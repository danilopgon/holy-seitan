"use client"

import {AlertCircle} from "lucide-react"
import {useRouter} from "next/navigation"
import type React from "react"
import {useId, useState} from "react"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {useAuthStore} from "@/lib/auth-store"

export default function LoginPage() {
    const router = useRouter()
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
                router.push("/admin")
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
                    <CardTitle className="font-mono text-2xl">Acceso Admin</CardTitle>
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
                                className="font-mono"
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
                                className="font-mono"
                            />
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4"/>
                                <AlertDescription className="font-mono">{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full font-mono" disabled={isLoading}>
                            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </Button>
                    </form>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-mono text-muted-foreground mb-2">Credenciales de Demostración:</p>
                        <p className="text-xs font-mono">Correo: admin@holyseitan.com</p>
                        <p className="text-xs font-mono">Contraseña: admin123</p>
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}
