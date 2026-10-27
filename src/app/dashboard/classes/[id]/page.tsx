import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { sqlClient } from "@/db";
import { getSession } from "@/lib/auth/session";
import { ClassroomManagementClient } from "@/features/dashboard/components/classroom-management-client";
import { resolveAcademicContext } from "@/features/academic/lib/context";

export default async function ClassCockpitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "superadmin" || session.role === "admin";
  const { id } = await params;
  const query = await searchParams;
  const initialTab = typeof query.tab === "string" ? query.tab : "roster";

  // 1. Fetch Class Core Information
  const classResult = await sqlClient.query(`
    SELECT
      c.id,
      c.name,
      c.code,
      c.status,
      g.id as grade_id,
      g.name as grade_name,
      sec.id as section_id,
      sec.name as section_name,
      (
        SELECT sc.name
        FROM class_subject_combinations csc
        JOIN subject_combinations sc ON sc.id = csc.combination_id
        WHERE csc.class_id = c.id
        LIMIT 1
      ) as assigned_combination,
      (
        SELECT sc.id
        FROM class_subject_combinations csc
        JOIN subject_combinations sc ON sc.id = csc.combination_id
        WHERE csc.class_id = c.id
        LIMIT 1
      ) as assigned_combination_id,
      (
        SELECT p.first_name || ' ' || p.last_name
        FROM teacher_class_assignments tca
        JOIN teachers t ON t.id = tca.teacher_id
        JOIN staff s ON s.id = t.staff_id
        JOIN people p ON p.id = s.person_id
        WHERE tca.class_id = c.id AND tca.status = 'active'
        LIMIT 1
      ) as class_teacher_name,
      (
        SELECT s.staff_number
        FROM teacher_class_assignments tca
        JOIN teachers t ON t.id = tca.teacher_id
        JOIN staff s ON s.id = t.staff_id
        WHERE tca.class_id = c.id AND tca.status = 'active'
        LIMIT 1
      ) as class_teacher_number
    FROM classes c
    JOIN grades g ON g.id = c.grade_id
    LEFT JOIN grade_sections gs ON gs.grade_id = g.id
    LEFT JOIN sections sec ON sec.id = gs.section_id
    WHERE c.id = $1
    LIMIT 1
  `, [id]);

  if (!classResult.length) {
    notFound();
  }

  const classItem = classResult[0];

  // Authorization Check: Non-admins must be assigned as class teacher or subject teacher in this class
  if (!isAdmin) {
    const classAssignment = await sqlClient.query(`
      SELECT 1 FROM teacher_class_assignments tca
      JOIN teachers t ON t.id = tca.teacher_id
      JOIN staff s ON s.id = t.staff_id
      JOIN people p ON p.id = s.person_id
      JOIN users u ON u.person_id = p.id
      WHERE u.id = $1 AND tca.class_id = $2 AND tca.status = 'active'
      UNION
      SELECT 1 FROM teacher_subject_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      JOIN staff s ON s.id = t.staff_id
      JOIN people p ON p.id = s.person_id
      JOIN users u ON u.person_id = p.id
      WHERE u.id = $1 AND tsa.class_id = $2 AND tsa.status = 'active'
      LIMIT 1
    `, [session.userId, id]);

    if (classAssignment.length === 0) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center salamah-enter">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#092233] p-6 sm:p-8 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-4">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
              Classroom Cockpit Restricted
            </span>
            <h2 className="mt-3 font-serif text-2xl font-bold text-white">
              Access Restricted
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              You are not assigned to manage <strong className="text-white">{classItem.name}</strong> as a Form Master or Subject Teacher. Classroom cockpits are reserved for assigned pastoral leads and school administrators.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#dfba73] px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to My Staff Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // 2. Fetch Class Subjects strictly from assigned Subject Combinations
  const subjects = await sqlClient.query(`
    SELECT DISTINCT s.id, s.name, s.code, s.short_name
    FROM class_subject_combinations csc
    JOIN subject_combination_subjects scs ON scs.combination_id = csc.combination_id
    JOIN subjects s ON s.id = scs.subject_id
    WHERE csc.class_id = $1 AND csc.status = 'active'
    ORDER BY s.name
  `, [id]);

  // 3. Fetch Class Enrolled Students
  const enrolledStudents = await sqlClient.query(`
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
      p.avatar_url,
      se.id as enrollment_id,
      se.enrollment_date,
      se.status as enrollment_status,
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
      ) as guardian_phone
    FROM student_enrollments se
    JOIN students s ON s.id = se.student_id
    JOIN people p ON p.id = s.person_id
    WHERE se.class_id = $1 AND se.status = 'active'
    ORDER BY p.last_name, p.first_name
  `, [id]);

  // 4. Fetch Other Students available to add to class
  const availableStudents = await sqlClient.query(`
    SELECT
      s.id,
      s.admission_number,
      p.first_name,
      p.last_name,
      c.name as current_class_name
    FROM students s
    JOIN people p ON p.id = s.person_id
    LEFT JOIN student_enrollments se ON se.student_id = s.id AND se.status = 'active'
    LEFT JOIN classes c ON c.id = se.class_id
    WHERE se.class_id IS NULL OR se.class_id != $1
    ORDER BY p.last_name, p.first_name
  `, [id]);

  // 5. Fetch Attendance Records for this class
  const attendanceRecords = await sqlClient.query(`
    SELECT
      ar.student_id,
      ar.attendance_date,
      ar.status,
      ar.note
    FROM attendance_records ar
    WHERE ar.class_id = $1
    ORDER BY ar.attendance_date DESC
  `, [id]);

  // 6. Session & Term Info synchronized with Global Academic Context
  const academicContext = await resolveAcademicContext({
    sessionId: typeof query.sessionId === "string" && query.sessionId.trim() ? query.sessionId : undefined,
    termId: typeof query.termId === "string" && query.termId.trim() ? query.termId : undefined,
  });

  let currentSession: { id: string; name: string; is_current?: boolean } | null = null;
  let currentTerm: { id: string; name: string; term_number: number; is_current?: boolean } | null = null;

  if (academicContext?.sessionId) {
    const sessionRes = await sqlClient.query(
      "SELECT id, name, is_current FROM academic_sessions WHERE id = $1 LIMIT 1",
      [academicContext.sessionId]
    ) as { id: string; name: string; is_current?: boolean }[];
    currentSession = sessionRes[0] || null;
  }

  if (!currentSession) {
    const [defSession] = await sqlClient.query(
      "SELECT id, name, is_current FROM academic_sessions WHERE is_current = true LIMIT 1"
    ) as { id: string; name: string; is_current?: boolean }[];
    currentSession = defSession || null;
  }

  if (academicContext?.termId && currentSession) {
    const termRes = await sqlClient.query(
      "SELECT id, name, term_number, is_current FROM academic_terms WHERE id = $1 AND session_id = $2 LIMIT 1",
      [academicContext.termId, currentSession.id]
    ) as { id: string; name: string; term_number: number; is_current?: boolean }[];
    currentTerm = termRes[0] || null;
  }

  if (!currentTerm && currentSession) {
    const [defTerm] = await sqlClient.query(
      "SELECT id, name, term_number, is_current FROM academic_terms WHERE session_id = $1 AND is_current = true LIMIT 1",
      [currentSession.id]
    ) as { id: string; name: string; term_number: number; is_current?: boolean }[];
    currentTerm = defTerm || null;
  }

  if (!currentTerm && currentSession) {
    const [firstTerm] = await sqlClient.query(
      "SELECT id, name, term_number, is_current FROM academic_terms WHERE session_id = $1 ORDER BY term_number ASC LIMIT 1",
      [currentSession.id]
    ) as { id: string; name: string; term_number: number; is_current?: boolean }[];
    currentTerm = firstTerm || null;
  }

  // 7. Fetch Assessment Scores for this class filtered by session and term
  let scoreQuery = `
    SELECT
      sc.student_id,
      sc.score,
      a.id as assessment_id,
      a.subject_id,
      s.name as subject_name,
      at.name as type_name,
      at.code as type_code,
      a.maximum_score
    FROM assessment_scores sc
    JOIN assessments a ON a.id = sc.assessment_id
    JOIN subjects s ON s.id = a.subject_id
    JOIN assessment_types at ON at.id = a.assessment_type_id
    WHERE a.class_id = $1
  `;
  const scoreQueryParams: any[] = [id];
  if (currentSession?.id) {
    scoreQueryParams.push(currentSession.id);
    scoreQuery += ` AND a.session_id = $${scoreQueryParams.length}`;
  }
  if (currentTerm?.id) {
    scoreQueryParams.push(currentTerm.id);
    scoreQuery += ` AND a.term_id = $${scoreQueryParams.length}`;
  }
  const assessmentScores = await sqlClient.query(scoreQuery, scoreQueryParams);

  // 8. Fetch Classroom Comments
  const comments = await sqlClient.query(`
    SELECT
      c.*,
      p.first_name || ' ' || p.last_name as student_name,
      s.admission_number
    FROM student_classroom_comments c
    JOIN students s ON s.id = c.student_id
    JOIN people p ON p.id = s.person_id
    WHERE c.class_id = $1
    ORDER BY c.comment_date DESC, c.created_at DESC
  `, [id]);

  // 9. Fetch Terminal Reports (Affective, Psychomotor, Teacher Remark, Principal Commendation)
  let terminalQuery = `
    SELECT *
    FROM student_terminal_reports
    WHERE class_id = $1
  `;
  const termReportParams: any[] = [id];
  if (currentSession?.id) {
    termReportParams.push(currentSession.id);
    terminalQuery += ` AND session_id = $${termReportParams.length}`;
  }
  if (currentTerm?.id) {
    termReportParams.push(currentTerm.id);
    terminalQuery += ` AND term_id = $${termReportParams.length}`;
  }
  const terminalReports = await sqlClient.query(terminalQuery, termReportParams);

  // 9. All Classes for classroom selector
  const allClasses = await sqlClient.query(`
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

  // 10. Check Quick Enrollment Setting
  const [quickEnrollSetting] = await sqlClient.query(`
    SELECT setting_value FROM system_settings WHERE setting_key = 'quick_enrollment_enabled' LIMIT 1
  `) as { setting_value: { enabled?: boolean } }[];
  const quickEnrollmentEnabled = quickEnrollSetting?.setting_value?.enabled ?? true;

  // 11. Fetch All Sessions, Terms & Section Heads in chronological order
  const allSessions = await sqlClient.query("SELECT id, name, is_current FROM academic_sessions ORDER BY name ASC");
  const allTerms = await sqlClient.query("SELECT id, session_id, name, term_number, is_current FROM academic_terms ORDER BY term_number ASC");
  const sectionHeads = await sqlClient.query("SELECT * FROM school_section_heads");

  const classroomNode = (
    <ClassroomManagementClient
      classItem={classItem as any}
      subjects={subjects as any}
      enrolledStudents={enrolledStudents as any}
      availableStudents={availableStudents as any}
      allClasses={allClasses as any}
      attendanceRecords={attendanceRecords as any}
      assessmentScores={assessmentScores as any}
      comments={comments as any}
      terminalReports={terminalReports as any}
      currentSession={currentSession || { id: "default", name: "2026/2027" }}
      currentTerm={currentTerm || { id: "default", name: "First Term", term_number: 1 }}
      allSessions={allSessions as any}
      allTerms={allTerms as any}
      sectionHeads={sectionHeads as any}
      initialTab={initialTab}
      quickEnrollmentEnabled={quickEnrollmentEnabled}
      isSuperAdmin={isAdmin}
    />
  );

  if (isAdmin) {
    return <div className="space-y-6 salamah-enter">{classroomNode}</div>;
  }

  return (
    <div className="min-h-screen bg-[#061824] text-slate-100 antialiased selection:bg-teal-500/30">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#04141e]/95 px-4 sm:px-6 lg:px-8 py-3.5 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-[#dfba73] transition cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Staff Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-500/20 px-2.5 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30">
              {classItem.name} ({classItem.grade_name})
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {classroomNode}
      </main>
    </div>
  );
}
