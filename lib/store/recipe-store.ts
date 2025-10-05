"use client"

import {create} from "zustand"
import type {Recipe} from "@/core/models/recipe"
import type {RecipeDTO} from "@/core/models/recipe-dto"
import {supabaseBrowser} from "@/core/supabase-browser"
import {useAuthStore} from "@/lib/store/auth-store"
import {dtoToRecipe, recipeToDtoPayload, recipeToDtoPayloadPartial} from "../recipe-adapter"

export interface RecipeStore {
    recipes: Recipe[]
    setRecipes: (recipes: Recipe[]) => void
    loadRecipes: () => Promise<void>
    getRecipeBySlug: (slug: string) => Promise<Recipe | undefined>
    addRecipe: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt" | "author">) => Promise<void>
    updateRecipe: (id: string, recipe: Partial<Omit<Recipe, "id" | "createdAt" | "updatedAt" | "author">>) => Promise<void>
    deleteRecipe: (id: string) => Promise<void>
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
    recipes: [],
    setRecipes: (recipes: Recipe[]) => set({recipes}),
    loadRecipes: async () => {
        const supabase = supabaseBrowser()
        const {data, error} = await supabase
            .from("recipes")
            .select("*")
            .order("created_at", {ascending: false})
            .returns<RecipeDTO[]>()

        if (error) throw error

        const authorName = "Holy Seitan"
        const mapped = (data ?? []).map((d) => dtoToRecipe(d, authorName))
        set({recipes: mapped})
    },
    getRecipeBySlug: async (slug) => {
        const cache = get().recipes.find((r) => r.slug === slug)
        if (cache) return cache
        const supabase = supabaseBrowser()
        const {data, error} = await supabase
            .from("recipes")
            .select("*")
            .eq("slug", slug)
            .maybeSingle()

        if (error || !data) return undefined

        const me = useAuthStore.getState().user
        const author = me?.displayName || me?.email || "Autor"
        const mapped = dtoToRecipe(data as RecipeDTO, author)
        set({recipes: [...get().recipes.filter((r) => r.slug !== slug), mapped]})
        return mapped
    },
    addRecipe: async (recipe) => {
        const supabase = supabaseBrowser()
        const me = useAuthStore.getState().user
        if (!me) throw new Error("No auth")

        const payload = recipeToDtoPayload(recipe)
        const {data, error} = await supabase
            .from("recipes")
            .insert({
                ...payload,
                created_by: me.id,
            })
            .select("*")
            .single<RecipeDTO>()

        if (error) throw error
        const author = me.displayName || me.email
        const mapped = dtoToRecipe(data, author)
        set({recipes: [mapped, ...get().recipes]})
    },
    updateRecipe: async (id, updates) => {
        const supabase = supabaseBrowser()

        const payload = recipeToDtoPayloadPartial(updates)

        const {data, error} = await supabase
            .from("recipes")
            .update(payload)
            .eq("id", id)
            .select("*")
            .maybeSingle<RecipeDTO>()

        if (error) throw error
        if (!data) {
            throw new Error("No se encontró la receta o no tienes permisos (RLS).")
        }

        const me = useAuthStore.getState().user
        const author = me?.displayName || me?.email || "Autor"
        const mapped = dtoToRecipe(data, author)

        set({recipes: get().recipes.map((r) => (r.id === id ? mapped : r))})
    },
    deleteRecipe: async (id) => {
        const supabase = supabaseBrowser()

        const {data, error} = await supabase
            .from("recipes")
            .delete()
            .eq("id", id)
            .select("*")
            .maybeSingle<RecipeDTO>()

        if (error) throw error
        if (!data) {
            throw new Error("No se pudo borrar: no existe o RLS lo impide.")
        }

        set({recipes: get().recipes.filter((r) => r.id !== id)})
    },
}))
