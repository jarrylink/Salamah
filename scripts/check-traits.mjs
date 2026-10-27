import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
async function run() {
  const traits = await sql`SELECT * FROM trait_definitions ORDER BY category, sort_order`;
  console.log('Trait definitions:', traits);

  const remarks = await sql`SELECT * FROM student_remarks LIMIT 5`;
  console.log('Remarks count / sample:', remarks);
}
run();
