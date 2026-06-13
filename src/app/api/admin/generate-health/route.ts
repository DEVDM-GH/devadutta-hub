import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin, getAllManagedEmails, getPersona } from "@/lib/access";
import { generateInsightForUser } from "@/lib/health-generation";
import { prisma } from "@/lib/prisma";

// Allow up to 60 s on Vercel Pro — parallel Gemini calls should land ~15 s for 3 users.
export const maxDuration = 60;

async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) {
    return { email: null, denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!isAdmin(email)) {
    return { email: null, denied: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { email, denied: null };
}

// ---------------------------------------------------------------------------
// GET — last refresh timestamp
// ---------------------------------------------------------------------------

export async function GET() {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const agg = await prisma.healthInsight.aggregate({ _max: { generatedAt: true } });
    return NextResponse.json({
      lastRefreshedAt: agg._max.generatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("[api/admin/generate-health GET]", err);
    return NextResponse.json({ lastRefreshedAt: null });
  }
}

// ---------------------------------------------------------------------------
// POST — generate coaching for all managed users in parallel
// ---------------------------------------------------------------------------

export type GenerateResult = {
  email: string;
  ok: boolean;
  error?: string;
};

export type GenerateResponse = {
  completedAt: string;
  results: GenerateResult[];
};

export async function POST() {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  const emails = getAllManagedEmails();

  const settled = await Promise.allSettled(
    emails.map((email) =>
      generateInsightForUser(email, getPersona(email))
    )
  );

  const results: GenerateResult[] = settled.map((outcome, i) => {
    if (outcome.status === "fulfilled") {
      return { email: emails[i], ok: true };
    }
    const err = outcome.reason as Error | undefined;
    console.error(`[api/admin/generate-health POST] failed for ${emails[i]}:`, err);
    return { email: emails[i], ok: false, error: err?.message ?? "Unknown error" };
  });

  const response: GenerateResponse = {
    completedAt: new Date().toISOString(),
    results,
  };

  const anyFailed = results.some((r) => !r.ok);
  return NextResponse.json(response, { status: anyFailed ? 207 : 200 });
}
