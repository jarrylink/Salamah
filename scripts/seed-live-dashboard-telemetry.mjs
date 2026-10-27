import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log("Seeding today's attendance records and history...");

  const sessions = await sql`SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1`;
  const sessionId = sessions[0]?.id;

  const terms = await sql`SELECT id FROM academic_terms WHERE session_id = ${sessionId} AND is_current = true LIMIT 1`;
  const termId = terms[0]?.id;

  const users = await sql`SELECT id FROM users LIMIT 1`;
  const userId = users[0]?.id;

  // Fetch all active enrolled students
  const enrolled = await sql`
    SELECT se.student_id, se.class_id, s.admission_number, p.first_name, p.last_name
    FROM student_enrollments se
    JOIN students s ON s.id = se.student_id
    JOIN people p ON p.id = s.person_id
    WHERE se.status = 'active'
  `;

  console.log(`Found ${enrolled.length} active enrolled students.`);

  // Dates to seed: today and past 3 days for history
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  for (const dateStr of dates) {
    for (let idx = 0; idx < enrolled.length; idx++) {
      const st = enrolled[idx];
      // 80% present, 10% late, 10% absent
      const status = idx === enrolled.length - 1 ? 'absent' : (idx === enrolled.length - 2 ? 'late' : 'present');
      
      // Calculate realistic arrival timestamps
      const checkInDate = new Date(`${dateStr}T07:15:00Z`);
      checkInDate.setMinutes(15 + idx * 4);

      await sql`
        INSERT INTO attendance_records (
          session_id, term_id, class_id, student_id, attendance_date, status, recorded_by_user_id, note, created_at, updated_at
        ) VALUES (
          ${sessionId}, ${termId}, ${st.class_id}, ${st.student_id}, ${dateStr}, ${status}, ${userId},
          ${status === 'present' ? 'Early morning check-in at main portal gate' : status === 'late' ? 'Traffic advisory at diplomatic junction' : 'Excused medical absence'},
          ${checkInDate.toISOString()},
          ${checkInDate.toISOString()}
        )
        ON CONFLICT (student_id, attendance_date) DO UPDATE SET
          status = EXCLUDED.status,
          created_at = EXCLUDED.created_at,
          note = EXCLUDED.note;
      `;
    }
  }

  console.log("Seeded attendance for today and historical days.");
}
seed();
