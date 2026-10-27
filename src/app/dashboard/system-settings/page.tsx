import { sqlClient } from "@/db";
import { getSystemSettings } from "@/lib/services/settings";
import { SystemSettingsClient } from "@/features/dashboard/components/system-settings-client";

export default async function SystemSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialTab = typeof query.tab === "string" ? query.tab : "academic";

  const settings = await getSystemSettings();
  const sessions = await sqlClient.query("SELECT id, name, is_current FROM academic_sessions ORDER BY start_date DESC");
  const terms = await sqlClient.query(`
    SELECT t.id, t.name, t.term_number, t.is_current, t.session_id, s.name as session_name
    FROM academic_terms t
    JOIN academic_sessions s ON s.id = t.session_id
    ORDER BY s.start_date DESC, t.term_number
  `);

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#c5a059]/20 pb-4">
        <span className="rounded-full border border-[#c5a059]/35 bg-[#c5a059]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
          Core Institutional Governance
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          System Settings & Master Configuration
        </h1>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
          Set the active academic session & term, authorized signatories, official school profile parameters, and admin security settings. Stored in Neon DB as the single source of truth.
        </p>
      </div>

      <SystemSettingsClient
        settings={settings}
        sessions={sessions as unknown as { id: string; name: string; is_current: boolean; }[]}
        terms={terms as unknown as { id: string; name: string; term_number: number; is_current: boolean; session_id: string; session_name: string; }[]}
        initialTab={initialTab}
      />
    </div>
  );
}
