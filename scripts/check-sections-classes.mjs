import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const sections = await sql`SELECT id, name, code FROM sections`;
  console.log('Sections in DB:', sections);

  const classes = await sql`
    SELECT c.id, c.name, c.code, g.name as grade_name, s.name as section_name
    FROM classes c
    JOIN grades g ON g.id = c.grade_id
    LEFT JOIN grade_sections gs ON gs.grade_id = g.id
    LEFT JOIN sections s ON s.id = gs.section_id
    ORDER BY c.name
  `;
  console.log('Classes count:', classes.length);
  console.log('Sample classes:', classes.slice(0, 8));
}

run().catch(console.error);
