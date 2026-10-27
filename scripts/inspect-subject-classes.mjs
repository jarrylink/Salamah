import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function inspectDb() {
  const sql = neon(process.env.DATABASE_URL);

  const currentSession = await sql`SELECT id, name, is_current FROM academic_sessions WHERE is_current = true`;
  console.log('Current Session:', currentSession);

  const currentTerm = await sql`SELECT id, session_id, name, term_number, is_current FROM academic_terms WHERE is_current = true`;
  console.log('Current Term:', currentTerm);

  const terms2627 = await sql`SELECT id, name, term_number, is_current FROM academic_terms WHERE session_id = ${currentSession[0]?.id} ORDER BY term_number`;
  console.log('Terms for 2026/2027:', terms2627);

  const classSubCount = await sql`SELECT count(*)::int as count FROM class_subjects`;
  console.log('class_subjects count:', classSubCount[0]?.count);

  const classCombCount = await sql`SELECT count(*)::int as count FROM class_subject_combinations`;
  console.log('class_subject_combinations count:', classCombCount[0]?.count);

  const classes = await sql`
    SELECT c.id, c.name, c.code, g.name as grade_name,
      (SELECT count(*)::int FROM student_enrollments se WHERE se.class_id = c.id AND se.status = 'active') as student_count
    FROM classes c
    JOIN grades g ON g.id = c.grade_id
    ORDER BY g.sort_order, c.name
  `;
  console.log('Classes and student counts:', classes);

  // Check which classes take which subjects
  const sampleSubject = await sql`SELECT id, name, code FROM subjects LIMIT 5`;
  console.log('Sample subjects:', sampleSubject);

  for (const s of sampleSubject) {
    const directClasses = await sql`
      SELECT c.id, c.name, c.code
      FROM class_subjects cs
      JOIN classes c ON c.id = cs.class_id
      WHERE cs.subject_id = ${s.id}
    `;
    const combClasses = await sql`
      SELECT c.id, c.name, c.code
      FROM class_subject_combinations csc
      JOIN subject_combination_subjects scs ON scs.combination_id = csc.combination_id
      JOIN classes c ON c.id = csc.class_id
      WHERE scs.subject_id = ${s.id}
    `;
    console.log(`Subject "${s.name}" (${s.code}): direct=${directClasses.length}, comb=${combClasses.length}`);
  }
}

inspectDb().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
