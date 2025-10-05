"use client"

import type React from "react"

import { useState } from "react"
import type { Recipe } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownRenderer } from "./markdown-renderer"
import { X } from "lucide-react"

interface RecipeFormProps {
  recipe?: Recipe
  onSubmit: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
}

export function RecipeForm({ recipe, onSubmit, onCancel }: RecipeFormProps) {
  const [formData, setFormData] = useState({
    title: recipe?.title || "",
    slug: recipe?.slug || "",
    description: recipe?.description || "",
    content: recipe?.content || "",
    emoji: recipe?.emoji || "🍽️",
    prepTime: recipe?.prepTime || 0,
    cookTime: recipe?.cookTime || 0,
    servings: recipe?.servings || 4,
    difficulty: recipe?.difficulty || "Fácil",
    tags: recipe?.tags || [],
    author: recipe?.author || "Chef Tempeh",
  })

  const [tagInput, setTagInput] = useState("")

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Auto-generate slug from title
    if (field === "title") {
      const slug = value
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData as Omit<Recipe, "id" | "createdAt" | "updatedAt">)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono">Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-mono">
              Título
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="font-mono">
              Slug
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              required
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-mono">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              required
              className="font-mono"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emoji" className="font-mono">
              Emoji
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="emoji"
                value={formData.emoji}
                onChange={(e) => handleChange("emoji", e.target.value)}
                placeholder="🍽️"
                className="font-mono text-4xl text-center w-24 h-24"
                maxLength={2}
              />
              <div className="text-sm text-muted-foreground">
                <p>Elige un emoji que represente tu receta</p>
                <p className="mt-1">Ejemplos: 🍝 🍔 🍛 🍳 🍫 🥗 🍕 🌮</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author" className="font-mono">
              Autor
            </Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => handleChange("author", e.target.value)}
              required
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono">Detalles de la Receta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prepTime" className="font-mono">
                Tiempo de Preparación (minutos)
              </Label>
              <Input
                id="prepTime"
                type="number"
                value={formData.prepTime}
                onChange={(e) => handleChange("prepTime", Number.parseInt(e.target.value))}
                required
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cookTime" className="font-mono">
                Tiempo de Cocción (minutos)
              </Label>
              <Input
                id="cookTime"
                type="number"
                value={formData.cookTime}
                onChange={(e) => handleChange("cookTime", Number.parseInt(e.target.value))}
                required
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings" className="font-mono">
                Porciones
              </Label>
              <Input
                id="servings"
                type="number"
                value={formData.servings}
                onChange={(e) => handleChange("servings", Number.parseInt(e.target.value))}
                required
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty" className="font-mono">
              Dificultad
            </Label>
            <Select value={formData.difficulty} onValueChange={(value) => handleChange("difficulty", value)}>
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fácil" className="font-mono">
                  Fácil
                </SelectItem>
                <SelectItem value="Media" className="font-mono">
                  Media
                </SelectItem>
                <SelectItem value="Difícil" className="font-mono">
                  Difícil
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-mono">Etiquetas</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Agregar una etiqueta"
                className="font-mono"
              />
              <Button type="button" onClick={handleAddTag} variant="outline" className="font-mono bg-transparent">
                Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <div
                  key={tag}
                  className="bg-primary text-primary-foreground px-3 py-1 rounded-md flex items-center gap-2 font-mono text-sm"
                >
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono">Contenido de la Receta (Markdown)</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="font-mono">
                Editar
              </TabsTrigger>
              <TabsTrigger value="preview" className="font-mono">
                Vista Previa
              </TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="mt-4">
              <Textarea
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
                required
                className="font-mono min-h-[400px]"
                placeholder="# Título de la Receta&#10;&#10;## Ingredientes&#10;- Ingrediente 1&#10;- Ingrediente 2&#10;&#10;## Instrucciones&#10;1. Paso 1&#10;2. Paso 2"
              />
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <div className="border border-border rounded-lg p-6 min-h-[400px] bg-card">
                <MarkdownRenderer content={formData.content} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" className="font-mono">
          {recipe ? "Actualizar Receta" : "Crear Receta"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="font-mono bg-transparent">
          Cancelar
        </Button>
      </div>
    </form>
  )
}
