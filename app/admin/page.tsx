"use client"

import {useState} from "react"
import {useRecipeStore} from "@/lib/recipe-store"
import type {Recipe} from "@/lib/types"
import {ProtectedRoute} from "@/components/protected-route"
import {RecipeForm} from "@/components/recipe-form"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardTitle} from "@/components/ui/card"
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
import {Pencil, Plus, Trash2} from "lucide-react"

type ViewMode = "list" | "create" | "edit"

export default function AdminPage() {
    const {recipes, addRecipe, updateRecipe, deleteRecipe} = useRecipeStore()
    const [viewMode, setViewMode] = useState<ViewMode>("list")
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)

    const handleCreate = (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => {
        addRecipe(recipe)
        setViewMode("list")
    }

    const handleUpdate = (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => {
        if (selectedRecipe) {
            updateRecipe(selectedRecipe.id, recipe)
            setViewMode("list")
            setSelectedRecipe(null)
        }
    }

    const handleEdit = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
        setViewMode("edit")
    }

    const handleDelete = (recipe: Recipe) => {
        setRecipeToDelete(recipe)
    }

    const confirmDelete = () => {
        if (recipeToDelete) {
            deleteRecipe(recipeToDelete.id)
            setRecipeToDelete(null)
        }
    }

    return (
        <ProtectedRoute>
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-mono font-bold text-foreground mb-2">Panel de Administración</h1>
                        <p className="text-muted-foreground">Gestiona tu colección de recetas</p>
                    </div>
                    {viewMode === "list" && (
                        <Button onClick={() => setViewMode("create")} className="font-mono">
                            <Plus className="h-4 w-4 mr-2"/>
                            Nueva Receta
                        </Button>
                    )}
                </div>

                {viewMode === "list" && (
                    <div className="grid grid-cols-1 gap-4">
                        {recipes.map((recipe) => (
                            <Card key={recipe.id}>
                                <CardContent className="p-6">
                                    <div className="flex gap-6">
                                        <div
                                            className="h-32 w-32 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center text-7xl">
                                            {recipe.emoji}
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="font-mono text-xl mb-2">{recipe.title}</CardTitle>
                                            <CardDescription className="mb-4">{recipe.description}</CardDescription>
                                            <div className="flex gap-2 text-sm text-muted-foreground font-mono">
                                                <span>{recipe.prepTime + recipe.cookTime}m</span>
                                                <span>•</span>
                                                <span>{recipe.servings} porciones</span>
                                                <span>•</span>
                                                <span>{recipe.difficulty}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(recipe)}
                                                    className="font-mono">
                                                <Pencil className="h-4 w-4 mr-2"/>
                                                Editar
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(recipe)}
                                                className="font-mono"
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

                {viewMode === "create" && (
                    <div>
                        <h2 className="text-2xl font-mono font-bold text-foreground mb-6">Crear Nueva Receta</h2>
                        <RecipeForm onSubmit={handleCreate} onCancel={() => setViewMode("list")}/>
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
                        <AlertDialogCancel className="font-mono">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="font-mono bg-destructive text-destructive-foreground"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ProtectedRoute>
    )
}
