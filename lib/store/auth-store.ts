"use client"
import {create} from "zustand"
import {persist} from "zustand/middleware"
import {supabaseBrowser} from "@/core/supabase-browser"

export type AuthUser = {
    id: string
    email: string
    displayName?: string
    isAdmin: boolean
}

export interface AuthStore {
    user: AuthUser | null
    login: (email: string, password: string) => Promise<boolean>
    logout: () => Promise<void>
    isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            login: async (email, password) => {
                const supabase = supabaseBrowser()
                const {data, error} = await supabase.auth.signInWithPassword({email, password})
                if (error || !data.session?.user) return false

                const u = data.session.user
                const role = (u.app_metadata)?.role
                const display = (u.app_metadata)?.display_name ?? (u.user_metadata)?.display_name

                set({
                    user: {
                        id: u.id,
                        email: u.email ?? email,
                        displayName: display,
                        isAdmin: role === "admin",
                    },
                })
                return true
            },
            logout: async () => {
                const supabase = supabaseBrowser()
                await supabase.auth.signOut()
                set({user: null})
            },
            isAuthenticated: () => get().user !== null,
        }),
        {name: "auth-storage"},
    ),
)
