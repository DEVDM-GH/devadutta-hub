/**
 * Shared logic for importing scripts/ideas-output.json into SavedIdea.
 * Used by local seed (dev.db) and remote seed (Turso) — same JSON rules.
 */
import { readFileSync } from "fs";
import { join } from "path";

/**
 * @param {string} scriptDir - __dirname of the caller (folder containing ideas-output.json)
 */
export function loadIdeasFromDisk(scriptDir) {
  const filePath = join(scriptDir, "ideas-output.json");
  const raw = readFileSync(filePath, "utf-8");
  const ideas = JSON.parse(raw);
  if (!Array.isArray(ideas)) {
    throw new Error("ideas-output.json must be a JSON array.");
  }
  return ideas;
}

/**
 * @param {import("../src/generated/prisma/client").PrismaClient | null} prisma - null when opts.dryRun
 * @param {unknown[]} ideas
 * @param {{ dryRun?: boolean }} [opts]
 * @returns {Promise<number>} number of rows created (or that would be created in dryRun)
 */
export async function insertIdeas(prisma, ideas, opts = {}) {
  const { dryRun = false } = opts;
  if (!dryRun && !prisma) {
    throw new Error("prisma is required unless dryRun is true");
  }
  let created = 0;
  for (const idea of ideas) {
    if (!idea.title || !idea.content || !idea.category) {
      console.warn("Skipping incomplete idea:", idea.title || "(no title)");
      continue;
    }
    if (dryRun) {
      created++;
      console.log(`  [dry-run] ${idea.title} (${idea.category})`);
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
  return created;
}
