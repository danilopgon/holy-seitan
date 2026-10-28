import type { McpServer } from 'npm:@modelcontextprotocol/server@2.0.0'
import { z } from 'npm:zod@4.4.3'

import { applyRecipeEdits, canonicalJson, type EditableRecipe, proposalId, type RecipeEdits } from './recipe-edits.ts'
import { errorResult, jsonResult, runtimeErrorResult } from './result.ts'
import type { ToolContext } from './types.ts'

// Recipe tools for issue #9. Every query runs through the caller's RLS-scoped client:
// visitors' rules for reads, admin-only writes. Writes go through the
// apply_recipe_update / restore_recipe_revision RPCs, which check the expected version
// and record the previous state in recipe_revisions.

const SITE_URL = Deno.env.get('HOLY_SEITAN_SITE_URL')?.replace(/\/$/, '') || 'https://holy-seitan.danilopgon.com'
const RECIPE_FIELDS = 'id, slug, title, description, content_md, ingredients, emoji, prep_time, cook_time, servings, difficulty, tags, is_published, version, updated_at'

const quantity = z.object({ min: z.number().positive(), max: z.number().positive().optional() })

const ingredientInput = z.object({
  name: z.string().min(1),
  quantity: quantity.optional(),
  unit: z.string().optional(),
  note: z.string().optional(),
  group: z.string().optional(),
})

const editsSchema = z.object({
  title: z.string().optional().describe('New title, only if it should change'),
  description: z.string().optional().describe('New one-line description, only if it should change'),
  content: z
    .array(z.object({
      old: z.string().describe('Exact text from content_md to replace; must appear exactly once'),
      new: z.string().describe('Replacement text'),
    }))
    .optional()
    .describe('Changes to the preparation (Markdown). Copy `old` verbatim from get_recipe.'),
  ingredients: z
    .array(
      z.discriminatedUnion('op', [
        z.object({
          op: z.literal('update'),
          id: z.string(),
          name: z.string().optional(),
          quantity: quantity.nullable().optional().describe('null removes the amount (e.g. "al gusto")'),
          unit: z.string().nullable().optional(),
          note: z.string().nullable().optional(),
          group: z.string().nullable().optional(),
        }),
        z.object({
          op: z.literal('add'),
          after_id: z.string().nullable().optional().describe('Insert after this id; null for first; omit for last'),
          ingredient: ingredientInput,
        }),
        z.object({ op: z.literal('remove'), id: z.string() }),
        z.object({ op: z.literal('move'), id: z.string(), after_id: z.string().nullable().describe('null moves it first') }),
      ]),
    )
    .optional()
    .describe('Changes to the structured ingredient list, by ingredient id from get_recipe'),
})

const recipeRef = {
  slug: z.string().min(1).describe('Recipe slug from search_recipes or get_recipe'),
  base_version: z.number().int().positive().describe('The version you read with get_recipe'),
}

interface RecipeRow extends EditableRecipe {
  id: string
  [key: string]: unknown
}

async function loadRecipe({ supabase }: ToolContext, slug: string): Promise<RecipeRow | null> {
  const { data, error } = await supabase.from('recipes').select(RECIPE_FIELDS).eq('slug', slug).maybeSingle()
  if (error) throw error
  return data as RecipeRow | null
}

const notFound = (slug: string) =>
  errorResult(`No recipe with slug "${slug}". Use search_recipes to find the right one; never guess a slug.`)

const conflict = (slug: string, expected: number, current: number) =>
  errorResult(
    `Version conflict on "${slug}": you read version ${expected} but it is now ${current}. ` +
      'Call get_recipe again, rebuild the edits on the current text and propose them again.',
  )

// Postgres raises these from public.apply_recipe_update / restore_recipe_revision
function writeErrorResult(error: { code?: string; message?: string }, slug: string) {
  if (error.code === '40001') return errorResult(`Version conflict on "${slug}": ${error.message}. Call get_recipe again and re-propose.`)
  if (error.code === '42501') return errorResult('Not allowed: only the recipe book admins can change recipes.')
  if (error.code === 'P0002') return errorResult(`${error.message} for "${slug}".`)
  return runtimeErrorResult(error)
}

const newIngredientId = (slug: string) => () => `${slug}-${crypto.randomUUID().slice(0, 8)}`

export function registerRecipeTools(server: McpServer, context: ToolContext): void {
  const { supabase } = context

  server.registerTool(
    'search_recipes',
    {
      description:
        'Find recipes in the Holy Seitan recipe book by title, description, slug or tag. ' +
        'If several match, show them to the user and ask which one they mean; do not pick one silently.',
      inputSchema: z.object({ query: z.string().min(1).describe('Words from the recipe name, e.g. "lasaña"') }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ query }) => {
      try {
        // Keep PostgREST filter syntax out of user text
        const term = query.replace(/[%,()*\\"{}]/g, ' ').trim()
        const slugTerm = term.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        const { data, error } = await supabase
          .from('recipes')
          .select('slug, title, description, tags, version, updated_at')
          .or(`title.ilike.%${term}%,description.ilike.%${term}%,slug.ilike.%${slugTerm}%,tags.cs.{\"${term.toLowerCase()}\"}`)
          .order('title')
          .limit(10)
        if (error) throw error
        const matches = data ?? []
        return jsonResult({
          count: matches.length,
          matches,
          next_step: matches.length === 0
            ? 'Nothing matched. Try another word or ask the user for the recipe name.'
            : matches.length === 1
            ? 'One match. Call get_recipe with its slug.'
            : 'Several matches. Ask the user which recipe they mean before reading or changing anything.',
        })
      } catch (error) {
        return runtimeErrorResult(error)
      }
    },
  )

  server.registerTool(
    'get_recipe',
    {
      description:
        'Read the full, current recipe: preparation Markdown (content_md), structured ingredients with their ids, ' +
        'metadata and version. Always read it before proposing a change, and work only from what it returns.',
      inputSchema: z.object({ slug: z.string().min(1) }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ slug }) => {
      try {
        const recipe = await loadRecipe(context, slug)
        if (!recipe) return notFound(slug)
        return jsonResult({ ...recipe, url: `${SITE_URL}/recipe/${recipe.slug}` })
      } catch (error) {
        return runtimeErrorResult(error)
      }
    },
  )

  server.registerTool(
    'propose_recipe_update',
    {
      description:
        'Validate a bounded change to one recipe and return the exact diff and a proposal_id. Saves nothing. ' +
        'Show the diff to the user and only call apply_recipe_update after they explicitly approve this proposal.',
      inputSchema: z.object({
        ...recipeRef,
        edits: editsSchema,
        summary: z.string().min(3).max(200).describe('Short reason for the change, kept in the history (in Spanish)'),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ slug, base_version, edits, summary }) => {
      try {
        const recipe = await loadRecipe(context, slug)
        if (!recipe) return notFound(slug)
        if (recipe.version !== base_version) return conflict(slug, base_version, recipe.version)
        const result = applyRecipeEdits(recipe, edits as RecipeEdits, newIngredientId(slug))
        if (!result.ok) return errorResult(`The edits are not valid:\n- ${result.errors.join('\n- ')}`)
        return jsonResult({
          proposal_id: await proposalId(slug, base_version, edits as RecipeEdits, summary),
          slug,
          base_version,
          summary,
          diff: result.diff,
          next_step:
            'Show this diff to the user. If they approve it, call apply_recipe_update with the same slug, ' +
            'base_version, edits, summary and this proposal_id. If they want changes, propose again.',
        })
      } catch (error) {
        return runtimeErrorResult(error)
      }
    },
  )

  server.registerTool(
    'apply_recipe_update',
    {
      description:
        'Save a change the user has explicitly approved. Requires the proposal_id from propose_recipe_update and ' +
        'exactly the same slug, base_version, edits and summary. Writes the recipe, keeps the previous version in ' +
        'the history and reads it back to confirm.',
      inputSchema: z.object({
        ...recipeRef,
        edits: editsSchema,
        summary: z.string().min(3).max(200),
        proposal_id: z.string().length(32),
      }),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ slug, base_version, edits, summary, proposal_id }) => {
      try {
        if (proposal_id !== (await proposalId(slug, base_version, edits as RecipeEdits, summary))) {
          return errorResult(
            'proposal_id does not match these edits. Only an approved proposal can be applied: call propose_recipe_update ' +
              'again and ask the user to approve the new diff.',
          )
        }
        const recipe = await loadRecipe(context, slug)
        if (!recipe) return notFound(slug)
        if (recipe.version !== base_version) return conflict(slug, base_version, recipe.version)
        const result = applyRecipeEdits(recipe, edits as RecipeEdits, newIngredientId(slug))
        if (!result.ok) return errorResult(`The edits are no longer valid:\n- ${result.errors.join('\n- ')}`)

        const { error } = await supabase.rpc('apply_recipe_update', {
          p_recipe_id: recipe.id,
          p_expected_version: base_version,
          p_changes: result.changes,
          p_summary: summary,
        })
        if (error) return writeErrorResult(error, slug)

        // Read back what is really stored instead of trusting the write
        const saved = await loadRecipe(context, slug)
        const verified = !!saved &&
          saved.version === base_version + 1 &&
          (result.changes.content_md === undefined || saved.content_md === result.changes.content_md) &&
          (result.changes.title === undefined || saved.title === result.changes.title) &&
          (result.changes.description === undefined || saved.description === result.changes.description) &&
          (result.changes.ingredients === undefined ||
            // jsonb reorders object keys, so compare canonical forms
            canonicalJson(saved.ingredients) === canonicalJson(result.changes.ingredients))

        return jsonResult({
          saved: true,
          verified,
          slug,
          previous_version: base_version,
          version: saved?.version ?? null,
          url: `${SITE_URL}/recipe/${slug}`,
          undo: `restore_recipe_revision with slug "${slug}", version ${base_version}, base_version ${saved?.version}`,
        })
      } catch (error) {
        return runtimeErrorResult(error)
      }
    },
  )

  server.registerTool(
    'get_recipe_history',
    {
      description: 'List the saved versions of a recipe, newest first: who changed it, from which client, why and when.',
      inputSchema: z.object({ slug: z.string().min(1), limit: z.number().int().min(1).max(50).optional() }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ slug, limit }) => {
      try {
        const recipe = await loadRecipe(context, slug)
        if (!recipe) return notFound(slug)
        const { data, error } = await supabase
          .from('recipe_revisions')
          .select('version, title, summary, changed_by, client_id, created_at')
          .eq('recipe_id', recipe.id)
          .order('version', { ascending: false })
          .limit(limit ?? 20)
        if (error) throw error
        return jsonResult({
          slug,
          current_version: recipe.version,
          revisions: (data ?? []).map((r) => ({ ...r, source: r.client_id ? 'mcp' : 'panel' })),
          note: 'Each revision is the recipe as it was before the change that created the next version.',
        })
      } catch (error) {
        return runtimeErrorResult(error)
      }
    },
  )

  server.registerTool(
    'restore_recipe_revision',
    {
      description:
        'Bring a recipe back to a previous version from get_recipe_history (title, description, preparation, ' +
        'ingredients and metadata). Use it to undo a change that went wrong, after the user confirms. ' +
        'The restore is recorded as a new version, so it can be undone too.',
      inputSchema: z.object({
        ...recipeRef,
        version: z.number().int().positive().describe('The version to bring back, from get_recipe_history'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ slug, base_version, version }) => {
      try {
        const recipe = await loadRecipe(context, slug)
        if (!recipe) return notFound(slug)
        if (recipe.version !== base_version) return conflict(slug, base_version, recipe.version)
        const { error } = await supabase.rpc('restore_recipe_revision', {
          p_recipe_id: recipe.id,
          p_revision_version: version,
          p_expected_version: base_version,
        })
        if (error) return writeErrorResult(error, slug)
        const saved = await loadRecipe(context, slug)
        return jsonResult({
          restored_version: version,
          version: saved?.version ?? null,
          verified: saved?.version === base_version + 1,
          url: `${SITE_URL}/recipe/${slug}`,
        })
      } catch (error) {
        return runtimeErrorResult(error)
      }
    },
  )
}
