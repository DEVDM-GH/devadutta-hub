<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This repo is a single Next.js 16 app (`devadutta-hub`), npm + Node 22. Standard commands live in `README.md` and `docs/DEVELOPMENT.md` (`npm run dev` / `lint` / `build`); don't duplicate them here.

Environment startup notes (the update script already runs `npm ci` + `npx prisma generate`):

- Local DB is an embedded SQLite file at `prisma/dev.db` (no separate DB service). It is gitignored; create/refresh it once with `npm run db:migrate`. Optionally load demo rows with `npm run seed-health-demo`. Leave `TURSO_*` unset so the app uses this local file (see `src/lib/prisma.ts`).
- The Prisma client is generated (gitignored) to `src/generated/prisma/`. `next dev` does NOT auto-generate it — if imports from `@/generated/prisma/client` fail, run `npx prisma generate` (it's part of `npm run build` too).
- A `.env.local` is required for the app to boot: `AUTH_SECRET` plus `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (placeholders are fine to start the server). Real Google OAuth credentials are NOT available in this environment, so the interactive "Continue with Google" flow cannot complete here. In `NODE_ENV=development` the email allow-list is bypassed (`src/auth.ts`).
- Sessions are Auth.js v5 JWTs (no DB adapter wired in `src/auth.ts`). To exercise the authenticated dashboard/APIs (`/api/health`, `/api/ideas`, etc.) without Google OAuth, mint a session JWT with the app's `AUTH_SECRET` using `next-auth/jwt` `encode({ token: { email, sub, name }, secret, salt: "authjs.session-token" })` and send it as the `authjs.session-token` cookie. Gotcha: that cookie is httpOnly, so it can't be set via browser JS — use `curl` (or DevTools) to attach it.
- Lint currently fails on pre-existing `react/no-unescaped-entities` errors (CI on `main` is red for this reason). `npm run lint` itself runs fine; the failures are not caused by env setup.
- There is no automated test suite (no `test` script / test runner).
