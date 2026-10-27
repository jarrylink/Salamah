import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function check() {
  const counts = await sql`
    SELECT
      COALESCE(s.name, 'Other') as section_name,
      c.name as class_name,
      count(se.id)::int as enrolled_count
    FROM classes c
    JOIN grades g ON g.id = c.grade_id
    LEFT JOIN grade_sections gs ON gs.grade_id = g.id
    LEFT JOIN sections s ON s.id = gs.section_id
    LEFT JOIN student_enrollments se ON se.class_id = c.id AND se.status = 'active'
    GROUP BY s.name, c.name, g.sort_order
    ORDER BY s.name, g.sort_order, c.name
  `;
  console.log('Enrolled per class:', counts);
}
check();
