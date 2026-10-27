import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for db:migrate.");
const sql = neon(process.env.DATABASE_URL);
const migrationFiles = (await readdir("drizzle")).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();

await sql.query('create schema if not exists drizzle');
await sql.query('create table if not exists drizzle.salamah_migrations (name text primary key, hash text not null, applied_at timestamptz not null default now())');
const applied = new Set((await sql.query('select name from drizzle.salamah_migrations')).map((row) => row.name));

for (const file of migrationFiles) {
  if (applied.has(file)) continue;
  // This project existed before the migration ledger. Its core migration is
  // already present in the supplied database, so record that verified baseline
  // instead of replaying CREATE TYPE/TABLE statements destructively.
  if (file.startsWith("0000_") && (await sql.query("select to_regclass('public.academic_sessions') as relation"))[0]?.relation) {
    await sql.query('insert into drizzle.salamah_migrations (name, hash) values ($1, $2)', [file, createHash("sha256").update(await readFile(`drizzle/${file}`)).digest("hex")]);
    continue;
  }
  const source = await readFile(`drizzle/${file}`, "utf8");
  const statements = source.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);
  await sql.transaction(statements.map((query) => sql.query(query)));
  await sql.query('insert into drizzle.salamah_migrations (name, hash) values ($1, $2)', [file, createHash("sha256").update(source).digest("hex")]);
  console.log(`Applied ${file}`);
}
console.log("Database migrations are current.");
