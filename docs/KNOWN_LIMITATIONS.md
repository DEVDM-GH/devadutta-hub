# Known limitations

Design and operational constraints worth remembering when extending Health Pulse, Gemini pipelines, or admin tooling.

---

## Admin “Refresh Coaching” from the dashboard

**Context:** Admins will trigger the same work as `npm run generate-health:all:turso` via a dashboard button (`POST /api/admin/generate-health`).

### Serverless execution time (Vercel)

| Plan | Default max duration | Notes |
|------|----------------------|--------|
| Hobby | **10 seconds** | May fail if all users are generated sequentially |
| Pro | **60 seconds** (configurable up to 300s on some runtimes) | Usually enough for a small user set |

**Current scale (3 users):** A dry run took ~45s when Gemini calls ran **sequentially**. Running calls **in parallel** (`Promise.allSettled`) should land near the slowest single call (~15s), which fits Pro and is closer on Hobby.

**Risk as we grow:** Each new user adds one Gemini round-trip. At ~15s per user in parallel, 5+ users can exceed Hobby limits and eventually Pro limits without architectural changes.

**Mitigations when scaling:**

1. **Parallel generation** inside the API route (first step — planned for v1).
2. **Background job** — queue work (Inngest, Trigger.dev, Vercel Cron + chunked runs, or a small worker) and return `202 Accepted` with a job id; poll or use webhooks for completion.
3. **Keep CLI as source of truth** — `npm run generate-health:all:turso` for bulk refresh during demos or after onboarding many users.
4. **Increase `maxDuration`** on the route (Pro only) via `export const maxDuration = 60` in the route segment config.

### “Last refreshed” timestamp

**v1 approach:** `SELECT MAX(generatedAt) FROM HealthInsight` — no separate audit table.

**Limitation:** This reflects the **latest coaching write across all users**, not necessarily a single admin-triggered batch. If one user’s insight is regenerated alone (CLI `--email`), the dashboard timestamp updates even though not everyone was refreshed.

**When to upgrade:** Add a `HealthGenerationRun` (or similar) table: `{ id, triggeredBy, startedAt, completedAt, status, userResults JSON }` when you need accurate batch history or compliance-style audit logs.

### Duplicated persona map

Persona emails live in:

- `src/lib/access.ts` (`EMAIL_CONFIG`)
- `scripts/generate-health-gemini.mjs` (`PERSONA_MAP`)

The API route will need the same list (or a shared module). **Limitation:** Adding a user requires updating multiple places until we extract a single shared config (e.g. `scripts/health-users.mjs` imported by both script and app, or DB-driven personas).

### Gemini API from the browser

The refresh button must **never** call Gemini from the client. All generation goes through a **server-only** API route with `GEMINI_API_KEY` and an `isAdmin()` guard. Members receive `403 Forbidden`.

### Rate limits and cost

Each refresh = **N Gemini calls** (one per user in `PERSONA_MAP`). Accidental double-clicks or frequent refreshes consume quota. **Future:** debounce the button, show in-progress state, optional cooldown, or admin-only rate limit.

---

## Related docs

- Health Pulse design: [HEALTH_PULSE_STORY.md](./HEALTH_PULSE_STORY.md)
- Local / CLI commands: [DEVELOPMENT.md](./DEVELOPMENT.md)
- Auth and roles: [SECURITY.md](./SECURITY.md) · `src/lib/access.ts`
