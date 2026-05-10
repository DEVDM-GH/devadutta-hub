import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const isProduction = process.env.NODE_ENV === "production";
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  let url: string;
  let authToken: string | undefined;

  if (isProduction && tursoUrl) {
    url = tursoUrl;
    authToken = tursoToken;
  } else {
    const dbPath = path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");
    url = `file:${dbPath}`;
  }

  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
