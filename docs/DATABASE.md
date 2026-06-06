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
| **`npm run seed-ideas`** | `prisma generate` + **`tsx`** — inserts **`scripts/ideas-output.json`** into **local** `dev.db` only |
| **`npm run seed-ideas:dry`** | Plain **Node** — validates JSON and lists rows that **would** be imported locally (no DB, no `prisma generate`) |
| **`npm run seed-ideas:turso`** | `prisma generate` + **`tsx`** — inserts the same JSON into **Turso** (`TURSO_*` in `.env.local` or CI) |
| **`npm run seed-ideas:turso:dry`** | Plain **Node** — same preview as above for Turso target (no network) |

## Seeding ideas (local vs Turso)

- **`scripts/seed-ideas.mjs`** uses the **local file** SQLite URL only — safe default for dev.
- **`scripts/seed-ideas-turso.mjs`** (and **`npm run seed-ideas:turso`**) uses **`TURSO_*`** + `PrismaLibSql` like the app.

Same source file: **`scripts/ideas-output.json`**. Each successful run **inserts** new `SavedIdea` rows (no dedupe). For dry-run, CI, and troubleshooting (including Windows **`@esbuild/win32-x64`**), see **[IDEAS_PIPELINE.md](./IDEAS_PIPELINE.md)**.

Other options: Turso **SQL console** / manual SQL, or create ideas through the **live app** after tables exist.

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
