"use client"

import {type CSSProperties, ViewTransition} from "react"
import {ArrowLeft, ChefHat, Clock, Users} from "lucide-react"
import Link from "next/link"
import {MarkdownRenderer} from "@/components/markdown-renderer"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import type {Recipe} from "@/core/models/recipe"
import {getEmojiTransitionName} from "@/lib/view-transition"

export function RecipeView({recipe}: { recipe: Recipe }) {
    const totalTime = recipe.prepTime + recipe.cookTime

    const entrance = (delay: number): CSSProperties => ({
        animation: `recipe-fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: `${delay}ms`,
    })

    return (
        <main className="container mx-auto px-4 py-8 max-w-4xl">
            <div style={entrance(0)}>
                <Link href="/">
                    <Button variant="ghost" className="mb-6 font-mono">
                        <ArrowLeft className="h-4 w-4 mr-2"/>
                        Volver a Recetas
                    </Button>
                </Link>
            </div>

            <div className="mb-8">
                <div style={entrance(30)}>
                    <h1 className="text-4xl font-mono font-bold tracking-tight leading-tight text-foreground mb-4">{recipe.title}</h1>
                    <p className="text-lg text-muted-foreground mb-6">{recipe.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6 mb-6 tabular-nums" style={entrance(60)}>
                    <div className="flex items-center gap-2 text-foreground">
                        <Clock className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Tiempo Total</p>
                            <p className="font-mono font-semibold">{totalTime} minutos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                        <Users className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Porciones</p>
                            <p className="font-mono font-semibold">{recipe.servings}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                        <ChefHat className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Dificultad</p>
                            <p className="font-mono font-semibold">{recipe.difficulty}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6" style={entrance(90)}>
                    {(recipe.tags ?? []).map((tag) => (
                        <Badge key={tag} variant="secondary" className="font-mono">
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="relative h-60 w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center" style={entrance(0)}>
                    <ViewTransition name={getEmojiTransitionName(recipe.slug)}>
                        <span className="text-[8rem]" role="img" aria-label={recipe.title}>
                            {recipe.emoji}
                        </span>
                    </ViewTransition>
                </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-8" style={entrance(120)}>
                <MarkdownRenderer content={recipe.content}/>
            </div>

            <div className="mt-8 pt-6 border-t border-border" style={entrance(120)}>
                <p className="text-sm text-muted-foreground font-mono">
                    Receta por {recipe.author} • Última actualización{" "}
                    {new Date(recipe.updatedAt).toLocaleDateString("es-ES")}
                </p>
            </div>
        </main>
    )
}
