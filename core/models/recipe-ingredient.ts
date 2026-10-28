// A numeric amount, or a range like "2–3" when `max` is set
export interface IngredientQuantity {
    min: number
    max?: number
}

// Stored as-is in the `recipes.ingredients` jsonb column; array order is display order
export interface RecipeIngredient {
    id: string
    name: string
    // Missing for amounts that do not scale ("al gusto", "una pizca")
    quantity?: IngredientQuantity
    unit?: string
    note?: string
    // Consecutive ingredients with the same group render under one heading ("Para la salsa")
    group?: string
}
