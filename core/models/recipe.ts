export interface Recipe {
    id: string
    title: string
    slug: string
    description: string
    content: string
    emoji: string
    prepTime: number
    cookTime: number
    servings: number
    difficulty: "Facil" | "Media" | "Dificil"
    tags: string[]
    author: string
    createdAt: string
    updatedAt: string
}