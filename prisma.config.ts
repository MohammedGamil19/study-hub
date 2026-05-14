import path from "node:path";
import { defineConfig } from "prisma/config";

const localFileUrl =
  "file:///" +
  path.resolve(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    // Must be a file: URL — Prisma uses this for schema type-checking only.
    // The actual DB connection (local or Turso) goes through migrate.adapter below.
    url: "file:./prisma/dev.db",
  },
  migrate: {
    async adapter() {
      const { PrismaLibSql } = await import("@prisma/adapter-libsql");
      // Use Turso in production, local SQLite file in dev
      const url = process.env.TURSO_DATABASE_URL ?? localFileUrl;
      return new PrismaLibSql({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    },
  },
});
