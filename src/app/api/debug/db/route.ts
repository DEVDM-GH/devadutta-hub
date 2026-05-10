import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Signed-in only. Returns whether Prisma can talk to the DB and table row counts.
 * Use when production APIs return 500 — open Network tab after visiting this URL.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tursoUrl = Boolean(process.env.TURSO_DATABASE_URL?.trim());
  const tursoToken = Boolean(process.env.TURSO_AUTH_TOKEN?.trim());

  try {
    const [savedIdeaCount, healthEntryCount] = await Promise.all([
      prisma.savedIdea.count(),
      prisma.healthEntry.count(),
    ]);
    return NextResponse.json({
      ok: true,
      env: {
        tursoUrlConfigured: tursoUrl,
        tursoAuthTokenConfigured: tursoToken,
        vercel: Boolean(process.env.VERCEL),
      },
      counts: { savedIdeaCount, healthEntryCount },
    });
  } catch (err) {
    console.error("[api/debug/db]", err);
    return NextResponse.json(
      {
        ok: false,
        env: {
          tursoUrlConfigured: tursoUrl,
          tursoAuthTokenConfigured: tursoToken,
          vercel: Boolean(process.env.VERCEL),
        },
        error: err instanceof Error ? err.message : String(err),
        hint:
          "If you see 'no such table' or SQLITE_UNKNOWN, run `npm run db:apply-turso` once with TURSO_* in .env.local, then check Turso dashboard.",
      },
      { status: 503 }
    );
  }
}
