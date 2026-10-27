import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function setFirstTermCurrent() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('Setting 2026/2027 First Term as current term in DB...');

  // 1. Get 2026/2027 session
  const [session2627] = await sql`SELECT id, name FROM academic_sessions WHERE name = '2026/2027'`;
  if (!session2627) throw new Error('2026/2027 session not found');

  // 2. Unset all current terms and sessions
  await sql`UPDATE academic_sessions SET is_current = false`;
  await sql`UPDATE academic_sessions SET is_current = true WHERE id = ${session2627.id}`;

  await sql`UPDATE academic_terms SET is_current = false`;
  
  // Set First Term of 2026/2027 as is_current = true
  const [firstTerm] = await sql`
    SELECT id, name, term_number 
    FROM academic_terms 
    WHERE session_id = ${session2627.id} AND term_number = 1
  `;
  if (!firstTerm) throw new Error('First Term not found');

  await sql`UPDATE academic_terms SET is_current = true WHERE id = ${firstTerm.id}`;

  // 3. Update existing terminal reports to point to First Term of 2026/2027 (and copy to Second Term if needed)
  const updatedReports = await sql`
    UPDATE student_terminal_reports
    SET session_id = ${session2627.id}, term_id = ${firstTerm.id}
    RETURNING id
  `;
  console.log(`Updated ${updatedReports.length} terminal reports to 2026/2027 First Term (${firstTerm.id})`);

  // Verify
  const s = await sql`SELECT id, name, is_current FROM academic_sessions WHERE is_current = true`;
  const t = await sql`SELECT id, session_id, name, term_number, is_current FROM academic_terms WHERE is_current = true`;
  console.log('Verified Current Session:', s[0]);
  console.log('Verified Current Term:', t[0]);
}

setFirstTermCurrent().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
