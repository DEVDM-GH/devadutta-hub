# Implementation Tasks — Health Pulse + Gemini Showcase

> Branch: `feat/health-hub-gemini-showcase`  
> Last updated: Jun 7, 2026  
> Current model: **Sonnet 4.6** (all implementation unless noted)

---

## Status key

| Symbol | Meaning |
|--------|---------|
| ✅ | Done — code merged to branch, type-checked clean |
| 🔄 | In progress |
| ⏳ | Not started |
| ❌ | Blocked |

---

## Completed tasks

### T-01 · Feature branch
**Status:** ✅  
**What:** Created `feat/health-hub-gemini-showcase` off `main`.  
**Dependencies:** none  

---

### T-02 · `src/lib/access.ts` — role + module + persona config
**Status:** ✅  
**What:** Single source of truth for roles (`admin`/`member`), module visibility (`ideas`/`health`), health personas (`fintech-athlete`, `natural-bodybuilder`, `early-pregnancy`), and per-email config.  
**Exports:** `getRole`, `getPersona`, `getDisplayName`, `getAllowedModules`, `canAccess`, `isAdmin`  
**Dependencies:** none  
**Hidden issues resolved:**
- All 3 allowlisted emails pre-mapped (`qa.devadutta`, `talk2devdmohapatra`, `pritychoudhary2422`)
- Unknown emails fall back to `member` + `fintech-athlete` safely  

---

### T-03 · Sidebar + dashboard home filtered by role
**Status:** ✅  
**What:**  
- `layout.tsx` computes `allowedModules` server-side, passes to `SidebarClient`  
- `SidebarClient` tags each nav item with a `module` key, filters at render time  
- `dashboard/page.tsx` made async, calls `auth()`, filters quick-links + tips, replaces hardcoded "Devadutta" with `getDisplayName()`  
**Dependencies:** T-02  

---

### T-04 · Route guard — `/dashboard/ideas` + `/api/ideas`
**Status:** ✅  
**What:**  
- `dashboard/ideas/layout.tsx` (new server component) — calls `canAccess(email, "ideas")`, redirects non-admins to `/dashboard` before the client bundle is loaded  
- `api/ideas/route.ts` — `requireAuth()` → `requireAdmin()` which returns 403 for non-admin sessions on all 4 verbs  
**Dependencies:** T-02  
**Hidden issues resolved:**
- Defence-in-depth: UI hides the link AND route redirects AND API rejects — three independent layers  
- Client bundle for ideas page is never sent to member's browser  

---

### T-05 · `userEmail` on `HealthEntry` — schema + migration + API scoping
**Status:** ✅  
**What:**  
- `schema.prisma` — added `userEmail String?` to `HealthEntry`  
- Migration `20260606223842_add_user_email_to_health_entry` — `ALTER TABLE "HealthEntry" ADD COLUMN "userEmail" TEXT`  
- `prisma generate` run — client types regenerated  
- `api/health/route.ts` — `requireAuth()` refactored to `getAuthedEmail()` returning discriminated union; GET/POST/DELETE all scoped to `email`; DELETE upgraded to `deleteMany` with ownership check  
- `db:apply-turso` run successfully — `userEmail` column added to live Turso DB  
- `apply-turso-schema.mjs` comment bug fixed (Node v24 `*/` in block comment parsed as closing token)  
**Dependencies:** T-02  
**Hidden issues resolved:**
- `String?` (optional) keeps existing rows valid without a backfill
- `deleteMany({ where: { id, userEmail } })` prevents user A deleting user B's rows by guessing an ID  

---

### T-06 · Health Pulse UI rewrite
**Status:** ✅  
**What:**  
- Full rewrite of `dashboard/health/page.tsx` — removed 4-tab layout, all static arrays (`WORKOUT_SUGGESTIONS`, `DIET_TIPS`), heavy recharts  
- New layout: header → log form → quick stats bar → Gemini coaching card → recent 7 entries → two lean sparklines (weight + sleep, 14 days)  
- `CoachingCard` component: rich card when `HealthInsight` exists; punchy empty state with `npm run generate-health:turso` CTA when it doesn't  
- `api/health/insight/route.ts` (new) — returns latest `HealthInsight` for signed-in user; gracefully returns `null` (with `catch`) until the table is created in T-07  
**Dependencies:** T-05  
**Hidden issues resolved:**
- `@ts-expect-error` on `prisma.healthInsight` suppresses the TypeScript error until T-07 adds the model — must be REMOVED after T-07 runs `prisma generate`  
- `Promise.all([fetch entries, fetch insight])` avoids waterfall — page renders in one shot  

---

## Pending tasks

### T-07 · `HealthInsight` schema + migration + Prisma generate
**Status:** ⏳  
**Model:** Sonnet 4.6  
**Estimated effort:** 20 min  

**What to build:**  
Add `HealthInsight` model to `prisma/schema.prisma`:

```
model HealthInsight {
  id           Int      @id @default(autoincrement())
  userEmail    String
  headline     String
  weeklyRead   String
  priorities   String   // JSON stringified array — SQLite has no native array type
  todayAction  String
  workoutFocus String
  entryCount   Int
  generatedAt  DateTime @default(now())
}
```

Then:
1. `npm run db:migrate` — creates migration SQL
2. `npm run db:apply-turso` — applies to Turso
3. `npx prisma generate` — regenerates client types
4. Remove `@ts-expect-error` from `api/health/insight/route.ts`
5. Add `priorities` deserialization in `api/health/insight/route.ts` before returning to client

**Dependencies:** T-06  

**⚠️ Hidden issues:**  
- **SQLite has no array type.** `priorities` must be `String` in the schema and stored as `JSON.stringify(["str1","str2","str3"])`. The API route must `JSON.parse(insight.priorities)` before returning — otherwise `insight.priorities.map(...)` in the UI crashes with "priorities.map is not a function"  
- **`@ts-expect-error` becomes invalid** after `prisma generate` adds the `healthInsight` property to `PrismaClient` — remove it or TSC will fail with "Unused '@ts-expect-error' directive"  
- **`db:apply-turso` is a hard gate for T-10** — if you run the generate script against Turso before applying the migration, it fails with "no such table: HealthInsight"  

---

### T-08 · Persona prompt files
**Status:** ⏳  
**Model:** Sonnet 4.6 (writing quality matters here)  
**Estimated effort:** 30 min  

**What to build:**  
Three files under `scripts/personas/`:

```
scripts/personas/fintech-athlete.md
scripts/personas/natural-bodybuilder.md
scripts/personas/early-pregnancy.md
```

Each file is the **system-prompt context block** Gemini receives for that persona. Structure:
- Who this person is (role, lifestyle, location)
- Health goals
- Constraints and preferences
- Tone directive for the coaching output (direct vs gentle)
- Safety guardrails (especially for early-pregnancy: wellness only, no clinical advice, no weight-loss language)

**Dependencies:** T-02  

**⚠️ Hidden issues:**  
- **early-pregnancy persona carries medical-adjacent risk.** The prompt must contain an explicit guardrail: *"You are a wellness coach, not a medical professional. Never give clinical advice, recommend medications, or suggest exercises that are contraindicated in pregnancy. If in doubt, recommend consulting a doctor."*  
- **Tone divergence is the demo's proof point.** All three personas receive the same log data — the output must feel noticeably different. Invest in persona voice (direct/athletic for bodybuilder, warm/practical for pregnancy)  
- **Persona file is loaded at generate time** — the `getPersona(email)` helper in `access.ts` returns the persona ID; the script reads `scripts/personas/<id>.md`  

---

### T-09 · `scripts/generate-health-gemini.mjs`
**Status:** ⏳  
**Model:** Sonnet 4.6  
**Estimated effort:** 1.5 hrs  

**What to build:**  
A Node ESM script (plain `.mjs`, no tsx needed — see architecture below) that:
1. Accepts `--email <email>` flag (defaults to first admin email for convenience)
2. Accepts `--dry-run` flag
3. Reads `.env` / `.env.local` for `GEMINI_API_KEY`, `GEMINI_MODEL`, `TURSO_*`
4. Connects to DB: Turso if `TURSO_DATABASE_URL` set, else local SQLite file — using `@libsql/client` **directly** (not Prisma, no tsx required)
5. Fetches last 14 `HealthEntry` rows for `--email`, ordered by date
6. Loads persona file from `scripts/personas/<personaId>.md` (persona looked up from `access.ts` EMAIL_CONFIG — extracted as a plain JSON map in the script to avoid TypeScript import)
7. Builds Gemini prompt: persona system block + log data as a human-readable table
8. Calls Gemini Interactions API with strict JSON schema
9. Validates the response
10. Upserts to `HealthInsight` — deletes existing rows for that email first, then inserts fresh (simple, avoids growing table)
11. Prints summary

**Gemini output schema:**
```json
{
  "headline":      "string — one sentence, grounded in the actual log numbers",
  "weeklyRead":    "string — 3-4 sentences, patterns from the data",
  "priorities":    ["string", "string", "string"],
  "todayAction":   "string — one concrete action",
  "workoutFocus":  "string — this week's training emphasis for this persona"
}
```

**Dependencies:** T-07, T-08  

**⚠️ Hidden issues:**  
- **Do NOT use Prisma/tsx in this script.** The Ideas generate script works with plain `node` because it doesn't touch the DB. This script reads and writes the DB — but using `@libsql/client` directly (raw SQL) avoids the tsx/Prisma generated client import chain entirely. Same approach as `apply-turso-schema.mjs`. This is the correct pattern.
- **Persona ID lookup without TypeScript imports.** The script is plain `.mjs`; it can't `import { getPersona } from "@/lib/access"`. Extract the email→persona map as a plain JS object at the top of the script (duplicate of the relevant part of `access.ts`). Keep them in sync manually or add a comment.
- **`priorities` must be `JSON.stringify()`d** before writing to the DB — it's stored as TEXT in SQLite/Turso
- **Entry count of 0 is a guard condition.** If the email has no entries, the script should exit early with a helpful message rather than sending empty data to Gemini
- **Gemini prompt injection risk.** The `notes` field of health entries goes into the prompt. If a user types something adversarial in notes, it could manipulate the output. For a private app with known users this is low risk — add a note in the script
- **Model cost.** Using `GEMINI_MODEL` from env (default: `gemini-3.5-flash`). Flash is correct for this task — structured JSON, short output, cheap. Do not default to Pro.
- **Temperature.** Use `0.4` (lower than ideas at `0.9`) — coaching should be consistent and grounded, not creative

---

### T-10 · `scripts/seed-health-demo.mjs`
**Status:** ⏳  
**Model:** Sonnet 4.6  
**Estimated effort:** 45 min  

**What to build:**  
A plain `.mjs` script (using `@libsql/client` directly — same reason as T-09) that inserts 7 days of believable health entries per persona, keyed by email. Safe to run multiple times — checks for existing entries in the date range and skips if already seeded.

**Per-persona realistic ranges:**

| Persona | Weight | Sleep | Calories | Water | Workouts |
|---------|--------|-------|----------|-------|----------|
| fintech-athlete | 72–74 kg | 5.5–7.5 hrs | 1900–2400 kcal | 2.0–3.0 L | 4/7 days |
| natural-bodybuilder | 83–86 kg | 7.0–8.5 hrs | 2800–3400 kcal | 3.0–4.0 L | 5/7 days |
| early-pregnancy | 61–64 kg | 8.0–10.0 hrs | 1900–2300 kcal | 2.5–3.5 L | 3/7 days |

Notes should be persona-appropriate: fintech-athlete might say "tired after late stand-up", bodybuilder "legs day, DOMS", pregnancy "morning nausea, rested well".

**Dependencies:** T-07 (needs `HealthEntry.userEmail` column — already done in T-05; needs table in Turso — done)  

**⚠️ Hidden issues:**  
- **Idempotency.** Check `SELECT COUNT(*) FROM HealthEntry WHERE userEmail=? AND date>=?` before inserting. If rows already exist for that email in the last 7 days, print a message and skip — don't duplicate. Alternatively accept a `--force` flag to clear and reseed.
- **Date range.** Use the last 7 calendar days (today back 6 days) so the sparklines and "last 7 entries" list in the UI always show fresh-looking data
- **Local vs Turso.** Same `TURSO_DATABASE_URL` detection as T-09. Add `--turso` flag or just detect from env.

---

### T-11 · `package.json` scripts
**Status:** ⏳  
**Model:** Sonnet 4.6 (trivial — 10 min)  
**Estimated effort:** 10 min  

**What to add:**

```json
"generate-health":        "node scripts/generate-health-gemini.mjs",
"generate-health:dry":    "node scripts/generate-health-gemini.mjs --dry-run",
"generate-health:turso":  "node scripts/generate-health-gemini.mjs --turso",
"seed-health-demo":       "node scripts/seed-health-demo.mjs",
"seed-health-demo:turso": "node scripts/seed-health-demo.mjs --turso"
```

**Dependencies:** T-09, T-10  

**⚠️ Hidden issues:**  
- The `generate-health:turso` command must also accept `--email` — e.g. `node scripts/generate-health-gemini.mjs --turso --email pritychoudhary2422@gmail.com`. In `package.json` you can't embed that; call it directly from the terminal with args appended: `npm run generate-health:turso -- --email foo@bar.com`
- Document the `--` passthrough in the script's top-of-file comment  

---

### T-12 · Manual smoke test
**Status:** ⏳  
**Model:** You (human)  
**Estimated effort:** 20 min  
**Do this AFTER T-10 and T-11 are done**

**Checklist:**

```
Local (npm run dev):

[ ] Sign in as qa.devadutta@gmail.com (admin)
    → Sidebar shows: Dashboard, AI Idea Lab, Health Pulse
    → /dashboard/ideas loads fine
    → /dashboard/health shows empty coaching card + "Log Today" works
    → Log one entry → entry appears in "Recent entries"

[ ] Sign out → sign in as pritychoudhary2422@gmail.com (member / early-pregnancy)
    → Sidebar shows: Dashboard, Health Pulse ONLY (no Ideas Lab)
    → Manually navigate to /dashboard/ideas → redirects to /dashboard ✓
    → Health Pulse shows ZERO entries (isolated from admin data) ✓
    → Greeting says "Welcome back, Prity 👋"

[ ] Run: npm run seed-health-demo
    → 7 entries seeded for each email
    → Admin account: see fintech-athlete data
    → Prity account: see early-pregnancy data

[ ] Run: npm run generate-health (local)
    → Gemini called → HealthInsight written to local DB
    → Coaching card populates for admin account
    → Run again for Prity's email → different output

[ ] Verify persona difference (the demo's main proof point)
    → Same JSON schema, different coaching voice and content

Production (Turso):

[ ] npm run db:apply-turso (after T-07)
[ ] npm run seed-health-demo:turso
[ ] npm run generate-health:turso
[ ] Deploy to Vercel → smoke test in browser
```

**Dependencies:** T-11  

---

### T-13 · Update `HEALTH_PULSE_STORY.md` + `docs/DEVELOPMENT.md`
**Status:** ⏳  
**Model:** Sonnet 4.6  
**Estimated effort:** 20 min  

**What:** Update docs to reflect the completed implementation — scripts, commands, persona files, testing checklist, Turso apply order.

**Dependencies:** T-12  

---

## Dependency graph

```
T-01 (branch)
  └── T-02 (access.ts)
        ├── T-03 (sidebar/dashboard)
        ├── T-04 (ideas route guard)
        ├── T-05 (userEmail migration) ──→ Turso column live ✅
        │     └── T-06 (UI rewrite)
        │           └── T-07 (HealthInsight schema + migration)
        │                 ├── [db:apply-turso] ← must run before T-09/T-10 touch Turso
        │                 ├── T-08 (persona files)
        │                 │     └── T-09 (generate script)
        │                 │           └── T-11 (package.json scripts)
        │                 └── T-10 (seed demo data)
        │                       └── T-11
        └── T-08 (persona files — can start in parallel with T-07)

T-11 → T-12 (smoke test) → T-13 (docs)
```

---

## Model assignment rationale

| Task | Recommended model | Reason |
|------|------------------|--------|
| T-07 schema + migration | **Sonnet 4.6** | Small, precise — schema field types matter (the `priorities String` hidden issue) |
| T-08 persona files | **Sonnet 4.6** | Writing quality directly affects Gemini output quality |
| T-09 generate script | **Sonnet 4.6** | Complex: DB read + Gemini call + DB write + error handling + dry-run — needs full context |
| T-10 seed script | **Sonnet 4.6** | Realistic data ranges matter for demo quality |
| T-11 package.json | **Haiku** or manual | Trivial edits — Sonnet is overkill |
| T-12 smoke test | **You** | Cannot be automated yet |
| T-13 docs | **Sonnet 4.6** | Needs full conversation context |
| **Gemini API call inside T-09** | **`gemini-3.5-flash`** (env var) | Structured short output — Flash is perfect, cheap, fast. Never default to Pro. Use `temperature: 0.4` (grounded coaching, not creative writing) |

---

## Demo script (for tomorrow)

After all tasks complete and smoke test passes:

```
1. Open /dashboard — show "Welcome back, Devadutta" + two sections visible
2. Open /dashboard/health — show coaching card (generated from fintech-athlete + your logs)
   Read out the headline — it references real numbers from the seed data
3. Sign out → sign in as pritychoudhary2422@gmail.com (Prity / early-pregnancy)
   → Sidebar: only Health Pulse (no Ideas Lab)
   → Coaching card: completely different voice — gentle, no weight-loss language
4. Point out: "Same Gemini API key. Same JSON schema. Same screen. Persona drives everything."
5. Optional live beat: run generate-health:turso -- --email <email> live and refresh
```

---

## Risks going into demo day

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Gemini API quota / rate limit during live demo | Low | Run generate before demo, show cached result |
| `db:apply-turso` not run → 500 on Turso | Medium | Checklist in T-12 |
| Two Google accounts not available for live sign-in switch | Medium | Record a screen capture as backup |
| Persona output sounds generic (not tailored enough) | Medium | Tune persona prompt in T-08 — test T-12 output before demo |
| Prity hasn't tested and signs in live for first time | Low | Seed her data in T-10 before demo |
