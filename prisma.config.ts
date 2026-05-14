import path from "node:path";
import { defineConfig } from "prisma/config";

// datasource.url must always be a local file: path — Prisma's SQLite parser
// crashes on libsql:// URLs. Runtime connection to Turso is handled in
// src/lib/prisma.ts via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: "file:./prisma/dev.db",
  },
});
