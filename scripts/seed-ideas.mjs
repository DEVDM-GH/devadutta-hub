import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const dbPath = join(root, "prisma", "dev.db").replace(/\\/g, "/");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = join(__dirname, "ideas-output.json");
  const raw = readFileSync(filePath, "utf-8");
  const ideas = JSON.parse(raw);

  if (!Array.isArray(ideas)) {
    console.error("ideas-output.json must be a JSON array.");
    process.exit(1);
  }

  let created = 0;
  for (const idea of ideas) {
    if (!idea.title || !idea.content || !idea.category) {
      console.warn("Skipping incomplete idea:", idea.title || "(no title)");
      continue;
    }
    await prisma.savedIdea.create({
      data: {
        category: idea.category,
        title: idea.title,
        content: idea.content,
        tags: idea.tags ?? "",
        pinned: false,
      },
    });
    created++;
    console.log(`  + ${idea.title}`);
  }

  console.log(`\n✅ Seeded ${created} ideas into the database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
