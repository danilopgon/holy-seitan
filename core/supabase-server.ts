import {createServerClient, type CookieOptions} from "@supabase/ssr"
import {cookies} from "next/headers"
import {supabasePublishableKey, supabaseUrl} from "@/core/supabase-env"

export async function supabaseServer() {
    const cookieStore = await cookies() // Next 15: mejor await

    return createServerClient(
        supabaseUrl,
        supabasePublishableKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({name, value, options}) => {
                            cookieStore.set(name, value, options as CookieOptions)
                        })
                    } catch {
                    }
                },
            },
        }
    )
}
