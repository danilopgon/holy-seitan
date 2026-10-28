# Servidor MCP de Holy Seitan

Permite que un agente (Claude Code, ChatGPT…) lea recetas, cree recetas nuevas y aplique cambios que hayas aprobado. Es la issue #9.

- **Endpoint:** `https://krenaahusuofcxvxmzrt.supabase.co/functions/v1/mcp` (Edge Function `supabase/functions/mcp`).
- **Acceso:** OAuth 2.1 con Supabase Auth. Solo entran las dos cuentas existentes (las altas están cerradas) y cada conexión pide consentimiento en `/oauth/consent`. Las conexiones se revocan en `/admin`, en "Agentes conectados".
- **Permisos:** el agente actúa como la cuenta con la que te conectas, con RLS. Solo los admins (`app_metadata.role = 'admin'`) pueden escribir.

## Herramientas

| Herramienta | Qué hace |
|---|---|
| `search_recipes` | Busca por título, descripción, slug o etiqueta. Si hay varias, pide que elijas. |
| `get_recipe` | Receta completa: preparación, ingredientes con sus ids y `version`. |
| `propose_recipe_update` | Valida un cambio acotado y devuelve el diff y un `proposal_id`. No guarda nada. |
| `apply_recipe_update` | Guarda **exactamente** la propuesta aprobada (mismo `proposal_id`), la vuelve a leer y lo confirma. |
| `get_recipe_history` | Versiones anteriores: quién, desde dónde (panel o MCP), por qué y cuándo. |
| `restore_recipe_revision` | Devuelve la receta a una versión anterior. La restauración también queda en el historial. |
| `propose_recipe_create` | Valida una receta nueva y devuelve su vista previa, el slug y un `proposal_id`. No guarda nada. |
| `create_recipe` | Crea **exactamente** la receta aprobada, como la cuenta conectada, y la vuelve a leer. Se publica por defecto, como en el panel; con `publish: false` queda como borrador oculto. |

Recetas nuevas: título, descripción, emoji, preparación en Markdown (sin la lista de ingredientes), ingredientes estructurados, tiempos, raciones, dificultad y etiquetas. El slug sale del título y, si ya existe, se añade `-2`, `-3`… Borrar recetas no se puede desde el MCP, solo desde el panel.

Cambios permitidos: título, descripción, fragmentos exactos de la preparación (`old → new`, que tiene que aparecer una sola vez) e ingredientes (añadir, editar, quitar y mover). Cada escritura comprueba la `version` que se leyó; si la receta ha cambiado entretanto, falla con un conflicto en vez de pisar el cambio.

## Conectar

**Claude Code**
```sh
claude mcp add --transport http holy-seitan https://krenaahusuofcxvxmzrt.supabase.co/functions/v1/mcp
```
Después, en Claude Code, ejecuta `/mcp`, elige `holy-seitan` e inicia sesión. Se abre `/oauth/consent` y ahí pulsas "Permitir acceso".

**ChatGPT** (necesita el modo desarrollador)
Settings → Apps & Connectors → Advanced → Developer mode. Luego, en Connectors → Create: nombre `Holy Seitan`, URL del endpoint y autenticación OAuth. Al conectar se abre la misma pantalla de consentimiento.

## Desarrollo local

```sh
npx supabase start          # aplica las migraciones; supabase/seed.sql (local, gitignored) carga cuentas y recetas de prueba
npx supabase functions serve mcp --env-file supabase/functions/.env
pnpm test:db                # pgTAP: RLS, versiones, historial y restauración
pnpm test:functions         # Deno: contrato de ediciones, diff y proposal_id
pnpm mcp:smoke              # de principio a fin: OAuth, herramientas, denegación y revocación
```

La CLI necesita una clave de firma local: `npx supabase gen signing-key --algorithm ES256 --append`, sobre un `supabase/signing_keys.json` que contenga `[]`. El servidor rechaza tokens HS256.

## Notas
- `[auth.email] enable_signup` tiene que seguir a `true`: a `false`, desactiva el login por email de las cuentas existentes. Las altas se cierran con `[auth] enable_signup = false`.
- Revocar una conexión invalida su refresh token. El access token que ya tuviera sigue valiendo hasta que caduca (como mucho 1 hora).
- Las recetas pueden contener texto que el agente lee. Como solo las escribís vosotros y las herramientas no ejecutan nada, el riesgo de instrucciones inyectadas es bajo.
