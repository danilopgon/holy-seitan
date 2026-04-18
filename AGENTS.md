# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Holy Seitan** is a vegan recipe book web app. Recipes are written in Markdown, stored in Supabase, and rendered on the web. There is a public-facing recipe list/detail view and a password-protected `/admin` panel for creating, editing, and deleting recipes.

## Commands

**Package manager**: pnpm (preferred; both `package-lock.json` and `pnpm-lock.yaml` exist but pnpm-lock.yaml is more recent).

```sh
pnpm dev          # start dev server (Next.js)
pnpm build        # production build
pnpm start        # start production server
pnpm lint         # ESLint via next lint
```

**Biome** (linter + formatter) is installed but has no npm script — run it directly:
```sh
npx biome check .           # lint only
npx biome check --write .   # lint + format (fixes in place)
```

There is no test suite in the project.

**Environment setup**: Copy `env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` (direct Postgres URL for Drizzle, format in `env.example`)

## Architecture

### Stack
- Next.js 15 App Router, React 18, TypeScript (strict)
- Supabase — database + auth
- Drizzle ORM — schema definition and type inference only (no migration scripts are set up)
- Zustand — global client state
- Shadcn/UI (new-york style) + TailwindCSS v4 + Radix UI

### Directory Layout

```text
app/           # Next.js App Router pages
  page.tsx     # Home (public recipe grid)
  login/       # Auth page
  admin/       # Protected CRUD panel
  recipe/[slug]/

core/          # Domain layer (framework-agnostic)
  models/      # TypeScript interfaces: Recipe, RecipeDTO, AuthUser, etc.
  drizzle/     # Drizzle schema (schema.ts) — used for types, not runtime ORM calls
  supabase-server.ts   # Server-side Supabase client (RSC / server actions)
  supabase-browser.ts  # Client-side Supabase client

lib/           # Application layer
  actions/     # Next.js server actions (use "use server")
  store/       # Zustand stores: recipe-store.ts, auth-store.ts
  providers/   # React context providers (RecipesProvider)
  recipe-adapter.ts  # DTO ↔ domain model conversion

components/    # UI components
  ui/          # Shadcn/UI primitives (auto-generated, do not edit manually)
  *.tsx        # Custom components: header, footer, recipe-card, recipe-form, etc.

hooks/         # Custom React hooks
```

### Data Model Duality

There are two recipe representations that must be kept in sync:

- **`RecipeDTO`** (`core/models/recipe-dto.ts`) — raw Supabase shape: snake_case keys (`content_md`, `prep_time`, `is_published`), difficulty as `"easy" | "medium" | "hard"`
- **`Recipe`** (`core/models/recipe.ts`) — app domain model: camelCase keys (`content`, `prepTime`, `isPublished`), difficulty as `"Facil" | "Media" | "Dificil"` (Spanish labels)

All conversion between them goes through `lib/recipe-adapter.ts` (`dtoToRecipe`, `recipeToDtoPayload`, `recipeToDtoPayloadPartial`).

### Data Loading Strategy

1. `RecipesProvider` (client component mounted in `app/layout.tsx`) calls `loadRecipesServerAction()` once on mount. This seeds the Zustand `useRecipeStore` with all published recipes.
2. Subsequent admin mutations (add, update, delete) go directly through the browser Supabase client inside the Zustand store methods — no server actions are used for writes.
3. The public recipe detail page (`/recipe/[slug]`) first checks the Zustand store cache before hitting Supabase.

### Two Supabase Clients

Always use the correct one:
- `supabaseServer()` (`core/supabase-server.ts`) — async factory, reads cookies via `next/headers`; use in server components and server actions.
- `supabaseBrowser()` (`core/supabase-browser.ts`) — synchronous factory (tagged `"use client"`); use in client components and Zustand stores.

### Auth

- Email/password via Supabase Auth.
- `isAdmin` is derived from `user.app_metadata.role === "admin"` (set server-side in Supabase).
- Auth state is persisted in `localStorage` via Zustand's `persist` middleware (`auth-storage` key).
- `ProtectedRoute` component checks the live Supabase session client-side and redirects to `/login` if missing.

## Code Style

- **Formatter**: Biome — tabs for indentation, double quotes in JS/JSX.
- **Path alias**: `@/` maps to the project root (e.g. `@/core/models/recipe`).
- **Shadcn/UI**: Add new primitives with `npx shadcn@latest add <component>` — this updates `components/ui/`. Do not hand-edit those files.
- `next.config.mjs` has `typescript.ignoreBuildErrors: true` — TypeScript errors do not fail the build, but should still be fixed.
