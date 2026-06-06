/**
 * Push scripts/ideas-output.json → Turso (production / remote DB).
 *
 * Does NOT touch local prisma/dev.db. Requires TURSO_* in .env.local (or CI secrets).
 *
 * Usage: npm run seed-ideas:turso
 * Dry run (no Turso connection, no secrets): npm run seed-ideas:turso:dry
 *   or: node scripts/seed-ideas-turso.mjs --dry-run
 * Real import uses tsx (Prisma 7 emits client.ts; plain Node cannot load it).
 */
import { config } from "dotenv";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { insertIdeas, loadIdeasFromDisk } from "./seed-ideas-core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const ideas = loadIdeasFromDisk(__dirname);
  if (dryRun) {
    const n = await insertIdeas(null, ideas, { dryRun: true });
    console.log(`\n✅ [dry-run] Would seed ${n} ideas into Turso (no connection, no writes).`);
    return;
  }

  config({ path: resolve(root, ".env") });
  config({ path: resolve(root, ".env.local") });

  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!url || !authToken) {
    console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN.");
    console.error("Add them to .env.local (same as Vercel), or set in CI secrets for automation.");
    process.exit(1);
  }

  const [{ PrismaClient }, { PrismaLibSql }] = await Promise.all([
    import("../src/generated/prisma/client"),
    import("@prisma/adapter-libsql"),
  ]);

  const adapter = new PrismaLibSql({ url, authToken });
  const prisma = new PrismaClient({ adapter });
  try {
    const created = await insertIdeas(prisma, ideas);
    console.log(`\n✅ Seeded ${created} ideas into Turso.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
