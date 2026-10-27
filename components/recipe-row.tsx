"use client"

import {ViewTransition} from "react"
import Link from "next/link"
import type {Recipe} from "@/core/models/recipe"
import {getEmojiTile} from "@/lib/emoji-tile"
import {getEmojiTransitionName} from "@/lib/view-transition"

interface RecipeRowProps {
	recipe: Recipe
	index?: number
}

export function RecipeRow({recipe, index}: RecipeRowProps) {
	const totalTime = recipe.prepTime + recipe.cookTime

	return (
		<li
			className="border-b border-border"
			style={index !== undefined ? {
				animation: 'recipe-fade-up 350ms cubic-bezier(0.22, 1, 0.36, 1) both',
				animationDelay: `${Math.min(index, 12) * 30}ms`,
			} : undefined}
		>
			<Link
				href={`/recipe/${recipe.slug}`}
				className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1 rounded-md px-2 py-4 transition-colors hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-6"
			>
				<div
					className="row-span-2 flex h-16 w-16 items-center justify-center rounded-md md:row-span-1"
					data-tile={getEmojiTile(recipe.slug)}
				>
					<ViewTransition name={getEmojiTransitionName(recipe.slug)}>
						<span className="font-emoji text-4xl" role="img" aria-label={recipe.title}>
							{recipe.emoji}
						</span>
					</ViewTransition>
				</div>
				<div className="min-w-0">
					<h3 className="font-mono text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
						{recipe.title}
					</h3>
					<p className="text-sm text-muted-foreground line-clamp-1">{recipe.description}</p>
				</div>
				<p className="flex flex-wrap gap-x-4 font-mono text-sm text-muted-foreground tabular-nums md:justify-end md:text-foreground">
					<span>{totalTime} min</span>
					<span>{recipe.servings} rac.</span>
					<span>{recipe.difficulty}</span>
				</p>
			</Link>
		</li>
	)
}
