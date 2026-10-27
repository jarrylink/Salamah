import { sqlClient } from "@/db";
import { StudentsDirectoryClient } from "@/features/dashboard/components/students-directory-client";

export const metadata = {
  title: "Students Registry | Salamah International School",
  description: "Incoming applicants and active enrolled students directory",
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  let initialTab = typeof query.tab === "string" ? query.tab : "active";
  if (initialTab === "incoming") initialTab = "pending";

  // 1. Fetch Active Enrolled Students (Superadmin official register)
  const activeStudents = await sqlClient.query(`
    SELECT DISTINCT ON (s.id)
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
      se.context as enrollment_context,
      c.id as class_id,
      c.name as class_name,
      c.code as class_code,
      g.id as grade_id,
      g.name as grade_name,
      sec.id as section_id,
      sec.name as section_name,
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
        SELECT count(*)::int
        FROM student_file_entries sfe
        WHERE sfe.student_id = s.id
      ) as dossier_entries_count
    FROM students s
    JOIN people p ON p.id = s.person_id
    LEFT JOIN student_enrollments se ON se.student_id = s.id AND se.status = 'active'
    LEFT JOIN classes c ON c.id = se.class_id
    LEFT JOIN grades g ON g.id = c.grade_id
    LEFT JOIN grade_sections gs ON gs.grade_id = g.id
    LEFT JOIN sections sec ON sec.id = gs.section_id
    WHERE s.status = 'active' AND (se.context IS NULL OR se.context != 'teacher_quick')
    ORDER BY s.id, p.last_name, p.first_name
  `);

  // 2. Fetch Quick Enrolled Students (Teacher classroom quick intake)
  const quickStudents = await sqlClient.query(`
    SELECT DISTINCT ON (s.id)
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
      se.context as enrollment_context,
      c.id as class_id,
      c.name as class_name,
      c.code as class_code,
      g.id as grade_id,
      g.name as grade_name,
      sec.id as section_id,
      sec.name as section_name,
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
        SELECT count(*)::int
        FROM student_file_entries sfe
        WHERE sfe.student_id = s.id
      ) as dossier_entries_count
    FROM students s
    JOIN people p ON p.id = s.person_id
    JOIN student_enrollments se ON se.student_id = s.id AND se.status = 'active'
    LEFT JOIN classes c ON c.id = se.class_id
    LEFT JOIN grades g ON g.id = c.grade_id
    LEFT JOIN grade_sections gs ON gs.grade_id = g.id
    LEFT JOIN sections sec ON sec.id = gs.section_id
    WHERE s.status = 'active' AND se.context = 'teacher_quick'
    ORDER BY s.id, p.last_name, p.first_name
  `);

  // 3. Fetch Pending Students from application_children
  const pendingStudents = await sqlClient.query(`
    SELECT
      ac.id,
      ac.first_name,
      ac.middle_name,
      ac.last_name,
      ac.gender,
      ac.date_of_birth,
      ac.intended_class,
      ac.previous_school,
      ac.medical_info,
      COALESCE(ac.avatar_url, ac.passport_url) as avatar_url,
      COALESCE(ac.passport_url, ac.avatar_url) as passport_url,
      ac.status,
      ac.created_at,
      aa.id as application_id,
      aa.application_number,
      aa.guardian_name,
      aa.guardian_email,
      aa.guardian_phone,
      aa.guardian_address,
      aa.payment_status
    FROM application_children ac
    JOIN admission_applications aa ON aa.id = ac.application_id
    WHERE ac.status != 'enrolled'
    ORDER BY ac.created_at DESC
  `);

  // 4. Classes and Sections
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

  const sections = await sqlClient.query(`
    SELECT id, name, code FROM sections ORDER BY sort_order
  `);

  const sessions = await sqlClient.query(`
    SELECT id, name, is_current FROM academic_sessions ORDER BY is_current DESC, start_date DESC
  `);

  // 5. System setting for quick enrollment toggle
  const [quickSettingRow] = await sqlClient.query(`
    SELECT setting_value FROM system_settings WHERE setting_key = 'quick_enrollment_enabled' LIMIT 1
  `) as { setting_value: { enabled?: boolean } }[];
  const quickEnrollmentEnabled = quickSettingRow?.setting_value?.enabled ?? true;

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#dfba73]/20 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-full border border-[#dfba73]/35 bg-[#dfba73]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
              Student Information Architecture
            </span>
            <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Students Registry & Admission Management
            </h1>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
              Comprehensive institutional directory with three dedicated tiers: Landing page Pending Applications, Official Active Scholars, and Teacher Quick List adjustments.
            </p>
          </div>
        </div>
      </div>

      <StudentsDirectoryClient
        activeStudents={activeStudents as any}
        quickStudents={quickStudents as any}
        pendingStudents={pendingStudents as any}
        classes={classes as any}
        sections={sections as any}
        sessions={sessions as any}
        initialTab={initialTab}
        initialQuickEnrollmentEnabled={quickEnrollmentEnabled}
      />
    </div>
  );
}
