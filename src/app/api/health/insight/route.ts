import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health/insight
 * Returns the most recent HealthInsight for the signed-in user, or null.
 * `priorities` is stored as a JSON string in SQLite — deserialized here
 * so the client always receives a proper string[].
 */
export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await prisma.healthInsight.findFirst({
      where: { userEmail: email },
      orderBy: { generatedAt: "desc" },
    });

    if (!raw) return NextResponse.json(null);

    return NextResponse.json({
      ...raw,
      priorities: JSON.parse(raw.priorities) as string[],
    });
  } catch (err) {
    console.error("[api/health/insight GET]", err);
    return NextResponse.json(null);
  }
}
