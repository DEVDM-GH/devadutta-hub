/**
 * Shared Gemini generation logic for the AI Idea Lab.
 *
 * Used by:
 *   - src/app/api/admin/generate-ideas/route.ts  (API route, Prisma)
 *
 * The CLI script (scripts/generate-ideas-gemini.mjs) duplicates the Gemini
 * layer to avoid TypeScript compilation in a plain Node ESM script — it also
 * only writes scripts/ideas-output.json rather than inserting rows directly.
 * Keep both in sync when updating the prompt or response parsing.
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

export type GeneratedIdea = {
  category: string;
  title: string;
  content: string;
  tags: string;
};

const VALID_CATEGORIES = new Set(["career", "project", "learning", "technical"]);

// ---------------------------------------------------------------------------
// Prompt loading
// ---------------------------------------------------------------------------

export function loadIdeaPrompt(): string {
  const filePath = join(process.cwd(), "scripts", "idea-prompt.md");
  const raw = readFileSync(filePath, "utf-8");
  const idx = raw.indexOf("\n---\n");
  if (idx === -1) {
    throw new Error("idea-prompt.md must contain a `---` separator before the prompt body.");
  }
  return raw.slice(idx + 5).trim();
}

// ---------------------------------------------------------------------------
// Gemini call  (Interactions API — new steps schema, June 2026)
// ---------------------------------------------------------------------------

export async function callGeminiForIdeas(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
  const client = new GoogleGenAI({ apiKey });

  const interaction = await client.interactions.create({
    model,
    input: prompt,
    generation_config: { temperature: 0.9 },
    store: false,
  });

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

export function parseIdeas(text: string): GeneratedIdea[] {
  const trimmed = text.trim();
  // Strip markdown fences if the model adds them despite instructions
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const payload = fenced ? fenced[1].trim() : trimmed;
  const raw = JSON.parse(payload) as unknown;

  if (!Array.isArray(raw)) {
    throw new Error("Gemini response must be a JSON array of ideas.");
  }

  return raw.map((item, i) => {
    const idea = item as Record<string, unknown>;
    if (!idea.title || !idea.content || !idea.category) {
      throw new Error(`Idea at index ${i} is missing title, content, or category.`);
    }
    if (!VALID_CATEGORIES.has(idea.category as string)) {
      throw new Error(
        `Idea "${String(idea.title)}" has invalid category "${String(idea.category)}". Expected one of: ${[...VALID_CATEGORIES].join(", ")}`
      );
    }
    return {
      category: idea.category as string,
      title: idea.title as string,
      content: idea.content as string,
      tags: (idea.tags as string | undefined) ?? "",
    };
  });
}

// ---------------------------------------------------------------------------
// Full pipeline — build prompt, call Gemini, insert fresh SavedIdea rows
// ---------------------------------------------------------------------------

export async function generateAndSaveIdeas(): Promise<GeneratedIdea[]> {
  const prompt = loadIdeaPrompt();
  const raw = await callGeminiForIdeas(prompt);
  const ideas = parseIdeas(raw);

  // Append, matching the existing seed-ideas.mjs behaviour (no dedupe yet).
  for (const idea of ideas) {
    await prisma.savedIdea.create({
      data: {
        category: idea.category,
        title: idea.title,
        content: idea.content,
        tags: idea.tags,
        pinned: false,
      },
    });
  }

  return ideas;
}
