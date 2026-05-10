# Security

## Authentication and session

- **Provider:** Google OAuth via **Auth.js** (`next-auth` v5).
- **Session strategy:** JWT (default for this config — no Prisma adapter on `auth.ts`).
- **Session transport:** HTTP-only cookies set by Auth.js (`__Secure-*` on HTTPS).

### Access control

- **Middleware** restricts **`/dashboard/*`** to signed-in users.
- **`signIn` callback** enforces an email allow list when **`NODE_ENV !== "development"`**:
  - Controlled by **`ALLOWED_EMAILS`** (comma-separated, case-insensitive).
  - In development, all Google accounts are allowed for faster local testing.

### Production auth URL hygiene

If **`AUTH_URL` / `NEXTAUTH_URL`** accidentally contain **`localhost`** on Vercel, OAuth can redirect to the wrong host. **`src/auth.ts`** removes those env values when **`VERCEL_URL`** is set, and **`trustHost: true`** trusts the deployment host for URL construction.

## API authorization

- **`/api/health`**, **`/api/ideas`**, **`/api/debug/db`** call **`auth()`** and return **401** without a session.
- **`/api/ping`** is intentionally **unauthenticated** (liveness only).

## HTTP security headers

Configured in **`next.config.ts`** for all routes:

| Header | Intent |
|--------|--------|
| `X-Frame-Options: SAMEORIGIN` | Clickjacking mitigation |
| `X-Content-Type-Options: nosniff` | MIME sniffing reduction |
| `Referrer-Policy: strict-origin-when-cross-origin` | Referrer leakage control |
| `Permissions-Policy` | Disable camera / mic / geolocation by default |
| `Content-Security-Policy` | Restrict scripts, styles, fonts, images, `connect-src` |

**CSP notes**

- `script-src` includes `'unsafe-eval'` and `'unsafe-inline'` (common for Next.js dev tooling; review tightening for stricter threat models).
- `img-src` allows `https://lh3.googleusercontent.com` for Google profile images.
- `connect-src 'self'` — extend if the app calls third-party APIs from the browser.

## Secrets handling

- **Never commit** `.env`, `.env.local`, or Turso tokens.
- **`.env.example`** documents keys without real values.
- **Vercel** stores production secrets; rotate if leaked.

## Database

- **Turso** credentials grant full SQL access to that database; scope tokens and databases per environment where possible.
- **Local `prisma/dev.db`** is gitignored; treat backups as your responsibility.

## Dependency and supply chain

- Run **`npm audit`** periodically; CI does not block on audit today (optional hardening).
- Pin major versions in `package.json`; use lockfile for reproducible installs.
