"use client"

import {useMemo, useState} from "react"
import {RecipeCard} from "@/components/recipe-card"
import {RecipeFilters} from "@/components/recipe-filters"
import {useRecipeStore} from "@/lib/store/recipe-store"

function RecipeCardSkeleton() {
    return (
        <div className="rounded-lg border p-6">
            <div className="h-40 w-full rounded bg-muted animate-pulse mb-4"/>
            <div className="h-6 w-2/3 bg-muted rounded animate-pulse mb-2"/>
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse"/>
        </div>
    )
}

export default function HomePage() {
    const recipes = useRecipeStore((s) => s.recipes)
    const initialized = useRecipeStore((s) => s.initialized)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const skeletonKeys = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"]

    const allTags = useMemo(() => {
        const tags = new Set<string>()
        recipes.forEach((r) => {
            r.tags.forEach((t) => {
                tags.add(t)
            })
        })
        return Array.from(tags).sort()
    }, [recipes])

    const filteredRecipes = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        return recipes.filter((r) => {
            const matchesSearch =
                !q ||
                r.title.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q)
            const matchesTags =
                selectedTags.length === 0 || selectedTags.every((t) => r.tags.includes(t))
            return matchesSearch && matchesTags
        })
    }, [recipes, searchQuery, selectedTags])

    const handleTagClick = (tag: string) =>
        setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

    const isLoading = !initialized

    return (
        <main className="container mx-auto px-4 py-8">
            {/* Hero */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-mono font-bold text-foreground mb-4">Holy Seitan!</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Holy Seitan es el recetario vegano en markdown de María (@mloherr) y Dani (@danilopgon), construido
                    con Next.js 15, Supabase y Drizzle ORM.
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

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading
                    ? skeletonKeys.map((key) => <RecipeCardSkeleton key={key}/>)
                    : filteredRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe}/>)}
            </div>

            {/* Empty state (solo cuando ya cargó) */}
            {!isLoading && filteredRecipes.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground font-mono">
                        No se encontraron recetas. Intenta ajustar tus filtros.
                    </p>
                </div>
            )}
        </main>
    )
}
