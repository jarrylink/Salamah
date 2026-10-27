import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
async function run() {
  const classes = await sql`SELECT c.id, c.name, c.code, g.name as grade_name FROM classes c JOIN grades g ON g.id = c.grade_id ORDER BY g.sort_order, c.name`;
  console.log('Classes:', classes);

  const subjects = await sql`SELECT id, name, code FROM subjects ORDER BY name`;
  console.log('Subjects count:', subjects.length);
}
run();
