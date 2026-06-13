/**
 * Shared Gemini generation logic for Health Pulse coaching.
 *
 * Used by:
 *   - src/app/api/admin/generate-health/route.ts  (API route, Prisma)
 *
 * The CLI script (scripts/generate-health-gemini.mjs) duplicates the Gemini
 * layer to avoid TypeScript compilation in a plain Node ESM script. Keep
 * both in sync when updating prompts or response parsing.
 */

import { GoogleGenAI } from "@google/genai";

// Local aliases for SDK step fields that are not re-exported from @google/genai
type SdkContent = { type: string; text?: string };
type SdkOutputStep = { type: string; content?: SdkContent[] };
import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HealthLogEntry = {
  date: string;
  weightKg: number | null;
  calories: number | null;
  waterL: number | null;
  sleepHrs: number | null;
  workoutDone: boolean;
  notes: string | null;
};

export type HealthInsightPayload = {
  headline: string;
  weeklyRead: string;
  priorities: string[]; // always 3 items
  todayAction: string;
  workoutFocus: string;
};

// ---------------------------------------------------------------------------
// Persona loading
// ---------------------------------------------------------------------------

export function loadPersonaPrompt(personaId: string): string {
  const filePath = join(process.cwd(), "scripts", "personas", `${personaId}.md`);
  try {
    return readFileSync(filePath, "utf-8").trim();
  } catch {
    throw new Error(`Persona file not found: ${filePath}`);
  }
}

// ---------------------------------------------------------------------------
// Prompt building
// ---------------------------------------------------------------------------

export function buildLogTable(entries: HealthLogEntry[]): string {
  if (entries.length === 0) return "(no entries logged yet)";

  const header  = "Date       | Weight(kg) | Sleep(h) | Calories | Water(L) | Workout | Notes";
  const divider = "-----------|------------|----------|----------|----------|---------|------";

  const rows = entries.map((e) => {
    const weight   = e.weightKg  != null ? String(e.weightKg)  : "—";
    const sleep    = e.sleepHrs  != null ? String(e.sleepHrs)  : "—";
    const calories = e.calories  != null ? String(e.calories)  : "—";
    const water    = e.waterL    != null ? String(e.waterL)    : "—";
    const workout  = e.workoutDone ? "✓" : "✗";
    const notes    = e.notes ? String(e.notes).slice(0, 40) : "—";
    return `${String(e.date).padEnd(10)} | ${weight.padEnd(10)} | ${sleep.padEnd(8)} | ${calories.padEnd(8)} | ${water.padEnd(8)} | ${workout.padEnd(7)} | ${notes}`;
  });

  return [header, divider, ...rows].join("\n");
}

export function buildPrompt(personaPrompt: string, entries: HealthLogEntry[]): string {
  return `${personaPrompt}

---

## Recent health log (most recent first)

\`\`\`
${buildLogTable(entries)}
\`\`\`

Based on the data above, generate the coaching output now.

Respond with valid JSON matching this EXACT structure — no extra fields, no nested objects, no markdown fences:
{
  "headline": "<one punchy sentence summarising the week>",
  "weeklyRead": "<2-3 sentence narrative of what the data shows>",
  "priorities": [
    "<priority 1 as a plain string>",
    "<priority 2 as a plain string>",
    "<priority 3 as a plain string>"
  ],
  "todayAction": "<one concrete action to take today>",
  "workoutFocus": "<workout recommendation for today or next session>"
}`;
}

// ---------------------------------------------------------------------------
// Gemini call  (Interactions API — new steps schema, June 2026)
// ---------------------------------------------------------------------------

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
  const client = new GoogleGenAI({ apiKey });

  const interaction = await client.interactions.create({
    model,
    input: prompt,
    generation_config: { temperature: 0.4 },
    store: false,
  });

  // New steps schema (breaking change June 8 2026 — output_text removed)
  // Narrow to the last model_output step, then find the text content item.
  const outputStep = interaction.steps?.findLast(
    (s): s is typeof s & SdkOutputStep => s.type === "model_output"
  );
  const text = outputStep?.content?.find((c) => c.type === "text")?.text?.trim();

  if (!text) throw new Error("Gemini returned no text. Check API key, quota, or model name.");
  return text;
}

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

export function parseInsight(text: string): HealthInsightPayload {
  const trimmed = text.trim();
  // Strip markdown fences if the model adds them despite instructions
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const payload = fenced ? fenced[1].trim() : trimmed;
  const raw = JSON.parse(payload) as Record<string, unknown>;

  // Normalize snake_case → camelCase (Gemini may return either without a schema)
  const insight: HealthInsightPayload = {
    headline:     raw.headline     as string,
    weeklyRead:  (raw.weeklyRead   ?? raw.weekly_read)   as string,
    priorities:   raw.priorities   as string[],
    todayAction: (raw.todayAction  ?? raw.today_action)  as string,
    workoutFocus:(raw.workoutFocus ?? raw.workout_focus) as string,
  };

  if (
    !insight.headline ||
    !insight.weeklyRead ||
    !Array.isArray(insight.priorities) ||
    !insight.todayAction ||
    !insight.workoutFocus
  ) {
    throw new Error("Gemini response is missing required fields.");
  }
  if (insight.priorities.length !== 3) {
    throw new Error(`Expected 3 priorities, got ${insight.priorities.length}.`);
  }
  return insight;
}

// ---------------------------------------------------------------------------
// Full pipeline — fetch entries via Prisma, call Gemini, write HealthInsight
// ---------------------------------------------------------------------------

export async function generateInsightForUser(
  email: string,
  personaId: string,
  limit = 14,
): Promise<void> {
  const entries = await prisma.healthEntry.findMany({
    where: { userEmail: email },
    orderBy: { date: "desc" },
    take: limit,
    select: {
      date: true,
      weightKg: true,
      calories: true,
      waterL: true,
      sleepHrs: true,
      workoutDone: true,
      notes: true,
    },
  });

  if (entries.length === 0) {
    throw new Error(`No health entries found for ${email}. Seed data first.`);
  }

  const personaPrompt = loadPersonaPrompt(personaId);
  const prompt = buildPrompt(personaPrompt, entries as HealthLogEntry[]);
  const raw = await callGemini(prompt);
  const insight = parseInsight(raw);

  // Upsert: delete existing insight then insert fresh
  await prisma.healthInsight.deleteMany({ where: { userEmail: email } });
  await prisma.healthInsight.create({
    data: {
      userEmail:    email,
      headline:     insight.headline,
      weeklyRead:   insight.weeklyRead,
      priorities:   JSON.stringify(insight.priorities),
      todayAction:  insight.todayAction,
      workoutFocus: insight.workoutFocus,
      entryCount:   entries.length,
    },
  });
}
