# Tech stack

## Runtime and language

| Item | Version / choice | Notes |
|------|------------------|--------|
| Node.js | **20+** (22 in CI) | Required by Next 16, Prisma 7, Tailwind Oxide toolchain |
| TypeScript | **5.x** | `strict: true`; path alias `@/*` → `src/*` |
| Package manager | **npm** | Lockfile v2+; regenerate on **Linux-friendly** npm when possible |

## Application framework

| Package | Role |
|---------|------|
| **next** `16.2.x` | App Router, RSC, Route Handlers, middleware |
| **react** / **react-dom** `19.2.x` | UI |

## Styling and UI

| Package | Role |
|---------|------|
| **tailwindcss** `4.x` | Utility CSS; PostCSS via `@tailwindcss/postcss` |
| **lucide-react** | Icons |
| **clsx** + **tailwind-merge** | `cn()` helper for class names |

## Data and ORM

| Package | Role |
|---------|------|
| **prisma** / **@prisma/client** `7.8.x` | CLI + client version alignment |
| **@prisma/adapter-libsql** | Driver adapter for Prisma Client |
| **@libsql/client** | LibSQL / Turso wire protocol |

**Prisma 7 specifics**

- Generator: **`prisma-client`** (not legacy `prisma-client-js` only).
- **Required `output`** in `schema.prisma` → generated client under **`src/generated/prisma/`**.
- **No** `url` in `schema.prisma` datasource block; **CLI URL** lives in **`prisma.config.ts`** (local file for migrations).

## Auth

| Package | Role |
|---------|------|
| **next-auth** `5.0.0-beta.x` | Auth.js for Next.js — Google provider, JWT sessions |

Optional dependency present for future DB-backed sessions: **`@auth/prisma-adapter`** (not wired in current `auth.ts`).

## Charts and dates

| Package | Role |
|---------|------|
| **recharts** | Health metrics charts |
| **date-fns** | Date utilities where used |

## Tooling (dev)

| Package | Role |
|---------|------|
| **eslint** + **eslint-config-next** | Lint |
| **tsx** | Run `seed-ideas*.mjs` after `prisma generate` (generated client is **TypeScript**; plain `node` cannot resolve it) |
| **@google/genai** `≥ 2.0` | Gemini **Interactions API** in `scripts/generate-ideas-gemini.mjs` (dev-only; not used by Next.js runtime) |
| **@esbuild/win32-x64** | Windows-only optional dep for **tsx** seed scripts (skipped on Linux/Vercel) |
| **Node** | `seed-ideas*:dry` and `generate-ideas*` (plain `node`; no Prisma import on dry paths) |
| **dotenv** | Load `.env` / `.env.local` for CLI scripts |

## Infrastructure (external)

- **Vercel** — Hosting, CDN, serverless Node runtime, env management.
- **Turso** — Managed libSQL; production database.
- **Google Cloud Console** — OAuth 2.0 Web client for Google sign-in.

## Design constraints

- **SQLite** semantics (via Turso): no Postgres-specific types; migrations are SQL files compatible with SQLite.
- **Edge**: Auth middleware runs on Edge; Prisma with LibSQL is used in **Node** route handlers (default App Router API runtime unless configured otherwise).
