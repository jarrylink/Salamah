import { sqlClient } from "@/db";
import { getOfficesList } from "@/lib/services/offices";
import { getManagersAndStaff } from "@/lib/services/access-management";
import {
  OfficesClient,
  type OfficeItem,
  type OfficeLogItem,
} from "@/features/dashboard/components/offices-client";

export default async function OfficesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialTab = typeof query.tab === "string" ? query.tab : "directory";

  const offices = await getOfficesList();
  const personnel = await getManagersAndStaff();

  // All weekly logs across all offices
  const allLogs = await sqlClient.query(`
    SELECT
      ol.id, ol.office_id, ol.log_date, ol.week_summary, ol.daily_tasks_carried_out, ol.challenges, ol.next_week_plan, ol.status,
      o.name as office_name, o.code as office_code,
      p.first_name, p.last_name, u.email
    FROM office_logs ol
    JOIN offices o ON o.id = ol.office_id
    JOIN users u ON u.id = ol.author_user_id
    JOIN people p ON p.id = u.person_id
    ORDER BY ol.log_date DESC, ol.created_at DESC
  `);

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#c5a059]/20 pb-4">
        <span className="rounded-full border border-[#c5a059]/35 bg-[#c5a059]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
          Institutional Administration
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          School Offices & Weekly Duty Logs
        </h1>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
          Create administrative offices, define binding duty mandates, assign Managers or Staff, and inspect weekly logs of daily tasks carried out.
        </p>
      </div>

      <OfficesClient
        offices={offices as unknown as OfficeItem[]}
        personnel={personnel as unknown as { user_id: string; first_name: string; last_name: string; email: string; role: string; }[]}
        allLogs={allLogs as unknown as OfficeLogItem[]}
        initialTab={initialTab}
      />
    </div>
  );
}
