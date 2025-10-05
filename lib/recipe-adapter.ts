import type {Recipe} from "@/core/models/recipe";
import type {RecipeDTO} from "@/core/models/recipe-dto";

const diffToUi: Record<RecipeDTO["difficulty"], Recipe["difficulty"]> = {
    easy: "Facil",
    medium: "Media",
    hard: "Dificil",
}

const diffToDto: Record<Recipe["difficulty"], RecipeDTO["difficulty"]> = {
    "Facil": "easy",
    "Media": "medium",
    "Dificil": "hard",
}

export function dtoToRecipe(dto: RecipeDTO, author: string): Recipe {
    return {
        id: dto.id,
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        content: dto.content_md,
        emoji: dto.emoji,
        prepTime: dto.prep_time ?? 0,
        cookTime: dto.cook_time ?? 0,
        servings: dto.servings ?? 1,
        difficulty: diffToUi[dto.difficulty],
        tags: dto.tags ?? [],
        author,
        createdAt: new Date(dto.created_at).toISOString(),
        updatedAt: new Date(dto.updated_at).toISOString(),
        isPublished: dto.is_published
    }
}

export function recipeToDtoPayload(
    r: Omit<Recipe, "id" | "author" | "createdAt" | "updatedAt">,
): Omit<RecipeDTO, "id" | "created_by" | "created_at" | "updated_at"> {
    return {
        title: r.title,
        slug: r.slug,
        description: r.description,
        emoji: r.emoji,
        content_md: r.content,
        prep_time: r.prepTime,
        cook_time: r.cookTime,
        servings: r.servings,
        difficulty: diffToDto[r.difficulty],
        tags: r.tags ?? [],
        is_published: true,
    }
}

type PartialRecipe = Partial<Omit<Recipe, "id" | "createdAt" | "updatedAt" | "author">>

export function recipeToDtoPayloadPartial(input: PartialRecipe) {
    const out: Partial<RecipeDTO> = {}

    if (input.title !== undefined) out.title = input.title
    if (input.slug !== undefined) out.slug = input.slug
    if (input.description !== undefined) out.description = input.description
    if (input.content !== undefined) out.content_md = input.content
    if (input.emoji !== undefined) out.emoji = input.emoji
    if (input.prepTime !== undefined) out.prep_time = input.prepTime
    if (input.cookTime !== undefined) out.cook_time = input.cookTime
    if (input.servings !== undefined) out.servings = input.servings
    if (input.difficulty !== undefined) {
        const map: Record<string, RecipeDTO["difficulty"]> = {
            "Facil": "easy",
            "Media": "medium",
            "Dificil": "hard",
        }
        out.difficulty = map[input.difficulty] ?? "easy"
    }
    if (input.tags !== undefined) out.tags = input.tags
    if (input.isPublished !== undefined) out.is_published = input.isPublished

    return out
}
