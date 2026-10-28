import { assert, assertEquals, assertNotEquals } from 'jsr:@std/assert@1'

import { applyRecipeEdits, canonicalJson, type EditableRecipe, proposalId } from './recipe-edits.ts'

const recipe: EditableRecipe = {
  slug: 'prueba',
  version: 3,
  title: 'Receta de prueba',
  description: 'Para probar el MCP',
  content_md: '## Instrucciones\n\n1. Sofreímos la cebolla.\n2. Añadimos el tomate.\n3. Añadimos sal.',
  ingredients: [
    { id: 'a', name: 'cebolla', quantity: { min: 1 } },
    { id: 'b', name: 'tomate', quantity: { min: 400 }, unit: 'g' },
    { id: 'c', name: 'sal', note: 'al gusto' },
  ],
}

let counter = 0
const newId = () => `nuevo-${++counter}`

Deno.test('a content edit replaces exactly one match and keeps the rest', () => {
  const result = applyRecipeEdits(recipe, { content: [{ old: 'Sofreímos la cebolla.', new: 'Pochamos la cebolla 10 minutos.' }] }, newId)
  assert(result.ok)
  assertEquals(
    result.changes.content_md,
    '## Instrucciones\n\n1. Pochamos la cebolla 10 minutos.\n2. Añadimos el tomate.\n3. Añadimos sal.',
  )
  assertEquals(result.diff.content, [{ before: '1. Sofreímos la cebolla.', after: '1. Pochamos la cebolla 10 minutos.' }])
  assertEquals(result.changes.ingredients, undefined)
})

Deno.test('ambiguous or missing content matches are rejected, never guessed', () => {
  const twice = applyRecipeEdits(recipe, { content: [{ old: 'Añadimos', new: 'Echamos' }] }, newId)
  assert(!twice.ok)
  assert(twice.errors[0].includes('appears 2 times'))

  const missing = applyRecipeEdits(recipe, { content: [{ old: 'Horneamos', new: 'Asamos' }] }, newId)
  assert(!missing.ok)
  assert(missing.errors[0].includes('not found'))
})

Deno.test('ingredient operations: update, clear, add, remove and move', () => {
  const result = applyRecipeEdits(
    recipe,
    {
      ingredients: [
        { op: 'update', id: 'b', quantity: { min: 500 }, note: 'triturado' },
        { op: 'update', id: 'c', note: null },
        { op: 'add', after_id: 'a', ingredient: { name: 'ajo', quantity: { min: 2 }, unit: 'dientes' } },
        { op: 'remove', id: 'c' },
        { op: 'move', id: 'b', after_id: null },
      ],
    },
    newId,
  )
  assert(result.ok)
  assertEquals(result.changes.ingredients?.map((i) => i.name), ['tomate', 'cebolla', 'ajo'])
  assertEquals(result.changes.ingredients?.[0], { id: 'b', name: 'tomate', quantity: { min: 500 }, unit: 'g', note: 'triturado' })
  assertEquals(result.diff.ingredients?.[0], '~ 400 g tomate → 500 g tomate (triturado)')
  assert(result.diff.ingredients?.some((l) => l === '+ 2 dientes ajo'))
  assert(result.diff.ingredients?.some((l) => l === '- sal'))
})

Deno.test('invalid ingredient edits are reported with their position', () => {
  const result = applyRecipeEdits(
    recipe,
    {
      ingredients: [
        { op: 'update', id: 'zzz', name: 'x' },
        { op: 'update', id: 'a', quantity: { min: 3, max: 2 } },
        { op: 'add', ingredient: { name: ' ' } },
      ],
    },
    newId,
  )
  assert(!result.ok)
  assertEquals(result.errors.length, 3)
  assert(result.errors[0].startsWith('ingredients[0]'))
  assert(result.errors[1].includes('max'))
})

Deno.test('edits that change nothing are refused', () => {
  const result = applyRecipeEdits(recipe, { title: 'Receta de prueba' }, newId)
  assert(!result.ok)
})

Deno.test('the original recipe is never mutated', () => {
  const snapshot = structuredClone(recipe)
  applyRecipeEdits(recipe, { ingredients: [{ op: 'remove', id: 'a' }], content: [{ old: 'sal', new: 'pimienta' }] }, newId)
  assertEquals(recipe, snapshot)
})

Deno.test('the proposal id binds slug, version, edits and summary, not key order', async () => {
  const edits = { content: [{ old: 'a', new: 'b' }], title: 'X' }
  const reordered = { title: 'X', content: [{ new: 'b', old: 'a' }] }
  const id = await proposalId('prueba', 3, edits, 'cambio')
  assertEquals(id, await proposalId('prueba', 3, reordered, 'cambio'))
  assertNotEquals(id, await proposalId('prueba', 4, edits, 'cambio'))
  assertNotEquals(id, await proposalId('prueba', 3, { ...edits, title: 'Y' }, 'cambio'))
  assertNotEquals(id, await proposalId('prueba', 3, edits, 'otro resumen'))
  assertEquals(canonicalJson({ b: 1, a: [2, { d: 3, c: undefined }] }), '{"a":[2,{"d":3}],"b":1}')
})

import { buildNewRecipe, slugify, uniqueSlug } from './recipe-edits.ts'

const newRecipe = {
  title: '  Hummus de Remolacha ',
  description: 'Hummus rosa con remolacha asada',
  emoji: '🥙',
  content_md: '## Instrucciones\n\n1. Trituramos todo.',
  ingredients: [
    { name: 'garbanzos cocidos', quantity: { min: 400 }, unit: 'g' },
    { name: 'remolacha asada', quantity: { min: 1 } },
    { name: 'sal', note: 'al gusto' },
  ],
  prep_time: 10,
  cook_time: 0,
  servings: 4,
  difficulty: 'easy' as const,
  tags: ['Untable', 'untable', ' rápido '],
}

Deno.test('slugs follow the admin form and avoid collisions', () => {
  assertEquals(slugify('Lasaña vegana de soja'), 'lasana-vegana-de-soja')
  assertEquals(uniqueSlug('dhal', ['dhal', 'dhal-2']), 'dhal-3')
  assertEquals(uniqueSlug('hummus', ['dhal']), 'hummus')
})

Deno.test('a new recipe is cleaned, ids are generated and it is published by default', () => {
  let n = 0
  const result = buildNewRecipe(newRecipe, 'hummus-de-remolacha', () => String(++n))
  assert(result.ok)
  assertEquals(result.row.title, 'Hummus de Remolacha')
  assertEquals(result.row.ingredients.map((i) => i.id), ['hummus-de-remolacha-1', 'hummus-de-remolacha-2', 'hummus-de-remolacha-3'])
  assertEquals(result.row.ingredients[2], { id: 'hummus-de-remolacha-3', name: 'sal', note: 'al gusto' })
  assertEquals(result.row.tags, ['untable', 'rápido'])
  assertEquals(result.row.is_published, true)
  const draft = buildNewRecipe({ ...newRecipe, publish: false }, 'x', () => 'a')
  assert(draft.ok && draft.row.is_published === false)
})

Deno.test('an invalid new recipe reports every problem', () => {
  const result = buildNewRecipe(
    { ...newRecipe, content_md: ' ', servings: 0, difficulty: 'facil' as never, ingredients: [{ name: 'x', quantity: { min: -1 } }] },
    'hummus',
    () => '1',
  )
  assert(!result.ok)
  assertEquals(result.errors.length, 4)
})
