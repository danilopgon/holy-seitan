"use client"

import {create} from "zustand"
import {persist} from "zustand/middleware"
import type {AuthStore} from "@/models/authStore";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      login: async (email: string, password: string) => {
        // Mock authentication - in real app, this would call Supabase
        // Admin credentials: admin@tofubase.com / admin123
        if (email === "admin@tofubase.com" && password === "admin123") {
          set({ user: { email, isAdmin: true } })
          return true
        }
        return false
      },
      logout: () => {
        set({ user: null })
      },
      isAuthenticated: () => {
        return get().user !== null
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)
