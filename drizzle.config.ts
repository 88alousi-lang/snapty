import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
  casing: "snake_case",
});

// For TiDB Cloud, SSL is required
if (connectionString && connectionString.includes('tidbcloud.com')) {
  // SSL will be handled automatically by the MySQL driver
}
