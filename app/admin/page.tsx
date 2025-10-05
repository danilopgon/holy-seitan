"use client"

import {Pencil, Plus, Trash2, Search} from "lucide-react"
import {useMemo, useState} from "react"
import {ProtectedRoute} from "@/components/protected-route"
import {RecipeForm} from "@/components/recipe-form"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import type {Recipe} from "@/core/models/recipe"
import {useRecipeStore} from "@/lib/store/recipe-store"

type ViewMode = "list" | "create" | "edit"

export default function AdminPage() {
    const recipes = useRecipeStore((s) => s.recipes)
    const addRecipe = useRecipeStore((s) => s.addRecipe)
    const updateRecipe = useRecipeStore((s) => s.updateRecipe)
    const deleteRecipe = useRecipeStore((s) => s.deleteRecipe)

    const [viewMode, setViewMode] = useState<ViewMode>("list")
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
    const [busy, setBusy] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const skeletonKeys = ["sk1", "sk2", "sk3"]

    const handleCreate = async (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => {
        try {
            setBusy(true)
            await addRecipe(recipe)
            setViewMode("list")
        } finally {
            setBusy(false)
        }
    }

    const handleUpdate = async (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => {
        if (!selectedRecipe) return
        try {
            setBusy(true)
            await updateRecipe(selectedRecipe.id, recipe)
            setViewMode("list")
            setSelectedRecipe(null)
        } finally {
            setBusy(false)
        }
    }

    const handleEdit = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
        setViewMode("edit")
    }

    const handleDelete = (recipe: Recipe) => setRecipeToDelete(recipe)

    const confirmDelete = async () => {
        if (!recipeToDelete) return
        try {
            setBusy(true)
            await deleteRecipe(recipeToDelete.id)
            setRecipeToDelete(null)
        } finally {
            setBusy(false)
        }
    }

    const isLoadingList = recipes.length === 0 && viewMode === "list"

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return recipes
        return recipes.filter(
            (r) =>
                r.title.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q)
        )
    }, [recipes, searchQuery])

    return (
        <ProtectedRoute>
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-mono font-bold text-foreground mb-2">Panel de Administración</h1>
                        <p className="text-muted-foreground">
                            Gestiona tu colección de recetas
                            {viewMode === "list" && (
                                <> • <span className="font-mono">{filtered.length}</span> resultados</>
                            )}
                        </p>
                    </div>

                    {viewMode === "list" && (
                        <div className="flex w-full gap-2 md:w-auto">
                            {/* Search input */}
                            <div className="relative flex-1 md:w-80">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar por título o descripción…"
                                    className="pl-9 font-mono"
                                    aria-label="Buscar recetas"
                                />
                            </div>

                            <Button onClick={() => setViewMode("create")} className="font-mono whitespace-nowrap"
                                    disabled={busy}>
                                <Plus className="h-4 w-4 mr-2"/>
                                Nueva Receta
                            </Button>
                        </div>
                    )}
                </div>

                {viewMode === "list" && (
                    isLoadingList ? (
                        <div className="grid grid-cols-1 gap-4">
                            {skeletonKeys.map((k) => (
                                <Card key={k}>
                                    <CardContent className="p-6">
                                        <div className="flex gap-6">
                                            <div className="h-32 w-32 rounded-lg bg-muted animate-pulse"/>
                                            <div className="flex-1 space-y-3">
                                                <div className="h-6 w-1/2 bg-muted rounded animate-pulse"/>
                                                <div className="h-4 w-2/3 bg-muted rounded animate-pulse"/>
                                                <div className="h-4 w-1/3 bg-muted rounded animate-pulse"/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <>
                            {filtered.length === 0 ? (
                                <div className="text-center py-16 border border-dashed rounded-lg">
                                    <p className="text-muted-foreground font-mono">
                                        No hay recetas que coincidan con “{searchQuery}”.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {filtered.map((recipe) => (
                                        <Card key={recipe.id}>
                                            <CardContent className="p-6">
                                                <div className="flex gap-6">
                                                    <div
                                                        className="h-32 w-32 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center text-7xl">
                                                        {recipe.emoji}
                                                    </div>
                                                    <div className="flex-1">
                                                        <CardTitle
                                                            className="font-mono text-xl mb-2">{recipe.title}</CardTitle>
                                                        <CardDescription
                                                            className="mb-4">{recipe.description}</CardDescription>
                                                        <div
                                                            className="flex gap-2 text-sm text-muted-foreground font-mono">
                                                            <span>{recipe.prepTime + recipe.cookTime}m</span>
                                                            <span>•</span>
                                                            <span>{recipe.servings} porciones</span>
                                                            <span>•</span>
                                                            <span>{recipe.difficulty}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(recipe)}
                                                            className="font-mono"
                                                            disabled={busy}
                                                        >
                                                            <Pencil className="h-4 w-4 mr-2"/>
                                                            Editar
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete(recipe)}
                                                            className="font-mono"
                                                            disabled={busy}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2"/>
                                                            Eliminar
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )
                )}

                {viewMode === "create" && (
                    <div>
                        <h2 className="text-2xl font-mono font-bold text-foreground mb-6">Crear Nueva Receta</h2>
                        <RecipeForm onSubmit={handleCreate} onCancel={() => setViewMode("list")} submitting={busy}/>
                    </div>
                )}

                {viewMode === "edit" && selectedRecipe && (
                    <div>
                        <h2 className="text-2xl font-mono font-bold text-foreground mb-6">Editar Receta</h2>
                        <RecipeForm
                            recipe={selectedRecipe}
                            onSubmit={handleUpdate}
                            onCancel={() => {
                                setViewMode("list")
                                setSelectedRecipe(null)
                            }}
                            submitting={busy}
                        />
                    </div>
                )}
            </main>

            <AlertDialog open={!!recipeToDelete} onOpenChange={() => setRecipeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-mono">Eliminar Receta</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres eliminar "{recipeToDelete?.title}"? Esta acción no se puede
                            deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="font-mono" disabled={busy}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="font-mono bg-destructive text-destructive-foreground"
                            disabled={busy}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ProtectedRoute>
    )
}
