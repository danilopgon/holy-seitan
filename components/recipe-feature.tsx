"use client"

import {ViewTransition} from "react"
import Link from "next/link"
import {Badge} from "@/components/ui/badge"
import type {Recipe} from "@/core/models/recipe"
import {getEmojiTile} from "@/lib/emoji-tile"
import {getEmojiTransitionName} from "@/lib/view-transition"

export function RecipeFeature({recipe}: { recipe: Recipe }) {
	const totalTime = recipe.prepTime + recipe.cookTime

	return (
		<Link
			href={`/recipe/${recipe.slug}`}
			className="group grid overflow-hidden rounded-xl border border-border bg-card md:grid-cols-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
		>
			<div className="flex min-h-64 items-center justify-center md:min-h-80" data-tile={getEmojiTile(recipe.slug)}>
				<ViewTransition name={getEmojiTransitionName(recipe.slug)}>
					<span
						className="font-emoji text-[7rem] md:text-[9rem] transition-transform duration-300 ease-out group-hover:scale-105"
						role="img"
						aria-label={recipe.title}
					>
						{recipe.emoji}
					</span>
				</ViewTransition>
			</div>
			<div className="flex min-w-0 flex-col justify-center gap-4 p-6 md:p-10">
				<h3 className="font-mono text-3xl font-bold tracking-tight leading-tight [overflow-wrap:break-word] group-hover:text-primary transition-colors">
					{recipe.title}
				</h3>
				<p className="text-lg text-muted-foreground">{recipe.description}</p>
				<dl className="grid grid-cols-3 gap-4 font-mono tabular-nums">
					<div>
						<dt className="text-sm font-sans text-muted-foreground">Tiempo</dt>
						<dd className="font-semibold">{totalTime} min</dd>
					</div>
					<div>
						<dt className="text-sm font-sans text-muted-foreground">Raciones</dt>
						<dd className="font-semibold">{recipe.servings}</dd>
					</div>
					<div>
						<dt className="text-sm font-sans text-muted-foreground">Dificultad</dt>
						<dd className="font-semibold">{recipe.difficulty}</dd>
					</div>
				</dl>
				{recipe.tags.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{recipe.tags.slice(0, 3).map((tag) => (
							<Badge key={tag} variant="secondary" className="font-mono text-xs">
								{tag}
							</Badge>
						))}
					</div>
				)}
			</div>
		</Link>
	)
}
