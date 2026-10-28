"use client"
import {createBrowserClient} from "@supabase/ssr"
import {supabasePublishableKey, supabaseUrl} from "@/core/supabase-env"

export const supabaseBrowser = () =>
    createBrowserClient(
        supabaseUrl,
        supabasePublishableKey,
    )