"use client"

import {useMemo, useState} from "react"
import {RecipeFeature} from "@/components/recipe-feature"
import {RecipeFilters} from "@/components/recipe-filters"
import {RecipeRow} from "@/components/recipe-row"
import {useRecipeStore} from "@/lib/store/recipe-store"

function RecipeRowSkeleton() {
    return (
        <li className="flex items-center gap-4 border-b border-border px-2 py-4">
            <div className="h-16 w-16 rounded-md bg-muted animate-pulse"/>
            <div className="flex-1 space-y-2">
                <div className="h-5 w-1/3 bg-muted rounded animate-pulse"/>
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse"/>
            </div>
        </li>
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

    const isFiltering = searchQuery.trim() !== "" || selectedTags.length > 0

    // The most recently updated recipe leads the page until the visitor filters
    const latest = useMemo(() => {
        if (isFiltering || recipes.length < 2) return null
        return recipes.reduce((a, b) =>
            new Date(b.updatedAt).getTime() > new Date(a.updatedAt).getTime() ? b : a,
        )
    }, [recipes, isFiltering])

    const indexRecipes = latest ? filteredRecipes.filter((r) => r.id !== latest.id) : filteredRecipes

    const handleTagClick = (tag: string) =>
        setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

    const isLoading = !initialized

    return (
        <main className="container mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-14">
            {/* Hero */}
            <div className="grid gap-8 md:grid-cols-12 md:items-end mb-12">
                <div className="md:col-span-5 min-w-0">
                    <h1 className="text-5xl md:text-6xl font-mono font-bold tracking-tight leading-none text-foreground mb-4 [overflow-wrap:break-word]">
                        Holy Seitan!
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md">
                        El recetario vegano de María (@mloherr) y Dani (@danilopgon), escrito en markdown.
                    </p>
                </div>
                <div className="md:col-span-7 min-w-0">
                    <RecipeFilters
                        onSearchChange={setSearchQuery}
                        onTagClick={handleTagClick}
                        selectedTags={selectedTags}
                        availableTags={allTags}
                    />
                </div>
            </div>

            {/* Latest */}
            {latest && (
                <section className="mb-16" aria-labelledby="latest-heading">
                    <h2 id="latest-heading" className="font-mono text-xl font-semibold tracking-tight mb-4">
                        Lo último
                    </h2>
                    <RecipeFeature recipe={latest}/>
                </section>
            )}

            {/* Index */}
            <section aria-labelledby="index-heading">
                <div className="flex items-baseline justify-between gap-4 border-b-2 border-foreground pb-3">
                    <h2 id="index-heading" className="font-mono text-xl font-semibold tracking-tight">
                        {isFiltering ? "Resultados" : latest ? "Más recetas" : "Todas las recetas"}
                    </h2>
                    {!isLoading && (
                        <p className="font-mono text-sm text-muted-foreground tabular-nums">{indexRecipes.length}</p>
                    )}
                </div>
                <ul>
                    {isLoading
                        ? skeletonKeys.map((key) => <RecipeRowSkeleton key={key}/>)
                        : indexRecipes.map((recipe, index) => <RecipeRow key={recipe.id} recipe={recipe} index={index}/>)}
                </ul>

                {/* Empty state (solo cuando ya cargó) */}
                {!isLoading && filteredRecipes.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            No se encontraron recetas. Intenta ajustar tus filtros.
                        </p>
                    </div>
                )}
            </section>
        </main>
    )
}
