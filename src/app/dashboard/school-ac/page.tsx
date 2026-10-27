import { sqlClient } from "@/db";
import { SchoolAcClient } from "@/features/dashboard/components/school-ac-client";

export const metadata = {
  title: "School AC (Academic Calendar) | Salamah International School",
  description: "Manage term weeks, automatic 7-day progression, and current week tracking",
};

export default async function SchoolAcPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialTab = typeof query.tab === "string" ? query.tab : "calendar";

  // 1. Fetch Academic Calendar
  const [calendar] = await sqlClient.query(`
    SELECT
      c.id,
      c.term_name,
      c.start_date,
      c.end_date,
      c.total_weeks,
      c.current_week,
      c.manual_override_week,
      c.weeks_config,
      c.is_active,
      c.created_at,
      c.updated_at,
      s.name as session_name,
      t.name as term_db_name
    FROM school_academic_calendars c
    LEFT JOIN academic_sessions s ON s.id = c.session_id
    LEFT JOIN academic_terms t ON t.id = c.term_id
    WHERE c.is_active = true
    LIMIT 1
  `) as any[];

  // 2. Fetch Sessions and Terms
  const sessions = await sqlClient.query(`
    SELECT id, name, is_current FROM academic_sessions ORDER BY is_current DESC, start_date DESC
  `);

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#dfba73]/20 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-full border border-[#dfba73]/35 bg-[#dfba73]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
              Scholastic Progression Architecture
            </span>
            <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
              School AC · Academic Calendar & Week Progression
            </h1>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
              Centralized term scheduler. System tracks scholastic weeks automatically every 7 days from resumption date or accepts immediate manual admin week overrides.
            </p>
          </div>
        </div>
      </div>

      <SchoolAcClient
        calendar={calendar}
        sessions={sessions as any}
        initialTab={initialTab}
      />
    </div>
  );
}
