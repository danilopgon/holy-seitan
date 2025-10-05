import type {Recipe} from "@/models/recipe";

export type RecipeStore = {
    recipes: Recipe[]
    addRecipe: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => void
    updateRecipe: (id: string, recipe: Partial<Recipe>) => void
    deleteRecipe: (id: string) => void
    getRecipeBySlug: (slug: string) => Recipe | undefined
}