# Database

## Models (Prisma schema)

Defined in **`prisma/schema.prisma`**:

| Model | Purpose |
|-------|---------|
| **HealthEntry** | Daily-style health logs: date, weight, calories, water, sleep, workout flag, notes |
| **SavedIdea** | AI Idea Lab: category, title, content, tags, pinned, timestamps |

Both use SQLite-compatible types (`String` → TEXT, `DateTime` → NUMERIC/DATETIME per Prisma mapping, etc.).

## Two database targets

| Environment | Datasource | How `src/lib/prisma.ts` chooses |
|-------------|------------|----------------------------------|
| **Local dev** | `file:…/prisma/dev.db` | No `TURSO_DATABASE_URL` (or empty) |
| **Vercel / prod** | **Turso** (`libsql://…`) | `TURSO_DATABASE_URL` set; optional `TURSO_AUTH_TOKEN` |

**Important:** Setting env vars on Vercel **does not create tables**. Schema must exist on Turso (SQL console, `npm run db:apply-turso`, or Turso CLI).

## Prisma CLI vs app runtime

| Concern | Config file | URL used |
|---------|-------------|----------|
| **`prisma migrate dev`**, `db push`, Studio (local) | **`prisma.config.ts`** | `file:./prisma/dev.db` |
| **Running Next.js app** | **`src/lib/prisma.ts`** | Turso if `TURSO_*` set, else local file |

Prisma’s Turso guidance: develop migrations against **local SQLite**, then **apply** the generated `migration.sql` to Turso (this repo automates that with **`npm run db:apply-turso`**).

## Scripts

| Command | Effect |
|---------|--------|
| **`npm run db:migrate`** | `prisma migrate dev` — evolves **local** `dev.db` and writes migration folders |
| **`npm run db:apply-turso`** | Executes every **`prisma/migrations/*/migration.sql`** against Turso using `@libsql/client` (reads `.env` / `.env.local`) |
| **`npm run db:studio`** | Prisma Studio against CLI datasource (local file) |
| **`npm run seed-ideas`** | Inserts rows from **`scripts/ideas-output.json`** into **local** `dev.db` only (not Turso) |

## Seeding production ideas

`seed-ideas.mjs` is intentionally bound to the **local file** path. To bulk-load ideas on Turso:

1. Use Turso **SQL console** / import, or  
2. Extend a script to use the same `TURSO_*` + `PrismaLibSql` pattern as `apply-turso-schema.mjs`, or  
3. Use the live app UI after tables exist.

## Diagnostics

- **`GET /api/debug/db`** (authenticated) — returns `counts` or a structured error (e.g. missing table).
- **Vercel logs** — search for `[api/ideas`, `[api/health`, `[prisma]`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| 500 on `/api/ideas` or `/api/health` | Tables missing on Turso | Apply migrations SQL to Turso |
| 500 after schema change locally | Turso not updated | New `migration.sql` → run **`db:apply-turso`** again |
| Works locally, fails on Vercel | `TURSO_*` missing for **Preview** or **Production** | Set env for the environment you deploy |
| `no such table` | Wrong DB or empty Turso | Confirm URL points to intended Turso database |
