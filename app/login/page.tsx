"use client"

import {AlertCircle} from "lucide-react"
import {useRouter, useSearchParams} from "next/navigation"
import type React from "react"
import {useId, useState} from "react"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {safeNextPath} from "@/lib/safe-next-path"
import {useAuthStore} from "@/lib/store/auth-store"

export default function LoginPage() {
    const router = useRouter()
    // An MCP client's consent screen sends people here with ?next= and expects them back after signing in
    const next = useSearchParams().get("next")
    const login = useAuthStore((state) => state.login)
    const emailId = useId();
    const passwordId = useId();
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const success = await login(email, password)
            if (success) {
                router.push(typeof window === "undefined" ? "/admin" : safeNextPath(next, "/admin"))
            } else {
                setError("Correo o contraseña inválidos")
            }
        } catch (_error) {
            setError("Ocurrió un error. Por favor intenta de nuevo.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="container mx-auto px-4 py-16 flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="font-mono text-2xl tracking-tight">Acceso Admin</CardTitle>
                    <CardDescription>Inicia sesión para gestionar recetas</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor={emailId} className="font-mono">
                                Correo Electrónico
                            </Label>
                            <Input
                                id={emailId}
                                type="email"
                                placeholder="admin@holyseitan.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={passwordId} className="font-mono">
                                Contraseña
                            </Label>
                            <Input
                                id={passwordId}
                                type="password"
                                placeholder="Ingresa tu contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4"/>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full font-mono" disabled={isLoading}>
                            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    )
}
