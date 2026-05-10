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

Leave **`TURSO_*` unset** to use local SQLite for the app; set them only if you intentionally point local Next at Turso.

## Common commands

| Command | Use |
|---------|-----|
| `npm run dev` | Dev server with hot reload |
| `npm run lint` | ESLint |
| `npm run build` | Production build (also runs `prisma generate`) |
| `npm run db:migrate` | Create / apply migrations to **local** DB |
| `npm run db:studio` | GUI for local DB |
| `npm run seed-ideas` | Load `scripts/ideas-output.json` into **local** DB |
| `npm run db:apply-turso` | Push migration SQL to **Turso** (needs `TURSO_*` in env) |

## Code conventions

- **Imports:** `@/…` alias for `src/…`
- **Prisma:** import `PrismaClient` from **`@/generated/prisma/client`**, not `@prisma/client`
- **UI:** Tailwind utility classes; `cn()` from `src/lib/utils.ts` for conditional classes
- **API errors:** Log with `console.error("[context]", err)` before returning generic JSON errors

## AI-assisted idea generation

1. Edit / run prompt in **`scripts/idea-prompt.md`**
2. Save model output JSON to **`scripts/ideas-output.json`**
3. **`npm run seed-ideas`**

## Full documentation index

See **[docs/README.md](./README.md)** for architecture, stack, deployment, database, and security guides.
