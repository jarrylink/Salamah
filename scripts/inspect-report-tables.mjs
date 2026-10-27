import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
async function run() {
  const tables = ['student_remarks', 'student_trait_assessments', 'trait_definitions', 'report_card_signatories'];
  for (const t of tables) {
    const cols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = ${t}
      ORDER BY ordinal_position
    `;
    console.log(`\nTable ${t}:`);
    console.log(cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }
}
run();
