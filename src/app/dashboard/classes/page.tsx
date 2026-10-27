import { sqlClient } from "@/db";
import {
  ClassesClient,
  type ClassItem,
} from "@/features/dashboard/components/classes-client";
import { resolveAcademicContext } from "@/features/academic/lib/context";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialTab = typeof query.tab === "string" ? query.tab : "classes";
  const context = await resolveAcademicContext();
  const sessionId = context?.sessionId;

  // Fetch classes
  const classes = await sqlClient.query(`
    SELECT
      c.id, c.name, c.code, c.status,
      g.id as grade_id, g.name as grade_name,
      (SELECT count(*)::int FROM student_enrollments se WHERE se.class_id = c.id AND se.status = 'active') as student_count,
      (
        SELECT sc.name
        FROM class_subject_combinations csc
        JOIN subject_combinations sc ON sc.id = csc.combination_id
        WHERE csc.class_id = c.id
        LIMIT 1
      ) as assigned_combination,
      (
        SELECT p.first_name || ' ' || p.last_name
        FROM teacher_class_assignments tca
        JOIN teachers t ON t.id = tca.teacher_id
        JOIN staff s ON s.id = t.staff_id
        JOIN people p ON p.id = s.person_id
        WHERE tca.class_id = c.id AND tca.status = 'active'
        LIMIT 1
      ) as class_teacher_name
    FROM classes c
    JOIN grades g ON g.id = c.grade_id
    ORDER BY g.sort_order, c.name
  `);

  const grades = await sqlClient.query("SELECT id, name FROM grades ORDER BY sort_order");
  const combinations = await sqlClient.query("SELECT id, name FROM subject_combinations ORDER BY name");
  const teachers = await sqlClient.query(`
    SELECT t.id, p.first_name || ' ' || p.last_name as name, s.staff_number, u.email
    FROM teachers t
    JOIN staff s ON s.id = t.staff_id
    JOIN people p ON p.id = s.person_id
    JOIN users u ON u.person_id = p.id
    WHERE t.status = 'active'
    ORDER BY p.first_name, p.last_name
  `);

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#c5a059]/20 pb-4">
        <span className="rounded-full border border-[#c5a059]/35 bg-[#c5a059]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
          Academic Structure
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Classes & Student Registration
        </h1>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
          Manage classes, attach subject combinations, assign pastoral class teachers, and inspect daily student registers.
        </p>
      </div>

      <ClassesClient
        classes={classes as unknown as ClassItem[]}
        grades={grades as unknown as { id: string; name: string }[]}
        combinations={combinations as unknown as { id: string; name: string }[]}
        teachers={teachers as unknown as { id: string; name: string; staff_number: string | null }[]}
        sessionId={sessionId}
        initialTab={initialTab}
      />
    </div>
  );
}
