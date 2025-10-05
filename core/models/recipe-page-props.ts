import type {Recipe} from "@/core/models/recipe";

export interface RecipeFormProps {
    recipe?: Recipe
    onSubmit: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => Promise<void> | void
    onCancel: () => void
    submitting?: boolean
}