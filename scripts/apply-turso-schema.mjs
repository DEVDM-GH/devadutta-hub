// Apply local prisma/migrations/<folder>/migration.sql files to your remote Turso DB.
//
// Vercel env vars only connect the running app to Turso; they do not run SQL.
// Prisma Migrate targets your local file DB (prisma.config.ts); Turso needs this
// one-time (or per-migration) apply.
//
// Usage (Node 20+): ensure .env.local has TURSO_DATABASE_URL + TURSO_AUTH_TOKEN, then:
//   npm run db:apply-turso
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

const root = process.cwd();
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local") });

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url || !authToken) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local (same values as Vercel).");
  process.exit(1);
}

const migrationsDir = join(root, "prisma", "migrations");
if (!existsSync(migrationsDir)) {
  console.error("Missing prisma/migrations");
  process.exit(1);
}

const folders = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const client = createClient({ url, authToken });

function statementsFromMigration(sql) {
  const stripped = sql.replace(/^--[^\n]*\n/gm, "").trim();
  return stripped
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

for (const folder of folders) {
  const file = join(migrationsDir, folder, "migration.sql");
  if (!existsSync(file)) continue;

  const stmts = statementsFromMigration(readFileSync(file, "utf8"));
  console.log(`→ ${folder} (${stmts.length} statement(s))`);

  for (const stmt of stmts) {
    try {
      await client.execute(stmt);
    } catch (err) {
      const msg = String(err?.message ?? err);
      if (/already exists|duplicate column name/i.test(msg)) {
        console.warn(`  skip: ${msg}`);
        continue;
      }
      console.error(err);
      process.exit(1);
    }
  }
}

console.log("\nOK — refresh Turso → Edit Data; you should see HealthEntry and SavedIdea.");
