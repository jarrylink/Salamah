import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const [s] = await sql`SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1`;
  const [term] = await sql`SELECT id FROM academic_terms WHERE is_current = true LIMIT 1`;
  const [cl] = await sql`SELECT id FROM classes LIMIT 1`;
  const [st] = await sql`SELECT id FROM students LIMIT 1`;

  const res = await sql`
    INSERT INTO student_terminal_reports (
      session_id, term_id, class_id, student_id, 
      teacher_comment, principal_comment, 
      affective_domain, psychomotor_domain,
      days_school_opened, days_present, days_absent,
      next_term_resumption, height, weight
    ) VALUES (
      ${s.id}, ${term.id}, ${cl.id}, ${st.id},
      'Diligent, respectful and focused pupil.',
      'Promoted with Distinction.',
      ${JSON.stringify({ punctuality: 5, neatness: 5, politeness: 5 })},
      ${JSON.stringify({ handwriting: 5, sports: 4, verbalFluency: 5 })},
      60, 59, 1,
      'January 11, 2027', '148 cm', '44 kg'
    )
    ON CONFLICT (session_id, term_id, class_id, student_id) DO UPDATE SET
      teacher_comment = EXCLUDED.teacher_comment,
      principal_comment = EXCLUDED.principal_comment,
      affective_domain = EXCLUDED.affective_domain,
      psychomotor_domain = EXCLUDED.psychomotor_domain,
      updated_at = now()
    RETURNING *
  `;
  console.log('✅ Terminal report successfully upserted:', {
    id: res[0]?.id,
    teacher_comment: res[0]?.teacher_comment,
    affective_domain: res[0]?.affective_domain,
    psychomotor_domain: res[0]?.psychomotor_domain,
  });
}

run().catch(console.error);
