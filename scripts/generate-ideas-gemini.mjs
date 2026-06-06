/**
 * Generate scripts/ideas-output.json via Gemini Interactions API (@google/genai).
 *
 * Reads the prompt body from scripts/idea-prompt.md (content after the first `---`).
 *
 * Usage:
 *   npm run generate-ideas              # call Gemini → write ideas-output.json
 *   npm run generate-ideas:dry          # call Gemini → print preview, no file write
 *
 * Requires GEMINI_API_KEY in .env.local (see .env.example).
 */
import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local") });

const apiKey = process.env.GEMINI_API_KEY?.trim();
const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";

const ideasJsonSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["career", "project", "learning", "technical"],
      },
      title: { type: "string" },
      content: { type: "string" },
      tags: { type: "string" },
    },
    required: ["category", "title", "content"],
  },
};

function loadPrompt() {
  const raw = readFileSync(join(__dirname, "idea-prompt.md"), "utf-8");
  const idx = raw.indexOf("\n---\n");
  if (idx === -1) {
    throw new Error("idea-prompt.md must contain a `---` separator before the prompt body.");
  }
  return raw.slice(idx + 5).trim();
}

function extractJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const payload = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(payload);
}

function validateIdeas(ideas) {
  if (!Array.isArray(ideas)) {
    throw new Error("Model output must be a JSON array.");
  }
  const validCategories = new Set(["career", "project", "learning", "technical"]);
  for (const [i, idea] of ideas.entries()) {
    if (!idea?.title || !idea?.content || !idea?.category) {
      throw new Error(`Idea at index ${i} is missing title, content, or category.`);
    }
    if (!validCategories.has(idea.category)) {
      throw new Error(
        `Idea "${idea.title}" has invalid category "${idea.category}". Expected one of: ${[...validCategories].join(", ")}`
      );
    }
  }
  return ideas;
}

async function callGemini(prompt) {
  const client = new GoogleGenAI({ apiKey });

  const interaction = await client.interactions.create({
    model,
    input: prompt,
    generation_config: {
      temperature: 0.9,
    },
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: ideasJsonSchema,
    },
  });

  const text = interaction.output_text?.trim();
  if (!text) {
    throw new Error("Gemini returned no text. Check API key, model name, and quota.");
  }
  return text;
}

async function main() {
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY.");
    console.error("");
    console.error("Setup:");
    console.error("  1. Open https://aistudio.google.com/apikey");
    console.error("  2. Create an API key (Google AI Studio — separate from OAuth client ID)");
    console.error("  3. Add to .env.local:  GEMINI_API_KEY=AIza...");
    console.error("");
    console.error("Optional: GEMINI_MODEL=gemini-3.5-flash  (default)");
    process.exit(1);
  }

  const prompt = loadPrompt();
  console.log(`Calling Gemini Interactions API (${model})…`);

  const raw = await callGemini(prompt);
  const ideas = validateIdeas(extractJson(raw));

  console.log(`Received ${ideas.length} ideas.`);

  if (dryRun) {
    console.log("\n[dry-run] Preview (first 2 ideas):");
    console.log(JSON.stringify(ideas.slice(0, 2), null, 2));
    console.log(`\n✅ [dry-run] Would write ${ideas.length} ideas to scripts/ideas-output.json`);
    return;
  }

  const outPath = join(__dirname, "ideas-output.json");
  writeFileSync(outPath, `${JSON.stringify(ideas, null, 2)}\n`, "utf-8");
  console.log(`\n✅ Wrote ${ideas.length} ideas to scripts/ideas-output.json`);
  console.log("Next: npm run seed-ideas  (local)  or  npm run seed-ideas:turso  (remote)");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
