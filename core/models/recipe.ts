import type {RecipeIngredient} from "@/core/models/recipe-ingredient"

export interface Recipe {
    id: string
    title: string
    slug: string
    description: string
    // Preparation and notes; ingredients live in `ingredients`, never in both
    content: string
    ingredients: RecipeIngredient[]
    emoji: string
    prepTime: number
    cookTime: number
    servings: number
    difficulty: "Facil" | "Media" | "Dificil"
    tags: string[]
    author: string
    createdAt: string
    updatedAt: string
    isPublished: boolean
}