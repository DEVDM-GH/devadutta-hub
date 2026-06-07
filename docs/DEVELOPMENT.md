# Local development

## Prerequisites

- **Node.js 20+** and npm 10+
- Google OAuth client with `http://localhost:3000/api/auth/callback/google`
- Optional: Turso credentials in `.env.local` if testing against remote DB locally

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run db:migrate            # creates / updates prisma/dev.db
npm run dev
```

Open `http://localhost:3000`.

## Environment file

Use **`.env.local`** (gitignored). See **[.env.example](../.env.example)** for keys. Minimum for auth + local DB:

- `AUTH_SECRET`
- `AUTH_URL=http://localhost:3000` (local)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- Optionally `ALLOWED_EMAILS`

Leave **`TURSO_*` unset** to use local SQLite for the app; set them only if you intentionally point local Next at Turso (then **`seed-ideas:turso`** / **`generate-ideas:turso`** update what you see at `/dashboard/ideas`). See **[IDEAS_PIPELINE.md](./IDEAS_PIPELINE.md)**.

Add **`GEMINI_API_KEY`** (from [Google AI Studio](https://aistudio.google.com/apikey)) to use Health Pulse coaching generation. Optional: **`GEMINI_MODEL`** (default: `gemini-3.5-flash`).

## Common commands

| Command | Use |
|---------|-----|
| `npm run dev` | Dev server with hot reload |
| `npm run lint` | ESLint |
| `npm run build` | Production build (also runs `prisma generate`) |
| `npm run db:migrate` | Create / apply migrations to **local** DB |
| `npm run db:studio` | GUI for local DB |
| `npm run seed-ideas` | Load `scripts/ideas-output.json` into **local** `dev.db` (`prisma generate` + **tsx**) |
| `npm run seed-ideas:dry` | Preview import locally (plain **Node**, no writes) |
| `npm run seed-ideas:turso` | Load the same JSON into **Turso** (`TURSO_*` + **tsx**) |
| `npm run generate-ideas` | Call Gemini → write `scripts/ideas-output.json` (needs `GEMINI_API_KEY`) |
| `npm run generate-ideas:dry` | Gemini preview, no file write |
| `npm run generate-ideas:local` | Generate + seed local `dev.db` |
| `npm run generate-ideas:turso` | Generate + seed Turso |
| `npm run db:apply-turso` | Push migration SQL to **Turso** (needs `TURSO_*` in env) |
| `npm run seed-health-demo` | Seed 7 days of demo health entries per persona into **local** `dev.db` |
| `npm run seed-health-demo:turso` | Same seed into **Turso** |
| `npm run seed-health-demo:force` | Re-seed local (clears existing demo data first) |
| `npm run seed-health-demo:turso:force` | Re-seed Turso (clears existing demo data first) |
| `npm run generate-health -- --email <email>` | Generate Gemini coaching for an email → write to **local** `HealthInsight` |
| `npm run generate-health:turso -- --email <email>` | Same → write to **Turso** |
| `npm run generate-health:dry -- --email <email>` | Preview coaching output, no DB write |

## Code conventions

- **Imports:** `@/…` alias for `src/…`
- **Prisma:** import `PrismaClient` from **`@/generated/prisma/client`**, not `@prisma/client`
- **UI:** Tailwind utility classes; `cn()` from `src/lib/utils.ts` for conditional classes
- **API errors:** Log with `console.error("[context]", err)` before returning generic JSON errors

## AI-assisted idea generation (admin only)

**Option A — Gemini (automated):** set **`GEMINI_API_KEY`** in `.env.local` (see **[IDEAS_PIPELINE.md](./IDEAS_PIPELINE.md)**), then:

```bash
npm run generate-ideas:dry    # preview, no writes
npm run generate-ideas        # writes scripts/ideas-output.json
npm run generate-ideas:local  # generate + seed local dev.db
```

**Option B — Manual Cursor:**

1. Edit / run prompt in **`scripts/idea-prompt.md`**
2. Save model output JSON to **`scripts/ideas-output.json`**
3. **`npm run seed-ideas`** for **local** `dev.db`, or **`npm run seed-ideas:turso`** when `TURSO_*` is set in `.env.local`

Optional preview without writes: **`npm run seed-ideas:dry`** / **`npm run seed-ideas:turso:dry`**

Details: **[IDEAS_PIPELINE.md](./IDEAS_PIPELINE.md)**.

## Health Pulse coaching generation

Persona-driven AI coaching powered by Gemini. Each allowlisted email maps to a persona in `scripts/personas/`. Requires `GEMINI_API_KEY`.

```bash
# 1. Seed believable demo data (safe to run multiple times)
npm run seed-health-demo:turso

# 2. Generate coaching for each user
npm run generate-health:turso -- --email qa.devadutta@gmail.com
npm run generate-health:turso -- --email pritychoudhary2422@gmail.com

# Preview without writing to DB
npm run generate-health:dry -- --email qa.devadutta@gmail.com
```

Persona files live in **`scripts/personas/<id>.md`**. Adding a new user:
1. Add their email + persona ID to `src/lib/access.ts` and `scripts/generate-health-gemini.mjs` (`PERSONA_MAP`)
2. Add them to `ALLOWED_EMAILS` in `.env.local`
3. Seed their data + generate their coaching

Details: **[HEALTH_PULSE_STORY.md](./HEALTH_PULSE_STORY.md)** · **[TASKS.md](./TASKS.md)**.

## Full documentation index

See **[docs/README.md](./README.md)** for architecture, stack, deployment, database, and security guides.
