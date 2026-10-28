"use client"

import {ArrowDown, ArrowUp, ListPlus, Plus, Trash2} from "lucide-react"
import {type ReactNode, useId, useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {type IngredientRow, newKey} from "@/lib/ingredient-rows"
import {cn} from "@/lib/utils"
import {editableQuantity, parseQuantity} from "@/lib/ingredients"
import {parseIngredientLine} from "@/lib/ingredients-markdown"

const ITEM_COLUMNS = "sm:grid-cols-[5.5rem_12rem_minmax(0,1.2fr)_minmax(0,1fr)]"

const emptyItem = (): IngredientRow => ({kind: "item", key: newKey(), id: newKey(), quantity: "", unit: "", name: "", note: ""})

// Labels show on phones, where each ingredient is a card; on wider screens one header row names the columns
function Field({label, htmlFor, className, children}: { label: string; htmlFor: string; className?: string; children: ReactNode }) {
    return (
        <div className={cn("grid min-w-0 gap-1", className)}>
            <label htmlFor={htmlFor} className="text-xs text-muted-foreground sm:sr-only">{label}</label>
            {children}
        </div>
    )
}

interface Props {
    rows: IngredientRow[]
    onChange: (rows: IngredientRow[]) => void
}

export function IngredientsEditor({rows, onChange}: Props) {
    const id = useId()
    const [pasteOpen, setPasteOpen] = useState(false)
    const [pasteText, setPasteText] = useState("")

    const update = (key: string, patch: Partial<Record<string, string>>) =>
        onChange(rows.map((r) => (r.key === key ? ({...r, ...patch} as IngredientRow) : r)))
    const remove = (key: string) => onChange(rows.filter((r) => r.key !== key))
    const move = (index: number, delta: number) => {
        const target = index + delta
        if (target < 0 || target >= rows.length) return
        const next = [...rows]
        ;[next[index], next[target]] = [next[target], next[index]]
        onChange(next)
    }

    const importPasted = () => {
        const imported: IngredientRow[] = pasteText
            .split(/\r?\n/)
            .map((l) => l.replace(/^\s*(?:[-*+•]|\d+[.)])\s+/, "").trim())
            .filter(Boolean)
            .map((line) => {
                if (/:$/.test(line)) return {kind: "group", key: newKey(), title: line.replace(/:$/, "")}
                const {ingredient} = parseIngredientLine(line)
                return {
                    kind: "item",
                    key: newKey(),
                    id: newKey(),
                    quantity: ingredient.quantity ? editableQuantity(ingredient.quantity) : "",
                    unit: ingredient.unit ?? "",
                    name: ingredient.name,
                    note: ingredient.note ?? "",
                }
            })
        onChange([...rows, ...imported])
        setPasteText("")
        setPasteOpen(false)
    }

    return (
        <div className="space-y-3">
            {rows.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    Sin ingredientes todavía. Añádelos uno a uno o pega una lista.
                </p>
            )}

            {rows.some((r) => r.kind === "item") && (
                <div aria-hidden="true" className={cn("hidden gap-x-2 text-xs text-muted-foreground sm:grid sm:pr-[8rem]", ITEM_COLUMNS)}>
                    <span>Cantidad</span>
                    <span>Unidad</span>
                    <span>Ingrediente</span>
                    <span>Nota</span>
                </div>
            )}

            <ol className="space-y-3 sm:space-y-2">
                {rows.map((row, index) => {
                    const actions = (
                        <div className="flex shrink-0 justify-end gap-1">
                            <Button type="button" variant="ghost" size="icon" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir">
                                <ArrowUp/>
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => move(index, 1)} disabled={index === rows.length - 1} aria-label="Bajar">
                                <ArrowDown/>
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(row.key)} aria-label={row.kind === "group" ? "Eliminar grupo" : "Eliminar ingrediente"}>
                                <Trash2/>
                            </Button>
                        </div>
                    )

                    if (row.kind === "group") {
                        return (
                            <li key={row.key} className="flex items-end gap-2 pt-3 first:pt-0 sm:items-center sm:gap-3 sm:pt-4">
                                <Field label="Grupo" htmlFor={`${id}-${index}-group`} className="flex-1">
                                    <Input
                                        id={`${id}-${index}-group`}
                                        value={row.title}
                                        onChange={(e) => update(row.key, {title: e.target.value})}
                                        placeholder="Grupo, por ejemplo «Para la salsa». Vacío: lo que sigue va sin grupo"
                                        className="font-mono font-semibold"
                                    />
                                </Field>
                                {actions}
                            </li>
                        )
                    }

                    // Example values only on a fresh row, so an empty unit never reads as "g"
                    const fresh = !row.name && !row.quantity && !row.unit && !row.note
                    return (
                        <li key={row.key} className="rounded-lg border border-border bg-background p-3 sm:flex sm:items-center sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
                            <div className={cn("grid min-w-0 flex-1 grid-cols-[6rem_minmax(0,1fr)] gap-x-2 gap-y-3 sm:gap-y-0", ITEM_COLUMNS)}>
                                <Field label="Cantidad" htmlFor={`${id}-${index}-qty`}>
                                    <Input
                                        id={`${id}-${index}-qty`}
                                        value={row.quantity}
                                        onChange={(e) => update(row.key, {quantity: e.target.value})}
                                        placeholder={fresh ? "200" : undefined}
                                        inputMode="decimal"
                                        aria-invalid={!parseQuantity(row.quantity).ok}
                                        className="font-mono tabular-nums"
                                    />
                                </Field>
                                <Field label="Unidad" htmlFor={`${id}-${index}-unit`}>
                                    <Input
                                        id={`${id}-${index}-unit`}
                                        value={row.unit}
                                        onChange={(e) => update(row.key, {unit: e.target.value})}
                                        placeholder={fresh ? "g" : undefined}
                                        list={`${id}-units`}
                                        className="font-mono"
                                    />
                                </Field>
                                <Field label="Ingrediente" htmlFor={`${id}-${index}-name`} className="col-span-2 sm:col-span-1">
                                    <Input
                                        id={`${id}-${index}-name`}
                                        value={row.name}
                                        onChange={(e) => update(row.key, {name: e.target.value})}
                                        placeholder={fresh ? "harina de garbanzo" : undefined}
                                    />
                                </Field>
                                <Field label="Nota" htmlFor={`${id}-${index}-note`} className="col-span-2 sm:col-span-1">
                                    <Input
                                        id={`${id}-${index}-note`}
                                        value={row.note}
                                        onChange={(e) => update(row.key, {note: e.target.value})}
                                        placeholder={fresh ? "picada, al gusto, opcional…" : undefined}
                                    />
                                </Field>
                            </div>
                            <div className="mt-2 border-t border-border pt-2 sm:mt-0 sm:border-0 sm:pt-0">{actions}</div>
                        </li>
                    )
                })}
            </ol>

            <datalist id={`${id}-units`}>
                {["g", "kg", "ml", "l", "cucharada", "cucharadita", "taza", "diente", "bote", "lata", "pizca"].map((u) => (
                    <option key={u} value={u}/>
                ))}
            </datalist>

            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => onChange([...rows, emptyItem()])} className="font-mono">
                    <Plus/> Ingrediente
                </Button>
                <Button type="button" variant="outline" onClick={() => onChange([...rows, {kind: "group", key: newKey(), title: ""}])} className="font-mono">
                    <ListPlus/> Grupo
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPasteOpen((v) => !v)} aria-expanded={pasteOpen} className="font-mono">
                    Pegar lista
                </Button>
            </div>

            {pasteOpen && (
                <div className="space-y-2">
                    <Textarea
                        aria-label="Lista de ingredientes"
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        rows={6}
                        className="font-mono"
                        placeholder={"- 200 g de harina\n- 1 cebolla, picada\n- sal al gusto\nPara la salsa:\n- 2 cucharadas de soja"}
                    />
                    <p className="text-sm text-muted-foreground">
                        Una línea por ingrediente. Las líneas que acaban en «:» abren un grupo. Revisa el resultado antes de guardar.
                    </p>
                    <Button type="button" variant="secondary" onClick={importPasted} disabled={!pasteText.trim()} className="font-mono">
                        Añadir a la lista
                    </Button>
                </div>
            )}
        </div>
    )
}
