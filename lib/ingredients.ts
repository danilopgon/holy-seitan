import type {IngredientQuantity, RecipeIngredient} from "@/core/models/recipe-ingredient"

export const MULTIPLIERS = [0.5, 1, 2, 3] as const
export type Multiplier = (typeof MULTIPLIERS)[number]

// Weights and volumes read better as decimals ("62,5 g"); everything else as kitchen fractions ("1½ tazas")
const METRIC_UNITS = new Set(["mg", "g", "gr", "grs", "gramo", "gramos", "kg", "kilo", "kilos", "ml", "cl", "dl", "l", "litro", "litros"])

// singular → plural, for units that change with the amount after scaling
const UNIT_PLURALS: Record<string, string> = {
    cucharada: "cucharadas",
    cucharadita: "cucharaditas",
    taza: "tazas",
    vaso: "vasos",
    unidad: "unidades",
    diente: "dientes",
    pizca: "pizcas",
    "puñado": "puñados",
    lata: "latas",
    hoja: "hojas",
    rama: "ramas",
    sobre: "sobres",
    paquete: "paquetes",
    bote: "botes",
    rodaja: "rodajas",
    loncha: "lonchas",
    trozo: "trozos",
    bloque: "bloques",
    bolsa: "bolsas",
    bandeja: "bandejas",
    litro: "litros",
    gramo: "gramos",
    kilo: "kilos",
    vasito: "vasitos",
}
const UNIT_SINGULARS = Object.fromEntries(Object.entries(UNIT_PLURALS).map(([s, p]) => [p, s]))

const FRACTIONS: [number, string][] = [
    [1 / 8, "⅛"],
    [1 / 4, "¼"],
    [1 / 3, "⅓"],
    [1 / 2, "½"],
    [2 / 3, "⅔"],
    [3 / 4, "¾"],
]
const FRACTION_TOLERANCE = 0.04

const UNICODE_FRACTIONS: Record<string, string> = Object.fromEntries(
    [...FRACTIONS, [1 / 5, "⅕"], [3 / 8, "⅜"], [5 / 8, "⅝"], [7 / 8, "⅞"]].map(([v, c]) => [c, String(v)]),
)

function isMetric(unit?: string) {
    return !!unit && METRIC_UNITS.has(unit.toLowerCase())
}

function parseNumber(text: string): number | undefined {
    const t = text.trim()
    // "1 1/2", "1/2", "1,5", "1.5", "2"
    const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/)
    if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
    const fraction = t.match(/^(\d+)\/(\d+)$/)
    if (fraction) return Number(fraction[2]) === 0 ? undefined : Number(fraction[1]) / Number(fraction[2])
    if (/^\d+([.,]\d+)?$/.test(t)) return Number(t.replace(",", "."))
    return undefined
}

function expandUnicodeFractions(text: string) {
    return text.replace(/(\d*)\s*([¼½¾⅓⅔⅕⅛⅜⅝⅞])/g, (_, whole: string, frac: string) => {
        const value = (whole ? Number(whole) : 0) + Number(UNICODE_FRACTIONS[frac])
        return String(Math.round(value * 1000) / 1000)
    })
}

export type QuantityParse = { ok: true; quantity?: IngredientQuantity } | { ok: false }

// Accepts what people type: "200", "1,5", "1/2", "½", "1 ½", "2-3", "2–3", "2 a 3". Empty means no quantity.
export function parseQuantity(text: string): QuantityParse {
    const t = expandUnicodeFractions(text.trim())
    if (!t) return {ok: true}
    const parts = t.split(/\s*(?:-|–|—|\ba\b|\bo\b)\s*/)
    if (parts.length > 2) return {ok: false}
    const [min, max] = parts.map(parseNumber)
    if (min === undefined || min <= 0) return {ok: false}
    if (parts.length === 1) return {ok: true, quantity: {min}}
    if (max === undefined || max <= min) return {ok: false}
    return {ok: true, quantity: {min, max}}
}

export function scaleQuantity(q: IngredientQuantity, factor: number): IngredientQuantity {
    return q.max === undefined ? {min: q.min * factor} : {min: q.min * factor, max: q.max * factor}
}

function formatDecimal(n: number, maxDigits: number) {
    return n.toLocaleString("es-ES", {maximumFractionDigits: maxDigits})
}

export function formatAmount(n: number, unit?: string): string {
    if (isMetric(unit)) {
        const u = unit?.toLowerCase()
        if (u && ["kg", "kilo", "kilos", "l", "litro", "litros"].includes(u)) return formatDecimal(n, 2)
        return n >= 10 ? formatDecimal(Math.round(n), 0) : formatDecimal(n, 1)
    }
    const whole = Math.floor(n)
    const rest = n - whole
    if (rest < FRACTION_TOLERANCE) return formatDecimal(whole, 0)
    if (1 - rest < FRACTION_TOLERANCE) return formatDecimal(whole + 1, 0)
    const fraction = FRACTIONS.find(([v]) => Math.abs(v - rest) < FRACTION_TOLERANCE)
    if (fraction) return `${whole > 0 ? whole : ""}${fraction[1]}`
    return formatDecimal(n, 1)
}

export function formatQuantity(q: IngredientQuantity, unit?: string): string {
    const min = formatAmount(q.min, unit)
    return q.max === undefined ? min : `${min}–${formatAmount(q.max, unit)}`
}

// "1 taza" ×2 → "2 tazas", "2 cucharadas" ×0,5 → "1 cucharada"
export function inflectUnit(unit: string, q: IngredientQuantity): string {
    const amount = q.max ?? q.min
    // Only the head word changes: "cucharadas soperas" → "cucharada sopera"
    const [head, ...rest] = unit.split(" ")
    const lower = head.toLowerCase()
    const inflected = amount > 1 ? (UNIT_PLURALS[lower] ?? (UNIT_SINGULARS[lower] && lower)) : (UNIT_SINGULARS[lower] ?? (UNIT_PLURALS[lower] && lower))
    if (!inflected) return unit
    const qualifiers = rest.map((w) => (amount > 1 ? w.replace(/([aeo])$/, "$1s") : w.replace(/([aeo])s$/, "$1")))
    return [inflected, ...qualifiers].join(" ")
}

export function formatIngredientAmount(ingredient: RecipeIngredient, factor = 1): string | undefined {
    const {quantity, unit} = ingredient
    if (!quantity) return unit || undefined
    const scaled = scaleQuantity(quantity, factor)
    const amount = formatQuantity(scaled, unit)
    return unit ? `${amount} ${inflectUnit(unit, scaled)}` : amount
}

export interface IngredientGroup {
    title?: string
    items: RecipeIngredient[]
}

// Keeps the stored order; a new heading starts whenever the group changes
export function groupIngredients(ingredients: RecipeIngredient[]): IngredientGroup[] {
    const groups: IngredientGroup[] = []
    for (const ingredient of ingredients) {
        const title = ingredient.group?.trim() || undefined
        const last = groups.at(-1)
        if (last && last.title === title) last.items.push(ingredient)
        else groups.push({title, items: [ingredient]})
    }
    return groups
}

// Trims strings, drops empty optional fields and rows without a name
export function normalizeIngredients(ingredients: RecipeIngredient[]): RecipeIngredient[] {
    return ingredients
        .map((i) => {
            const out: RecipeIngredient = {id: i.id, name: i.name.trim()}
            if (i.quantity) out.quantity = i.quantity.max === undefined ? {min: i.quantity.min} : {...i.quantity}
            if (i.unit?.trim()) out.unit = i.unit.trim()
            if (i.note?.trim()) out.note = i.note.trim()
            if (i.group?.trim()) out.group = i.group.trim()
            return out
        })
        .filter((i) => i.name)
}

// The jsonb column is written by hand-run scripts too, so never trust its shape
export function parseStoredIngredients(value: unknown): RecipeIngredient[] {
    if (!Array.isArray(value)) return []
    return value.flatMap((raw, index) => {
        if (!raw || typeof raw !== "object") return []
        const r = raw as Record<string, unknown>
        if (typeof r.name !== "string" || !r.name.trim()) return []
        const ingredient: RecipeIngredient = {
            id: typeof r.id === "string" && r.id ? r.id : `ing-${index}`,
            name: r.name,
        }
        const q = r.quantity as Record<string, unknown> | undefined
        if (q && typeof q.min === "number" && q.min > 0) {
            ingredient.quantity = typeof q.max === "number" && q.max > q.min ? {min: q.min, max: q.max} : {min: q.min}
        }
        if (typeof r.unit === "string") ingredient.unit = r.unit
        if (typeof r.note === "string") ingredient.note = r.note
        if (typeof r.group === "string") ingredient.group = r.group
        return [ingredient]
    })
}
