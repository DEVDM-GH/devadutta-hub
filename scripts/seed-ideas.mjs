import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { insertIdeas, loadIdeasFromDisk } from "./seed-ideas-core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const ideas = loadIdeasFromDisk(__dirname);
  if (dryRun) {
    const n = await insertIdeas(null, ideas, { dryRun: true });
    console.log(`\n✅ [dry-run] Would seed ${n} ideas into prisma/dev.db (no writes).`);
    return;
  }

  const [{ PrismaClient }, { PrismaLibSql }] = await Promise.all([
    import("../src/generated/prisma/client"),
    import("@prisma/adapter-libsql"),
  ]);

  const dbPath = join(root, "prisma", "dev.db").replace(/\\/g, "/");
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
  const prisma = new PrismaClient({ adapter });
  try {
    const created = await insertIdeas(prisma, ideas);
    console.log(`\n✅ Seeded ${created} ideas into local prisma/dev.db.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
