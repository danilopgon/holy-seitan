"use client"

import type React from "react"
import {useEffect} from "react"
import {useRouter} from "next/navigation"
import {useAuthStore} from "@/lib/store/auth-store"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!user?.isAdmin) {
      router.push("/login")
    }
  }, [user, router])

  if (!user?.isAdmin) {
    return null
  }

  return <>{children}</>
}
