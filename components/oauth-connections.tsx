"use client"

import {Unplug} from "lucide-react"
import {useCallback, useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {supabaseBrowser} from "@/core/supabase-browser"
import type {OAuthGrant} from "@supabase/supabase-js"

// The MCP clients (Claude Code, ChatGPT…) this account has authorised. Revoking signs the client out and
// it has to ask for consent again (issue #9).
export function OAuthConnections() {
    const [grants, setGrants] = useState<OAuthGrant[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [revoking, setRevoking] = useState<string | null>(null)

    const load = useCallback(async () => {
        const {data, error} = await supabaseBrowser().auth.oauth.listGrants()
        if (error) {
            setError(error.message)
            setGrants([])
            return
        }
        setError(null)
        setGrants(data ?? [])
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    const revoke = async (grant: OAuthGrant) => {
        setRevoking(grant.client.id)
        const {error} = await supabaseBrowser().auth.oauth.revokeGrant({clientId: grant.client.id})
        setRevoking(null)
        if (error) setError(error.message)
        else await load()
    }

    return (
        <section aria-labelledby="connections-heading" className="mt-12 border-t border-border pt-8">
            <h2 id="connections-heading" className="text-xl font-mono font-semibold tracking-tight mb-2">
                Agentes conectados
            </h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-[68ch]">
                Aplicaciones a las que has dado acceso por MCP para leer recetas y aplicar cambios aprobados. Al revocar
                una, pierde el acceso y tendrá que volver a pedir permiso.
            </p>

            {grants === null ? (
                <p role="status" className="text-sm text-muted-foreground">Cargando…</p>
            ) : grants.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ninguna aplicación conectada.</p>
            ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                    {grants.map((grant) => (
                        <li key={grant.client.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                            <div className="min-w-0">
                                <p className="font-mono font-semibold">{grant.client.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Desde el {new Date(grant.granted_at).toLocaleDateString("es-ES")}
                                    {grant.scopes.length > 0 && `, con permisos ${grant.scopes.join(", ")}`}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="font-mono"
                                disabled={revoking === grant.client.id}
                                onClick={() => void revoke(grant)}
                            >
                                <Unplug className="h-4 w-4 mr-2" aria-hidden="true"/>
                                {revoking === grant.client.id ? "Revocando…" : "Revocar"}
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        </section>
    )
}
