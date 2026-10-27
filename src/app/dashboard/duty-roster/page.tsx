import { sqlClient } from "@/db";
import { DutyRosterClient } from "@/features/dashboard/components/duty-roster-client";

export const metadata = {
  title: "School Duty Roster | Salamah International School",
  description: "Official weekly faculty duty roster and automated staff distribution",
};

export default async function DutyRosterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialTab = typeof query.tab === "string" ? query.tab : "roster";

  // 1. Fetch Duty Rosters
  const rosters = await sqlClient.query(`
    SELECT
      dr.id,
      dr.title,
      dr.total_weeks,
      dr.start_date,
      dr.end_date,
      dr.duties_list,
      dr.weeks_data,
      dr.is_active,
      dr.created_at,
      dr.updated_at,
      s.name as session_name,
      t.name as term_name
    FROM duty_rosters dr
    LEFT JOIN academic_sessions s ON s.id = dr.session_id
    LEFT JOIN academic_terms t ON t.id = dr.term_id
    ORDER BY dr.is_active DESC, dr.created_at DESC
  `);

  // 2. Fetch Active Academic Calendar (for current week)
  const [calendar] = await sqlClient.query(`
    SELECT id, term_name, start_date, end_date, total_weeks, current_week, manual_override_week, weeks_config
    FROM school_academic_calendars
    WHERE is_active = true
    LIMIT 1
  `) as any[];

  // 3. Fetch All Available Staff and Teachers
  const staffList = await sqlClient.query(`
    SELECT
      s.id as staff_id,
      p.id as person_id,
      p.first_name || ' ' || p.last_name as full_name,
      s.staff_number,
      s.department,
      COALESCE(t.qualification, 'Faculty') as qualification,
      COALESCE(t.specialization, 'Teaching') as specialization
    FROM staff s
    JOIN people p ON p.id = s.person_id
    LEFT JOIN teachers t ON t.staff_id = s.id
    WHERE s.status = 'active'
    ORDER BY p.last_name, p.first_name
  `);

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#dfba73]/20 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-full border border-[#dfba73]/35 bg-[#dfba73]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
              Faculty Administration & Operations
            </span>
            <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
              School Weekly Duty Roster & Staff Distribution
            </h1>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
              Official institutional duty register. Configure weeks and dates, automatically distribute faculty evenly across pastoral posts, and print laser-quality A4 schedules.
            </p>
          </div>
        </div>
      </div>

      <DutyRosterClient
        rosters={rosters as any}
        staffList={staffList as any}
        calendar={calendar as any}
        initialTab={initialTab}
      />
    </div>
  );
}
