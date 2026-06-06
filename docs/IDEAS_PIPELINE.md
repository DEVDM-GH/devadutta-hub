# Ideas import — simple mental model

Think of **two boxes**:

| Box | What it is | Your JSON file lands here when you run… |
|-----|------------|-------------------------------------------|
| **Laptop SQLite** | `prisma/dev.db` on your machine | `npm run seed-ideas` (**unchanged**) |
| **Turso (cloud)** | The database Vercel uses in production | `npm run seed-ideas:turso` (**new**) |

Same file: **`scripts/ideas-output.json`**. Same rows get **inserted** (new `SavedIdea` rows each time — no dedupe yet).

### Which database does the running app use?

| `.env.local` | `npm run dev` reads | Seed command to update the UI |
|--------------|---------------------|-------------------------------|
| **`TURSO_*` unset** | **`prisma/dev.db`** (local file) | `npm run seed-ideas` or `generate-ideas:local` |
| **`TURSO_*` set** | **Turso** (same as Vercel) | `npm run seed-ideas:turso` or `generate-ideas:turso` |

Check while signed in: **`/api/debug/db`** — shows `savedIdeaCount` and whether Turso env vars are configured.

---

## Gemini API key (automated generation)

The **`GOOGLE_CLIENT_ID`** / **`GOOGLE_CLIENT_SECRET`** pair is for **sign-in only**. Idea generation uses a separate **Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey).

### One-time setup

1. Open [Google AI Studio → API keys](https://aistudio.google.com/apikey).
2. Click **Create API key** (pick an existing Google Cloud project or create one).
3. Add to **`.env.local`**:
   ```bash
   GEMINI_API_KEY=AIzaSy...
   ```
4. Optional: **`GEMINI_MODEL=gemini-3.5-flash`** (default if unset).

Generation uses the **Gemini Interactions API** via **`@google/genai`** (devDependency) in **`scripts/generate-ideas-gemini.mjs`**, with structured JSON output — not the legacy `generateContent` REST endpoint.

**Do not commit** the key. For **Workflow 2** only, add **`GEMINI_API_KEY`** under **Repo → Settings → Secrets and variables → Actions** (not Vercel). See **[GitHub Actions workflows](#github-actions-workflows)**.

### Local commands

| Command | What it does |
|---------|----------------|
| `npm run generate-ideas:dry` | Call Gemini, preview first 2 ideas, **no file write** |
| `npm run generate-ideas` | Call Gemini → write **`scripts/ideas-output.json`** |
| `npm run generate-ideas:local` | Generate + seed **local** `dev.db` |
| `npm run generate-ideas:turso` | Generate + seed **Turso** (needs `TURSO_*` in `.env.local`) |

The prompt text lives in **`scripts/idea-prompt.md`** (body after the first `---`). Edit your profile there before generating.

### Manual Cursor workflow (no Gemini key)

Copy the prompt from **`idea-prompt.md`** into Cursor, paste the JSON into **`ideas-output.json`**, then **`npm run seed-ideas`** or **`seed-ideas:turso`**.

---

### Dry run (no database writes)

Check the JSON and see what **would** be imported — **no** `prisma generate`, **no** Turso credentials, **no** connections (these use **plain Node**):

```bash
npm run seed-ideas:dry          # preview → local dev.db path
npm run seed-ideas:turso:dry    # same preview (labels Turso; still zero network)
```

The real `seed-ideas` / `seed-ideas:turso` commands use **tsx** after `prisma generate`, because Prisma 7 writes **`client.ts`** (and extensionless TS imports), which **`node` alone cannot load**.

---

## Why two commands?

- **Local** keeps today’s workflow: fast, offline, no secrets for Turso.
- **Turso** is **explicit**: you must have `TURSO_*` in `.env.local` (or CI). That way you never accidentally overwrite production while testing locally.

---

## “Automation” for the future

**Level 1 — You (laptop, Gemini)**  
Generate and seed in one step:

```bash
npm run generate-ideas:local   # or generate-ideas:turso
```

Or generate JSON only, then seed manually:

```bash
npm run generate-ideas
npm run seed-ideas:turso
```

**Level 1b — You (laptop, manual JSON)**  
After updating `ideas-output.json`:

```bash
npm run seed-ideas:turso
```

**Level 2 — GitHub Actions: seed committed JSON → Turso**  
Workflow: **`.github/workflows/seed-turso-ideas.yml`** (name: **Seed ideas to Turso**)

**Level 3 — GitHub Actions: Gemini generates fresh ideas → Turso**  
Workflow: **`.github/workflows/generate-seed-turso-ideas.yml`** (name: **Generate and seed ideas to Turso**)

See **[GitHub Actions workflows](#github-actions-workflows)** below for setup and step-by-step use.

---

## GitHub Actions workflows

Both idea workflows are **optional**, **manual only** (`workflow_dispatch`), and **never run on push or PR**. They do not affect Vercel deploys or the **`ci.yml`** verify job.

### One-time setup (repo secrets)

Secrets live in **GitHub**, not in git. Copy the same values you use in **`.env.local`** (never commit that file).

#### Add secrets in the GitHub UI

1. Open your repo on GitHub (e.g. `DEVDM-GH/devadutta-hub`).
2. **Settings** → **Secrets and variables** → **Actions**.
3. Click **New repository secret** for each row below.

| Secret name | Required for | Value source |
|-------------|--------------|--------------|
| `TURSO_DATABASE_URL` | Workflow 1 **and** 2 | `.env.local` → `TURSO_DATABASE_URL` (`libsql://…`) |
| `TURSO_AUTH_TOKEN` | Workflow 1 **and** 2 | `.env.local` → `TURSO_AUTH_TOKEN` |
| `GEMINI_API_KEY` | **Workflow 2 only** | [Google AI Studio](https://aistudio.google.com/apikey) → Create API key (not OAuth credentials) |

4. After saving, secrets appear in the list (values are hidden). Workflows reference them as `${{ secrets.GEMINI_API_KEY }}` — the key is **never** on a branch.

#### CLI alternative (`gh`)

If [GitHub CLI](https://cli.github.com/) is installed and authenticated (`gh auth login`):

```bash
# From repo root; paste values when prompted, or pipe from env:
gh secret set TURSO_DATABASE_URL
gh secret set TURSO_AUTH_TOKEN
gh secret set GEMINI_API_KEY
```

Verify: **Settings → Secrets and variables → Actions** or `gh secret list`.

#### Which workflow needs which secret?

| | Workflow 1 — **Seed ideas to Turso** | Workflow 2 — **Generate and seed ideas to Turso** |
|---|--------------------------------------|---------------------------------------------------|
| **`GEMINI_API_KEY` on branch?** | Never | Never |
| **`GEMINI_API_KEY` in GitHub Secrets?** | No | **Yes** |
| **Committed `ideas-output.json`?** | **Yes** (source of rows) | Optional (Gemini generates on runner) |
| **Turso secrets** | Yes | Yes |

**Workflow 2 test:** Revert or keep an old `ideas-output.json` on the branch — the workflow generates fresh JSON on the runner and seeds Turso; the committed file is ignored for generation.

Turso must already have **`SavedIdea`** tables (`npm run db:apply-turso` once from your laptop).

### Workflow 1 — Seed ideas to Turso

**File:** `.github/workflows/seed-turso-ideas.yml`  
**When to use:** You committed **`scripts/ideas-output.json`** to the branch and want Turso updated without running npm locally.

**What it does:**

1. Checks out the branch you select when triggering the workflow
2. `npm ci`
3. `npx prisma generate`
4. `npx tsx scripts/seed-ideas-turso.mjs` — **inserts** rows from the checked-out JSON into Turso

**What it does not do:** Call Gemini; change the repo; run on every push.

**How to run:**

1. Commit and push **`scripts/ideas-output.json`** (and any code changes) to GitHub
2. **Actions** tab → **Seed ideas to Turso** → **Run workflow**
3. Choose **branch** (e.g. `main` or your feature branch) → **Run workflow**
4. Open the run log; expect **✅ Seeded N ideas into Turso**
5. Refresh **`/dashboard/ideas`** on your deployed app (or local app if `TURSO_*` is in `.env.local`)

**Note:** Each run **appends** rows (no dedupe). Re-running without changing JSON duplicates ideas in Turso.

### Workflow 2 — Generate and seed ideas to Turso

**File:** `.github/workflows/generate-seed-turso-ideas.yml`  
**When to use:** You want fresh ideas from Gemini in the cloud without running `generate-ideas` on your laptop.

**What it does:**

1. Checks out the branch you select (uses **`scripts/idea-prompt.md`** from that branch)
2. `npm ci`
3. `node scripts/generate-ideas-gemini.mjs` with **`GEMINI_API_KEY`** secret — writes **`ideas-output.json` on the runner only**
4. `npx prisma generate`
5. `npx tsx scripts/seed-ideas-turso.mjs` — seeds Turso from that generated JSON

**What it does not do:** Commit `ideas-output.json` back to the repo; run automatically on push.

**How to run:**

1. **Actions** → **Generate and seed ideas to Turso** → **Run workflow**
2. Choose **branch** → **Run workflow**
3. Wait ~1–3 minutes (Gemini call + seed)
4. Verify Turso / UI as above

**Tip:** To change the prompt profile, merge updates to **`idea-prompt.md`** first, then run the workflow on that branch.

### CI vs idea workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **`ci.yml`** | Every push / PR to `main` | Lint + build (blocks merge if required) |
| **`seed-turso-ideas.yml`** | Manual only | JSON → Turso |
| **`generate-seed-turso-ideas.yml`** | Manual only | Gemini → Turso |

---

## Troubleshooting

**`Missing GEMINI_API_KEY` or Gemini 403/401**  
Use a key from [Google AI Studio](https://aistudio.google.com/apikey), not OAuth client credentials. Enable the **Generative Language API** on the linked Google Cloud project if Google prompts you to.

**`Gemini API error (429)`**  
Free-tier quota exceeded — wait or upgrade billing on the Google Cloud project tied to the key.

**`tsx`: “The package `@esbuild/win32-x64` could not be found” (Windows)**  
Run `npm install` in the repo. **`@esbuild/win32-x64`** is an **optionalDependency** (Windows only) so local **tsx** seed scripts get the native binary; Vercel/Linux skips it without failing the build.

---

## Safety ideas (later, if you want)

- **Dedupe** by title hash or external id in JSON so re-runs skip duplicates.
- **Separate Turso DB** for staging vs production.

None of that is required for the first version; the split commands already separate local vs cloud.
