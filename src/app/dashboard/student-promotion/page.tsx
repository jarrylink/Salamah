import { sqlClient } from "@/db";
import { StudentPromotionClient } from "@/features/dashboard/components/student-promotion-client";

export default async function StudentPromotionPage() {
  // 1. Fetch all classes
  const classes = await sqlClient.query(`
    SELECT
      c.id,
      c.name,
      c.code,
      g.name as grade_name,
      s.name as section_name
    FROM classes c
    JOIN grades g ON g.id = c.grade_id
    LEFT JOIN grade_sections gs ON gs.grade_id = g.id
    LEFT JOIN sections s ON s.id = gs.section_id
    ORDER BY g.sort_order, c.name
  `);

  // 2. Fetch Academic Sessions & Terms
  const sessions = await sqlClient.query(
    "SELECT id, name, is_current FROM academic_sessions ORDER BY name DESC"
  );
  const terms = await sqlClient.query(
    "SELECT id, session_id, name, term_number, is_current FROM academic_terms ORDER BY term_number ASC"
  );

  const [currentSession] = (await sqlClient.query(
    "SELECT id, name, is_current FROM academic_sessions WHERE is_current = true LIMIT 1"
  )) as { id: string; name: string }[];

  const [currentTerm] = (await sqlClient.query(
    "SELECT id, name, term_number, is_current FROM academic_terms WHERE is_current = true LIMIT 1"
  )) as { id: string; name: string; term_number: number }[];

  // 3. Fetch past promotion history
  const initialHistory = await sqlClient.query(`
    SELECT 
      sp.*,
      p.first_name, p.last_name, p.avatar_url,
      s.admission_number,
      from_c.name as from_class_name, from_g.name as from_grade_name,
      to_c.name as to_class_name, to_g.name as to_grade_name,
      from_sess.name as from_session_name,
      to_sess.name as to_session_name,
      u.email as decided_by_email
    FROM student_promotions sp
    JOIN students s ON s.id = sp.student_id
    JOIN people p ON p.id = s.person_id
    JOIN classes from_c ON from_c.id = sp.from_class_id
    JOIN grades from_g ON from_g.id = from_c.grade_id
    JOIN classes to_c ON to_c.id = sp.to_class_id
    JOIN grades to_g ON to_g.id = to_c.grade_id
    JOIN academic_sessions from_sess ON from_sess.id = sp.from_session_id
    JOIN academic_sessions to_sess ON to_sess.id = sp.to_session_id
    LEFT JOIN users u ON u.id = sp.decided_by_user_id
    ORDER BY sp.created_at DESC
    LIMIT 100
  `);

  return (
    <div className="space-y-6 salamah-enter">
      <StudentPromotionClient
        classes={classes as any}
        sessions={sessions as any}
        terms={terms as any}
        initialHistory={initialHistory as any}
        currentSessionId={currentSession?.id || (sessions[0]?.id as string)}
        currentTermId={currentTerm?.id || (terms[0]?.id as string)}
      />
    </div>
  );
}
