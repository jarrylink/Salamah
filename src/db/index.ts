import "server-only";

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

// Enhance Neon fetch resilience with automatic retries for transient connection drops
if (neonConfig) {
  const originalFetch = neonConfig.fetchFunction || globalThis.fetch;
  neonConfig.fetchFunction = async (url: string | URL | Request, options?: RequestInit) => {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        return await originalFetch(url, options);
      } catch (err: unknown) {
        attempts++;
        if (attempts >= maxAttempts) throw err;
        await new Promise((resolve) => setTimeout(resolve, attempts * 400));
      }
    }
    return originalFetch(url, options);
  };
}

export const sqlClient = neon(databaseUrl);
export const db = drizzle({ client: sqlClient, schema });
