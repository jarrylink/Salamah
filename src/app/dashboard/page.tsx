import { redirect } from "next/navigation";
import { sqlClient } from "@/db";
import { getSession } from "@/lib/auth/session";
import { SuperadminDashboard } from "@/features/dashboard/components/superadmin-dashboard";
import { ManagerDashboard } from "@/features/dashboard/components/manager-dashboard";
import { StaffDashboardClient } from "@/features/dashboard/components/staff-dashboard";
import { StudentDashboardClient } from "@/features/dashboard/components/student-dashboard";
import { RoleWorkspace } from "@/features/dashboard/components/role-workspace";
import { TeacherDashboard } from "@/features/dashboard/components/teacher-dashboard";
import { resolveAcademicContext } from "@/features/academic/lib/context";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  const query = await searchParams;
  const sessionId = typeof query.sessionId === "string" ? query.sessionId : undefined;
  const termId = typeof query.termId === "string" ? query.termId : undefined;

  // 1. Super Admin & School Admin
  if (session.role === "superadmin" || session.role === "admin") {
    return <SuperadminDashboard sessionId={sessionId} termId={termId} />;
  }

  // 2. Manager Workspace
  if (session.role === "manager") {
    return <ManagerDashboard userId={session.userId} />;
  }

  // 3. Staff Workspace (including teachers)
  if (session.role === "staff" || session.role === "teacher" || session.role === "academic_staff" || session.role === "non_academic_staff") {
    // Fetch staff person and metadata
    const [staffRow] = await sqlClient.query(`
      SELECT
        p.first_name, p.last_name, p.phone, p.gender,
        COALESCE(u.passport_url, p.avatar_url) as avatar_url,
        u.email, u.role, COALESCE(u.designation, u.role::text) as designation,
        s.id as staff_id, s.staff_number, s.department, s.employment_date, s.employment_type,
        mgr_p.first_name as manager_first_name, mgr_p.last_name as manager_last_name,
        mgr_u.email as manager_email
      FROM users u
      JOIN people p ON p.id = u.person_id
      LEFT JOIN staff s ON s.person_id = p.id
      LEFT JOIN manager_staff_assignments msa ON msa.staff_user_id = u.id AND msa.status = 'active'
      LEFT JOIN users mgr_u ON mgr_u.id = msa.manager_user_id
      LEFT JOIN people mgr_p ON mgr_p.id = mgr_u.person_id
      WHERE u.id = $1
    `, [session.userId]);

    const staffProfile = {
      userId: session.userId,
      firstName: staffRow?.first_name || "Staff",
      lastName: staffRow?.last_name || "Member",
      email: staffRow?.email || session.email,
      phone: staffRow?.phone || null,
      gender: staffRow?.gender || "male",
      avatarUrl: staffRow?.avatar_url || null,
      designation: staffRow?.designation || "teaching staff",
      department: staffRow?.department || "Academic Operations",
      staffNumber: staffRow?.staff_number || null,
      employmentDate: staffRow?.employment_date ? String(staffRow.employment_date) : null,
      employmentType: staffRow?.employment_type || "Full Time",
      managerName: staffRow?.manager_first_name ? `${staffRow.manager_first_name} ${staffRow.manager_last_name}` : null,
      managerEmail: staffRow?.manager_email || null,
    };

    // Fetch official school notices for Noticeboard
    const noticeRows = await sqlClient.query(`
      SELECT id, title, content, audience, publish_date, status
      FROM notices
      WHERE status = 'active' AND audience IN ('everyone', 'staff')
      ORDER BY publish_date DESC, created_at DESC
      LIMIT 25
    `);

    // Fetch user documents / dossier
    const documentRows = await sqlClient.query(`
      SELECT id, user_id, title, doc_type, file_url, file_name, file_size, category, notes, created_at
      FROM user_documents
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [session.userId]);

    // Fetch assigned classes
    const classRows = await sqlClient.query(`
      SELECT DISTINCT c.id, c.name, c.code, tca.assignment_type
      FROM teacher_class_assignments tca
      JOIN teachers t ON t.id = tca.teacher_id
      JOIN staff s ON s.id = t.staff_id
      JOIN users u ON u.person_id = s.person_id
      JOIN classes c ON c.id = tca.class_id
      WHERE u.id = $1 AND tca.status = 'active'
    `, [session.userId]);

    // For each class, fetch enrolled students
    const classesWithStudents = await Promise.all(
      classRows.map(async (cls) => {
        const students = await sqlClient.query(`
          SELECT s.id, s.admission_number, p.first_name || ' ' || p.last_name as name
          FROM student_enrollments se
          JOIN students s ON s.id = se.student_id
          JOIN people p ON p.id = s.person_id
          WHERE se.class_id = $1 AND se.status = 'active'
          ORDER BY p.last_name, p.first_name
        `, [cls.id]);
        return {
          id: cls.id,
          name: cls.name,
          code: cls.code,
          assignmentType: cls.assignment_type,
          studentCount: students.length,
          students: students.map((st) => ({
            id: String(st.id),
            admissionNumber: String(st.admission_number || ""),
            name: String(st.name || ""),
          })),
        };
      })
    );

    // Fetch assigned subjects
    const subjectRows = await sqlClient.query(`
      SELECT DISTINCT
        s.id,
        s.name,
        s.code,
        COALESCE(c.id, comb_c.id) as class_id,
        COALESCE(c.name, comb_c.name, 'All Class Streams') as class_name
      FROM teacher_subject_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      JOIN staff stf ON stf.id = t.staff_id
      JOIN users u ON u.person_id = stf.person_id
      JOIN subjects s ON s.id = tsa.subject_id
      LEFT JOIN classes c ON c.id = tsa.class_id
      LEFT JOIN subject_combination_subjects scs ON scs.subject_id = s.id AND tsa.class_id IS NULL
      LEFT JOIN class_subject_combinations csc ON csc.combination_id = scs.combination_id AND csc.status = 'active'
      LEFT JOIN classes comb_c ON comb_c.id = csc.class_id
      WHERE u.id = $1 AND tsa.status = 'active'
      ORDER BY s.name
    `, [session.userId]);

    const subjectsWithDetails = await Promise.all(
      subjectRows.map(async (s) => {
        const students = s.class_id ? await sqlClient.query(`
          SELECT s.id, s.admission_number, p.first_name || ' ' || p.last_name as name
          FROM student_enrollments se
          JOIN students s ON s.id = se.student_id
          JOIN people p ON p.id = s.person_id
          WHERE se.class_id = $1 AND se.status = 'active'
          ORDER BY p.last_name, p.first_name
        `, [s.class_id]) : [];

        const scores = s.class_id ? await sqlClient.query(`
          SELECT sc.student_id, sc.score, at.code as type_code, at.name as type_name
          FROM assessment_scores sc
          JOIN assessments a ON a.id = sc.assessment_id
          JOIN assessment_types at ON at.id = a.assessment_type_id
          WHERE a.subject_id = $1 AND a.class_id = $2
        `, [s.id, s.class_id]) : [];

        const [scheme] = await sqlClient.query(`
          SELECT weeks_data FROM subject_schemes_of_work
          WHERE subject_id = $1 AND (class_id = $2 OR class_id IS NULL)
          ORDER BY updated_at DESC LIMIT 1
        `, [s.id, s.class_id || null]);

        const lessonNotes = await sqlClient.query(`
          SELECT * FROM subject_lesson_notes
          WHERE subject_id = $1 AND (class_id = $2 OR class_id IS NULL)
          ORDER BY week_number ASC
        `, [s.id, s.class_id || null]);

        const lessonPlans = await sqlClient.query(`
          SELECT * FROM subject_lesson_plans
          WHERE subject_id = $1 AND (class_id = $2 OR class_id IS NULL)
          ORDER BY week_number ASC
        `, [s.id, s.class_id || null]);

        return {
          id: String(s.id),
          name: String(s.name),
          code: String(s.code),
          classId: String(s.class_id || ""),
          className: String(s.class_name || "General Subject"),
          students: students.map((st) => ({
            id: String(st.id),
            admissionNumber: String(st.admission_number || ""),
            name: String(st.name || ""),
          })),
          scores: scores.map((sc) => ({
            studentId: String(sc.student_id),
            score: Number(sc.score),
            typeCode: String(sc.type_code),
            typeName: String(sc.type_name),
          })),
          schemeWeeks: (scheme?.weeks_data as any[]) || [],
          lessonNotes: lessonNotes.map((ln) => ({
            id: String(ln.id),
            weekNumber: Number(ln.week_number),
            topic: String(ln.topic),
            subtopics: ln.subtopics ? String(ln.subtopics) : null,
            content: String(ln.content),
            learningMaterials: ln.learning_materials ? String(ln.learning_materials) : null,
            homework: ln.homework ? String(ln.homework) : null,
            status: String(ln.status),
          })),
          lessonPlans: lessonPlans.map((lp) => ({
            id: String(lp.id),
            weekNumber: Number(lp.week_number),
            topic: String(lp.topic),
            durationMinutes: Number(lp.duration_minutes || 40),
            behavioralObjectives: lp.behavioral_objectives ? String(lp.behavioral_objectives) : null,
            instructionalMaterials: lp.instructional_materials ? String(lp.instructional_materials) : null,
            previousKnowledge: lp.previous_knowledge ? String(lp.previous_knowledge) : null,
            steps: (lp.steps as any[]) || [],
            evaluation: lp.evaluation ? String(lp.evaluation) : null,
            conclusion: lp.conclusion ? String(lp.conclusion) : null,
            status: String(lp.status),
          })),
        };
      })
    );

    // Fetch assigned offices & logs
    const officeRows = await sqlClient.query(`
      SELECT o.id, o.name, o.code, o.location, o.responsibilities
      FROM offices o
      WHERE o.assigned_user_id = $1 AND o.status = 'active'
      ORDER BY o.name
    `, [session.userId]);

    const officesWithLogs = await Promise.all(
      officeRows.map(async (off) => {
        const logs = await sqlClient.query(`
          SELECT id, log_date, week_summary, daily_tasks_carried_out, challenges, next_week_plan
          FROM office_logs
          WHERE office_id = $1
          ORDER BY log_date DESC LIMIT 5
        `, [off.id]);
        return {
          id: off.id,
          name: off.name,
          code: off.code,
          location: off.location,
          responsibilities: off.responsibilities,
          logs: logs.map((l) => ({
            id: l.id,
            logDate: String(l.log_date),
            weekSummary: l.week_summary,
            dailyTasksCarriedOut: l.daily_tasks_carried_out,
            challenges: l.challenges,
            nextWeekPlan: l.next_week_plan,
          })),
        };
      })
    );

    // Fetch assigned tasks & logs
    const taskRows = await sqlClient.query(`
      SELECT t.id, t.title, t.category, t.description, t.responsibility_document, t.frequency, t.status
      FROM school_tasks t
      WHERE t.assigned_user_id = $1 AND t.status = 'active'
      ORDER BY t.title
    `, [session.userId]);

    const tasksWithLogs = await Promise.all(
      taskRows.map(async (tsk) => {
        const logs = await sqlClient.query(`
          SELECT id, log_date, report, status
          FROM school_task_logs
          WHERE task_id = $1
          ORDER BY log_date DESC LIMIT 5
        `, [tsk.id]);
        return {
          id: tsk.id,
          title: tsk.title,
          category: tsk.category,
          description: tsk.description,
          responsibilityDocument: tsk.responsibility_document,
          frequency: tsk.frequency,
          status: tsk.status,
          logs: logs.map((l) => ({
            id: l.id,
            logDate: String(l.log_date),
            report: l.report,
            status: l.status,
          })),
        };
      })
    );

    return (
      <StaffDashboardClient
        staff={staffProfile}
        classes={classesWithStudents}
        subjects={subjectsWithDetails as any}
        offices={officesWithLogs}
        tasks={tasksWithLogs}
        notices={noticeRows.map((n) => ({
          id: String(n.id),
          title: String(n.title),
          content: String(n.content),
          publishDate: String(n.publish_date),
          status: String(n.status),
        }))}
        documents={documentRows.map((d) => ({
          id: String(d.id),
          title: String(d.title),
          docType: String(d.doc_type),
          fileUrl: String(d.file_url),
          fileName: d.file_name ? String(d.file_name) : null,
          fileSize: d.file_size ? String(d.file_size) : null,
          category: d.category ? String(d.category) : null,
          notes: d.notes ? String(d.notes) : null,
          createdAt: String(d.created_at),
        }))}
      />
    );
  }

  // 4. Student Workspace
  if (session.role === "student") {
    const context = await resolveAcademicContext();
    const [studentRow] = await sqlClient.query(`
      SELECT
        s.id as student_id,
        s.admission_number,
        p.first_name,
        p.last_name,
        c.id as class_id,
        c.name as class_name,
        ses.id as session_id,
        ses.name as session_name
      FROM users u
      JOIN people p ON p.id = u.person_id
      JOIN students s ON s.person_id = p.id
      LEFT JOIN student_enrollments se ON se.student_id = s.id AND se.status = 'active'
      LEFT JOIN classes c ON c.id = se.class_id
      LEFT JOIN academic_sessions ses ON ses.id = se.session_id
      WHERE u.id = $1
      LIMIT 1
    `, [session.userId]);

    const studentInfo = {
      id: studentRow?.student_id || session.userId,
      firstName: studentRow?.first_name || "Student",
      lastName: studentRow?.last_name || "",
      admissionNumber: studentRow?.admission_number || "SAL-2026-000",
      className: studentRow?.class_name || "JSS 1",
      sessionName: studentRow?.session_name || (context?.sessionName || "2026/2027"),
    };

    const targetSessionId = studentRow?.session_id || context?.sessionId;

    // Fetch terms for this session
    const terms = targetSessionId
      ? await sqlClient.query(`
        SELECT id, term_number, name
        FROM academic_terms
        WHERE session_id = $1
        ORDER BY term_number
      `, [targetSessionId])
      : [];

    // For each term, fetch subjects and assessment scores
    const resultsByTerm = await Promise.all(
      terms.map(async (term) => {
        const scores = await sqlClient.query(`
          SELECT
            sub.name as subject_name,
            at.code as assessment_type_code,
            sc.score
          FROM assessments a
          JOIN assessment_types at ON at.id = a.assessment_type_id
          JOIN subjects sub ON sub.id = a.subject_id
          LEFT JOIN assessment_scores sc ON sc.assessment_id = a.id AND sc.student_id = $1
          WHERE a.term_id = $2
          ORDER BY sub.name
        `, [studentInfo.id, term.id]);

        // Group scores by subject (3 CAs + Exam)
        const subjectMap: Record<string, { ca1: number | null; ca2: number | null; ca3: number | null; exam: number | null }> = {};
        for (const row of scores) {
          if (!subjectMap[row.subject_name]) {
            subjectMap[row.subject_name] = { ca1: null, ca2: null, ca3: null, exam: null };
          }
          if (row.assessment_type_code === "CA1") subjectMap[row.subject_name].ca1 = row.score;
          else if (row.assessment_type_code === "CA2") subjectMap[row.subject_name].ca2 = row.score;
          else if (row.assessment_type_code === "CA3") subjectMap[row.subject_name].ca3 = row.score;
          else if (row.assessment_type_code === "EXAM") subjectMap[row.subject_name].exam = row.score;
        }

        const subjects = Object.entries(subjectMap).map(([subjectName, scoreData]) => {
          const total = (scoreData.ca1 || 0) + (scoreData.ca2 || 0) + (scoreData.ca3 || 0) + (scoreData.exam || 0);
          let grade = "F";
          let remark = "Fail";
          if (total >= 75) { grade = "A"; remark = "Distinction"; }
          else if (total >= 65) { grade = "B"; remark = "Very Good"; }
          else if (total >= 50) { grade = "C"; remark = "Credit"; }
          else if (total >= 40) { grade = "D"; remark = "Pass"; }

          return {
            subjectName,
            ca1: scoreData.ca1,
            ca2: scoreData.ca2,
            ca3: scoreData.ca3,
            exam: scoreData.exam,
            total,
            grade,
            remark,
          };
        });

        const totalScores = subjects.reduce((acc, s) => acc + s.total, 0);
        const termAverage = subjects.length ? totalScores / subjects.length : 0;

        return {
          termNumber: term.term_number,
          termName: term.name,
          subjects,
          termAverage,
        };
      })
    );

    // Fetch E-Learning resources
    const elearningRows = await sqlClient.query(`
      SELECT
        r.id, r.title, r.description, r.resource_type, r.content, r.file_name, r.created_at,
        COALESCE(s.name, 'General Studies') as subject_name
      FROM elearning_resources r
      LEFT JOIN subjects s ON s.id = r.subject_id
      WHERE r.status = 'active'
      ORDER BY r.created_at DESC
    `);

    const elearningResources = elearningRows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      subjectName: r.subject_name,
      resourceType: r.resource_type as "text" | "file" | "url",
      content: r.content,
      fileName: r.file_name,
      createdAt: String(r.created_at),
    }));

    return (
      <StudentDashboardClient
        student={studentInfo}
        resultsByTerm={resultsByTerm}
        elearningResources={elearningResources}
      />
    );
  }

  // Fallback for guardians / others
  return <RoleWorkspace role={session.role as Exclude<typeof session.role, "superadmin">} userId={session.userId} />;
}
