import { neon } from "@neondatabase/serverless";
import { scryptSync, timingSafeEqual } from "node:crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

function verifyPassword(storedHash, attemptPassword) {
  const [, salt, expectedHashHex] = storedHash.split("$");
  if (!salt || !expectedHashHex) return false;
  const actualHash = scryptSync(attemptPassword, salt, 64);
  const expectedHash = Buffer.from(expectedHashHex, "hex");
  return timingSafeEqual(actualHash, expectedHash);
}

async function run() {
  console.log("=== Salamah System Verification ===");

  // 1. Check Accounts & Passwords
  const accounts = [
    { email: "superadmin@salamah.edu.ng", expectedRole: "superadmin" },
    { email: "manager1@salamah.edu.ng", expectedRole: "manager" },
    { email: "staff1@salamah.edu.ng", expectedRole: "staff" },
    { email: "student1@salamah.edu.ng", expectedRole: "student" },
  ];

  for (const acc of accounts) {
    const [user] = await sql`SELECT id, email, role, password_hash, status FROM users WHERE email = ${acc.email}`;
    if (!user) {
      throw new Error(`Account missing: ${acc.email}`);
    }
    const passMatches = verifyPassword(user.password_hash, "12345678");
    if (!passMatches) {
      throw new Error(`Password mismatch for ${acc.email}`);
    }
    console.log(`✓ Account verified: ${user.email} (Role: ${user.role}, Status: ${user.status}, Password: OK)`);
  }

  // 2. Check Database Tables
  const tables = [
    "cms_sections",
    "admission_applications",
    "application_children",
    "offices",
    "office_logs",
    "school_tasks",
    "school_task_logs",
    "elearning_resources",
    "letterhead_documents",
    "system_settings",
    "manager_staff_assignments"
  ];

  for (const table of tables) {
    const [{ count }] = await sql.query(`SELECT count(*)::int as count FROM ${table}`);
    console.log(`✓ Table [${table}] records count: ${count}`);
  }

  // 3. Verify CMS sections
  const cmsRows = await sql`SELECT section_key, title FROM cms_sections ORDER BY section_key`;
  console.log(`✓ CMS Sections loaded: ${cmsRows.map(r => r.section_key).join(", ")}`);

  // 4. Verify System Settings
  const settingsRows = await sql`SELECT setting_key FROM system_settings`;
  console.log(`✓ System Settings loaded: ${settingsRows.map(r => r.setting_key).join(", ")}`);

  console.log("\n>>> ALL VERIFICATION CHECKS PASSED PERFECTLY! <<<");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
