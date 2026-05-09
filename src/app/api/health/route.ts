import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const entries = await prisma.healthEntry.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const body = await req.json();
    const entry = await prisma.healthEntry.create({
      data: {
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
  } catch {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.healthEntry.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
