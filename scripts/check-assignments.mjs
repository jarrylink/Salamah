import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
async function run() {
  const staff = await sql`
    SELECT s.id as staff_id, u.id as user_id, u.email, p.first_name, p.last_name, s.staff_number
    FROM staff s
    JOIN users u ON u.person_id = s.person_id
    JOIN people p ON p.id = s.person_id
  `;
  console.log('Staff users:', staff);

  const teacherAssignments = await sql`
    SELECT tsa.id, s.name as subject_name, c.name as class_name, p.first_name || ' ' || p.last_name as teacher_name
    FROM teacher_subject_assignments tsa
    JOIN subjects s ON s.id = tsa.subject_id
    JOIN classes c ON c.id = tsa.class_id
    JOIN teachers t ON t.id = tsa.teacher_id
    JOIN staff st ON st.id = t.staff_id
    JOIN people p ON p.id = st.person_id
  `;
  console.log('Teacher subject assignments:', teacherAssignments);

  const classTeachers = await sql`
    SELECT tca.id, c.name as class_name, p.first_name || ' ' || p.last_name as teacher_name
    FROM teacher_class_assignments tca
    JOIN classes c ON c.id = tca.class_id
    JOIN teachers t ON t.id = tca.teacher_id
    JOIN staff st ON st.id = t.staff_id
    JOIN people p ON p.id = st.person_id
  `;
  console.log('Class teachers:', classTeachers);
}
run();
