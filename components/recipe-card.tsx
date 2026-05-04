"use client"

import type {MouseEvent} from "react"
import Link from "next/link"
import {useRouter} from "next/navigation"
import {Clock, Users, ChefHat} from "lucide-react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import type {Recipe} from "@/core/models/recipe"
import {getEmojiTransitionName, startViewTransitionIfAvailable} from "@/lib/view-transition"

interface RecipeCardProps {
	recipe: Recipe
}

export function RecipeCard({recipe}: RecipeCardProps) {
	const router = useRouter()
	const totalTime = recipe.prepTime + recipe.cookTime

	const handleTransitionNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault()
		startViewTransitionIfAvailable(() => {
			router.push(`/recipe/${recipe.slug}`)
		})
	}

	return (
		<Link href={`/recipe/${recipe.slug}`} onClick={handleTransitionNavigation}>
			<Card className="overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200 ease-out h-full">
				<div className="relative h-36 w-full bg-muted flex items-center justify-center">
					<span style={{viewTransitionName: getEmojiTransitionName(recipe.slug)}}>
						<span className="text-6xl" role="img" aria-label={recipe.title}>
							{recipe.emoji}
						</span>
					</span>
				</div>
				<CardHeader>
					<CardTitle className="font-mono text-lg font-semibold tracking-tight line-clamp-1">{recipe.title}</CardTitle>
					<CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 tabular-nums">
						<div className="flex items-center gap-1">
							<Clock className="h-4 w-4 text-primary/70" />
							<span>{totalTime}m</span>
						</div>
						<div className="flex items-center gap-1">
							<Users className="h-4 w-4 text-primary/70" />
							<span>{recipe.servings}</span>
						</div>
						<div className="flex items-center gap-1">
							<ChefHat className="h-4 w-4 text-primary/70" />
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
