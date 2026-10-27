import { redirect } from "next/navigation";
import { sqlClient } from "@/db";
import { getSession } from "@/lib/auth/session";
import {
  SubjectsClient,
  type SubjectItem,
  type CombinationItem,
} from "@/features/dashboard/components/subjects-client";

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "superadmin" && session.role !== "admin") {
    redirect("/dashboard");
  }

  const query = await searchParams;
  const initialTab = typeof query.tab === "string" ? query.tab : "catalogue";

  const subjects = await sqlClient.query(`
    SELECT
      s.id, s.name, s.code, s.short_name, s.description, s.status,
      (
        SELECT count(DISTINCT csc.class_id)::int
        FROM class_subject_combinations csc
        JOIN subject_combination_subjects scs ON scs.combination_id = csc.combination_id
        WHERE scs.subject_id = s.id AND csc.status = 'active'
      ) as class_count,
      (
        SELECT count(DISTINCT tsa.teacher_id)::int
        FROM teacher_subject_assignments tsa
        WHERE tsa.subject_id = s.id AND tsa.status = 'active'
      ) as teacher_count,
      (
        SELECT p.first_name || ' ' || p.last_name
        FROM teacher_subject_assignments tsa
        JOIN teachers t ON t.id = tsa.teacher_id
        JOIN staff stf ON stf.id = t.staff_id
        JOIN people p ON p.id = stf.person_id
        WHERE tsa.subject_id = s.id AND tsa.status = 'active'
        LIMIT 1
      ) as assigned_teacher_name,
      (
        SELECT u.email
        FROM teacher_subject_assignments tsa
        JOIN teachers t ON t.id = tsa.teacher_id
        JOIN staff stf ON stf.id = t.staff_id
        JOIN people p ON p.id = stf.person_id
        JOIN users u ON u.person_id = p.id
        WHERE tsa.subject_id = s.id AND tsa.status = 'active'
        LIMIT 1
      ) as assigned_teacher_email,
      (
        SELECT tsa.teacher_id
        FROM teacher_subject_assignments tsa
        WHERE tsa.subject_id = s.id AND tsa.status = 'active'
        LIMIT 1
      ) as assigned_teacher_id
    FROM subjects s
    ORDER BY s.name
  `);

  const teachers = await sqlClient.query(`
    SELECT t.id, p.first_name || ' ' || p.last_name as name, s.staff_number, u.email
    FROM teachers t
    JOIN staff s ON s.id = t.staff_id
    JOIN people p ON p.id = s.person_id
    JOIN users u ON u.person_id = p.id
    WHERE t.status = 'active'
    ORDER BY p.first_name, p.last_name
  `);

  const combinations = await sqlClient.query(`
    SELECT
      sc.id, sc.name, sc.description, sc.status,
      COALESCE(
        json_agg(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'code', s.code
          ) ORDER BY scs.sort_order
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'::json
      ) as member_subjects
    FROM subject_combinations sc
    LEFT JOIN subject_combination_subjects scs ON scs.combination_id = sc.id
    LEFT JOIN subjects s ON s.id = scs.subject_id
    GROUP BY sc.id
    ORDER BY sc.name
  `);

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#c5a059]/20 pb-4">
        <span className="rounded-full border border-[#c5a059]/35 bg-[#c5a059]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
          Curriculum Architecture
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Subjects & Subject Combinations
        </h1>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
          Maintain the comprehensive school subject catalogue and curate multi-subject combinations for senior and junior secondary academic tracks.
        </p>
      </div>

      <SubjectsClient
        subjects={subjects as unknown as SubjectItem[]}
        combinations={combinations as unknown as CombinationItem[]}
        teachers={teachers as unknown as { id: string; name: string; staff_number: string | null; email?: string }[]}
        initialTab={initialTab}
      />
    </div>
  );
}
