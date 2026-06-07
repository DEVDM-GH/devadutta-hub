import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccess(session.user.email, "ideas")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const ideas = await prisma.savedIdea.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(ideas);
  } catch (err) {
    console.error("[api/ideas GET]", err);
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const idea = await prisma.savedIdea.create({
      data: {
        category: body.category,
        title: body.title,
        content: body.content,
        tags: body.tags ?? "",
        pinned: body.pinned ?? false,
      },
    });
    return NextResponse.json(idea, { status: 201 });
  } catch (err) {
    console.error("[api/ideas POST]", err);
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const updated = await prisma.savedIdea.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[api/ideas PATCH]", err);
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.savedIdea.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/ideas DELETE]", err);
    return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 });
  }
}
