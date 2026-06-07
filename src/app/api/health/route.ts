import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Returns the authenticated user's email, or an error response.
 * Centralises auth in one place; callers destructure { email, denied }.
 */
async function getAuthedEmail(): Promise<
  | { email: string; denied: null }
  | { email: null; denied: NextResponse }
> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return { email: null, denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { email, denied: null };
}

export async function GET() {
  const { email, denied } = await getAuthedEmail();
  if (denied) return denied;

  try {
    const entries = await prisma.healthEntry.findMany({
      where: { userEmail: email },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch (err) {
    console.error("[api/health GET]", err);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { email, denied } = await getAuthedEmail();
  if (denied) return denied;

  try {
    const body = await req.json();
    const entry = await prisma.healthEntry.create({
      data: {
        userEmail: email,
        date: body.date,
        weightKg: body.weightKg ? parseFloat(body.weightKg) : null,
        calories: body.calories ? parseInt(body.calories) : null,
        waterL: body.waterL ? parseFloat(body.waterL) : null,
        sleepHrs: body.sleepHrs ? parseFloat(body.sleepHrs) : null,
        workoutDone: body.workoutDone ?? false,
        notes: body.notes ?? null,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[api/health POST]", err);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { email, denied } = await getAuthedEmail();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Scope delete to the owner — prevents one user from deleting another's rows
    await prisma.healthEntry.deleteMany({
      where: { id: parseInt(id), userEmail: email },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/health DELETE]", err);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
