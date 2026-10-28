// Manual decisions from the Phase 0 review of issue #7 (approved on 2026-10-28), applied on top of the
// automatic extraction. Every `find` must exist verbatim: a recipe that changed since the review fails loudly.
import type {RecipeIngredient} from "@/core/models/recipe-ingredient"

type Ingredient = Omit<RecipeIngredient, "id">

export interface RecipeOverride {
    // Exact replacements in the remaining Markdown (the preparation)
    content?: { find: string; replace: string }[]
    // Replace the extracted ingredient with this name by one or more ingredients
    ingredients?: { name: string; with: Ingredient[] }[]
    append?: Ingredient[]
}

const optional = (names: string[]): Ingredient[] => names.map((name) => ({name, group: "Opcional"}))

export const OVERRIDES: Record<string, RecipeOverride> = {
    // Accepted as extracted: "1 o 2 botes" as 1–2, "Media tableta" as ½, the saffron tip stays a note
    "albondigas-de-lentejas": {},
    "curry-de-garbanzos": {},
    "paella-de-verduras": {},
    dhal: {
        content: [
            {find: "1. Picamos 1 cebolla y 4 dientes de ajo.", replace: "1. Picamos la cebolla y el ajo."},
            {find: "Echamos el tomate tomate triturado", replace: "Echamos el tomate triturado"},
            {find: "Mezclamos y añadimos 1 bote de lentejas.", replace: "Mezclamos y añadimos las lentejas."},
        ],
    },
    "sopa-de-lasana": {
        content: [
            {find: "Sofreímos 1 cebolla y 2 dientes de ajo.", replace: "Sofreímos la cebolla y el ajo."},
            {find: "junto a 2 cucharaditas de tomate concentrado", replace: "junto al tomate concentrado"},
            {find: "añadimos  100 ml de crema vegetal (nata)", replace: "añadimos la nata vegetal"},
        ],
    },
    "crumble-de-pera": {
        content: [{find: "Añadir los 20 g de azúcar", replace: "Añadir el azúcar moreno"}],
    },
    "sopa-de-tomate": {
        content: [
            {
                find: "Añadimos 250 ml de agua, salpimentamos y añadimos un bote de nata vegetal",
                replace: "Añadimos el agua, salpimentamos y añadimos la nata vegetal",
            },
        ],
        // Both were only in the steps, so they never reached the list
        append: [
            {name: "agua", quantity: {min: 250}, unit: "ml"},
            {name: "nata vegetal", quantity: {min: 1}, unit: "bote"},
        ],
    },
    "sopa-china": {
        ingredients: [
            {
                name: "nidos de fideos de arroz o 1 bolsa de gyozas",
                with: [{name: "nidos de fideos de arroz", quantity: {min: 4}, note: "o 1 bolsa de gyozas", group: "Para la base"}],
            },
            {
                name: "cebolletas o 1 cebolla grande",
                with: [{name: "cebolletas", quantity: {min: 4}, note: "o 1 cebolla grande", group: "Para la base"}],
            },
        ],
    },
    "plumcake-de-limon-con-arandanos": {
        ingredients: [{name: "La rayadura de 2 limones", with: [{name: "limones", quantity: {min: 2}, note: "solo la ralladura"}]}],
    },
    tortitas: {
        ingredients: [{name: "jengibre, nuez moscada, cacao, etc", with: optional(["jengibre", "nuez moscada", "cacao"])}],
    },
    "verduras-asadas-al-horno": {
        ingredients: [
            {
                name: "ajo en polvo, pimentón ahumado, romero, tomillo, comino..",
                with: optional(["ajo en polvo", "pimentón ahumado", "romero", "tomillo", "comino"]),
            },
        ],
    },
}
