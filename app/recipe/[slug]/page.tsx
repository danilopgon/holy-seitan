"use client"

import {ArrowLeft, ChefHat, Clock, Users} from "lucide-react"
import Link from "next/link"
import {notFound} from "next/navigation"
import {MarkdownRenderer} from "@/components/markdown-renderer"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {useRecipeStore} from "@/lib/store/recipe-store"
import type {RecipePageProps} from "@/core/models/recipe-page-props";

export default function RecipePage({params}: RecipePageProps) {
    const {slug} = params
    const getRecipeBySlug = useRecipeStore((state) => state.getRecipeBySlug)
    const recipe = getRecipeBySlug(slug)

    if (!recipe) {
        notFound()
    }

    const totalTime = recipe.prepTime + recipe.cookTime

    return (
        <main className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Back Button */}
            <Link href="/">
                <Button variant="ghost" className="mb-6 font-mono">
                    <ArrowLeft className="h-4 w-4 mr-2"/>
                    Volver a Recetas
                </Button>
            </Link>

            {/* Recipe Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-mono font-bold text-foreground mb-4">{recipe.title}</h1>
                <p className="text-lg text-muted-foreground mb-6">{recipe.description}</p>

                {/* Recipe Meta */}
                <div className="flex flex-wrap items-center gap-6 mb-6">
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

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {recipe.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="font-mono">
                            {tag}
                        </Badge>
                    ))}
                </div>

                {/* Recipe Image */}
                <div
                    className="relative h-96 w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            <span className="text-[12rem]" role="img" aria-label={recipe.title}>
              {recipe.emoji}
            </span>
                </div>
            </div>

            {/* Recipe Content (Markdown) */}
            <div className="bg-card border border-border rounded-lg p-8">
                <MarkdownRenderer content={recipe.content}/>
            </div>

            {/* Recipe Footer */}
            <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground font-mono">
                    Receta por {recipe.author} • Última
                    actualización {new Date(recipe.updatedAt).toLocaleDateString("es-ES")}
                </p>
            </div>
        </main>
    )
}
