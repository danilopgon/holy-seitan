"use client"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {useOAuthConsent} from "@/hooks/use-oauth-consent"

// Consent screen for MCP clients (Claude Code, ChatGPT), adapted from Supabase's OAuth Consent block.
// Approving lets the client act as the signed-in admin; RLS still decides what it can change.

function ConsentShell({clientName, children}: { clientName: string; children: React.ReactNode }) {
    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle className="font-mono text-2xl tracking-tight">Conectar {clientName}</CardTitle>
                <CardDescription>
                    Revisa qué aplicación pide acceso a Holy Seitan antes de permitirlo.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">{children}</CardContent>
        </Card>
    )
}

export function OAuthConsent({authorizationId}: { authorizationId?: string | null }) {
    const {details, email, error, isLoading, decision, approve, deny} = useOAuthConsent(authorizationId)

    if (isLoading || !details || !email) {
        return (
            <ConsentShell clientName="una aplicación">
                {isLoading ? (
                    <p role="status" className="text-sm text-muted-foreground">Cargando la solicitud…</p>
                ) : (
                    <p role="alert" className="text-sm text-destructive">
                        {error ?? "No se ha podido cargar la solicitud. Vuelve a conectar desde la aplicación."}
                    </p>
                )}
            </ConsentShell>
        )
    }

    const scopes = details.scope.split(" ").filter(Boolean)
    const rows = [
        {label: "Aplicación", value: details.client.name},
        {label: "Vuelve a", value: details.redirect_uri},
        {label: "Con la cuenta", value: email},
        ...(scopes.length ? [{label: "Permisos", value: scopes.join(", ")}] : []),
    ]

    return (
        <ConsentShell clientName={details.client.name}>
            <dl className="divide-y divide-border rounded-lg border border-border text-sm">
                {rows.map(({label, value}) => (
                    <div key={label} className="flex items-start justify-between gap-6 p-4">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="min-w-0 break-all text-right font-mono">{value}</dd>
                    </div>
                ))}
            </dl>
            <p className="text-sm text-muted-foreground">
                Permite el acceso solo si has iniciado tú esta conexión. La aplicación podrá leer las recetas y
                proponer cambios en tu nombre; cada cambio queda en el historial y puedes revocar el acceso desde el
                panel cuando quieras.
            </p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="font-mono" disabled={decision !== null} onClick={() => void deny()}>
                    {decision === "deny" ? "Denegando…" : "Denegar"}
                </Button>
                <Button type="button" className="font-mono" disabled={decision !== null} onClick={() => void approve()}>
                    {decision === "approve" ? "Permitiendo…" : "Permitir acceso"}
                </Button>
            </div>
        </ConsentShell>
    )
}
