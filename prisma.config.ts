import path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// datasource.url must always be a local file: path — Prisma's SQLite parser
// crashes on libsql:// URLs. Runtime connection to Turso is handled in
// src/lib/prisma.ts via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars.
//
// migrate.adapter is used by "prisma db push" / "prisma migrate" to actually
// connect to the database. It correctly resolves Turso in production or the
// local dev.db when TURSO_DATABASE_URL is not set.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: "file:./prisma/dev.db",
  },
  migrate: {
    adapter: async () => {
      const url =
        process.env.TURSO_DATABASE_URL ??
        "file:" +
          path.resolve(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");
      return new PrismaLibSql({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    },
  },
});
