// End-to-end check of the MCP server (issue #9) against the local Supabase stack, doing what an MCP client
// such as Claude Code does: register itself, send the user through consent, get a token, call the tools.
//
//   npx supabase start && npx supabase db reset          (loads supabase/seed.sql)
//   npx supabase functions serve mcp --env-file supabase/functions/.env
//   pnpm mcp:smoke
//
// Local only: it signs in with the fake seed accounts and edits the unpublished 'receta-de-prueba'.
import {createHash, randomBytes} from "node:crypto"
import {createClient} from "@supabase/supabase-js"

const SUPABASE_URL = process.env.MCP_SMOKE_SUPABASE_URL ?? "http://127.0.0.1:54321"
const PUBLISHABLE_KEY = process.env.MCP_SMOKE_PUBLISHABLE_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
const MCP_URL = `${SUPABASE_URL}/functions/v1/mcp`
const REDIRECT_URI = "http://localhost:8976/callback"
const PASSWORD = "holy-seitan-local"
const SLUG = "receta-de-prueba"

let failures = 0
const check = (ok: boolean, label: string, detail?: unknown) => {
    console.log(`${ok ? "✓" : "✗"} ${label}${!ok && detail !== undefined ? `\n    ${JSON.stringify(detail).slice(0, 400)}` : ""}`)
    if (!ok) failures++
}

const base64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

async function connect(email: string) {
    const registration = await fetch(`${SUPABASE_URL}/auth/v1/oauth/clients/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            client_name: `mcp-smoke (${email})`,
            redirect_uris: [REDIRECT_URI],
            token_endpoint_auth_method: "none",
            grant_types: ["authorization_code", "refresh_token"],
            response_types: ["code"],
        }),
    }).then((r) => r.json())
    const clientId = registration.client_id as string

    const verifier = base64url(randomBytes(32))
    const challenge = base64url(createHash("sha256").update(verifier).digest())
    const authorize = new URL(`${SUPABASE_URL}/auth/v1/oauth/authorize`)
    authorize.search = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        code_challenge: challenge,
        code_challenge_method: "S256",
        state: "smoke",
        scope: "email",
    }).toString()
    const toConsent = await fetch(authorize, {redirect: "manual"})
    const consentUrl = new URL(toConsent.headers.get("location") ?? "", "http://x")
    const authorizationId = consentUrl.searchParams.get("authorization_id")

    // The consent page does this in the browser for the signed-in user
    const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {auth: {persistSession: false}})
    const signIn = await supabase.auth.signInWithPassword({email, password: PASSWORD})
    if (signIn.error || !authorizationId) throw new Error(`sign-in or consent redirect failed: ${signIn.error?.message ?? consentUrl}`)
    const details = await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
    if (details.error) throw new Error(`authorization details: ${details.error.message}`)
    const approved = await supabase.auth.oauth.approveAuthorization(authorizationId, {skipBrowserRedirect: true})
    if (approved.error) throw new Error(`approve: ${approved.error.message}`)
    const code = new URL(approved.data?.redirect_url ?? "").searchParams.get("code")

    const token = await fetch(`${SUPABASE_URL}/auth/v1/oauth/token`, {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code ?? "",
            code_verifier: verifier,
            client_id: clientId,
            redirect_uri: REDIRECT_URI,
        }),
    }).then((r) => r.json())

    return {clientId, accessToken: token.access_token as string, refreshToken: token.refresh_token as string, supabase, consentPath: consentUrl.pathname}
}

let rpcId = 0
async function mcp(token: string, method: string, params: unknown = {}) {
    const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
            "Mcp-Protocol-Version": "2025-06-18",
        },
        body: JSON.stringify({jsonrpc: "2.0", id: ++rpcId, method, params}),
    })
    const text = await response.text()
    const json = text.trimStart().startsWith("{")
        ? JSON.parse(text)
        : JSON.parse(text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).join(""))
    return {status: response.status, ...json}
}

async function tool(token: string, name: string, args: Record<string, unknown>) {
    const res = await mcp(token, "tools/call", {name, arguments: args})
    const result = res.result ?? {}
    return {isError: !!result.isError, data: result.structuredContent, text: result.content?.[0]?.text as string | undefined}
}

async function main() {
    const unauth = await fetch(MCP_URL, {method: "POST", headers: {"Content-Type": "application/json", Accept: "application/json, text/event-stream"}, body: "{}"})
    check(unauth.status === 401 && !!unauth.headers.get("www-authenticate"), "without a token: 401 with an OAuth challenge")

    const admin = await connect("dani@local.test")
    check(admin.consentPath === "/oauth/consent", "authorize sends the user to /oauth/consent")
    check(!!admin.accessToken, "an admin gets an access token after consenting")
    const header = JSON.parse(Buffer.from(admin.accessToken.split(".")[0], "base64url").toString())
    const claims = JSON.parse(Buffer.from(admin.accessToken.split(".")[1], "base64url").toString())
    check(header.alg === "ES256" && claims.client_id === admin.clientId, "the token is ES256 and carries the client_id", {header, claims})

    await mcp(admin.accessToken, "initialize", {protocolVersion: "2025-06-18", capabilities: {}, clientInfo: {name: "smoke", version: "1"}})
    const tools = (await mcp(admin.accessToken, "tools/list")).result?.tools?.map((t: { name: string }) => t.name) ?? []
    check(
        ["search_recipes", "get_recipe", "propose_recipe_update", "apply_recipe_update", "get_recipe_history", "restore_recipe_revision"].every((t) => tools.includes(t)),
        "tools/list exposes the six recipe tools",
        tools,
    )

    const search = await tool(admin.accessToken, "search_recipes", {query: "prueba"})
    check(search.data?.matches?.[0]?.slug === SLUG, "search finds the unpublished test recipe for an admin", search)
    const many = await tool(admin.accessToken, "search_recipes", {query: "sopa"})
    check((many.data?.count ?? 0) > 1 && /Ask the user/.test(many.data?.next_step), "several matches ask for disambiguation", many.data)

    const recipe = (await tool(admin.accessToken, "get_recipe", {slug: SLUG})).data
    const v = recipe?.version as number
    check(Number.isInteger(v) && recipe.content_md.includes("1. Sofreímos la cebolla.") && recipe.ingredients.length === 3, "get_recipe returns the real recipe and its version", recipe)

    const edits = {
        content: [{old: "1. Sofreímos la cebolla.", new: "1. Pochamos la cebolla a fuego lento 10 minutos."}],
        ingredients: [{op: "update", id: "prueba-1", quantity: {min: 2}}, {op: "add", ingredient: {name: "ajo", quantity: {min: 1}, unit: "diente"}}],
    }
    const summary = "Pochar la cebolla más tiempo y añadir ajo"
    const proposal = await tool(admin.accessToken, "propose_recipe_update", {slug: SLUG, base_version: v, edits, summary})
    check(!proposal.isError && proposal.data?.proposal_id?.length === 32, "propose returns a diff and a proposal_id", proposal)
    const unchanged = (await tool(admin.accessToken, "get_recipe", {slug: SLUG})).data
    check(unchanged?.version === v, "proposing does not write anything")

    const forged = await tool(admin.accessToken, "apply_recipe_update", {slug: SLUG, base_version: v, edits: {...edits, content: []}, summary, proposal_id: proposal.data.proposal_id})
    check(forged.isError && /does not match/.test(forged.text ?? ""), "apply refuses edits that differ from the proposal", forged)

    const applied = await tool(admin.accessToken, "apply_recipe_update", {slug: SLUG, base_version: v, edits, summary, proposal_id: proposal.data.proposal_id})
    check(!applied.isError && applied.data?.verified === true && applied.data?.version === v + 1, "apply saves, re-reads and verifies", applied)
    const saved = (await tool(admin.accessToken, "get_recipe", {slug: SLUG})).data
    check(saved?.content_md.includes("Pochamos la cebolla a fuego lento") && saved.content_md.includes("2. Añadimos el tomate"), "only the edited line changed")

    const stale = await tool(admin.accessToken, "propose_recipe_update", {slug: SLUG, base_version: v, edits, summary})
    check(stale.isError && /Version conflict/.test(stale.text ?? ""), "a stale base_version is reported as a conflict", stale)

    const history = (await tool(admin.accessToken, "get_recipe_history", {slug: SLUG})).data
    check(history?.revisions?.[0]?.version === v && history.revisions[0].source === "mcp" && history.revisions[0].summary === summary, "the history records the change as made through MCP", history)

    const restored = await tool(admin.accessToken, "restore_recipe_revision", {slug: SLUG, base_version: v + 1, version: v})
    check(!restored.isError && restored.data?.verified === true && restored.data?.version === v + 2, "restore brings back the previous version as a new one", restored)
    const back = (await tool(admin.accessToken, "get_recipe", {slug: SLUG})).data
    check(back?.content_md === recipe.content_md && JSON.stringify(back.ingredients) === JSON.stringify(recipe.ingredients), "the restored recipe equals the original")

    const intruder = await connect("intruso@local.test")
    check(!!intruder.accessToken, "a signed-in user without the admin role can connect (consent) …")
    const hidden = await tool(intruder.accessToken, "get_recipe", {slug: SLUG})
    check(hidden.isError, "… but cannot see unpublished recipes", hidden)
    const dhal = (await tool(intruder.accessToken, "get_recipe", {slug: "dhal"})).data
    const dhalEdits = {title: "Dhal hackeado"}
    const dhalProposal = (await tool(intruder.accessToken, "propose_recipe_update", {slug: "dhal", base_version: dhal.version, edits: dhalEdits, summary: "intento"})).data
    const denied = await tool(intruder.accessToken, "apply_recipe_update", {slug: "dhal", base_version: dhal.version, edits: dhalEdits, summary: "intento", proposal_id: dhalProposal.proposal_id})
    check(denied.isError && /Not allowed/.test(denied.text ?? ""), "… and cannot change published ones", denied)

    const revoked = await admin.supabase.auth.oauth.revokeGrant({clientId: admin.clientId})
    check(!revoked.error, "the admin can revoke the client", revoked.error)
    const refresh = await fetch(`${SUPABASE_URL}/auth/v1/oauth/token`, {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({grant_type: "refresh_token", refresh_token: admin.refreshToken, client_id: admin.clientId}),
    })
    check(refresh.status >= 400, "after revoking, the client cannot refresh its token", refresh.status)

    console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed")
    process.exit(failures ? 1 : 0)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
