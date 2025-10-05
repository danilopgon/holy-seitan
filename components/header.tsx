"use client"

import Link from "next/link"
import {useAuthStore} from "@/lib/store/auth-store"
import {Button} from "@/components/ui/button"
import {LogOut} from "lucide-react"

export function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold text-foreground">🌱 Holy Seitan</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm font-mono hover:text-primary transition-colors">
              Recetas
            </Link>
            {user?.isAdmin ? (
              <>
                <Link href="/admin" className="text-sm font-mono hover:text-primary transition-colors">
                  Admin
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} className="font-mono">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="font-mono bg-transparent">
                  Acceso Admin
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
