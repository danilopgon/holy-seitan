"use client"

import {ViewTransition} from "react"
import Link from "next/link"
import {Clock, Users, ChefHat} from "lucide-react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import type {Recipe} from "@/core/models/recipe"
import {getEmojiTransitionName} from "@/lib/view-transition"

interface RecipeCardProps {
	recipe: Recipe
	index?: number
}

export function RecipeCard({recipe, index}: RecipeCardProps) {
	const totalTime = recipe.prepTime + recipe.cookTime

	return (
		<Link
			href={`/recipe/${recipe.slug}`}
			style={index !== undefined ? {
				animation: 'recipe-fade-up 350ms cubic-bezier(0.22, 1, 0.36, 1) both',
				animationDelay: `${index * 40}ms`,
			} : undefined}
		>
			<Card className="overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200 ease-out h-full">
				<div className="relative h-36 w-full bg-muted flex items-center justify-center">
					<ViewTransition name={getEmojiTransitionName(recipe.slug)}>
						<span className="text-6xl" role="img" aria-label={recipe.title}>
							{recipe.emoji}
						</span>
					</ViewTransition>
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
