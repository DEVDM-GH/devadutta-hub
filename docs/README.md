# DevaDutta Hub — technical documentation

This folder is the **source of truth** for architecture, stack, deployment, database, and security. The root [README.md](../README.md) stays a **quick start**; these pages go deeper.

| Document | Contents |
|----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System shape, request flows, auth + data paths, folder map |
| [TECH_STACK.md](./TECH_STACK.md) | Runtime, frameworks, libraries, versions, rationale |
| [DATABASE.md](./DATABASE.md) | Prisma 7, SQLite vs Turso, migrations, seeding, troubleshooting |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel, env vars, CI, build, OAuth, operational checklist |
| [SECURITY.md](./SECURITY.md) | Auth model, headers, CSP, secrets, access control |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Local setup, scripts, conventions, idea seeding |
| [IDEAS_PIPELINE.md](./IDEAS_PIPELINE.md) | Local vs Turso idea import, optional GitHub Action |
| [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) | Operational constraints (Vercel timeouts, coaching refresh, scaling) |

**Related repo files**

- Product / process personas (if maintained): [PERSONAS.md](../PERSONAS.md)
- Environment template: [.env.example](../.env.example)
