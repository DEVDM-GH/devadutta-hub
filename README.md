# DevaDutta Hub

Personal command centre for Devadutta Mohapatra — public portfolio, private dashboard (**Google sign-in**), AI Idea Lab, and Health Hub.

## Requirements

- **Node.js 20+** (matches Vercel and Prisma 7; older Node will fail on `prisma` / `next build`)

---

## Quick start (local)

```bash
npm install

# First-time database (SQLite file at prisma/dev.db)
npm run db:migrate

# Optional: seed AI ideas from scripts/ideas-output.json
npm run seed-ideas

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in is at `/login` (dashboard routes require auth).

---

## Environment variables

Create **`.env.local`** in the project root (never commit it). Vercel uses the same names under **Project → Settings → Environment Variables** (use **Production** vs **Preview** scopes as needed).

| Variable | Where | Purpose |
|----------|--------|---------|
| `AUTH_SECRET` | Local + Vercel | Secret for Auth.js session/JWT. Generate e.g. `npx auth secret` |
| `AUTH_URL` | Optional locally; **set on Vercel** to your canonical site URL | Base URL for OAuth callbacks. Use `https://your-domain.com` in production—not `localhost` |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Optional | Aliases still understood by Auth.js v5; prefer `AUTH_*` |
| `GOOGLE_CLIENT_ID` | Local + Vercel | Google OAuth Web client ID |
| `GOOGLE_CLIENT_SECRET` | Local + Vercel | Google OAuth client secret |
| `ALLOWED_EMAILS` | Optional | Comma-separated allow list for sign-in (defaults exist in code for dev) |
| `TURSO_DATABASE_URL` | **Every Vercel environment that runs the app** (Production *and* Preview) | LibSQL URL; without it, serverless has no `prisma/dev.db` and APIs return 500 |
| `TURSO_AUTH_TOKEN` | Same | Turso auth token |

**Local dev:** Prisma CLI and the app use **`prisma.config.ts`** with `file:./prisma/dev.db` for migrations. The running app uses the SQLite file under `prisma/` when `TURSO_*` is not set in production mode.

**Production:** With `NODE_ENV=production` and `TURSO_DATABASE_URL` set, the Prisma client uses **Turso** via `@prisma/adapter-libsql`.

---

## Google OAuth (Auth.js v5)

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → **OAuth 2.0 Client IDs** (Web application).

2. **Authorized JavaScript origins**

   - Local: `http://localhost:3000`
   - Production: `https://<your-vercel-or-custom-domain>`

3. **Authorized redirect URIs** (must match the host users actually use)

   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://<your-domain>/api/auth/callback/google`

4. Copy **Client ID** and **Client secret** into `.env.local` / Vercel as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

**Production gotcha:** If `AUTH_URL` / `NEXTAUTH_URL` pointed at `localhost` on Vercel, Google would send users back to localhost. The app sets **`trustHost: true`** and strips localhost auth URLs when `VERCEL_URL` is present—still set **`AUTH_URL`** to your real **`https://…`** in Vercel for a clear canonical URL and double-check Google redirect URIs for that host.

---

## Database & Prisma ORM 7

- **Schema:** `prisma/schema.prisma`
- **Migrations:** `prisma/migrations/` — use `npm run db:migrate` locally
- **Client:** Prisma 7 generates the client into **`src/generated/prisma/`** (gitignored). It is created by **`prisma generate`**, which runs automatically as part of **`npm run build`** and **`npm run seed-ideas`**.

Do not import `PrismaClient` from `@prisma/client` in app code; use the generated client (see `src/lib/prisma.ts`).

---

## Deployment (Vercel)

1. **Node:** 20.x in Vercel project settings.
2. **Env:** `AUTH_SECRET`, `GOOGLE_*`, Turso vars for production, and **`AUTH_URL`** = your live `https://…` origin.
3. **Google:** Production redirect URI and JS origin for that same host.
4. **Build:** Default `npm run build` is correct (`prisma generate && next build`).
5. **Lockfile:** Regenerate `package-lock.json` with **npm 10+** on Node 20+ when possible so optional native deps (e.g. Tailwind Oxide) stay valid on Linux builders.

After changing only env vars, a normal **Redeploy** with build cache enabled is fine.

### CI and deployment checks

**What Vercel already does:** Every deployment runs **`npm run build`** (your install + build). If that fails, the deployment does not go live. That is your primary **deployment check**.

**What you add in GitHub:** This repo includes **`.github/workflows/ci.yml`**, which on every **push** and **pull request** to `main` / `master` runs `npm ci`, **`npm run lint`**, and **`npm run build`** on Ubuntu with Node 22 — close to Vercel’s Linux environment so TypeScript and Prisma issues surface **before** merge.

**Require checks before merge (recommended):**

1. Push the workflow to GitHub and open a PR (or wait for the first run on `main`).
2. In the repo: **Settings → Branches → Add branch protection rule** (for `main`).
3. Enable **Require status checks to pass before merging**.
4. Search for and select **`verify`** (the job name from the workflow; GitHub may show it as **CI / verify**).

Then merges are blocked until CI is green, while Vercel still runs its own build for Preview / Production.

**Vercel-only extras (optional):** In the Vercel project, explore **Settings → Git** (deployment statuses, comments on PRs) and **Deployment Protection** if you want previews behind auth. Vercel does not replace a separate **lint** job unless your build runs lint inside `build`; keeping lint in GitHub Actions catches style issues without failing the whole Next build for unrelated reasons.

---

## App routes

| Route | Description |
|-------|-------------|
| `/` | Public portfolio landing |
| `/login` | Google sign-in |
| `/dashboard` | Private home (requires session) |
| `/dashboard/ideas` | AI Idea Lab |
| `/dashboard/health` | Health Hub |

API: `/api/auth/[...nextauth]`, `/api/ideas`, `/api/health`, `/api/ping`.

---

## Generating new ideas (Cursor workflow)

1. Open `scripts/idea-prompt.md`
2. Copy the prompt from the `---` line downward into your AI tool
3. Paste the returned JSON array into `scripts/ideas-output.json`
4. Run `npm run seed-ideas` (runs `prisma generate` then seeds via **tsx**)

Ideas show up under `/dashboard/ideas` against your local SQLite DB.

---

## Project structure (high level)

```
src/
  app/                    ← App Router pages & API routes
  auth.ts                 ← Auth.js (Google, allow list, trustHost)
  lib/prisma.ts           ← PrismaClient + LibSQL adapter (local file / Turso)
  middleware.ts           ← Protects /dashboard, /login redirects
  generated/prisma/       ← Generated by prisma (gitignored)
prisma/
  schema.prisma
  migrations/
  dev.db                  ← Local SQLite (gitignored)
prisma.config.ts          ← Prisma CLI datasource (local file URL)
scripts/
  idea-prompt.md
  ideas-output.json
  seed-ideas.mjs          ← Seeder (run via npm script + tsx)
```

---

## Tech stack

- **Next.js 16** (App Router) + **React 19** + TypeScript  
- **Auth.js** (`next-auth` v5 beta) — Google provider, JWT sessions  
- **Prisma 7** — `prisma-client` generator, **LibSQL** adapter, SQLite locally / **Turso** in production  
- **Tailwind CSS v4** + **Recharts** + **Lucide**

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | `prisma generate` then `next build` |
| `npm run start` | Production server (after build) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:studio` | Prisma Studio |
| `npm run seed-ideas` | Generate client + seed ideas JSON into DB |
