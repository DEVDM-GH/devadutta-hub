# AI Idea Lab — UX improvement backlog

Proposed improvements to `/dashboard/ideas` (`src/app/dashboard/ideas/page.tsx`), grouped by effort/impact. Grounded in the current implementation as of Aug 2026 — re-check against the code before starting an item, since the page keeps changing.

Status legend: ✅ Done · ⏳ Not started

---

## Quick, low-risk wins

| Item | Why it hurts UX today | Status |
|---|---|---|
| Misleading empty state | "No ideas yet, run the seed script" shows even when ideas exist but the current search/filter/tag combo just matched zero — tells you to reseed data you already have | ⏳ |
| No result count / "clear filters" | Can't tell if 0 results means "no ideas" vs "too narrow a filter" combo; no one-click reset across search + category + tag | ⏳ |
| Category buttons have no counts | Can't see where ideas live (e.g. "Technical (4)") without clicking each filter | ⏳ |
| **Sort control** | Order was fixed to pinned-first / newest-first with no way to change it | ✅ |
| **Clickable tags** | Tags on a card were inert `<span>`s — no quick way to see other ideas sharing a tag | ✅ |
| Delete uses native `confirm()` | Jarring browser dialog, no undo if you misclick | ⏳ |
| No optimistic UI | Pin/delete/save all call `fetchIdeas()` (full refetch), so the whole grid flashes/reloads on every action | ⏳ |
| No error feedback | `fetch` calls never check `res.ok` — a failed save or a `401` fails silently | ⏳ |
| Icon-only buttons lack `aria-label` | Pin/Delete rely only on `title=`, weak for screen readers | ⏳ |

## Missing functionality

| Item | Notes | Status |
|---|---|---|
| No edit | Only Add / Pin / Delete exist — no way to fix a typo or update content without deleting and recreating. Biggest functional gap. `PATCH /api/ideas` already accepts arbitrary fields server-side; needs an edit form/mode on the card | ⏳ |
| No "Generate Ideas" button in the UI | The banner instructs a fully manual copy/paste-into-Cursor workflow, even though `scripts/generate-ideas-gemini.mjs` (Gemini automation) already exists. Health Pulse already has this pattern (`RefreshCoachingPanel.tsx` → `/api/admin/generate-health`) — mirroring it here (`/api/admin/generate-ideas` + a button) would remove the manual steps for admins | ⏳ |

## Polish

| Item | Notes | Status |
|---|---|---|
| Skeleton loading state | Replace the plain "Loading ideas..." line with skeleton cards matching final layout, to reduce layout shift | ⏳ |
| List transitions | Subtle enter/exit animation when cards are added, deleted, or filtered out, instead of an instant snap | ⏳ |
| Textarea auto-grow / char count | Add form's textarea is a fixed 5 rows with no character count — fine for short ideas, awkward for long ones | ⏳ |
| Copy-to-clipboard on card | Ideas are explicitly meant to be reused elsewhere (e.g. LinkedIn posts per the seed data) | ⏳ |

## Bigger, more invasive ideas

| Item | Notes | Status |
|---|---|---|
| Dedicated idea detail view/route | For very long ideas, rather than expanding in-card (the in-card "Read more" toggle already covers the common case) | ⏳ |
| Drag-to-reorder within the pinned group | Manual custom order beyond pinned + sort | ⏳ |
| Debounced/highlighted search matches | Highlight the matching substring in results; debounce the search input | ⏳ |

---

## Implementation notes for completed items

**Sort control:** Added a `sortBy` dropdown (Newest / Oldest / Title A–Z) next to the search box. Sorting is applied client-side to the already-filtered list, before the existing pinned/unpinned split — so pinned ideas still surface first, but the order within each group now follows the chosen sort.

**Clickable tags:** Each `#tag` pill on a card is now a button. Clicking it sets an `activeTag` filter (shown as a dismissible chip in the filter bar) that narrows the grid to ideas carrying that exact tag; clicking the same tag again, or the chip's `×`, clears it. This is a separate filter dimension from the free-text search box (which still substring-matches title/content/tags).

Related docs: [DEVELOPMENT.md](./DEVELOPMENT.md) · [IDEAS_PIPELINE.md](./IDEAS_PIPELINE.md)
