import { defineConfig } from "drizzle-kit";

const appUrl = process.env.DATABASE_URL ?? "postgresql://migration-placeholder";
// Neon pooler URLs are correct for the running Next.js app, but schema work
// requires a direct connection. Prefer an explicitly supplied direct URL and
// otherwise derive the matching endpoint without changing DATABASE_URL.
const migrationUrl = process.env.DATABASE_URL_UNPOOLED ?? appUrl.replace("-pooler.", ".");

export default defineConfig({ schema: "./src/db/schema.ts", out: "./drizzle", dialect: "postgresql", dbCredentials: { url: migrationUrl } });
