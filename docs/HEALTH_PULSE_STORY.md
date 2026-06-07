# Health Pulse — Feature Story

> Branch: `feat/health-hub-gemini-showcase`  
> Status: **Implemented — pending PR merge**  
> Last updated: Jun 7, 2026

---

## The short version

Health Hub goes from a static CRUD tracker with hardcoded workout cards into a
**persona-driven, Gemini-powered coaching experience**. The same UI adapts its
voice, advice, and framing to the signed-in person — a Bangalore fintech
engineer, a natural bodybuilder, a newly pregnant mom — because Gemini reads
*who you are* and *what you actually logged*, not a generic template.

---

## What exists today (before this branch)

| Layer | What it does | Problem |
|-------|-------------|---------|
| `HealthEntry` table | Stores weight, sleep, calories, water, workout flag, notes | No `userEmail` — one shared pool for all signed-in users |
| `/api/health` | CRUD route handler (GET / POST / DELETE) | No per-user filtering |
| `dashboard/health/page.tsx` | Log form + recharts + 4 tabs | Workout/Diet tabs are hardcoded static text, not tied to logs |
| Dashboard home + sidebar | Shows all sections to all users | AI Idea Lab visible to anyone who signs in |
| `ALLOWED_EMAILS` | Gates sign-in to a comma-separated list | Roles all equal — no admin vs member distinction |

The app promised "AI-powered suggestions after 7+ entries." That wire was never
connected. The coaching content is a static `const` array in the page file.

---

## What we are building

### 1. Per-user data isolation

Add `userEmail` to `HealthEntry` (and later `HealthInsight`). Every API query
filters by `session.user.email`. Two people signing in no longer see each
other's logs.

```
HealthEntry.userEmail  →  ties every log row to a Google account
HealthInsight.userEmail →  ties every AI coaching output to the same account
```

### 2. Role-based module visibility

Not every user should see every section. We introduce a two-level role system:

| Role | Who | Visible modules |
|------|-----|-----------------|
| `admin` | Devadutta + one other admin email | Dashboard, AI Idea Lab, Health Pulse |
| `member` | Allowlisted testers / friends | Dashboard, Health Pulse only |

Configuration lives in a single `src/lib/access.ts` file — no database table,
no env sprawl. Change a role by editing one object.

Enforcement happens at three points:
- **Sidebar** — nav items filtered by role (server-side via layout)
- **Dashboard home** — quick-link cards filtered by role
- **Route handler** — `/dashboard/ideas` checks role, redirects non-admins

### 3. Email → Persona mapping

Each allowlisted email maps to a health persona. A persona is a short profile
block that becomes the system-prompt context for Gemini:

| Email | Persona ID | What Gemini knows |
|-------|------------|-------------------|
| `qa.devadutta@gmail.com` | `fintech-athlete` | Bangalore desk job, trekking, badminton, cooking |
| `talk2devdmohapatra@gmail.com` | `fintech-athlete` | Same profile, admin |
| *(friend A)* | `natural-bodybuilder` | Bulk/cut phases, training volume, macros |
| *(friend B)* | `early-pregnancy` | Gentle movement, hydration, fatigue-aware, no medical framing |

Personas live in `scripts/personas/` as small markdown snippets — same
pattern as `idea-prompt.md`. New persona = new `.md` file + one line in the
email map.

### 4. Gemini coaching pipeline (batch, Ideas-style)

```
[HealthEntry rows for email]  +  [PersonaProfile]
             ↓
    generate-health-gemini.mjs
             ↓
    Gemini (structured JSON output)
             ↓
    HealthInsight row in Turso
             ↓
    Health Pulse UI reads and renders
```

Output schema (strict JSON, like Ideas):

```json
{
  "headline":       "You slept under 6h on your two hardest training days",
  "weeklyRead":     "3–4 sentences grounded in the actual log data",
  "priorities":     ["string", "string", "string"],
  "todayAction":    "One concrete thing to do today",
  "workoutFocus":   "This week's training emphasis for this persona",
  "tone":           "coach | clinical | gentle"  // set by persona
}
```

Commands mirror the Ideas pipeline:

| Command | Effect |
|---------|--------|
| `npm run generate-health:dry` | Preview insight without writing |
| `npm run generate-health` | Write `scripts/health-output.json` |
| `npm run generate-health:local` | Generate + seed local dev.db |
| `npm run generate-health:turso` | Generate + seed Turso (needs `TURSO_*`) |

### 5. Simplified Health Pulse UI

The four-tab layout is replaced with a single focused page:

```
[ Log Entry — 3 fields + notes ]
[ Last 7 entries as compact chips ]
[ ✨ Your Coaching — Gemini card ]
    headline · weekly read · 3 priorities · today's action
[ Sparkline: weight + sleep last 14 days ]
```

Static Workout/Diet tab content is deleted. Replaced by the Gemini card.
Empty state: "Log at least 3 days, then run generate-health."

---

## Safety constraints (non-negotiable)

- Pregnancy and medical-adjacent personas carry hard prompt guardrails:
  *"wellness coaching only — not clinical advice — never recommend specific
  medication, dosage, or diagnosis."*
- UI disclaimer on the coaching card: "Not medical advice. Always consult your
  doctor."
- Weight-loss language is suppressed for pregnancy persona at prompt level.

---

## What stays the same

- Auth flow (Google OAuth, `ALLOWED_EMAILS`, JWT sessions)
- Turso + Prisma + LibSQL stack
- `GEMINI_API_KEY` stays off Vercel for batch generation (same as Ideas)
- `/api/health` CRUD (add `userEmail` filter only)
- Ideas Lab pipeline — untouched on this branch

---

## Phasing

### Phase 0 — Tomorrow's showcase (this branch)
- [ ] `src/lib/access.ts` — role map + module config
- [ ] Sidebar + dashboard home filtered by role
- [ ] `/dashboard/ideas` route guard
- [ ] `userEmail` on `HealthEntry` schema + migration
- [ ] Simplified Health Pulse UI (no static tabs)
- [ ] `scripts/personas/` — 3 persona files
- [ ] `generate-health-gemini.mjs` — reads entries, calls Gemini
- [ ] `seed-health-demo.mjs` — 7 believable days per persona for live demo
- [ ] `HealthInsight` table + coaching card in UI

### Phase 1 — Real testers
- [ ] Expand `ALLOWED_EMAILS` to friend personas
- [ ] Each person sees their own data and their own coaching
- [ ] Add `npm run generate-health:turso` to optional GH Action

### Phase 2 — Future
- [ ] In-app "Regenerate" button (live Gemini call, Vercel key)
- [ ] Persona onboarding flow ("I am a…" picker on first login)
- [ ] `HealthInsight` history — compare coaching week over week

---

## Token / model strategy

| Task | Recommended tier | Rationale |
|------|-----------------|-----------|
| Coaching JSON from 7–14 log rows | Flash | Short structured output, low cost, demo-safe |
| Deep weekly essay (optional) | Pro | Only if you add a "deep read" beat |
| Persona system prompt | No model | Static markdown |
| Demo seed data | No model | Hardcoded script |

One Flash call per `generate-health` run. Prompt caps input to last N entries.
You assign models; the pipeline stays dumb and swappable.

---

## Demo script (tomorrow)

1. Sign in as `fintech-athlete` account → show Health Pulse, see coaching card
2. Sign out → sign in as `natural-bodybuilder` (or describe what they'd see)
3. Sign out → sign in as `early-pregnancy` — same UI, gentler tone, no
   weight-loss language
4. Show that AI Idea Lab is invisible to the non-admin accounts
5. "Same API key, same model, same schema — three completely different coaches."

---

## Open questions (decide before coding)

| Question | Options | Default |
|----------|---------|---------|
| Where does persona config live? | `src/lib/access.ts` inline vs `personas/` JSON files | Inline for now, files for Phase 1 |
| Route guard on `/dashboard/ideas` — redirect or 404? | Redirect to `/dashboard` with toast | Redirect |
| Pregnancy persona — friend's real email or placeholder? | Add when ready; use placeholder in code | Placeholder |
| Show "AI Idea Lab" in sidebar as locked/greyed vs hidden? | Fully hidden | Hidden |
