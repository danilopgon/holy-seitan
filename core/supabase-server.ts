/** biome-ignore-all lint/style/noNonNullAssertion: Conexión a Supabase */
import {createServerClient, type CookieOptions} from "@supabase/ssr"
import {cookies} from "next/headers"

export async function supabaseServer() {
    const cookieStore = await cookies() // Next 15: mejor await

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
