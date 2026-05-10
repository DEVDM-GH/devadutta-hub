import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  let url: string;
  let authToken: string | undefined;

  // Use Turso whenever the URL is set (Vercel previews also use NODE_ENV=production for builds).
  if (tursoUrl) {
    url = tursoUrl;
    authToken = tursoToken || undefined;
    if (process.env.VERCEL && !tursoToken) {
      console.error(
        "[prisma] TURSO_DATABASE_URL is set but TURSO_AUTH_TOKEN is missing. Remote Turso requests will fail."
      );
    }
  } else {
    const dbPath = path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");
    url = `file:${dbPath}`;
  }

  const onVercel = Boolean(process.env.VERCEL);
  if (onVercel && !tursoUrl) {
    console.error(
      "[prisma] TURSO_DATABASE_URL is missing on Vercel. SQLite file at prisma/dev.db is not deployed; set TURSO_* env vars for all environments that hit the API."
    );
  }

  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse one client per serverless isolate (Vercel); same pattern as Prisma docs for Next.js.
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
