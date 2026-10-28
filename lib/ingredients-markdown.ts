// Phase 0 of issue #7: reads the ingredient section out of a recipe's Markdown so it can move to
// `recipes.ingredients`. It never guesses silently: anything it is not sure about is reported as an issue.
import type {RecipeIngredient} from "@/core/models/recipe-ingredient"
import {parseQuantity} from "@/lib/ingredients"

export type IssueLevel = "info" | "review" | "blocker"

export interface MigrationIssue {
    level: IssueLevel
    message: string
    line?: string
}

const UNITS = [
    "mg", "g", "gr", "grs", "gramos?", "kg", "kilos?", "ml", "cl", "dl", "l", "litros?",
    "cucharadas?", "cucharaditas?", "cdas?", "cdtas?", "cditas?", "tazas?", "vasos?",
    "unidad(?:es)?", "uds?", "dientes?", "pizcas?", "puñados?", "latas?", "hojas?", "ramas?", "ramitas?",
    "sobres?", "paquetes?", "botes?", "bolsas?", "bandejas?", "rollos?", "láminas?", "laminas?", "ramilletes?", "cabezas?", "cucharón(?:es)?", "cucharones", "rodajas?", "lonchas?", "trozos?", "bloques?", "chorros?", "chorritos?",
]
const UNIT_QUALIFIERS = "soperas?|de postre|grandes?|pequeñ[oa]s?|median[oa]s?|rasas?|colmadas?"
const UNIT_RE = new RegExp(`^((?:${UNITS.join("|")})(?:\\s+(?:${UNIT_QUALIFIERS}))?)(?![\\p{L}])\\.?\\s*`, "iu")

const NUMBER = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?\s*[¼½¾⅓⅔⅛]?|[¼½¾⅓⅔⅛])`
const QUANTITY = String.raw`${NUMBER}(?:\s*(?:-|–|—|\ba\b|\bo\b)\s*${NUMBER})?`
const LEADING_QTY_RE = new RegExp(`^(${QUANTITY})\\s*(.*)$`, "u")
const TRAILING_QTY_RE = new RegExp(`^(.+?)\\s+(${QUANTITY})\\s*(.*)$`, "u")

// Amounts that are not numbers and must never be scaled
const IMPRECISE_RE = /\b(al gusto|a gusto|una pizca|un poco|un puñado|un chorr(?:it)?o|cantidad necesaria|c\/n|c\.n\.?|lo que admita)\b(\s+de\b)?/iu

const WORD_NUMBERS: Record<string, number> = {
    un: 1, una: 1, uno: 1, medio: 0.5, media: 0.5, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
}
const WORD_QTY_RE = new RegExp(`^(${Object.keys(WORD_NUMBERS).join("|")})\\s+(.+)$`, "iu")

export interface ParsedLine {
    ingredient: Omit<RecipeIngredient, "id">
    issues: MigrationIssue[]
}

function splitUnit(rest: string): { unit?: string; name: string } {
    const m = rest.match(UNIT_RE)
    if (!m) return {name: rest.trim()}
    const name = rest.slice(m[0].length).replace(/^de\s+/iu, "").trim()
    return {unit: m[1].toLowerCase(), name}
}

export function parseIngredientLine(raw: string): ParsedLine {
    const issues: MigrationIssue[] = []
    const notes: string[] = []
    let text = raw.trim().replace(/\.$/, "")

    text = text.replace(/\s*\(([^)]*)\)\s*/g, (_, note: string) => {
        notes.push(note.trim())
        return " "
    }).trim()
    // Trailing ", picada" / " - opcional" read as a note
    const tail = text.match(/^(.+?)(?:,\s*|\s+-\s+)([^\d,]+)$/u)
    if (tail && !/:/.test(text)) {
        text = tail[1].trim()
        notes.unshift(tail[2].trim())
    }

    const build = (fields: Omit<RecipeIngredient, "id" | "note">): ParsedLine => {
        const ingredient = Object.fromEntries(
            Object.entries(fields).filter(([, v]) => v !== undefined && v !== ""),
        ) as Omit<RecipeIngredient, "id">
        ingredient.name ??= ""
        // A line that is only a parenthesis, "(+ puré de sobre)", keeps it as the name
        if (!ingredient.name && notes.length) ingredient.name = notes.shift() ?? ""
        if (notes.length) ingredient.note = notes.join("; ")
        if (notes.some((n) => /[\d¼½¾⅓⅔⅛]/u.test(n))) {
            issues.push({level: "review", message: "La nota lleva cantidades que no se escalarán", line: raw})
        }
        if (!ingredient.name) issues.push({level: "blocker", message: "No se distingue el nombre del ingrediente", line: raw})
        else if (/\d/.test(ingredient.name)) issues.push({level: "review", message: "El nombre contiene números; comprobar que no es una cantidad", line: raw})
        return {ingredient, issues}
    }

    const imprecise = text.match(IMPRECISE_RE)
    if (imprecise) {
        notes.unshift(imprecise[1].toLowerCase())
        const name = text.replace(imprecise[0], " ").replace(/\s{2,}/g, " ").replace(/^de\s+/iu, "").trim()
        if (LEADING_QTY_RE.test(name)) {
            issues.push({level: "review", message: "Cantidad numérica junto a una imprecisa", line: raw})
        }
        return build({name})
    }

    // "Opcional: jengibre, nuez moscada…" is a free list, not "name: quantity"
    const optional = text.match(/^opcional\s*:\s*(.+)$/iu)
    if (optional) {
        notes.unshift("opcional")
        issues.push({level: "review", message: "Lista de opcionales en una sola línea", line: raw})
        return build({name: optional[1].trim()})
    }

    const colon = text.match(/^([^:]+):\s*(.+)$/u)
    if (colon) {
        const qty = colon[2].match(LEADING_QTY_RE)
        if (qty) {
            const parsed = parseQuantity(qty[1])
            const {unit, name: extra} = splitUnit(qty[2])
            if (parsed.ok && parsed.quantity) {
                if (extra) notes.push(extra)
                issues.push({level: "info", message: "Formato «nombre: cantidad»", line: raw})
                return build({name: colon[1].trim(), quantity: parsed.quantity, unit})
            }
        }
        issues.push({level: "review", message: "Texto tras «:» que no es una cantidad", line: raw})
        notes.push(colon[2].trim())
        return build({name: colon[1].trim()})
    }

    const leading = text.match(LEADING_QTY_RE)
    if (leading) {
        const parsed = parseQuantity(leading[1])
        if (parsed.ok && parsed.quantity) {
            if (/\bo\b/u.test(leading[1])) {
                issues.push({level: "review", message: "«X o Y» guardado como intervalo", line: raw})
            }
            const {unit, name} = splitUnit(leading[2])
            return build({name, quantity: parsed.quantity, unit})
        }
        issues.push({level: "blocker", message: `Cantidad no reconocida: «${leading[1]}»`, line: raw})
        return build({name: text})
    }

    const word = text.match(WORD_QTY_RE)
    if (word) {
        const {unit, name} = splitUnit(word[2])
        issues.push({level: "review", message: `Cantidad escrita con palabras («${word[1]}» → ${WORD_NUMBERS[word[1].toLowerCase()]})`, line: raw})
        return build({name, quantity: {min: WORD_NUMBERS[word[1].toLowerCase()]}, unit})
    }

    const trailing = text.match(TRAILING_QTY_RE)
    if (trailing) {
        const parsed = parseQuantity(trailing[2])
        const {unit, name: extra} = splitUnit(trailing[3])
        if (parsed.ok && parsed.quantity && !extra) {
            issues.push({level: "review", message: "Cantidad al final del nombre", line: raw})
            return build({name: trailing[1].trim(), quantity: parsed.quantity, unit})
        }
    }

    issues.push({level: "info", message: "Sin cantidad: se guardará solo el nombre", line: raw})
    return build({name: text})
}

const SECTION_RE = /^(?:(#{1,6})\s*|\*\*)?\s*ingredient(?:e)?s\b[^\n]*$/iu
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*$/u
const LIST_RE = /^(\s*)(?:[-*+•]|\d+[.)])\s+(.+)$/u
const THEMATIC_BREAK_RE = /^(?:-{3,}|\*{3,}|_{3,})$/u
const GROUP_OPENER_RE = /:$|^(\*\*|__).+(\*\*|__):?$|^para\s+(el|la|los|las)\s+\p{L}+$/iu
const GROUP_LINE_RE = /^(?:\*\*|__)?\s*(.+?)\s*:?\s*(?:\*\*|__)?\s*:?$/u

export interface ExtractedSection {
    found: boolean
    ingredients: Omit<RecipeIngredient, "id">[]
    // The Markdown without the ingredient section, for `content_md`
    remaining: string
    issues: MigrationIssue[]
}

export function extractIngredients(markdown: string): ExtractedSection {
    const lines = markdown.split(/\r?\n/)
    const issues: MigrationIssue[] = []
    const start = lines.findIndex((l) => SECTION_RE.test(l.trim()))
    if (start === -1) {
        return {
            found: false,
            ingredients: [],
            remaining: markdown,
            issues: [{level: "blocker", message: "No hay sección de ingredientes"}],
        }
    }

    const sectionLevel = lines[start].trim().match(/^(#{1,6})/)?.[1].length ?? 7
    let end = lines.length
    let group: string | undefined
    const ingredients: Omit<RecipeIngredient, "id">[] = []

    for (let i = start + 1; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()
        if (!trimmed || THEMATIC_BREAK_RE.test(trimmed)) continue

        const heading = trimmed.match(HEADING_RE)
        if (heading) {
            if (heading[1].length <= sectionLevel) {
                end = i
                break
            }
            group = heading[2].replace(/:$/, "").trim()
            continue
        }

        const item = line.match(LIST_RE)
        if (item) {
            if (item[1].replace(/\t/g, "  ").length >= 2) {
                issues.push({level: "review", message: "Lista anidada: se aplana bajo el grupo actual", line: trimmed})
            }
            const parsed = parseIngredientLine(item[2])
            issues.push(...parsed.issues)
            ingredients.push(group ? {...parsed.ingredient, group} : parsed.ingredient)
            continue
        }

        // A non-list line ending in ":" or in bold opens a sub-group ("Para la salsa:")
        if (GROUP_OPENER_RE.test(trimmed)) {
            group = trimmed.match(GROUP_LINE_RE)?.[1].replace(/:$/, "").trim()
            continue
        }
        // Without a heading the section ends at the first paragraph that is not part of it
        if (sectionLevel === 7) {
            end = i
            break
        }
        issues.push({level: "review", message: "Línea libre dentro de los ingredientes: se queda en la preparación", line: trimmed})
    }

    const seen = new Map<string, number>()
    for (const ing of ingredients) {
        const key = `${ing.group ?? ""}|${ing.name.toLowerCase()}`
        seen.set(key, (seen.get(key) ?? 0) + 1)
    }
    for (const [key, count] of seen) {
        if (count > 1) issues.push({level: "review", message: `Ingrediente repetido ${count} veces: «${key.split("|")[1]}»`})
    }
    if (ingredients.length === 0) issues.push({level: "blocker", message: "La sección de ingredientes está vacía o no tiene lista"})

    const freeLines = lines.slice(start + 1, end).filter((l) => {
        const t = l.trim()
        return t && !LIST_RE.test(l) && !HEADING_RE.test(t) && !GROUP_OPENER_RE.test(t) && !THEMATIC_BREAK_RE.test(t)
    })
    const remaining = [...lines.slice(0, start), ...freeLines, ...lines.slice(end)]
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()

    for (const mention of findQuantitiesInSteps(remaining)) {
        issues.push({level: "review", message: "La preparación menciona una cantidad que no se escalará", line: mention})
    }

    return {found: true, ingredients, remaining, issues}
}

const STEP_QTY_RE = new RegExp(`(${QUANTITY})\\s*(${UNITS.join("|")})(?![\\p{L}])`, "giu")

export function findQuantitiesInSteps(markdown: string): string[] {
    return markdown
        .split(/\r?\n/)
        .filter((l) => {
            STEP_QTY_RE.lastIndex = 0
            return STEP_QTY_RE.test(l)
        })
        .map((l) => l.trim())
}

export type MigrationStatus = "safe" | "review" | "unresolved"

export function migrationStatus(issues: MigrationIssue[]): MigrationStatus {
    if (issues.some((i) => i.level === "blocker")) return "unresolved"
    if (issues.some((i) => i.level === "review")) return "review"
    return "safe"
}
