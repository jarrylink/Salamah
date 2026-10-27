// scripts/reset-passwords.mjs — one-shot: set every seeded account password to "123456"
// Uses the exact scrypt parameters expected by src/lib/auth/password.ts
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const sql = neon(process.env.DATABASE_URL);
const PASSWORD = "123456";
const hash = (password) => {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
};

const EMAILS = [
  "superadmin@salamah.edu.ng",
  "admin@salamah.edu.ng",
  "principal@salamah.edu.ng",
  "headteacher@salamah.edu.ng",
  "headofnursery@salamah.edu.ng",
  "teacher.musa@salamah.edu.ng",
  "teacher.aisha@salamah.edu.ng",
];

console.log("Resetting passwords for", EMAILS.length, "accounts to \"" + PASSWORD + "\"...");

for (const email of EMAILS) {
  const rows = await sql`
    update users
       set password_hash = ${hash(PASSWORD)},
           updated_at    = now()
     where email = ${email}
     returning email, role`;
  if (rows.length === 0) {
    console.log("  ✗ not found:", email);
  } else {
    console.log("  ✓", rows[0].email, "| role:", rows[0].role);
  }
}

// Verification — count active users with scrypt hashes
const check = await sql`
  select email, left(password_hash, 8) as prefix
    from users
   where email = any(${EMAILS})
   order by email`;
console.log("\nVerification:");
for (const row of check) console.log("  ", row.email, "|", row.prefix);

console.log("\nDone. Sign in with any of the above emails + password: 123456");
