import Link from "next/link"
import type { Recipe } from "@/lib/types"
import { Clock, Users, ChefHat } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime

  return (
    <Link href={`/recipe/${recipe.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="relative h-48 w-full bg-muted flex items-center justify-center">
          <span className="text-8xl" role="img" aria-label={recipe.title}>
            {recipe.emoji}
          </span>
        </div>
        <CardHeader>
          <CardTitle className="font-mono text-lg line-clamp-1">{recipe.title}</CardTitle>
          <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{totalTime}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{recipe.servings}</span>
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="h-4 w-4" />
              <span>{recipe.difficulty}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="font-mono text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
