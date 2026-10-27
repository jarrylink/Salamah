import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  const classes = await sql`
    SELECT c.id, c.name, s.name as section
    FROM classes c
    JOIN grades g ON g.id = c.grade_id
    LEFT JOIN grade_sections gs ON gs.grade_id = g.id
    LEFT JOIN sections s ON s.id = gs.section_id
    ORDER BY s.name, c.name
  `;
  console.log('Classes count:', classes.length);
  console.log('Sample classes:', classes.slice(0, 5));

  const att = await sql`SELECT count(*)::int as cnt, max(attendance_date) as max_date FROM attendance_records`;
  console.log('Attendance:', att);

  const sampleAtt = await sql`
    SELECT ar.attendance_date, ar.status, ar.created_at, p.first_name, p.last_name, c.name as class_name
    FROM attendance_records ar
    JOIN students s ON s.id = ar.student_id
    JOIN people p ON p.id = s.person_id
    JOIN classes c ON c.id = ar.class_id
    ORDER BY ar.attendance_date DESC, ar.created_at ASC
    LIMIT 5
  `;
  console.log('Sample attendance:', sampleAtt);
}
run();
