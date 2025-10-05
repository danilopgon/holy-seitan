"use client"

import {useMemo, useState} from "react"
import {useRecipeStore} from "@/lib/recipe-store"
import {RecipeCard} from "@/components/recipe-card"
import {RecipeFilters} from "@/components/recipe-filters"

export default function HomePage() {
    const recipes = useRecipeStore((state) => state.recipes)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    // Get all unique tags
    const allTags = useMemo(() => {
        const tags = new Set<string>()
        recipes.forEach((recipe) => {
            recipe.tags.forEach((tag) => {
                tags.add(tag)
            })
        })
        return Array.from(tags).sort()
    }, [recipes])

    // Filter recipes
    const filteredRecipes = useMemo(() => {
        return recipes.filter((recipe) => {
            // Search filter
            const matchesSearch =
                searchQuery === "" ||
                recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                recipe.description.toLowerCase().includes(searchQuery.toLowerCase())

            // Tag filter
            const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => recipe.tags.includes(tag))

            return matchesSearch && matchesTags
        })
    }, [recipes, searchQuery, selectedTags])

    const handleTagClick = (tag: string) => {
        setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
    }

    return (
        <main className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-mono font-bold text-foreground mb-4">
                    Recetas Veganas Colaborativas
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Una colección de deliciosas recetas a base de plantas impulsada por la comunidad. Descubre,
                    comparte y
                    disfruta la cocina vegana.
                </p>
            </div>

            {/* Filters */}
            <div className="mb-8 max-w-3xl mx-auto">
                <RecipeFilters
                    onSearchChange={setSearchQuery}
                    onTagClick={handleTagClick}
                    selectedTags={selectedTags}
                    availableTags={allTags}
                />
            </div>

            {/* Recipe Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe}/>
                ))}
            </div>

            {/* No Results */}
            {filteredRecipes.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground font-mono">No se encontraron recetas. Intenta ajustar tus
                        filtros.</p>
                </div>
            )}
        </main>
    )
}
