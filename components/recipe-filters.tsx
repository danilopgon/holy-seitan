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

export function RecipeFilters({ onSearchChange, onTagClick, selectedTags, availableTags }: RecipeFiltersProps) {
  const [search, setSearch] = useState("")

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
          className="pl-10 font-mono"
        />
      </div>

      <div>
        <p className="text-sm font-mono text-muted-foreground mb-2">Filtrar por etiquetas:</p>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              aria-pressed={selectedTags.includes(tag)}
              className={cn(
                badgeVariants({ variant: selectedTags.includes(tag) ? "default" : "outline" }),
                "cursor-pointer font-mono transition-colors duration-150"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
