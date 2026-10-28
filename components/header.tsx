"use client"

import Link from "next/link"
import {useAuthStore} from "@/lib/store/auth-store"
import {Button} from "@/components/ui/button"
import {LogOut} from "lucide-react"
import {useRouter} from "next/navigation";
import {ThemeToggle} from "@/components/theme-toggle";

const navLink =
    "inline-flex min-h-11 items-center whitespace-nowrap rounded-sm px-1 text-sm font-mono hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

export function Header() {
    const {user, logout} = useAuthStore()
    const router = useRouter()

    const logoutAndNavigate = async () => {
        await logout()
        router.push('/login')

    }

    return (
        <header className="border-b border-border bg-card">
            <div className="container mx-auto max-w-6xl px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                        <span className="font-emoji text-xl sm:text-2xl text-primary" aria-hidden="true">🌱</span>
                        <span className="whitespace-nowrap text-xl sm:text-2xl font-mono font-bold text-foreground">Holy Seitan</span>
                    </Link>

                    <nav className="flex items-center gap-3 sm:gap-4">
                        <Link href="/" className={`${navLink} max-sm:hidden`}>
                            Recetas
                        </Link>
                        {user?.isAdmin ? (
                            <>
                                <Link href="/admin" className={navLink}>
                                    Admin
                                </Link>
                                <Button variant="ghost" size="sm" onClick={logoutAndNavigate} className="font-mono">
                                    <LogOut className="h-4 w-4 mr-2"/>
                                    Cerrar Sesión
                                </Button>
                            </>
                        ) : (
                            <Link href="/login" className={`${navLink} text-muted-foreground`}>
                                Acceso Admin
                            </Link>
                        )}
                        <ThemeToggle/>
                    </nav>
                </div>
            </div>
        </header>
    )
}
