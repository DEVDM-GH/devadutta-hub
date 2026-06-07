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

Persona files live in **`scripts/personas/<id>.md`**. Available personas: `fintech-athlete`, `natural-bodybuilder`, `early-pregnancy`.

Details: **[HEALTH_PULSE_STORY.md](./HEALTH_PULSE_STORY.md)** · **[TASKS.md](./TASKS.md)**.

---

## Adding a new user

Follow these steps every time you onboard someone new. Example: adding **Ravi** (`ravi@gmail.com`) as a `member` with the `natural-bodybuilder` persona.

### Step 1 — Allow sign-in

Add their email to `.env.local`:

```bash
ALLOWED_EMAILS=qa.devadutta@gmail.com,...,ravi@gmail.com
```

Also add the same value on **Vercel → Project Settings → Environment Variables** for Production (and Preview if needed). Without this, Ravi's Google sign-in is blocked before anything else runs.

### Step 2 — Assign role + persona in `src/lib/access.ts`

```typescript
// EMAIL_CONFIG object
"ravi@gmail.com": {
  role: "member",       // "admin" | "member"
  displayName: "Ravi",  // shown in dashboard greeting
  persona: "natural-bodybuilder",
},
```

Roles control which sections Ravi can see:

| Role | Sees |
|------|------|
| `admin` | Dashboard, AI Idea Lab, Health Pulse |
| `member` | Dashboard, Health Pulse only |

### Step 3 — Register persona in the generate script

```javascript
// scripts/generate-health-gemini.mjs — PERSONA_MAP object
"ravi@gmail.com": "natural-bodybuilder",
```

This maps his email to the prompt file at `scripts/personas/natural-bodybuilder.md` when coaching is generated.

### Step 4 — Add demo seed data (optional but recommended for demos)

In `scripts/seed-health-demo.mjs`, add a block to the `SEED_DATA` array:

```javascript
{
  email: "ravi@gmail.com",
  entries: [
    { daysBack: 6, weightKg: 84.0, sleepHrs: 7.5, calories: 3100, waterL: 3.5, workoutDone: true,  notes: "Heavy squat day. Hit PR." },
    { daysBack: 5, weightKg: 84.2, sleepHrs: 8.0, calories: 2900, waterL: 3.2, workoutDone: false, notes: "Rest day. Good recovery." },
    // ... 5 more days
  ],
},
```

Use realistic ranges for the persona (see **[TASKS.md](./TASKS.md)** T-10 for per-persona data ranges).

### Step 5 — Seed data + generate coaching

```bash
npm run seed-health-demo:turso          # seeds Ravi's entries
npm run generate-health:turso -- --email ravi@gmail.com  # generates his coaching
```

### Step 6 — Commit and deploy

```bash
git add src/lib/access.ts scripts/generate-health-gemini.mjs scripts/seed-health-demo.mjs
git commit -m "feat: add Ravi as member with natural-bodybuilder persona"
git push
```

Vercel auto-deploys on push to main. Once deployed, Ravi can sign in immediately.

---

## End-to-end user journey (new user after onboarding)

```
Ravi visits the app → clicks "Sign in with Google"
        ↓
middleware.ts checks: is /dashboard/* path? → yes
        ↓
Auth.js callback: is ravi@gmail.com in ALLOWED_EMAILS? → yes ✓
        ↓
Session created with { email, name, image }
        ↓
DashboardLayout (server): getRole("ravi@gmail.com") → "member"
                          getAllowedModules("member") → ["health"]
        ↓
Sidebar renders: Dashboard + Health Pulse  (AI Idea Lab not in list)
        ↓
Dashboard home: getDisplayName("ravi@gmail.com") → "Ravi"
  → "Welcome back, Ravi 👋"
  → Quick links: Health Pulse card only (Ideas card filtered out)
        ↓
Ravi opens Health Pulse (/dashboard/health)
        ↓
GET /api/health → WHERE userEmail = "ravi@gmail.com"
  → returns only his entries (isolated from all other users)
        ↓
GET /api/health/insight → WHERE userEmail = "ravi@gmail.com"
  → returns his HealthInsight (bodybuilder coaching)
        ↓
Coaching card shows:
  "Gemini Coaching · from your last 7 entries · 7 Jun"
  Headline, weekly read, priorities, today's action, workout focus
  — all generated from the natural-bodybuilder persona prompt
        ↓
Ravi logs a new entry → POST /api/health
  → saved with userEmail = "ravi@gmail.com"
  → only he can see or delete it
        ↓
Next coaching refresh: npm run generate-health:turso -- --email ravi@gmail.com
  → reads his latest entries, calls Gemini, updates HealthInsight
```

**What Ravi can never access:**
- `/dashboard/ideas` → server redirect to `/dashboard`
- `GET /api/ideas` → `403 Forbidden`
- Any other user's health entries (API always filters by session email)

## Full documentation index

See **[docs/README.md](./README.md)** for architecture, stack, deployment, database, and security guides.
