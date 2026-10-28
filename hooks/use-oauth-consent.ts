import {isAuthSessionMissingError, type OAuthAuthorizationDetails} from "@supabase/supabase-js"
import {useCallback, useEffect, useRef, useState} from "react"
import {supabaseBrowser} from "@/core/supabase-browser"

// Adapted from Supabase's OAuth Consent block (@supabase/oauth-consent-nextjs), using this app's client.
// An MCP client (Claude Code, ChatGPT) sends the user here with an authorization_id; the user approves or
// denies, and Supabase Auth redirects back to the client.

export type OAuthConsentDecision = "approve" | "deny"

const LOGIN_PATH = "/login"

const withNextParam = (path: string, next: string) => {
    const url = new URL(path, window.location.origin)
    url.searchParams.set("next", next)
    return `${url.pathname}${url.search}${url.hash}`
}

export function useOAuthConsent(authorizationId: string | null | undefined) {
    const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [decision, setDecision] = useState<OAuthConsentDecision | null>(null)
    const isDeciding = useRef(false)

    useEffect(() => {
        let active = true

        const loadAuthorization = async () => {
            setIsLoading(true)
            setError(null)
            setDetails(null)
            setDecision(null)

            if (!authorizationId) {
                setError("Falta el identificador de autorización. Vuelve a conectar desde la aplicación.")
                setIsLoading(false)
                return
            }

            const supabase = supabaseBrowser()
            const {data: {user}, error: userError} = await supabase.auth.getUser()

            if (userError && !isAuthSessionMissingError(userError)) {
                if (active) {
                    setError(userError.message)
                    setIsLoading(false)
                }
                return
            }

            // Sign in first, then come back to this exact request
            if (!user) {
                if (active) {
                    window.location.replace(withNextParam(LOGIN_PATH, `${window.location.pathname}${window.location.search}`))
                }
                return
            }

            const {data, error} = await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
            if (error) {
                if (active) {
                    setError(error.message)
                    setIsLoading(false)
                }
                return
            }

            // Already approved before: Auth answers with the redirect straight away
            if (!("authorization_id" in data)) {
                if (active) window.location.replace(safeRedirect(data.redirect_url))
                return
            }

            if (active) {
                setDetails(data)
                setIsLoading(false)
            }
        }

        void loadAuthorization()
        return () => {
            active = false
        }
    }, [authorizationId])

    const decide = useCallback(
        async (action: OAuthConsentDecision) => {
            if (!authorizationId || isDeciding.current) return

            isDeciding.current = true
            setDecision(action)
            setError(null)
            const supabase = supabaseBrowser()
            const result = action === "approve"
                ? await supabase.auth.oauth.approveAuthorization(authorizationId, {skipBrowserRedirect: true})
                : await supabase.auth.oauth.denyAuthorization(authorizationId, {skipBrowserRedirect: true})

            if (result.error || !result.data?.redirect_url) {
                setError(result.error?.message ?? "El servidor no ha devuelto adónde volver. Inténtalo de nuevo desde la aplicación.")
                setDecision(null)
                isDeciding.current = false
                return
            }

            window.location.assign(safeRedirect(result.data.redirect_url))
        },
        [authorizationId],
    )

    return {
        details,
        email: details?.user.email ?? null,
        error,
        isLoading,
        decision,
        approve: () => decide("approve"),
        deny: () => decide("deny"),
    }
}

// The redirect comes from Supabase Auth and points at the client's registered callback; refuse anything
// that is not a URL so a malformed answer cannot run script through the location bar
function safeRedirect(url: string) {
    try {
        const parsed = new URL(url)
        return parsed.protocol === "javascript:" ? "/" : parsed.toString()
    } catch {
        return "/"
    }
}

export type {OAuthAuthorizationDetails}
