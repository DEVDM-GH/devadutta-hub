import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccess } from "@/lib/access";
import { generateAndSaveIdeas } from "@/lib/idea-generation";

// Gemini can take a while to produce ~20 structured ideas in one call.
export const maxDuration = 60;

async function requireIdeasAccess() {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) {
    return { denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!canAccess(email, "ideas")) {
    return { denied: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { denied: null };
}

export type GenerateIdeasResponse = {
  count: number;
  completedAt: string;
};

export async function POST() {
  const { denied } = await requireIdeasAccess();
  if (denied) return denied;

  try {
    const ideas = await generateAndSaveIdeas();
    const response: GenerateIdeasResponse = {
      count: ideas.length,
      completedAt: new Date().toISOString(),
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[api/admin/generate-ideas POST]", err);
    const message = err instanceof Error ? err.message : "Failed to generate ideas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
