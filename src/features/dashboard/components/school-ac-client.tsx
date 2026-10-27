"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  Edit,
  Save,
  RotateCcw
} from "lucide-react";

export type WeekConfigItem = {
  weekNumber: number;
  startDate: string;
  endDate: string;
  title: string;
  isCurrent?: boolean;
};

export type CalendarData = {
  id: string;
  term_name: string;
  start_date: string;
  end_date: string;
  total_weeks: number;
  current_week: number;
  manual_override_week: number | null;
  weeks_config: WeekConfigItem[];
  session_name: string | null;
  term_db_name: string | null;
};

export function SchoolAcClient({
  calendar: initialCalendar,
  sessions,
  initialTab,
}: {
  calendar?: CalendarData;
  sessions: Array<{ id: string; name: string; is_current: boolean }>;
  initialTab: string;
}) {
  const [calendar, setCalendar] = useState<CalendarData | undefined>(initialCalendar);
  const [activeTab, setActiveTab] = useState<"calendar" | "tracker">(
    initialTab === "tracker" ? "tracker" : "calendar"
  );

  // Auto 7-day progression calculation
  const startDate = calendar?.start_date ? new Date(calendar.start_date) : new Date("2026-09-14");
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const autoWeek = Math.min(
    Math.max(1, Math.floor(diffDays / 7) + 1),
    calendar?.total_weeks || 12
  );

  const isManual = calendar?.manual_override_week !== null && calendar?.manual_override_week !== undefined;
  const effectiveCurrentWeek = isManual ? calendar!.manual_override_week! : autoWeek;

  // Settings State
  const [termName, setTermName] = useState(calendar?.term_name || "1st Term 2026/2027");
  const [totalWeeks, setTotalWeeks] = useState(calendar?.total_weeks || 12);
  const [startDateStr, setStartDateStr] = useState(calendar?.start_date || "2026-09-14");
  const [isUpdatingWeek, setIsUpdatingWeek] = useState(false);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  // ==========================================
  // UPDATE CURRENT WEEK
  // ==========================================
  async function handleSetCurrentWeek(weekNum: number, manual: boolean) {
    if (!calendar) return;
    setIsUpdatingWeek(true);

    try {
      const res = await fetch("/api/school-ac/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-current-week",
          calendarId: calendar.id,
          weekNumber: weekNum,
          isManualOverride: manual,
        }),
      });

      if (!res.ok) throw new Error("Failed to update current week");

      setCalendar({
        ...calendar,
        current_week: weekNum,
        manual_override_week: manual ? weekNum : null,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error setting current week");
    } finally {
      setIsUpdatingWeek(false);
    }
  }

  // ==========================================
  // SAVE CALENDAR CONFIG
  // ==========================================
  async function handleSaveCalendarConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!calendar) return;
    setIsUpdatingConfig(true);

    try {
      // Re-generate week dates if totalWeeks or startDate changed
      const weeksConfig: WeekConfigItem[] = [];
      const sDate = new Date(startDateStr);

      for (let w = 1; w <= totalWeeks; w++) {
        const wStart = new Date(sDate);
        wStart.setDate(wStart.getDate() + (w - 1) * 7);
        const wEnd = new Date(wStart);
        wEnd.setDate(wEnd.getDate() + 4);

        const existingWeek = calendar.weeks_config?.find((item) => item.weekNumber === w);

        weeksConfig.push({
          weekNumber: w,
          startDate: wStart.toISOString().split("T")[0],
          endDate: wEnd.toISOString().split("T")[0],
          title: existingWeek?.title || `Scholastic Week ${w}`,
          isCurrent: w === effectiveCurrentWeek,
        });
      }

      const eDate = new Date(sDate);
      eDate.setDate(eDate.getDate() + totalWeeks * 7);

      const res = await fetch("/api/school-ac/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-calendar",
          calendarId: calendar.id,
          termName,
          startDate: startDateStr,
          endDate: eDate.toISOString().split("T")[0],
          totalWeeks,
          weeksConfig,
        }),
      });

      if (!res.ok) throw new Error("Failed to save calendar config");

      alert("School Academic Calendar updated successfully!");
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving calendar");
    } finally {
      setIsUpdatingConfig(false);
    }
  }

  const weeksList = calendar?.weeks_config && calendar.weeks_config.length > 0
    ? calendar.weeks_config
    : Array.from({ length: totalWeeks }, (_, idx) => ({
        weekNumber: idx + 1,
        startDate: "",
        endDate: "",
        title: `Scholastic Week ${idx + 1}`,
        isCurrent: idx + 1 === effectiveCurrentWeek,
      }));

  return (
    <div className="space-y-6">
      {/* TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "calendar"
                ? "bg-[#dfba73] text-slate-950 shadow-lg shadow-[#dfba73]/20"
                : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Academic Calendar Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "tracker"
                ? "bg-[#dfba73] text-slate-950 shadow-lg shadow-[#dfba73]/20"
                : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Current Week Tracker</span>
            <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-extrabold text-[#dfba73]">
              Week {effectiveCurrentWeek}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CURRENT WEEK PROMINENT TELEMETRY BANNER */}
      {/* ======================================================== */}
      <div className="rounded-3xl border border-[#dfba73]/30 bg-gradient-to-r from-[#031523] via-[#052136] to-[#031523] p-6 shadow-xl text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dfba73]/20 border border-[#dfba73]/40 text-[#dfba73] font-serif text-3xl font-extrabold shadow-inner">
              {effectiveCurrentWeek}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[#dfba73]/40 bg-[#dfba73]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] text-[#dfba73] uppercase">
                  Scholastic Live Progression
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                    isManual
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-teal-500/20 text-teal-300 border-teal-500/30"
                  }`}
                >
                  {isManual ? "Admin Manual Override" : "7-Day Automatic Progression"}
                </span>
              </div>

              <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-white">
                Academic Week {effectiveCurrentWeek} of {calendar?.total_weeks || 12}
              </h2>
              <p className="text-xs text-slate-300">
                Term: <strong className="text-teal-300">{calendar?.term_name || "1st Term 2026/2027"}</strong> · Cycle advances dynamically every 7 days from start date.
              </p>
            </div>
          </div>

          {/* Quick Override Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-900/90 border border-slate-700 p-1.5">
              <span className="text-[11px] font-semibold text-slate-300 px-2">Set Week:</span>
              <select
                value={effectiveCurrentWeek}
                onChange={(e) => handleSetCurrentWeek(Number(e.target.value), true)}
                disabled={isUpdatingWeek}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-[#dfba73] focus:border-[#dfba73] focus:outline-none"
              >
                {Array.from({ length: calendar?.total_weeks || 12 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Week {w}
                  </option>
                ))}
              </select>

              {isManual && (
                <button
                  onClick={() => handleSetCurrentWeek(autoWeek, false)}
                  disabled={isUpdatingWeek}
                  className="flex items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-1.5 text-[11px] text-slate-300 hover:text-white transition"
                  title="Revert to 7-Day Auto Calculation"
                >
                  <RotateCcw className="h-3 w-3 text-teal-400" />
                  <span>Auto (Wk {autoWeek})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB CONTENT: TIMELINE & CALENDAR CONFIGURATION */}
      {/* ======================================================== */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: Week-by-Week Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-serif text-lg font-bold text-white">Term Weeks Schedule</h3>
            <span className="text-xs text-slate-400">Total {weeksList.length} Academic Weeks</span>
          </div>

          <div className="space-y-2.5">
            {weeksList.map((w) => {
              const isThisCurrent = w.weekNumber === effectiveCurrentWeek;
              return (
                <div
                  key={w.weekNumber}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 transition ${
                    isThisCurrent
                      ? "border-2 border-[#dfba73] bg-[#061e30] shadow-lg shadow-[#dfba73]/10"
                      : "border border-slate-800 bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
                        isThisCurrent
                          ? "bg-[#dfba73] text-slate-950 font-extrabold"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {w.weekNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{w.title}</h4>
                        {isThisCurrent && (
                          <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/30">
                            Active Week
                          </span>
                        )}
                      </div>
                      {w.startDate && w.endDate && (
                        <p className="text-[11px] font-mono text-slate-400">
                          {w.startDate} to {w.endDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isThisCurrent && (
                    <button
                      onClick={() => handleSetCurrentWeek(w.weekNumber, true)}
                      disabled={isUpdatingWeek}
                      className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-[#dfba73] transition"
                    >
                      Set as Current Week
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Academic Calendar Configuration Card */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#092233] p-5 shadow-lg">
            <h3 className="font-serif text-base font-bold text-white mb-1">
              Term Schedule Configuration
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure term resumption dates and total weeks. Changing start dates shifts the automated 7-day week schedule.
            </p>

            <form onSubmit={handleSaveCalendarConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Term / Session Label *
                </label>
                <input
                  type="text"
                  required
                  value={termName}
                  onChange={(e) => setTermName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Total Term Weeks *
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  required
                  value={totalWeeks}
                  onChange={(e) => setTotalWeeks(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Term Resumption Date (Week 1 Start) *
                </label>
                <input
                  type="date"
                  required
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingConfig}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-teal-400 transition shadow-md"
                >
                  <Save className="h-4 w-4" />
                  <span>{isUpdatingConfig ? "Saving..." : "Save Academic Calendar"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
