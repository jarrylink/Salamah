import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
async function check() {
  const s = await sql`SELECT id, name, is_current FROM academic_sessions WHERE is_current = true`;
  console.log('Current session:', s);
  const t = await sql`SELECT id, session_id, name, term_number, is_current FROM academic_terms WHERE is_current = true`;
  console.log('Current terms:', t);
  if (s[0]) {
    const allT = await sql`SELECT id, session_id, name, term_number, is_current FROM academic_terms WHERE session_id = ${s[0].id} ORDER BY term_number`;
    console.log('Terms for current session:', allT);
  }
}
check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
