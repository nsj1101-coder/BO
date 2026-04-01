import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    async url() {
      return process.env.DATABASE_URL ?? "postgresql://j@localhost:5432/cms_dev_sf";
    },
  },
});
