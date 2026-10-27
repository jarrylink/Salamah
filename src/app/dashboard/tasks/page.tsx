import { sqlClient } from "@/db";
import { getSchoolTasksList } from "@/lib/services/tasks";
import { getManagersAndStaff } from "@/lib/services/access-management";
import {
  TasksClient,
  type TaskItem,
  type TaskLogItem,
} from "@/features/dashboard/components/tasks-client";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialTab = typeof query.tab === "string" ? query.tab : "directory";

  const tasks = await getSchoolTasksList();
  const personnel = await getManagersAndStaff();

  // All execution logs
  const allLogs = await sqlClient.query(`
    SELECT
      tl.id, tl.task_id, tl.log_date, tl.report, tl.status, tl.notes, tl.created_at,
      st.title as task_title, st.category as task_category,
      p.first_name, p.last_name, u.email
    FROM school_task_logs tl
    JOIN school_tasks st ON st.id = tl.task_id
    JOIN users u ON u.id = tl.staff_user_id
    JOIN people p ON p.id = u.person_id
    ORDER BY tl.log_date DESC, tl.created_at DESC
  `);

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#c5a059]/20 pb-4">
        <span className="rounded-full border border-[#c5a059]/35 bg-[#c5a059]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
          School Support & Maintenance Operations
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          School Tasks & Responsibility Documents
        </h1>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
          Manage operational duties without fixed offices: security guards, gardeners, laborers, power plant technicians, and sanitation teams. Maintain binding editable SOP documents.
        </p>
      </div>

      <TasksClient
        tasks={tasks as unknown as TaskItem[]}
        personnel={personnel as unknown as { user_id: string; first_name: string; last_name: string; email: string; role: string; }[]}
        allLogs={allLogs as unknown as TaskLogItem[]}
        initialTab={initialTab}
      />
    </div>
  );
}
