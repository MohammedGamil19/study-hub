import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Production (Vercel): uses Turso cloud URL + auth token from env vars.
  // Local dev: falls back to the local SQLite file — no env vars needed.
  const url =
    process.env.TURSO_DATABASE_URL ??
    "file:///" +
      path.resolve(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");

  const adapter = new PrismaLibSql({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN, // undefined is fine for local file://
  });

  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
