"use client"

import type {RecipeIngredient} from "@/core/models/recipe-ingredient"
import {formatIngredientAmount, groupIngredients, MULTIPLIERS, type Multiplier} from "@/lib/ingredients"
import {cn} from "@/lib/utils"

const multiplierLabel = (m: Multiplier) => `×${String(m).replace(".", ",")}`

interface Props {
    ingredients: RecipeIngredient[]
    factor: Multiplier
    onFactorChange: (factor: Multiplier) => void
}

export function RecipeIngredients({ingredients, factor, onFactorChange}: Props) {
    const groups = groupIngredients(ingredients)

    return (
        <section aria-labelledby="ingredients-heading" className="space-y-4">
            <div className="space-y-3">
                <h2 id="ingredients-heading" className="text-xl font-mono font-semibold tracking-tight">
                    Ingredientes
                </h2>
                <fieldset className="grid w-full grid-cols-4 gap-0.5 rounded-md border border-input p-0.5">
                    <legend className="sr-only">Multiplicar cantidades</legend>
                    {MULTIPLIERS.map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => onFactorChange(m)}
                            aria-pressed={factor === m}
                            className={cn(
                                "min-h-11 rounded-sm px-2 text-sm font-mono tabular-nums transition-[color,background-color,transform] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                                factor === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent",
                            )}
                        >
                            {multiplierLabel(m)}
                        </button>
                    ))}
                </fieldset>
            </div>

            {factor !== 1 && (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                    Cantidades {multiplierLabel(factor)}. Las que aparecen en la preparación no cambian.
                </p>
            )}

            {groups.map((group) => (
                <div key={`${group.title ?? ""}-${group.items[0].id}`} className="space-y-2">
                    {group.title && <h3 className="text-sm font-mono font-semibold text-foreground">{group.title}</h3>}
                    <ul className="space-y-1.5">
                        {group.items.map((ing) => {
                            const amount = formatIngredientAmount(ing, factor)
                            return (
                                <li key={ing.id} className="leading-snug">
                                    {amount && <span className="font-mono font-semibold tabular-nums text-foreground">{amount} </span>}
                                    <span>{ing.name}</span>
                                    {ing.note && <span className="text-muted-foreground"> · {ing.note}</span>}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            ))}
        </section>
    )
}
