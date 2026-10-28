import type {RecipeIngredient} from "@/core/models/recipe-ingredient"
import {editableQuantity, parseQuantity} from "@/lib/ingredients"

// The editor works on rows: group headings and ingredients, in display order.
// Quantities stay as typed text until they are saved, so "1/2" is not rewritten under the cursor.
export type IngredientRow =
    | { kind: "group"; key: string; title: string }
    | { kind: "item"; key: string; id: string; quantity: string; unit: string; name: string; note: string }

export const newKey = () => crypto.randomUUID()

export function ingredientsToRows(ingredients: RecipeIngredient[]): IngredientRow[] {
    const rows: IngredientRow[] = []
    let group: string | undefined
    for (const ing of ingredients) {
        if ((ing.group || undefined) !== group) {
            const previous = group
            group = ing.group || undefined
            // An untitled heading ends the previous group, so saving keeps these ingredients ungrouped
            if (group || previous) rows.push({kind: "group", key: newKey(), title: group ?? ""})
        }
        rows.push({
            kind: "item",
            key: newKey(),
            id: ing.id,
            quantity: ing.quantity ? editableQuantity(ing.quantity) : "",
            unit: ing.unit ?? "",
            name: ing.name,
            note: ing.note ?? "",
        })
    }
    return rows
}

export type RowsResult = { ok: true; ingredients: RecipeIngredient[] } | { ok: false; error: string }

export function rowsToIngredients(rows: IngredientRow[]): RowsResult {
    const ingredients: RecipeIngredient[] = []
    let group: string | undefined
    for (const row of rows) {
        if (row.kind === "group") {
            group = row.title.trim() || undefined
            continue
        }
        if (!row.name.trim()) {
            if (row.quantity.trim() || row.unit.trim() || row.note.trim()) {
                return {ok: false, error: "Hay un ingrediente con cantidad o nota pero sin nombre."}
            }
            continue
        }
        const parsed = parseQuantity(row.quantity)
        if (!parsed.ok) {
            return {ok: false, error: `La cantidad «${row.quantity}» de «${row.name}» no se entiende. Usa 200, 1,5, 1/2 o 2-3.`}
        }
        const ing: RecipeIngredient = {id: row.id, name: row.name.trim()}
        if (parsed.quantity) ing.quantity = parsed.quantity
        if (row.unit.trim()) ing.unit = row.unit.trim()
        if (row.note.trim()) ing.note = row.note.trim()
        if (group) ing.group = group
        ingredients.push(ing)
    }
    return {ok: true, ingredients}
}
