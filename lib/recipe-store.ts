"use client"

import {create} from "zustand"
import {mockRecipes} from "./mock-data"
import type {Recipe} from "./types"

interface RecipeStore {
  recipes: Recipe[]
  addRecipe: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => void
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void
  deleteRecipe: (id: string) => void
  getRecipeBySlug: (slug: string) => Recipe | undefined
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: mockRecipes,
  addRecipe: (recipe) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => ({ recipes: [...state.recipes, newRecipe] }))
  },
  updateRecipe: (id, updates) => {
    set((state) => ({
      recipes: state.recipes.map((recipe) =>
        recipe.id === id ? { ...recipe, ...updates, updatedAt: new Date().toISOString() } : recipe,
      ),
    }))
  },
  deleteRecipe: (id) => {
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== id),
    }))
  },
  getRecipeBySlug: (slug) => {
    return get().recipes.find((recipe) => recipe.slug === slug)
  },
}))
