"use client"

import {useEffect, useRef} from "react"
import {loadRecipesServerAction} from "@/lib/actions/load-recipes"
import {dtoToRecipe} from "@/lib/recipe-adapter"
import {useRecipeStore} from "@/lib/store/recipe-store"

export function RecipesProvider({children}: { children: React.ReactNode }) {
    const setRecipes = useRecipeStore((s) => s.setRecipes)
    const setInitialized = useRecipeStore((s) => s.setInitialized)
    const loaded = useRef(false)

    useEffect(() => {
        if (loaded.current) return
        loaded.current = true

        loadRecipesServerAction()
            .then((rows) => {
                const mapped = rows.map((r) => dtoToRecipe(r, "Holy Seitan"))
                setRecipes(mapped)
                setInitialized(true)
            })
            .catch((err) => {
                console.error("Error cargando recetas:", err)
                setInitialized(true)
            })
    }, [setRecipes, setInitialized])

    return <>{children}</>
}
