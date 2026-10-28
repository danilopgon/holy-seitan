"use client"

import {type CSSProperties, useState, ViewTransition} from "react"
import {ArrowLeft, ChefHat, Clock, Users} from "lucide-react"
import Link from "next/link"
import {MarkdownRenderer} from "@/components/markdown-renderer"
import {RecipeIngredients} from "@/components/recipe-ingredients"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {WakeLockToggle} from "@/components/wake-lock-toggle"
import type {Recipe} from "@/core/models/recipe"
import {getEmojiTile} from "@/lib/emoji-tile"
import {formatAmount, type Multiplier} from "@/lib/ingredients"
import {getEmojiTransitionName} from "@/lib/view-transition"

const difficultyLabel: Record<Recipe["difficulty"], string> = {Facil: "Fácil", Media: "Media", Dificil: "Difícil"}

export function RecipeView({recipe}: { recipe: Recipe }) {
    const totalTime = recipe.prepTime + recipe.cookTime
    const hasIngredients = recipe.ingredients.length > 0
    // In-memory only: the stored quantities and servings never change
    const [factor, setFactor] = useState<Multiplier>(1)

    const entrance = (delay: number): CSSProperties => ({
        animation: `recipe-fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: `${delay}ms`,
    })

    const facts = [
        {Icon: Clock, label: "Tiempo total", value: `${totalTime}`, unit: " min"},
        {
            Icon: Users,
            label: "Porciones",
            value: formatAmount(recipe.servings * factor),
            unit: " porciones",
            detail: factor !== 1 ? `receta: ${recipe.servings}` : undefined,
        },
        {Icon: ChefHat, label: "Dificultad", value: difficultyLabel[recipe.difficulty], unit: ""},
    ]

    return (
        <main className="container mx-auto px-4 py-8 max-w-6xl">
            <div style={entrance(0)}>
                <Link href="/">
                    <Button variant="ghost" className="mb-6 font-mono">
                        <ArrowLeft className="h-4 w-4 mr-2"/>
                        Volver a Recetas
                    </Button>
                </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-12">
                <header className="md:col-start-2 md:row-start-1" style={entrance(30)}>
                    <h1 className="text-4xl font-mono font-bold tracking-tight leading-tight text-foreground mb-4">{recipe.title}</h1>
                    <p className="text-lg text-muted-foreground max-w-[68ch]">{recipe.description}</p>
                </header>

                <aside
                    aria-label="Datos de la receta"
                    className="space-y-5 md:col-start-1 md:row-span-2 md:row-start-1 md:sticky md:top-6 md:self-start md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:[scrollbar-width:thin] md:p-1 md:-m-1"
                >
                    <div className="flex gap-4 md:flex-col md:gap-4" style={entrance(0)}>
                        <div
                            className="flex size-24 shrink-0 items-center justify-center rounded-lg md:h-32 md:w-full"
                            data-tile={getEmojiTile(recipe.slug)}
                        >
                            <ViewTransition name={getEmojiTransitionName(recipe.slug)}>
                                <span className="font-emoji text-5xl md:text-7xl" role="img" aria-label={recipe.title}>
                                    {recipe.emoji}
                                </span>
                            </ViewTransition>
                        </div>

                        <dl className="grid content-center gap-2 tabular-nums md:flex md:flex-wrap md:gap-x-5" style={entrance(60)}>
                            {facts.map(({Icon, label, value, unit, detail}) => (
                                <div key={label} className="flex items-center gap-2 text-foreground">
                                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true"/>
                                    <dt className="sr-only">{label}</dt>
                                    <dd className="font-mono text-sm">
                                        <span className="font-semibold">{value}</span>
                                        {unit && <span className="text-muted-foreground">{unit}</span>}
                                        {detail && <span className="text-muted-foreground"> ({detail})</span>}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {(recipe.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2" style={entrance(90)}>
                            {recipe.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="font-mono">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div style={entrance(90)}>
                        <WakeLockToggle/>
                    </div>

                    {hasIngredients && (
                        <div className="border-t border-border pt-6" style={entrance(120)}>
                            <RecipeIngredients ingredients={recipe.ingredients} factor={factor} onFactorChange={setFactor}/>
                        </div>
                    )}
                </aside>

                <article className="md:col-start-2 md:self-start bg-card border border-border rounded-lg p-6 sm:p-8" style={entrance(120)}>
                    <MarkdownRenderer content={recipe.content} className="max-w-[68ch]"/>
                </article>
            </div>

            <div className="mt-8 pt-6 border-t border-border" style={entrance(120)}>
                <p className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span>Receta por {recipe.author}</span>
                    <span>Actualizada el {new Date(recipe.updatedAt).toLocaleDateString("es-ES")}</span>
                </p>
            </div>
        </main>
    )
}
