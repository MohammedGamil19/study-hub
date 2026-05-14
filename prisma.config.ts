import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: `file:${path.join("prisma", "dev.db")}`,
  },
  migrate: {
    async adapter() {
      const { PrismaLibSql } = await import("@prisma/adapter-libsql");
      const { createClient } = await import("@libsql/client");
      const client = createClient({
        url: `file:${path.join(process.cwd(), "prisma", "dev.db")}`,
      });
      return new PrismaLibSql(client);
    },
  },
});
