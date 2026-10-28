// Phase 0 of issue #7: moves the ingredient section of each recipe from `content_md` to `recipes.ingredients`.
//
//   pnpm ingredients:phase0 report <backup.json> [--approve]  → .migration/report.md + .migration/proposal.json
//                                                     (--approve marks every recipe approved, after the review)
//   pnpm ingredients:phase0 sql <proposal.json>       → .migration/apply.sql  (only entries with "approved": true)
//   pnpm ingredients:phase0 rollback <backup.json>    → .migration/rollback.sql
//
// The backup is the JSON of `select * from recipes` (the REST API returns exactly that). Nothing here writes to
// the database: the SQL files are reviewed and run by hand, and every update checks that `content_md` is still
// the one in the backup, so a recipe edited in the meantime is skipped instead of overwritten.
import {createHash} from "node:crypto"
import {mkdirSync, readFileSync, writeFileSync} from "node:fs"
import type {RecipeIngredient} from "@/core/models/recipe-ingredient"
import {type MigrationIssue, type MigrationStatus, extractIngredients, findQuantitiesInSteps, migrationStatus} from "@/lib/ingredients-markdown"
import {formatIngredientAmount} from "@/lib/ingredients"
import {OVERRIDES} from "./ingredients-overrides"

interface BackupRow {
    id: string
    slug: string
    title: string
    servings: number
    content_md: string
    ingredients?: unknown
}

interface ProposalEntry {
    id: string
    slug: string
    status: MigrationStatus
    approved: boolean
    contentHash: string
    ingredients: RecipeIngredient[]
    content_md: string
    issues: MigrationIssue[]
}

const OUT = ".migration"
const sha = (s: string) => createHash("sha256").update(s).digest("hex")
const sqlString = (s: string) => `'${s.replace(/'/g, "''")}'`

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim()

// "# TOFU BAOS" at the top repeats the page's own h1; anything else stays
function stripTitleHeading(markdown: string, title: string) {
    const [first, ...rest] = markdown.split("\n")
    const heading = first.match(/^#\s+(.+?)\s*#*$/)
    return heading && fold(heading[1]) === fold(title) ? rest.join("\n").trim() : markdown
}

function applyOverrides(slug: string, ingredients: Omit<RecipeIngredient, "id">[], content: string) {
    const override = OVERRIDES[slug]
    if (!override) return {ingredients, content, applied: false}
    for (const {find, replace} of override.content ?? []) {
        if (!content.includes(find)) throw new Error(`${slug}: no se encuentra «${find}» en la preparación`)
        content = content.replace(find, replace)
    }
    for (const {name, with: replacement} of override.ingredients ?? []) {
        const index = ingredients.findIndex((i) => i.name === name)
        if (index === -1) throw new Error(`${slug}: no se encuentra el ingrediente «${name}»`)
        ingredients = [...ingredients.slice(0, index), ...replacement, ...ingredients.slice(index + 1)]
    }
    return {ingredients: [...ingredients, ...(override.append ?? [])], content, applied: true}
}

function report(backupPath: string, approve: boolean) {
    const rows: BackupRow[] = JSON.parse(readFileSync(backupPath, "utf8"))
    const proposal: ProposalEntry[] = rows.map((row) => {
        const extracted = extractIngredients(row.content_md)
        const fixed = applyOverrides(row.slug, extracted.ingredients, stripTitleHeading(extracted.remaining, row.title))
        // Reviewed recipes keep their history as info; the steps are checked again after the edits
        const issues: MigrationIssue[] = fixed.applied
            ? [
                ...extracted.issues
                    .filter((i) => !i.message.startsWith("La preparación menciona"))
                    .map((i) => (i.level === "review" ? {...i, level: "info" as const, message: `${i.message} (revisado)`} : i)),
                ...findQuantitiesInSteps(fixed.content).map((line) => ({level: "review" as const, message: "La preparación menciona una cantidad que no se escalará", line})),
            ]
            : extracted.issues
        return {
            id: row.id,
            slug: row.slug,
            status: migrationStatus(issues),
            approved: approve,
            contentHash: sha(row.content_md),
            ingredients: fixed.ingredients.map((ing, i) => ({id: `${row.slug}-${i + 1}`, ...ing})),
            content_md: fixed.content,
            issues,
        }
    })

    const count = (s: MigrationStatus) => proposal.filter((p) => p.status === s).length
    const lines = [
        `# Fase 0 · inventario de ingredientes`,
        ``,
        `Copia: \`${backupPath}\` · ${rows.length} recetas · seguras ${count("safe")} · revisar ${count("review")} · sin resolver ${count("unresolved")}`,
        ``,
    ]
    for (const p of proposal) {
        lines.push(`## ${p.slug} — ${p.status}`, ``)
        lines.push(`| # | Cantidad | Nombre | Nota | Grupo |`, `|---|---|---|---|---|`)
        p.ingredients.forEach((ing, i) => {
            const cell = (s?: string) => (s ?? "").replace(/\|/g, "\\|")
            lines.push(`| ${i + 1} | ${cell(formatIngredientAmount(ing))} | ${cell(ing.name)} | ${cell(ing.note)} | ${cell(ing.group)} |`)
        })
        if (p.issues.length) {
            lines.push(``, `Incidencias:`)
            for (const issue of p.issues) {
                lines.push(`- **${issue.level}** ${issue.message}${issue.line ? ` — \`${issue.line.replace(/`/g, "'")}\`` : ""}`)
            }
        }
        lines.push(``)
    }

    mkdirSync(OUT, {recursive: true})
    writeFileSync(`${OUT}/report.md`, lines.join("\n"))
    writeFileSync(`${OUT}/proposal.json`, `${JSON.stringify(proposal, null, 2)}\n`)
    console.log(`${OUT}/report.md · safe ${count("safe")} · review ${count("review")} · unresolved ${count("unresolved")}`)
}

function applySql(proposalPath: string) {
    const proposal: ProposalEntry[] = JSON.parse(readFileSync(proposalPath, "utf8"))
    const approved = proposal.filter((p) => p.approved)
    const statements = approved.map(
        (p) => `  update public.recipes
   set ingredients = ${sqlString(JSON.stringify(p.ingredients))}::jsonb,
       content_md = ${sqlString(p.content_md)}
 where id = ${sqlString(p.id)}
   and encode(sha256(convert_to(content_md, 'UTF8')), 'hex') = ${sqlString(p.contentHash)}
   and ingredients = '[]'::jsonb;
  get diagnostics changed = row_count;
  updated := updated + changed;`,
    )
    const sql = [
        `-- ${approved.length} recetas aprobadas de ${proposal.length}.`,
        `-- Cada update solo actúa si content_md sigue igual que en la copia y la receta no tenía ingredientes;`,
        `-- si alguno no actúa, el bloque lanza una excepción y la transacción entera se deshace.`,
        `begin;`,
        // updated_at stays: the trigger would stamp now() and reshuffle the recipe the home page features
        `alter table public.recipes disable trigger trg_set_updated_at;`,
        // All or nothing, counted on the rows each update really touched
        `do $migration$
declare
  changed int;
  updated int := 0;
begin`,
        ...statements,
        `  if updated <> ${approved.length} then
    raise exception 'migración incompleta: % de ${approved.length} recetas actualizadas; alguna cambió desde la copia o ya tenía ingredientes', updated;
  end if;
end
$migration$;`,
        `alter table public.recipes enable trigger trg_set_updated_at;`,
        `commit;`,
        ``,
    ].join("\n\n")
    mkdirSync(OUT, {recursive: true})
    writeFileSync(`${OUT}/apply.sql`, sql)
    console.log(`${OUT}/apply.sql · ${approved.length} updates`)
}

function rollbackSql(backupPath: string) {
    const rows: BackupRow[] = JSON.parse(readFileSync(backupPath, "utf8"))
    const statements = rows.map(
        (r) => `update public.recipes set content_md = ${sqlString(r.content_md)}, ingredients = ${sqlString(JSON.stringify(r.ingredients ?? []))}::jsonb where id = ${sqlString(r.id)};`,
    )
    mkdirSync(OUT, {recursive: true})
    writeFileSync(
        `${OUT}/rollback.sql`,
        ["begin;", "alter table public.recipes disable trigger trg_set_updated_at;", ...statements, "alter table public.recipes enable trigger trg_set_updated_at;", "commit;", ""].join("\n"),
    )
    console.log(`${OUT}/rollback.sql · ${rows.length} recetas`)
}

const [command, path, ...flags] = process.argv.slice(2)
if (!path) {
    console.error("uso: ingredients-phase0 <report|sql|rollback> <archivo.json>")
    process.exit(1)
}
if (command === "report") report(path, flags.includes("--approve"))
else if (command === "sql") applySql(path)
else if (command === "rollback") rollbackSql(path)
else {
    console.error(`comando desconocido: ${command}`)
    process.exit(1)
}
