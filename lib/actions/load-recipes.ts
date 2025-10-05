"use server"

import type {RecipeDTO} from "@/core/models/recipe-dto"
import {supabaseServer} from "@/core/supabase-server";

export async function loadRecipesServerAction(): Promise<RecipeDTO[]> {
    const supabase = await supabaseServer()
    const {data, error} = await supabase
        .from("recipes")
        .select("*")
        .eq("is_published", true)
        .order("created_at", {ascending: false})

    if (error) throw error
    return data ?? []
}
