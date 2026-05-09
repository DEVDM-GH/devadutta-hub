# DevaDutta Hub

Personal command centre for Devadutta Mohapatra — public portfolio, AI Idea Lab, and Health Hub.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run DB migration (first time only)
npx prisma migrate dev

# 3. Seed the AI-generated ideas
npm run seed-ideas

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Sections

| Route | Description |
|---|---|
| `/` | Public portfolio — your professional landing page |
| `/dashboard` | Private home with navigation to all tools |
| `/dashboard/ideas` | AI Idea Lab — browse, pin, and manage career ideas |
| `/dashboard/health` | Health Hub — log metrics, view charts, workout & diet plans |

---

## Generating New Ideas with Cursor

1. Open `scripts/idea-prompt.md`
2. Copy the entire prompt (from the `---` line downward)
3. Paste it into Cursor chat (or Claude CLI)
4. Copy the JSON array from the response
5. Replace the contents of `scripts/ideas-output.json` with it
6. Run `npm run seed-ideas`

The ideas will appear in `/dashboard/ideas` immediately.

---

## Adding Google OAuth (when ready)

1. Set up a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials with redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Add to `.env.local`:
   ```
   NEXTAUTH_SECRET=<random string>
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=<your id>
   GOOGLE_CLIENT_SECRET=<your secret>
   ALLOWED_EMAIL=qa.devadutta@gmail.com
   ```

---

## Tech Stack

- **Next.js 16** with App Router + TypeScript
- **Tailwind CSS v4** — dark navy theme
- **Prisma v7** + SQLite (local file DB)
- **Recharts** — health metric visualizations
- **Lucide React** — icons

---

## Project Structure

```
src/app/
  page.tsx                  ← Public landing page
  dashboard/
    layout.tsx              ← Sidebar navigation
    page.tsx                ← Dashboard home
    ideas/page.tsx          ← AI Idea Lab
    health/page.tsx         ← Health Hub
  api/
    health/route.ts         ← Health CRUD API
    ideas/route.ts          ← Ideas CRUD API
scripts/
  idea-prompt.md            ← Paste this into Cursor to generate ideas
  ideas-output.json         ← Save Claude's output here
  seed-ideas.mjs            ← Loads ideas into the DB
prisma/
  schema.prisma             ← DB schema
  dev.db                    ← Local SQLite database
```
