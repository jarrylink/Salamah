import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  const indexes = await sql`
    SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'people';
  `;
  console.log('People indexes:', indexes);

  const emptyEmails = await sql`
    SELECT count(*)::int as count FROM people WHERE email = '' OR email IS NULL;
  `;
  console.log('Empty or null emails:', emptyEmails);
}
run();
