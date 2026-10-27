import { sqlClient } from "@/db";
import { WeeklyThemeClient } from "@/features/dashboard/components/weekly-theme-client";

export const metadata = {
  title: "Weekly School Theme | Salamah International School",
  description: "Weekly scholastic themes, scripture, assembly focus, and moral values",
};

export default async function WeeklyThemePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialAction = typeof query.action === "string" ? query.action : undefined;

  // 1. Fetch Weekly Themes
  const themes = await sqlClient.query(`
    SELECT
      wt.id,
      wt.week_number,
      wt.theme_title,
      wt.scripture_reference,
      wt.quote_or_hadith,
      wt.assembly_focus,
      wt.core_values,
      wt.created_at,
      wt.updated_at
    FROM weekly_themes wt
    ORDER BY wt.week_number ASC
  `);

  // 2. Fetch Active Academic Calendar (for current week detection)
  const [calendar] = await sqlClient.query(`
    SELECT id, term_name, current_week, manual_override_week
    FROM school_academic_calendars
    WHERE is_active = true
    LIMIT 1
  `) as any[];

  const currentWeek = calendar?.manual_override_week || calendar?.current_week || 4;

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#dfba73]/20 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-full border border-[#dfba73]/35 bg-[#dfba73]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
              Pastoral & Moral Philosophy
            </span>
            <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Weekly School Themes & Core Values
            </h1>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
              Catalogue of weekly themes, Quranic / Biblical scriptures, moral hadiths, and assembly focus areas that anchor morning devotionals and academic conduct across all wings.
            </p>
          </div>
        </div>
      </div>

      <WeeklyThemeClient
        themes={themes as any}
        currentWeek={currentWeek}
        initialAction={initialAction}
      />
    </div>
  );
}
