"use client"

import {ArrowDown, ArrowUp, ListPlus, Plus, Trash2} from "lucide-react"
import {useId, useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {type IngredientRow, newKey} from "@/lib/ingredient-rows"
import {editableQuantity, parseQuantity} from "@/lib/ingredients"
import {parseIngredientLine} from "@/lib/ingredients-markdown"

const emptyItem = (): IngredientRow => ({kind: "item", key: newKey(), id: newKey(), quantity: "", unit: "", name: "", note: ""})

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

            <ol className="space-y-2">
                {rows.map((row, index) => (
                    <li key={row.key} className="flex items-start gap-2">
                        <div className="flex-1">
                            {row.kind === "group" ? (
                                <Input
                                    aria-label="Título del grupo"
                                    value={row.title}
                                    onChange={(e) => update(row.key, {title: e.target.value})}
                                    placeholder="Sin título: lo que sigue va sin grupo"
                                    className="font-mono font-semibold"
                                />
                            ) : (
                                <div className="grid grid-cols-[5rem_7rem_1fr] gap-2 max-sm:grid-cols-[4.5rem_1fr]">
                                    <Input
                                        aria-label="Cantidad"
                                        value={row.quantity}
                                        onChange={(e) => update(row.key, {quantity: e.target.value})}
                                        placeholder="200"
                                        inputMode="decimal"
                                        aria-invalid={!parseQuantity(row.quantity).ok}
                                        className="font-mono tabular-nums"
                                    />
                                    <Input
                                        aria-label="Unidad"
                                        value={row.unit}
                                        onChange={(e) => update(row.key, {unit: e.target.value})}
                                        placeholder="g"
                                        list={`${id}-units`}
                                        className="font-mono"
                                    />
                                    <Input
                                        aria-label="Ingrediente"
                                        value={row.name}
                                        onChange={(e) => update(row.key, {name: e.target.value})}
                                        placeholder="harina de garbanzo"
                                        className="max-sm:col-span-2"
                                    />
                                    <Input
                                        aria-label="Nota"
                                        value={row.note}
                                        onChange={(e) => update(row.key, {note: e.target.value})}
                                        placeholder="Nota: picada, al gusto, opcional…"
                                        className="col-span-3 max-sm:col-span-2 text-sm"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex shrink-0 gap-1">
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
                    </li>
                ))}
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
