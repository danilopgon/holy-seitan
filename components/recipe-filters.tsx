"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { badgeVariants } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecipeFiltersProps {
  onSearchChange: (search: string) => void
  onTagClick: (tag: string) => void
  selectedTags: string[]
  availableTags: string[]
}

// Enough to fill two rows beside the hero; the rest open on demand
const COLLAPSED_TAGS = 12

export function RecipeFilters({ onSearchChange, onTagClick, selectedTags, availableTags }: RecipeFiltersProps) {
  const [search, setSearch] = useState("")
  const [showAll, setShowAll] = useState(false)

  const hidden = availableTags.length - COLLAPSED_TAGS
  const visibleTags = showAll || hidden <= 0
    ? availableTags
    : availableTags.filter((tag, i) => i < COLLAPSED_TAGS || selectedTags.includes(tag))

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onSearchChange(value)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar recetas..."
          aria-label="Buscar recetas"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Filtrar por etiquetas:</p>
        <div id="recipe-tag-filters" className="flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              aria-pressed={selectedTags.includes(tag)}
              className={cn(
                badgeVariants({ variant: selectedTags.includes(tag) ? "default" : "outline" }),
                "min-h-8 px-3 cursor-pointer font-mono transition-colors duration-150"
              )}
            >
              {tag}
            </button>
          ))}
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              aria-controls="recipe-tag-filters"
              className="min-h-8 rounded-md px-2 text-sm font-mono text-primary underline-offset-4 hover:underline active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {showAll ? "Ver menos" : `Ver todas (${availableTags.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
