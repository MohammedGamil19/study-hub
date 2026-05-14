import path from "node:path";
import { defineConfig } from "prisma/config";

// This config is used by the Prisma CLI (prisma generate, prisma db push).
// - `prisma generate` (runs on Vercel postinstall): only needs schema path — no adapter required.
// - `prisma db push` (run locally to sync schema to Turso): set TURSO_DATABASE_URL +
//   TURSO_AUTH_TOKEN env vars before running, then uncomment the migrate block below.
// Runtime connection to Turso is handled in src/lib/prisma.ts via the PrismaClient adapter.

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
