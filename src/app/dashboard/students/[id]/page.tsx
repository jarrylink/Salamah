import { notFound } from "next/navigation";
import { sqlClient } from "@/db";
import { StudentFileClient } from "@/features/dashboard/components/student-file-client";

export default async function StudentFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Fetch Student Core Information
  const studentResult = await sqlClient.query(`
    SELECT
      s.id,
      s.admission_number,
      s.admission_date,
      s.status as student_status,
      p.id as person_id,
      p.first_name,
      p.middle_name,
      p.last_name,
      p.gender,
      p.date_of_birth,
      p.phone,
      p.email,
      p.address,
      p.avatar_url,
      se.id as enrollment_id,
      se.status as enrollment_status,
      se.enrollment_date,
      c.id as class_id,
      c.name as class_name,
      c.code as class_code,
      g.id as grade_id,
      g.name as grade_name,
      sec.id as section_id,
      sec.name as section_name,
      (
        SELECT p2.first_name || ' ' || p2.last_name
        FROM teacher_class_assignments tca
        JOIN teachers t ON t.id = tca.teacher_id
        JOIN staff st ON st.id = t.staff_id
        JOIN people p2 ON p2.id = st.person_id
        WHERE tca.class_id = c.id AND tca.status = 'active'
        LIMIT 1
      ) as class_teacher_name,
      (
        SELECT gp.first_name || ' ' || gp.last_name
        FROM student_guardians sg
        JOIN guardians gd ON gd.id = sg.guardian_id
        JOIN people gp ON gp.id = gd.person_id
        WHERE sg.student_id = s.id
        ORDER BY sg.is_primary DESC
        LIMIT 1
      ) as guardian_name,
      (
        SELECT gp.phone
        FROM student_guardians sg
        JOIN guardians gd ON gd.id = sg.guardian_id
        JOIN people gp ON gp.id = gd.person_id
        WHERE sg.student_id = s.id
        ORDER BY sg.is_primary DESC
        LIMIT 1
      ) as guardian_phone,
      (
        SELECT gp.email
        FROM student_guardians sg
        JOIN guardians gd ON gd.id = sg.guardian_id
        JOIN people gp ON gp.id = gd.person_id
        WHERE sg.student_id = s.id
        ORDER BY sg.is_primary DESC
        LIMIT 1
      ) as guardian_email,
      (
        SELECT sg.relationship
        FROM student_guardians sg
        WHERE sg.student_id = s.id
        ORDER BY sg.is_primary DESC
        LIMIT 1
      ) as guardian_relationship
    FROM students s
    JOIN people p ON p.id = s.person_id
    LEFT JOIN student_enrollments se ON se.student_id = s.id AND se.status = 'active'
    LEFT JOIN classes c ON c.id = se.class_id
    LEFT JOIN grades g ON g.id = c.grade_id
    LEFT JOIN grade_sections gs ON gs.grade_id = g.id
    LEFT JOIN sections sec ON sec.id = gs.section_id
    WHERE s.id = $1
    LIMIT 1
  `, [id]);

  if (!studentResult.length) {
    notFound();
  }

  const student = studentResult[0];

  // 2. Fetch File Entries (documents, text notes, URLs, activities)
  const fileEntries = await sqlClient.query(`
    SELECT *
    FROM student_file_entries
    WHERE student_id = $1
    ORDER BY created_at DESC
  `, [id]);

  // 3. Fetch Classroom Comments
  const comments = await sqlClient.query(`
    SELECT *
    FROM student_classroom_comments
    WHERE student_id = $1
    ORDER BY comment_date DESC, created_at DESC
  `, [id]);

  // 4. Attendance Summary
  const attendanceSummary = await sqlClient.query(`
    SELECT
      count(*)::int as total_days,
      count(*) FILTER (WHERE status = 'present')::int as days_present,
      count(*) FILTER (WHERE status = 'absent')::int as days_absent,
      count(*) FILTER (WHERE status = 'late')::int as days_late,
      count(*) FILTER (WHERE status = 'excused')::int as days_excused
    FROM attendance_records
    WHERE student_id = $1
  `, [id]);

  // 5. Recent Assessment Scores
  const scores = await sqlClient.query(`
    SELECT
      sc.score,
      a.name as assessment_name,
      a.maximum_score,
      s.name as subject_name,
      at.name as type_name
    FROM assessment_scores sc
    JOIN assessments a ON a.id = sc.assessment_id
    JOIN subjects s ON s.id = a.subject_id
    JOIN assessment_types at ON at.id = a.assessment_type_id
    WHERE sc.student_id = $1
    ORDER BY s.name, at.sort_order
  `, [id]);

  return (
    <div className="space-y-6 salamah-enter">
      <StudentFileClient
        student={student as any}
        fileEntries={fileEntries as any}
        comments={comments as any}
        attendanceSummary={attendanceSummary[0] as any}
        scores={scores as any}
      />
    </div>
  );
}
