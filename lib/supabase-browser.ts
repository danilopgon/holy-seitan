/** biome-ignore-all lint/style/noNonNullAssertion: Conexión a Supabase */
"use client"
import {createBrowserClient} from "@supabase/ssr"

export const supabaseBrowser = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )