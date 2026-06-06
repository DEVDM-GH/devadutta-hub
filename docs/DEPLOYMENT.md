# Deployment and operations

## Hosting

- **Application:** [Vercel](https://vercel.com) — GitHub integration, automatic builds on push.
- **Database:** [Turso](https://turso.tech) — remote libSQL; credentials via env vars.

## Required environment variables (Vercel)

Set per **Environment** (Production / Preview / Development) as needed.

| Variable | Required | Purpose |
|----------|----------|---------|
| `AUTH_SECRET` | Yes | Auth.js signing / encryption |
| `AUTH_URL` | Recommended | Canonical site URL (`https://…`). Avoid `localhost` in Production |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth |
| `ALLOWED_EMAILS` | Optional | Comma-separated allow list; dev mode allows all |
| `TURSO_DATABASE_URL` | Yes (for any env that uses DB APIs) | `libsql://…` connection URL |
| `TURSO_AUTH_TOKEN` | Yes (remote Turso) | API token |

**Do not add `GEMINI_API_KEY` to Vercel** for the current app — production reads ideas from Turso only; Gemini runs in **local scripts** or **GitHub Actions** (see below).

**Preview deployments:** If previews should hit the DB, attach **`TURSO_*`** to the **Preview** environment too. Google OAuth redirect URIs must include each preview host you actually use, or restrict previews.

## Build command

Default is fine:

```bash
npm run build
```

Which runs **`prisma generate && next build`**. No separate Vercel “plugin” required.

## Node version

Set **Node 20.x or 22.x** in Vercel project settings to match Prisma and Next requirements.

## OAuth (Google)

For each public origin users hit:

1. **Authorized JavaScript origins** — e.g. `https://your-app.vercel.app`
2. **Authorized redirect URIs** — `https://your-app.vercel.app/api/auth/callback/google`

The app uses **`trustHost: true`** and strips localhost `AUTH_URL` / `NEXTAUTH_URL` when `VERCEL_URL` is present to reduce misconfigured redirects.

## First-time Turso setup checklist

1. Create Turso database; copy URL + create auth token.
2. Add **`TURSO_DATABASE_URL`** and **`TURSO_AUTH_TOKEN`** to Vercel.
3. **Create tables** on Turso (SQL from `prisma/migrations/.../migration.sql`, or **`npm run db:apply-turso`** locally with same env in `.env.local`).
4. **Optional — bulk idea rows:** from a machine with `TURSO_*` in `.env.local`, run **`npm run seed-ideas:turso`** after committing **`scripts/ideas-output.json`**, or trigger **`.github/workflows/seed-turso-ideas.yml`** (manual dispatch + repo secrets). See **[IDEAS_PIPELINE.md](./IDEAS_PIPELINE.md)**.
5. Deploy; verify **`/api/debug/db`** while logged in.

## CI (GitHub Actions)

**`.github/workflows/ci.yml`** runs on `push` / `pull_request` to `main` / `master`:

- `npm ci`
- `npm run lint`
- `npm run build` (with dummy `AUTH_*` / `GOOGLE_*` for build-time auth import)

**Branch protection:** In GitHub, require status check **`verify`** (shown as **CI / verify**) before merging.

### GitHub Actions secrets (not Vercel)

For optional idea workflows, add **repository secrets** under **Settings → Secrets and variables → Actions**. Never commit API keys to a branch. Full walkthrough: **[IDEAS_PIPELINE.md](./IDEAS_PIPELINE.md#one-time-setup-repo-secrets)**.

| Secret | Workflow 1 (seed JSON) | Workflow 2 (Gemini → Turso) |
|--------|:----------------------:|:----------------------------:|
| `TURSO_DATABASE_URL` | Required | Required |
| `TURSO_AUTH_TOKEN` | Required | Required |
| `GEMINI_API_KEY` | Not used | Required |

**Optional workflow:** **`.github/workflows/seed-turso-ideas.yml`** — manual **Actions → Run workflow** only; imports committed **`scripts/ideas-output.json`** into Turso using **`TURSO_*`** secrets. Step-by-step: **[IDEAS_PIPELINE.md](./IDEAS_PIPELINE.md#github-actions-workflows)**.

**Optional workflow:** **`.github/workflows/generate-seed-turso-ideas.yml`** — same trigger; calls Gemini (**`GEMINI_API_KEY`** secret) then seeds Turso. Does not run on push. Details: **[IDEAS_PIPELINE.md](./IDEAS_PIPELINE.md#github-actions-workflows)**.

## Rollback

In Vercel: **Deployments** → select a previous **Ready** deployment → **Promote to Production** (or redeploy that commit).

## Logs and debugging

- **Vercel → Project → Logs** (or per-deployment function logs).
- Search for: `[api/ideas`, `[api/health`, `[api/debug/db`, `[prisma]`.

## Lockfile note

`package-lock.json` should be produced with **npm 10+** on **Node 20+** when possible so optional native packages (e.g. Tailwind Oxide) serialize correctly for **Linux** builders.
