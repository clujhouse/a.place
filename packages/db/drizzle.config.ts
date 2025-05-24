import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  casing: "snake_case",
} satisfies Config;
