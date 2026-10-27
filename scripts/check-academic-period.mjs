import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const sessions = await sql`SELECT id, name, is_current FROM academic_sessions`;
  console.log('Sessions:', sessions);

  const terms = await sql`SELECT id, session_id, name, is_current FROM academic_terms`;
  console.log('Terms:', terms);

  const reports = await sql`SELECT * FROM student_terminal_reports`;
  console.log('Terminal reports in DB:', reports);
}

run().catch(console.error);
