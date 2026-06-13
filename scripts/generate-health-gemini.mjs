// Generate a HealthInsight for a given user via Gemini Interactions API.
//
// Reads the user's recent HealthEntry rows directly from the database,
// loads the matching persona prompt from scripts/personas/<id>.md,
// calls Gemini, and writes the result back to the HealthInsight table.
//
// Uses @libsql/client directly (no Prisma/tsx needed) — same pattern as apply-turso-schema.mjs.
// Works against local SQLite or Turso depending on env vars.
//
// Usage:
//   node scripts/generate-health-gemini.mjs --email qa.devadutta@gmail.com
//   node scripts/generate-health-gemini.mjs --email qa.devadutta@gmail.com --dry-run
//   node scripts/generate-health-gemini.mjs --email qa.devadutta@gmail.com --turso
//   node scripts/generate-health-gemini.mjs --all
//   node scripts/generate-health-gemini.mjs --all --turso
//   node scripts/generate-health-gemini.mjs --all --dry-run
//
// Flags (pass after --  when using npm run):
//   --email <email>    Which user to generate coaching for (required unless --all)
//   --all              Generate coaching for every user in PERSONA_MAP
//   --dry-run          Call Gemini and print output; do NOT write to DB
//   --turso            Force Turso even if called as generate-health (not :turso)
//
// Requires in .env.local:
//   GEMINI_API_KEY
//   GEMINI_MODEL (optional, defaults to gemini-3.5-flash)
//   TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (for Turso target)

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local") });

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const forceTurso = args.includes("--turso");
const runAll = args.includes("--all");

const emailFlagIdx = args.indexOf("--email");
const targetEmail = emailFlagIdx !== -1 ? args[emailFlagIdx + 1]?.toLowerCase() : null;

if (!runAll && !targetEmail) {
  console.error("Error: --email <email> is required (or use --all for all users).");
  console.error("  Example: node scripts/generate-health-gemini.mjs --email qa.devadutta@gmail.com");
  console.error("  Example: node scripts/generate-health-gemini.mjs --all");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Persona map — mirrors EMAIL_CONFIG in src/lib/access.ts
// Keep in sync manually when adding new users.
// ---------------------------------------------------------------------------

const PERSONA_MAP = {
  "qa.devadutta@gmail.com":         "fintech-athlete",
  "talk2devdmohapatra@gmail.com":   "fintech-athlete",
  "pritychoudhary2422@gmail.com":   "early-pregnancy",
};

const DEFAULT_PERSONA = "fintech-athlete";

function getPersonaId(email) {
  return PERSONA_MAP[email] ?? DEFAULT_PERSONA;
}

function loadPersonaPrompt(personaId) {
  const path = join(__dirname, "personas", `${personaId}.md`);
  try {
    return readFileSync(path, "utf-8").trim();
  } catch {
    throw new Error(`Persona file not found: ${path}`);
  }
}

// ---------------------------------------------------------------------------
// DB connection
// ---------------------------------------------------------------------------

function createDbClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (forceTurso || tursoUrl) {
    if (!tursoUrl || !tursoToken) {
      console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set for Turso target.");
      process.exit(1);
    }
    console.log("DB target: Turso");
    return createClient({ url: tursoUrl, authToken: tursoToken });
  }

  const localPath = join(root, "prisma", "dev.db").replace(/\\/g, "/");
  console.log(`DB target: local SQLite (${localPath})`);
  return createClient({ url: `file:${localPath}` });
}

// ---------------------------------------------------------------------------
// Fetch recent entries
// ---------------------------------------------------------------------------

async function fetchEntries(client, email, limit = 14) {
  const result = await client.execute({
    sql: `SELECT date, weightKg, calories, waterL, sleepHrs, workoutDone, notes
          FROM HealthEntry
          WHERE userEmail = ?
          ORDER BY date DESC
          LIMIT ?`,
    args: [email, limit],
  });

  return result.rows.map((r) => ({
    date:        r.date,
    weightKg:    r.weightKg,
    calories:    r.calories,
    waterL:      r.waterL,
    sleepHrs:    r.sleepHrs,
    workoutDone: r.workoutDone === 1 || r.workoutDone === true,
    notes:       r.notes,
  }));
}

// ---------------------------------------------------------------------------
// Build prompt
// ---------------------------------------------------------------------------

function buildLogTable(entries) {
  if (entries.length === 0) return "(no entries logged yet)";

  const header = "Date       | Weight(kg) | Sleep(h) | Calories | Water(L) | Workout | Notes";
  const divider = "-----------|------------|----------|----------|----------|---------|------";

  const rows = entries.map((e) => {
    const weight   = e.weightKg  != null ? String(e.weightKg)  : "—";
    const sleep    = e.sleepHrs  != null ? String(e.sleepHrs)  : "—";
    const calories = e.calories  != null ? String(e.calories)  : "—";
    const water    = e.waterL    != null ? String(e.waterL)    : "—";
    const workout  = e.workoutDone ? "✓" : "✗";
    const notes    = e.notes     ? String(e.notes).slice(0, 40) : "—";

    return `${String(e.date).padEnd(10)} | ${weight.padEnd(10)} | ${sleep.padEnd(8)} | ${calories.padEnd(8)} | ${water.padEnd(8)} | ${workout.padEnd(7)} | ${notes}`;
  });

  return [header, divider, ...rows].join("\n");
}

function buildPrompt(personaPrompt, entries) {
  const logTable = buildLogTable(entries);
  return `${personaPrompt}

---

## Recent health log (most recent first)

\`\`\`
${logTable}
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
// Gemini call
// ---------------------------------------------------------------------------

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY in .env.local");
    process.exit(1);
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
  console.log(`Calling Gemini (${model})…`);

  const client = new GoogleGenAI({ apiKey });
  const interaction = await client.interactions.create({
    model,
    input: prompt,
    generation_config: { temperature: 0.4 },
    store: false,
  });

  // New steps schema — output_text removed June 8 2026
  // Use findLast to skip thought/tool steps and land on the actual model_output step
  const outputStep = interaction.steps?.findLast((s) => s.type === "model_output");
  const text = outputStep?.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) {
    // Debug: print step types so we can diagnose unexpected responses
    const stepTypes = interaction.steps?.map((s) => s.type).join(", ") ?? "none";
    throw new Error(`Gemini returned no text output. Steps: [${stepTypes}]`);
  }
  return text;
}

function parseInsight(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const payload = fenced ? fenced[1].trim() : trimmed;
  const raw = JSON.parse(payload);

  // Normalize snake_case → camelCase (Gemini may return either without a schema)
  const insight = {
    headline:     raw.headline,
    weeklyRead:   raw.weeklyRead   ?? raw.weekly_read,
    priorities:   raw.priorities,
    todayAction:  raw.todayAction  ?? raw.today_action,
    workoutFocus: raw.workoutFocus ?? raw.workout_focus,
  };

  if (!insight.headline || !insight.weeklyRead || !Array.isArray(insight.priorities) ||
      !insight.todayAction || !insight.workoutFocus) {
    throw new Error("Gemini response is missing required fields.");
  }
  if (insight.priorities.length !== 3) {
    throw new Error(`Expected 3 priorities, got ${insight.priorities.length}.`);
  }
  return insight;
}

// ---------------------------------------------------------------------------
// Write to DB
// ---------------------------------------------------------------------------

async function writeInsight(client, email, insight, entryCount) {
  // Delete existing insights for this user before inserting fresh
  await client.execute({
    sql: `DELETE FROM HealthInsight WHERE userEmail = ?`,
    args: [email],
  });

  await client.execute({
    sql: `INSERT INTO HealthInsight (userEmail, headline, weeklyRead, priorities, todayAction, workoutFocus, entryCount, generatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [
      email,
      insight.headline,
      insight.weeklyRead,
      JSON.stringify(insight.priorities),
      insight.todayAction,
      insight.workoutFocus,
      entryCount,
    ],
  });
}

// ---------------------------------------------------------------------------
// Core: generate for a single user (shared by single + all modes)
// ---------------------------------------------------------------------------

async function generateForUser(db, email) {
  const personaId = getPersonaId(email);
  console.log(`\n── ${email} (${personaId}) ${"─".repeat(Math.max(0, 50 - email.length))}`);

  const personaPrompt = loadPersonaPrompt(personaId);
  const entries = await fetchEntries(db, email);
  console.log(`Entries found: ${entries.length}`);

  if (entries.length === 0) {
    throw new Error(`No health entries found. Seed first: npm run seed-health-demo`);
  }

  const prompt = buildPrompt(personaPrompt, entries);
  const rawOutput = await callGemini(prompt);
  const insight = parseInsight(rawOutput);

  console.log(`Headline:     ${insight.headline}`);
  console.log(`Weekly read:  ${insight.weeklyRead}`);
  console.log(`Priorities:`);
  insight.priorities.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
  console.log(`Today action: ${insight.todayAction}`);
  console.log(`Workout:      ${insight.workoutFocus}`);

  if (dryRun) {
    console.log("[dry-run] No DB write.");
    return;
  }

  await writeInsight(db, email, insight, entries.length);
  console.log(`✅ HealthInsight saved.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const db = createDbClient();

  if (runAll) {
    const emails = Object.keys(PERSONA_MAP);
    console.log(`\nGenerating health coaching for all ${emails.length} users…`);
    if (dryRun) console.log("[dry-run mode — no DB writes]\n");

    const results = { ok: [], failed: [] };

    for (const email of emails) {
      try {
        await generateForUser(db, email);
        results.ok.push(email);
      } catch (err) {
        console.error(`❌ Failed for ${email}: ${err.message ?? err}`);
        results.failed.push(email);
      }
    }

    console.log("\n══ Summary " + "═".repeat(50));
    console.log(`✅ Success: ${results.ok.length}/${emails.length}`);
    results.ok.forEach((e) => console.log(`   • ${e}`));
    if (results.failed.length > 0) {
      console.log(`❌ Failed:  ${results.failed.length}/${emails.length}`);
      results.failed.forEach((e) => console.log(`   • ${e}`));
      process.exit(1);
    }
    return;
  }

  // Single-user mode
  console.log(`\nGenerating health coaching for: ${targetEmail}`);
  if (dryRun) console.log("[dry-run mode — no DB write]");

  await generateForUser(db, targetEmail);

  if (!dryRun) {
    console.log("\nRefresh /dashboard/health to see the coaching card.");
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
