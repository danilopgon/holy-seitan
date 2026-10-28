// Bounded edits an agent may propose for a recipe, and the diff shown before anything is saved.
// Pure functions only (no network, no database) so the contract can be tested in isolation.
//
// The ingredient shape mirrors core/models/recipe-ingredient.ts in the Next.js app; Postgres
// (public.is_valid_ingredients) is the final check for both the admin panel and this server.

export interface IngredientQuantity {
  min: number
  max?: number
}

export interface RecipeIngredient {
  id: string
  name: string
  quantity?: IngredientQuantity
  unit?: string
  note?: string
  group?: string
}

export interface EditableRecipe {
  slug: string
  version: number
  title: string
  description: string
  content_md: string
  ingredients: RecipeIngredient[]
}

export interface ContentEdit {
  old: string
  new: string
}

type NullableField<T> = T | null

export type IngredientEdit =
  | {
    op: 'update'
    id: string
    name?: string
    quantity?: NullableField<IngredientQuantity>
    unit?: NullableField<string>
    note?: NullableField<string>
    group?: NullableField<string>
  }
  | { op: 'add'; after_id?: string | null; ingredient: Omit<RecipeIngredient, 'id'> }
  | { op: 'remove'; id: string }
  | { op: 'move'; id: string; after_id: string | null }

export interface RecipeEdits {
  title?: string
  description?: string
  content?: ContentEdit[]
  ingredients?: IngredientEdit[]
}

export interface RecipeChanges {
  title?: string
  description?: string
  content_md?: string
  ingredients?: RecipeIngredient[]
}

export interface RecipeDiff {
  title?: { before: string; after: string }
  description?: { before: string; after: string }
  content?: { before: string; after: string }[]
  ingredients?: string[]
}

export type EditResult =
  | { ok: true; changes: RecipeChanges; diff: RecipeDiff }
  | { ok: false; errors: string[] }

const countOccurrences = (haystack: string, needle: string) => {
  let count = 0
  let from = 0
  while (needle) {
    const index = haystack.indexOf(needle, from)
    if (index === -1) break
    count++
    from = index + needle.length
  }
  return count
}

// The whole lines an edit touches, so the diff shows context instead of a bare fragment
function surroundingLines(text: string, start: number, end: number): string {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const lineEndIndex = text.indexOf('\n', end)
  return text.slice(lineStart, lineEndIndex === -1 ? text.length : lineEndIndex)
}

export function formatIngredient(ing: Omit<RecipeIngredient, 'id'>): string {
  const amount = ing.quantity
    ? `${ing.quantity.min}${ing.quantity.max !== undefined ? `–${ing.quantity.max}` : ''}`
    : ''
  const head = [amount, ing.unit, ing.name].filter(Boolean).join(' ')
  const tail = [ing.note && `(${ing.note})`, ing.group && `[${ing.group}]`].filter(Boolean).join(' ')
  return tail ? `${head} ${tail}` : head
}

function quantityError(q: unknown, where: string): string | null {
  if (q === undefined || q === null) return null
  if (typeof q !== 'object') return `${where}: quantity must be an object {min, max?}`
  const { min, max } = q as Record<string, unknown>
  if (typeof min !== 'number' || !Number.isFinite(min) || min <= 0) return `${where}: quantity.min must be a number > 0`
  if (max !== undefined && (typeof max !== 'number' || !Number.isFinite(max) || max <= min)) {
    return `${where}: quantity.max must be a number greater than min`
  }
  return null
}

function cleanIngredient(ing: RecipeIngredient): RecipeIngredient {
  const out: RecipeIngredient = { id: ing.id, name: ing.name.trim() }
  if (ing.quantity) out.quantity = ing.quantity.max === undefined ? { min: ing.quantity.min } : { ...ing.quantity }
  if (ing.unit?.trim()) out.unit = ing.unit.trim()
  if (ing.note?.trim()) out.note = ing.note.trim()
  if (ing.group?.trim()) out.group = ing.group.trim()
  return out
}

export function applyRecipeEdits(recipe: EditableRecipe, edits: RecipeEdits, newId: () => string): EditResult {
  const errors: string[] = []
  const changes: RecipeChanges = {}
  const diff: RecipeDiff = {}

  if (edits.title !== undefined) {
    const title = edits.title.trim()
    if (!title || title.length > 200) errors.push('title must be 1–200 characters')
    else if (title !== recipe.title) {
      changes.title = title
      diff.title = { before: recipe.title, after: title }
    }
  }

  if (edits.description !== undefined) {
    const description = edits.description.trim()
    if (!description || description.length > 280) errors.push('description must be 1–280 characters')
    else if (description !== recipe.description) {
      changes.description = description
      diff.description = { before: recipe.description, after: description }
    }
  }

  if (edits.content?.length) {
    let content = recipe.content_md
    const contentDiff: { before: string; after: string }[] = []
    edits.content.forEach((edit, i) => {
      const where = `content[${i}]`
      if (!edit.old) {
        errors.push(`${where}: old must not be empty; copy the exact text to replace from get_recipe`)
        return
      }
      if (edit.old === edit.new) {
        errors.push(`${where}: old and new are identical`)
        return
      }
      const count = countOccurrences(content, edit.old)
      if (count !== 1) {
        errors.push(
          count === 0
            ? `${where}: old text not found in the current preparation (it must match exactly, including spaces and line breaks)`
            : `${where}: old text appears ${count} times; include more surrounding text so it matches exactly once`,
        )
        return
      }
      const start = content.indexOf(edit.old)
      const before = surroundingLines(content, start, start + edit.old.length)
      content = content.slice(0, start) + edit.new + content.slice(start + edit.old.length)
      const after = surroundingLines(content, start, start + edit.new.length)
      contentDiff.push({ before, after })
    })
    if (!content.trim()) errors.push('content: the preparation cannot end up empty')
    if (content !== recipe.content_md) {
      changes.content_md = content
      diff.content = contentDiff
    }
  }

  if (edits.ingredients?.length) {
    let list = recipe.ingredients.map((i) => ({ ...i }))
    const lines: string[] = []
    const indexOf = (id: string) => list.findIndex((i) => i.id === id)

    edits.ingredients.forEach((edit, i) => {
      const where = `ingredients[${i}]`
      if (edit.op === 'add') {
        const ing = edit.ingredient
        if (!ing || typeof ing.name !== 'string' || !ing.name.trim()) {
          errors.push(`${where}: ingredient.name is required`)
          return
        }
        const qErr = quantityError(ing.quantity, where)
        if (qErr) return void errors.push(qErr)
        const added = cleanIngredient({ ...ing, id: newId() })
        if (edit.after_id === undefined) list.push(added)
        else if (edit.after_id === null) list.unshift(added)
        else {
          const at = indexOf(edit.after_id)
          if (at === -1) return void errors.push(`${where}: after_id ${edit.after_id} not found`)
          list.splice(at + 1, 0, added)
        }
        lines.push(`+ ${formatIngredient(added)}`)
        return
      }

      const at = indexOf(edit.id)
      if (at === -1) return void errors.push(`${where}: ingredient ${edit.id} not found; use the ids from get_recipe`)
      const current = list[at]

      if (edit.op === 'remove') {
        list = list.filter((x) => x.id !== edit.id)
        lines.push(`- ${formatIngredient(current)}`)
        return
      }

      if (edit.op === 'move') {
        const without = list.filter((x) => x.id !== edit.id)
        if (edit.after_id === null) without.unshift(current)
        else {
          const target = without.findIndex((x) => x.id === edit.after_id)
          if (target === -1) return void errors.push(`${where}: after_id ${edit.after_id} not found`)
          without.splice(target + 1, 0, current)
        }
        list = without
        const anchor = edit.after_id === null ? 'al principio' : `después de ${formatIngredient(list[list.findIndex((x) => x.id === edit.after_id)])}`
        lines.push(`↕ ${formatIngredient(current)} → ${anchor}`)
        return
      }

      // update: undefined keeps a field, null clears it
      if (edit.name !== undefined && !edit.name.trim()) return void errors.push(`${where}: name cannot be empty`)
      const qErr = quantityError(edit.quantity, where)
      if (qErr) return void errors.push(qErr)
      const next: RecipeIngredient = { ...current }
      if (edit.name !== undefined) next.name = edit.name
      for (const key of ['quantity', 'unit', 'note', 'group'] as const) {
        const value = edit[key]
        if (value === null) delete next[key]
        else if (value !== undefined) (next as unknown as Record<string, unknown>)[key] = value
      }
      const cleaned = cleanIngredient(next)
      list[at] = cleaned
      const before = formatIngredient(current)
      const after = formatIngredient(cleaned)
      if (before !== after) lines.push(`~ ${before} → ${after}`)
    })

    if (lines.length) {
      changes.ingredients = list
      diff.ingredients = lines
    }
  }

  if (errors.length) return { ok: false, errors }
  if (!Object.keys(changes).length) return { ok: false, errors: ['the edits do not change anything'] }
  return { ok: true, changes, diff }
}

// Stable JSON (sorted keys) so the same edits always give the same proposal id
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

// Binds an apply call to exactly what was proposed: same recipe, same base version, same edits, same summary
export async function proposalId(slug: string, baseVersion: number, edits: RecipeEdits, summary: string): Promise<string> {
  const data = new TextEncoder().encode(canonicalJson({ slug, baseVersion, edits, summary }))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}
