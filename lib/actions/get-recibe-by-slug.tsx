"use server"

import type {RecipeDTO} from "@/core/models/recipe-dto"
import {supabaseServer} from "@/core/supabase-server";

export async function getRecipeBySlugServerAction(slug: string): Promise<RecipeDTO | null> {
    const supabase = await supabaseServer()
    const {data, error} = await supabase
        .from("recipes")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle()

    if (error) throw error
    return (data as RecipeDTO) ?? null
}
