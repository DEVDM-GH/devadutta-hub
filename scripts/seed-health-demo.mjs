// Seed 7 days of realistic health entries per persona into the DB.
//
// Safe to run multiple times — skips entries for any email that already has
// data in the last 7 days (use --force to clear and reseed).
//
// Uses @libsql/client directly (no Prisma/tsx needed).
// Targets local SQLite by default; Turso when TURSO_DATABASE_URL is set or --turso flag passed.
//
// Usage:
//   node scripts/seed-health-demo.mjs
//   node scripts/seed-health-demo.mjs --turso
//   node scripts/seed-health-demo.mjs --force          # clears existing demo data first
//   node scripts/seed-health-demo.mjs --turso --force

import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local") });

const forceTurso = process.argv.includes("--turso");
const force      = process.argv.includes("--force");

// ---------------------------------------------------------------------------
// DB connection
// ---------------------------------------------------------------------------

function createDbClient() {
  const tursoUrl   = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (forceTurso || tursoUrl) {
    if (!tursoUrl || !tursoToken) {
      console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.");
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
// Date helpers
// ---------------------------------------------------------------------------

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Seed data — per persona, 7 days (index 6 = oldest, index 0 = today)
// Each array has 7 items ordered oldest → newest (day-6 to day-0)
// ---------------------------------------------------------------------------

const SEED_DATA = [
  // ── fintech-athlete ────────────────────────────────────────────────────
  {
    email: "qa.devadutta@gmail.com",
    entries: [
      { daysBack: 6, weightKg: 73.4, sleepHrs: 6.0, calories: 2100, waterL: 2.5, workoutDone: true,  notes: "Upper body session. Felt strong." },
      { daysBack: 5, weightKg: 73.2, sleepHrs: 5.5, calories: 1950, waterL: 2.0, workoutDone: false, notes: "Late standup till 11pm. Exhausted." },
      { daysBack: 4, weightKg: 73.1, sleepHrs: 7.5, calories: 2300, waterL: 3.0, workoutDone: true,  notes: "Leg day. Good energy, slept early." },
      { daysBack: 3, weightKg: 73.3, sleepHrs: 5.0, calories: 1800, waterL: 1.8, workoutDone: false, notes: "Release window ran late. Skipped gym." },
      { daysBack: 2, weightKg: 73.0, sleepHrs: 7.0, calories: 2250, waterL: 2.8, workoutDone: true,  notes: "Badminton for an hour. Fun session." },
      { daysBack: 1, weightKg: 72.8, sleepHrs: 6.5, calories: 2150, waterL: 2.5, workoutDone: true,  notes: "Full body HIIT. Pushed hard." },
      { daysBack: 0, weightKg: 72.7, sleepHrs: 6.0, calories: 2000, waterL: 2.2, workoutDone: false, notes: "Rest day. Mild DOMS from yesterday." },
    ],
  },
  // ── fintech-athlete (second admin account) ─────────────────────────────
  {
    email: "talk2devdmohapatra@gmail.com",
    entries: [
      { daysBack: 6, weightKg: 73.4, sleepHrs: 6.0, calories: 2100, waterL: 2.5, workoutDone: true,  notes: "Upper body session. Felt strong." },
      { daysBack: 5, weightKg: 73.2, sleepHrs: 5.5, calories: 1950, waterL: 2.0, workoutDone: false, notes: "Late standup till 11pm. Exhausted." },
      { daysBack: 4, weightKg: 73.1, sleepHrs: 7.5, calories: 2300, waterL: 3.0, workoutDone: true,  notes: "Leg day. Good energy, slept early." },
      { daysBack: 3, weightKg: 73.3, sleepHrs: 5.0, calories: 1800, waterL: 1.8, workoutDone: false, notes: "Release window ran late. Skipped gym." },
      { daysBack: 2, weightKg: 73.0, sleepHrs: 7.0, calories: 2250, waterL: 2.8, workoutDone: true,  notes: "Badminton for an hour. Fun session." },
      { daysBack: 1, weightKg: 72.8, sleepHrs: 6.5, calories: 2150, waterL: 2.5, workoutDone: true,  notes: "Full body HIIT. Pushed hard." },
      { daysBack: 0, weightKg: 72.7, sleepHrs: 6.0, calories: 2000, waterL: 2.2, workoutDone: false, notes: "Rest day. Mild DOMS from yesterday." },
    ],
  },
  // ── early-pregnancy (Prity) ────────────────────────────────────────────
  {
    email: "pritychoudhary2422@gmail.com",
    entries: [
      { daysBack: 6, weightKg: 61.8, sleepHrs: 9.0, calories: 2050, waterL: 2.5, workoutDone: true,  notes: "Short walk in the morning. Felt okay." },
      { daysBack: 5, weightKg: 62.0, sleepHrs: 8.5, calories: 1900, waterL: 2.2, workoutDone: false, notes: "Morning nausea. Couldn't eat much." },
      { daysBack: 4, weightKg: 62.1, sleepHrs: 10.0, calories: 2100, waterL: 3.0, workoutDone: false, notes: "Very tired. Rested all day." },
      { daysBack: 3, weightKg: 62.2, sleepHrs: 8.0, calories: 2200, waterL: 2.8, workoutDone: true,  notes: "Prenatal yoga session. Felt really good." },
      { daysBack: 2, weightKg: 62.3, sleepHrs: 9.5, calories: 2000, waterL: 2.0, workoutDone: false, notes: "Low water today. Forgot to drink." },
      { daysBack: 1, weightKg: 62.4, sleepHrs: 8.5, calories: 2150, waterL: 2.6, workoutDone: true,  notes: "Light swim. 20 mins. Loved it." },
      { daysBack: 0, weightKg: 62.5, sleepHrs: 9.0, calories: 2100, waterL: 2.5, workoutDone: false, notes: "Quiet morning. Some back discomfort." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const db = createDbClient();

  for (const { email, entries } of SEED_DATA) {
    const cutoff = daysAgo(7);

    // Idempotency check — skip if already has recent data (unless --force)
    if (!force) {
      const check = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM HealthEntry WHERE userEmail = ? AND date >= ?`,
        args: [email, cutoff],
      });
      const existing = Number(check.rows[0].cnt);
      if (existing > 0) {
        console.log(`⚠  ${email}: already has ${existing} entries in the last 7 days — skipping. Use --force to reseed.`);
        continue;
      }
    } else {
      // Clear existing demo range
      await db.execute({
        sql: `DELETE FROM HealthEntry WHERE userEmail = ? AND date >= ?`,
        args: [email, cutoff],
      });
      console.log(`🗑  ${email}: cleared existing entries for last 7 days.`);
    }

    // Insert entries
    for (const e of entries) {
      const date = daysAgo(e.daysBack);
      await db.execute({
        sql: `INSERT INTO HealthEntry (userEmail, date, weightKg, calories, waterL, sleepHrs, workoutDone, notes, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          email,
          date,
          e.weightKg,
          e.calories,
          e.waterL,
          e.sleepHrs,
          e.workoutDone ? 1 : 0,
          e.notes ?? null,
        ],
      });
    }
    console.log(`✅ ${email}: seeded ${entries.length} entries.`);
  }

  console.log("\nDone. Next steps:");
  console.log("  npm run generate-health -- --email qa.devadutta@gmail.com");
  console.log("  npm run generate-health -- --email pritychoudhary2422@gmail.com");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
