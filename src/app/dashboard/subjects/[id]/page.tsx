import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { sqlClient } from "@/db";
import { getSession } from "@/lib/auth/session";
import { SubjectTeachingCockpit } from "@/features/dashboard/components/subject-teaching-cockpit";
import { resolveAcademicContext } from "@/features/academic/lib/context";

export default async function SubjectCockpitPage({
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
  const initialTab = (typeof query.tab === "string" && ["scheme", "notes", "plans", "scores"].includes(query.tab))
    ? (query.tab as "scheme" | "notes" | "plans" | "scores")
    : "scheme";

  // 1. Fetch Subject Information
  const subjectResult = await sqlClient.query(`
    SELECT id, name, code, short_name, description, status
    FROM subjects
    WHERE id = $1
    LIMIT 1
  `, [id]);

  if (!subjectResult.length) {
    notFound();
  }

  const subjectData = subjectResult[0] as {
    id: string;
    name: string;
    code: string;
    short_name: string | null;
    description: string | null;
    status: string;
  };

  // Authorization Check: Non-admins must be assigned as an active teacher for this subject
  let teacherAssignments: { id: string; class_id: string | null }[] = [];
  if (!isAdmin) {
    teacherAssignments = (await sqlClient.query(`
      SELECT tsa.id, tsa.class_id
      FROM teacher_subject_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      JOIN staff stf ON stf.id = t.staff_id
      JOIN users u ON u.person_id = stf.person_id
      WHERE u.id = $1 AND tsa.subject_id = $2 AND tsa.status = 'active'
    `, [session.userId, id])) as { id: string; class_id: string | null }[];

    if (teacherAssignments.length === 0) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center salamah-enter">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#092233] p-6 sm:p-8 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-4">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
              Instructional Cockpit Restricted
            </span>
            <h2 className="mt-3 font-serif text-2xl font-bold text-white">
              Access Restricted
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              You are not assigned as the instructor for <strong className="text-white">{subjectData.name} ({subjectData.code})</strong>. Instructional cockpits are restricted strictly to assigned teachers and school administration.
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

  // 2. Resolve Global Academic Context
  const academicContext = await resolveAcademicContext({
    sessionId: typeof query.sessionId === "string" && query.sessionId.trim() ? query.sessionId : undefined,
    termId: typeof query.termId === "string" && query.termId.trim() ? query.termId : undefined,
  });

  let currentSession: { id: string; name: string } | null = null;
  let currentTerm: { id: string; name: string; term_number?: number } | null = null;

  if (academicContext?.sessionId) {
    const sessionRes = await sqlClient.query(
      "SELECT id, name FROM academic_sessions WHERE id = $1 LIMIT 1",
      [academicContext.sessionId]
    ) as { id: string; name: string }[];
    if (sessionRes[0]) currentSession = sessionRes[0];
  }

  if (!currentSession) {
    const [defSession] = await sqlClient.query(
      "SELECT id, name FROM academic_sessions WHERE is_current = true LIMIT 1"
    ) as { id: string; name: string }[];
    currentSession = defSession || null;
  }

  if (academicContext?.termId && currentSession?.id) {
    const termRes = await sqlClient.query(
      "SELECT id, name, term_number FROM academic_terms WHERE id = $1 AND session_id = $2 LIMIT 1",
      [academicContext.termId, currentSession.id]
    ) as { id: string; name: string; term_number: number }[];
    if (termRes[0]) currentTerm = termRes[0];
  }

  if (!currentTerm && currentSession?.id) {
    const [defTerm] = await sqlClient.query(
      "SELECT id, name, term_number FROM academic_terms WHERE session_id = $1 AND is_current = true LIMIT 1",
      [currentSession.id]
    ) as { id: string; name: string; term_number: number }[];
    currentTerm = defTerm || null;
  }

  if (!currentTerm && currentSession?.id) {
    const [firstTerm] = await sqlClient.query(
      "SELECT id, name, term_number FROM academic_terms WHERE session_id = $1 ORDER BY term_number ASC LIMIT 1",
      [currentSession.id]
    ) as { id: string; name: string; term_number: number }[];
    currentTerm = firstTerm || null;
  }

  const finalSession = currentSession || { id: "", name: "2026/2027" };
  const finalTerm = currentTerm || { id: "", name: "First Term" };

  // 3. Find ONLY Classes taking this specific subject via attached Subject Combinations
  const classes = (await sqlClient.query(`
    SELECT DISTINCT
      c.id,
      c.name,
      c.code,
      g.name as grade_name,
      g.sort_order,
      (SELECT count(*)::int FROM student_enrollments se WHERE se.class_id = c.id AND se.status = 'active') as student_count
    FROM classes c
    JOIN grades g ON g.id = c.grade_id
    WHERE c.id IN (
      SELECT csc.class_id 
      FROM class_subject_combinations csc 
      JOIN subject_combination_subjects scs ON scs.combination_id = csc.combination_id
      WHERE scs.subject_id = $1 AND csc.status = 'active'
    )
    ORDER BY g.sort_order, c.name
  `, [id])) as { id: string; name: string; code: string; grade_name: string; student_count: number }[];

  // If teacher is assigned only to specific class stream(s), restrict available classes accordingly
  const assignedClassIds = new Set(teacherAssignments.map((a) => a.class_id).filter(Boolean) as string[]);
  const relevantClasses = (!isAdmin && assignedClassIds.size > 0)
    ? classes.filter((c) => assignedClassIds.has(c.id))
    : classes;

  // Determine selected class
  const selectedClassId =
    (typeof query.classId === "string" ? query.classId : null) ||
    relevantClasses[0]?.id ||
    "";
  const selectedClass = relevantClasses.find((c) => c.id === selectedClassId) || relevantClasses[0] || null;

  // 3b. Fetch Subject Teachers & All Teachers for flexible assignment
  const subjectTeachers = (await sqlClient.query(`
    SELECT
      tsa.id,
      t.id as teacher_id,
      p.first_name || ' ' || p.last_name as name,
      s.staff_number,
      tsa.class_id
    FROM teacher_subject_assignments tsa
    JOIN teachers t ON t.id = tsa.teacher_id
    JOIN staff s ON s.id = t.staff_id
    JOIN people p ON p.id = s.person_id
    WHERE tsa.subject_id = $1 AND tsa.status = 'active'
  `, [id])) as { id: string; teacher_id: string; name: string; staff_number: string | null; class_id: string | null }[];

  const allTeachers = (await sqlClient.query(`
    SELECT t.id, p.first_name || ' ' || p.last_name as name, s.staff_number, u.email
    FROM teachers t
    JOIN staff s ON s.id = t.staff_id
    JOIN people p ON p.id = s.person_id
    JOIN users u ON u.person_id = p.id
    WHERE t.status = 'active'
    ORDER BY p.first_name, p.last_name
  `)) as { id: string; name: string; staff_number: string | null; email?: string }[];

  const currentAssignedTeacher =
    (selectedClass ? subjectTeachers.find((st) => st.class_id === selectedClass.id) : null) ||
    subjectTeachers[0] ||
    null;

  // 4. Fetch Enrolled Students for the Selected Class (Strictly real DB data, no hardcoding)
  const students = (selectedClass?.id
    ? await sqlClient.query(`
        SELECT
          s.id,
          s.admission_number as "admissionNumber",
          p.first_name || ' ' || p.last_name as name,
          p.avatar_url as "avatarUrl",
          p.gender
        FROM student_enrollments se
        JOIN students s ON s.id = se.student_id
        JOIN people p ON p.id = s.person_id
        WHERE se.class_id = $1 AND se.status = 'active'
        ORDER BY p.last_name, p.first_name
      `, [selectedClass.id])
    : []) as { id: string; admissionNumber: string; name: string }[];

  // 5. Fetch Assessment Scores for Subject and Selected Class in current session and term
  let scores: {
    studentId: string;
    score: number;
    typeCode: string;
    typeName: string;
  }[] = [];

  if (selectedClass?.id) {
    let scoresQuery = `
      SELECT
        sc.student_id as "studentId",
        sc.score,
        at.code as "typeCode",
        at.name as "typeName"
      FROM assessment_scores sc
      JOIN assessments a ON a.id = sc.assessment_id
      JOIN assessment_types at ON at.id = a.assessment_type_id
      WHERE a.subject_id = $1 AND a.class_id = $2
    `;
    const scoreParams: any[] = [id, selectedClass.id];

    if (finalSession.id) {
      scoreParams.push(finalSession.id);
      scoresQuery += ` AND a.session_id = $${scoreParams.length}`;
    }
    if (finalTerm.id) {
      scoreParams.push(finalTerm.id);
      scoresQuery += ` AND a.term_id = $${scoreParams.length}`;
    }

    scores = (await sqlClient.query(scoresQuery, scoreParams)) as {
      studentId: string;
      score: number;
      typeCode: string;
      typeName: string;
    }[];
  }

  // 6. Fetch Scheme of Work (12 Weeks)
  const schemeResult = (selectedClass?.id
    ? await sqlClient.query(`
        SELECT weeks_data
        FROM subject_schemes_of_work
        WHERE subject_id = $1 AND (class_id = $2 OR class_id IS NULL)
        ORDER BY updated_at DESC
        LIMIT 1
      `, [id, selectedClass.id])
    : await sqlClient.query(`
        SELECT weeks_data
        FROM subject_schemes_of_work
        WHERE subject_id = $1 AND class_id IS NULL
        ORDER BY updated_at DESC
        LIMIT 1
      `, [id])) as { weeks_data: any[] }[];

  const schemeWeeks = schemeResult[0]?.weeks_data || [];

  // 7. Fetch Lesson Notes
  const lessonNotes = (selectedClass?.id
    ? await sqlClient.query(`
        SELECT
          week_number as "weekNumber",
          topic,
          content,
          learning_materials as "learningMaterials",
          homework
        FROM subject_lesson_notes
        WHERE subject_id = $1 AND (class_id = $2 OR class_id IS NULL)
        ORDER BY week_number ASC
      `, [id, selectedClass.id])
    : await sqlClient.query(`
        SELECT
          week_number as "weekNumber",
          topic,
          content,
          learning_materials as "learningMaterials",
          homework
        FROM subject_lesson_notes
        WHERE subject_id = $1 AND class_id IS NULL
        ORDER BY week_number ASC
      `, [id])) as any[];

  // 8. Fetch Lesson Plans
  const lessonPlans = (selectedClass?.id
    ? await sqlClient.query(`
        SELECT
          week_number as "weekNumber",
          topic,
          duration_minutes as "durationMinutes",
          behavioral_objectives as "behavioralObjectives",
          instructional_materials as "instructionalMaterials",
          previous_knowledge as "previousKnowledge",
          evaluation,
          conclusion
        FROM subject_lesson_plans
        WHERE subject_id = $1 AND (class_id = $2 OR class_id IS NULL)
        ORDER BY week_number ASC
      `, [id, selectedClass.id])
    : await sqlClient.query(`
        SELECT
          week_number as "weekNumber",
          topic,
          duration_minutes as "durationMinutes",
          behavioral_objectives as "behavioralObjectives",
          instructional_materials as "instructionalMaterials",
          previous_knowledge as "previousKnowledge",
          evaluation,
          conclusion
        FROM subject_lesson_plans
        WHERE subject_id = $1 AND class_id IS NULL
        ORDER BY week_number ASC
      `, [id])) as any[];

  const cockpit = (
    <SubjectTeachingCockpit
      subject={{
        id: subjectData.id,
        name: subjectData.name,
        code: subjectData.code,
        classId: selectedClass?.id || "",
        className: selectedClass ? `${selectedClass.grade_name ? `${selectedClass.grade_name} ` : ""}${selectedClass.name}` : "No Class Attached",
        students,
        scores,
        schemeWeeks,
        lessonNotes,
        lessonPlans,
      }}
      assignedTeacher={currentAssignedTeacher ? {
        id: currentAssignedTeacher.teacher_id,
        name: currentAssignedTeacher.name,
        staffNumber: currentAssignedTeacher.staff_number,
      } : null}
      teachers={allTeachers}
      availableClasses={relevantClasses.map((c) => ({
        id: c.id,
        name: `${c.grade_name ? `${c.grade_name} ` : ""}${c.name}`,
        code: c.code,
        studentCount: c.student_count,
      }))}
      currentSession={finalSession}
      currentTerm={finalTerm}
      initialTab={initialTab}
      isSuperAdmin={isAdmin}
    />
  );

  if (isAdmin) {
    return cockpit;
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
            <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30">
              {subjectData.name} ({subjectData.code})
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {cockpit}
      </main>
    </div>
  );
}
