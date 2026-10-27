"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  CalendarDays,
  Printer,
  Sparkles,
  Users,
  CheckCircle2,
  Edit,
  Trash2,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  X,
  FileSpreadsheet
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";

export type StaffMember = {
  staff_id: string;
  person_id: string;
  full_name: string;
  staff_number: string;
  department: string | null;
  qualification: string;
  specialization: string;
};

export type DutyAssignment = {
  dutyName: string;
  staff: Array<{
    staffId: string;
    name: string;
    qualification?: string;
  }>;
};

export type WeekDutyRecord = {
  weekNumber: number;
  startDate: string;
  endDate: string;
  duties: DutyAssignment[];
};

export type DutyRoster = {
  id: string;
  title: string;
  total_weeks: number;
  start_date: string;
  end_date: string;
  duties_list: string[];
  weeks_data: WeekDutyRecord[];
  is_active: boolean;
  created_at: string;
  session_name: string | null;
  term_name: string | null;
};

export function DutyRosterClient({
  rosters: initialRosters,
  staffList,
  calendar,
  initialTab,
}: {
  rosters: DutyRoster[];
  staffList: StaffMember[];
  calendar?: {
    id: string;
    term_name: string;
    start_date: string;
    end_date: string;
    total_weeks: number;
    current_week: number;
    manual_override_week: number | null;
  };
  initialTab: string;
}) {
  const [rosters, setRosters] = useState<DutyRoster[]>(initialRosters);
  const activeRoster = rosters.find((r) => r.is_active) || rosters[0];
  const [selectedRosterId, setSelectedRosterId] = useState(activeRoster?.id || "");
  const currentRoster = rosters.find((r) => r.id === selectedRosterId) || activeRoster;

  const [activeTab, setActiveTab] = useState<"roster" | "generator" | "archives">(
    initialTab === "generator" ? "generator" : initialTab === "archives" ? "archives" : "roster"
  );

  const currentScholasticWeek = calendar?.manual_override_week || calendar?.current_week || 4;

  // Generator State
  const [genTitle, setGenTitle] = useState("1st Term 2026/2027 Faculty Weekly Duty Roster");
  const [genWeeks, setGenWeeks] = useState(12);
  const [genStartDate, setGenStartDate] = useState(calendar?.start_date || "2026-09-14");
  const [genDuties, setGenDuties] = useState<string[]>([
    "Assembly & Main Gate Supervision",
    "Break Time & Playground Oversight",
    "Dining Hall & Cafeteria Orderliness",
    "Dismissal, Bus Boarding & Evening Security",
  ]);
  const [genStaffPerDuty, setGenStaffPerDuty] = useState(2);
  const [generatedPreview, setGeneratedPreview] = useState<WeekDutyRecord[] | null>(null);
  const [isSavingGenerator, setIsSavingGenerator] = useState(false);

  // Edit Week Modal
  const [editingWeek, setEditingWeek] = useState<WeekDutyRecord | null>(null);
  const [editWeekDuties, setEditWeekDuties] = useState<DutyAssignment[]>([]);
  const [isSavingEditWeek, setIsSavingEditWeek] = useState(false);

  // Print Ref
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    window.print();
  }

  // ==========================================
  // GENERATOR LOGIC: EVEN CYCLIC DISTRIBUTION
  // ==========================================
  function generateDistribution() {
    if (staffList.length === 0) {
      alert("No staff members found in database to distribute.");
      return;
    }

    const weeks: WeekDutyRecord[] = [];
    const termStart = new Date(genStartDate);

    for (let w = 1; w <= genWeeks; w++) {
      const wStart = new Date(termStart);
      wStart.setDate(wStart.getDate() + (w - 1) * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 4); // Friday

      const weekDuties: DutyAssignment[] = genDuties.map((dutyName, dIdx) => {
        const assignedStaff: Array<{ staffId: string; name: string; qualification: string }> = [];

        for (let s = 0; s < genStaffPerDuty; s++) {
          const staffIndex = ((w - 1) * (genDuties.length * genStaffPerDuty) + dIdx * genStaffPerDuty + s) % staffList.length;
          const staff = staffList[staffIndex];
          assignedStaff.push({
            staffId: staff.staff_id,
            name: staff.full_name,
            qualification: staff.qualification,
          });
        }

        return {
          dutyName,
          staff: assignedStaff,
        };
      });

      weeks.push({
        weekNumber: w,
        startDate: wStart.toISOString().split("T")[0],
        endDate: wEnd.toISOString().split("T")[0],
        duties: weekDuties,
      });
    }

    setGeneratedPreview(weeks);
  }

  async function handleSaveGeneratedRoster(setAsActive: boolean) {
    if (!generatedPreview) return;
    setIsSavingGenerator(true);
    try {
      const res = await fetch("/api/duty-roster/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-roster",
          title: genTitle,
          totalWeeks: genWeeks,
          startDate: genStartDate,
          dutiesList: genDuties,
          weeksData: generatedPreview,
          isActive: setAsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save generated roster");

      alert("Duty Roster successfully generated and saved!");
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving roster");
    } finally {
      setIsSavingGenerator(false);
    }
  }

  // ==========================================
  // EDIT WEEK ASSIGNMENT
  // ==========================================
  function openEditWeekModal(week: WeekDutyRecord) {
    setEditingWeek(week);
    setEditWeekDuties(JSON.parse(JSON.stringify(week.duties)));
  }

  async function handleSaveEditWeek() {
    if (!editingWeek || !currentRoster) return;
    setIsSavingEditWeek(true);

    try {
      const updatedWeeksData = currentRoster.weeks_data.map((w) =>
        w.weekNumber === editingWeek.weekNumber ? { ...w, duties: editWeekDuties } : w
      );

      const res = await fetch("/api/duty-roster/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-roster",
          rosterId: currentRoster.id,
          weeksData: updatedWeeksData,
        }),
      });

      if (!res.ok) throw new Error("Failed to update roster");

      setRosters((prev) =>
        prev.map((r) => (r.id === currentRoster.id ? { ...r, weeks_data: updatedWeeksData } : r))
      );
      setEditingWeek(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving week duties");
    } finally {
      setIsSavingEditWeek(false);
    }
  }

  // ==========================================
  // SET ACTIVE ROSTER
  // ==========================================
  async function handleSetActiveRoster(rosterId: string) {
    try {
      const res = await fetch("/api/duty-roster/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-active",
          rosterId,
        }),
      });

      if (!res.ok) throw new Error("Failed to set active roster");

      setRosters((prev) =>
        prev.map((r) => ({
          ...r,
          is_active: r.id === rosterId,
        }))
      );
      setSelectedRosterId(rosterId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error setting active roster");
    }
  }

  // ==========================================
  // DELETE ROSTER
  // ==========================================
  async function handleDeleteRoster(rosterId: string, title: string) {
    if (!confirm(`Delete roster "${title}"?`)) return;

    try {
      const res = await fetch("/api/duty-roster/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-roster",
          rosterId,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete roster");

      setRosters((prev) => prev.filter((r) => r.id !== rosterId));
      if (selectedRosterId === rosterId && rosters.length > 1) {
        setSelectedRosterId(rosters[0].id);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting roster");
    }
  }

  return (
    <div className="space-y-6">
      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("roster")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "roster"
                ? "bg-[#dfba73] text-slate-950 shadow-lg shadow-[#dfba73]/20"
                : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Weekly Duty Roster (A4)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("generator");
              if (!generatedPreview) generateDistribution();
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "generator"
                ? "bg-[#dfba73] text-slate-950 shadow-lg shadow-[#dfba73]/20"
                : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Staff Auto-Distribution Generator</span>
          </button>

          <button
            onClick={() => setActiveTab("archives")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "archives"
                ? "bg-[#dfba73] text-slate-950 shadow-lg shadow-[#dfba73]/20"
                : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Roster Archives ({rosters.length})</span>
          </button>
        </div>

        {activeTab === "roster" && currentRoster && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition shadow-md"
            >
              <Printer className="h-4 w-4" />
              <span>Laser Print A4 Roster</span>
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: WEEKLY DUTY ROSTER (A4 PRINTABLE PAPER LAYOUT) */}
      {/* ======================================================== */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          {/* Active Roster Info Bar */}
          {currentRoster && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dfba73]/30 bg-[#061b29] p-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dfba73]/20 border border-[#dfba73]/40 text-[#dfba73]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{currentRoster.title}</h3>
                    {currentRoster.is_active && (
                      <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                        Active Roster
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Scholastic Cycle: {currentRoster.total_weeks} Academic Weeks ({currentRoster.start_date} to {currentRoster.end_date})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300">
                  Current Scholastic Week: <strong className="text-[#dfba73]">Week {currentScholasticWeek}</strong>
                </span>
                {!currentRoster.is_active && (
                  <button
                    onClick={() => handleSetActiveRoster(currentRoster.id)}
                    className="flex items-center gap-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 px-3 py-1.5 text-xs font-bold hover:bg-teal-500/30 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Set as Active Roster</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* AUTHENTIC A4 PAPER CONTAINER */}
          {/* Styled for on-screen elegance and 1:1 laser print formatting */}
          {/* ======================================================== */}
          <div
            ref={printRef}
            className="a4-printable mx-auto max-w-[850px] bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl border border-slate-300 print:p-0 print:border-none print:shadow-none print:max-w-none print:rounded-none"
            style={{ minHeight: "1050px" }}
          >
            {/* HERALDIC LETTERHEAD HEADER */}
            <div className="border-b-2 border-[#043e52] pb-4 mb-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  <Image
                    src="https://res.cloudinary.com/djkudkxmx/image/upload/v1764675966/FAVICON_gox83v.png"
                    alt="Salamah Crest"
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="text-center flex-1">
                  <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-[#043e52] uppercase">
                    Salamah International School
                  </h1>
                  <p className="text-[11px] font-bold text-[#dfba73] tracking-[0.2em] uppercase mt-0.5">
                    Learning for Peaceful Co-Existence
                  </p>
                  <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                    Diplomatic Zone, Maitama Extension, Abuja, Nigeria · Federal Government Accredited
                  </p>
                  <div className="mt-2 inline-block rounded-md bg-[#043e52] px-4 py-1 text-white text-[11px] font-bold tracking-wider uppercase">
                    Official Faculty Weekly Duty Roster
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-600 shrink-0 hidden sm:block">
                  <p className="font-bold text-slate-800">Session: 2026/2027</p>
                  <p>Term: 1st Term</p>
                  <p>Cycle: 12 Weeks</p>
                  <p className="font-mono text-emerald-700 font-bold mt-1">Status: Official</p>
                </div>
              </div>
            </div>

            {/* A4 TABLE */}
            {currentRoster && currentRoster.weeks_data && currentRoster.weeks_data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-400 text-[11px]">
                  <thead>
                    <tr className="bg-[#043e52] text-white font-serif uppercase tracking-wider text-[10px]">
                      <th className="border border-slate-400 px-2.5 py-2.5 text-center w-20">
                        Week & Dates
                      </th>
                      {currentRoster.duties_list && currentRoster.duties_list.length > 0 ? (
                        currentRoster.duties_list.map((dName, idx) => (
                          <th key={idx} className="border border-slate-400 px-3 py-2.5">
                            {dName}
                          </th>
                        ))
                      ) : (
                        <>
                          <th className="border border-slate-400 px-3 py-2.5">Assembly & Gate</th>
                          <th className="border border-slate-400 px-3 py-2.5">Break & Playground</th>
                          <th className="border border-slate-400 px-3 py-2.5">Dining Hall</th>
                          <th className="border border-slate-400 px-3 py-2.5">Dismissal & Bus</th>
                        </>
                      )}
                      <th className="border border-slate-400 px-2 py-2.5 text-center w-14 print:hidden">
                        Edit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRoster.weeks_data.map((week) => {
                      const isCurrent = week.weekNumber === currentScholasticWeek;
                      return (
                        <tr
                          key={week.weekNumber}
                          className={`transition ${
                            isCurrent
                              ? "bg-amber-100/80 font-semibold border-2 border-amber-500 shadow-xs"
                              : week.weekNumber % 2 === 0
                              ? "bg-slate-50"
                              : "bg-white"
                          }`}
                        >
                          <td className="border border-slate-300 px-2.5 py-2 text-center align-top">
                            <div className="font-bold text-[#043e52]">Week {week.weekNumber}</div>
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                              {week.startDate.slice(5)} to {week.endDate.slice(5)}
                            </div>
                            {isCurrent && (
                              <span className="inline-block mt-1 rounded-sm bg-amber-600 px-1.5 py-0.2 text-[8px] font-bold text-white uppercase tracking-wider">
                                Current
                              </span>
                            )}
                          </td>

                          {week.duties.map((duty, dIdx) => (
                            <td key={dIdx} className="border border-slate-300 px-3 py-2 align-top">
                              <div className="space-y-1">
                                {duty.staff.map((s, sIdx) => (
                                  <div key={sIdx} className="flex items-start gap-1">
                                    <span className="text-teal-700 font-bold">•</span>
                                    <div>
                                      <div className="text-slate-900 font-medium leading-tight">
                                        {s.name}
                                      </div>
                                      {s.qualification && (
                                        <div className="text-[9px] text-slate-500 italic">
                                          {s.qualification}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          ))}

                          <td className="border border-slate-300 px-2 py-2 text-center align-middle print:hidden">
                            <button
                              onClick={() => openEditWeekModal(week)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
                              title="Edit Week Assignments"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                No duty roster weeks recorded. Please generate a distribution using the generator tab.
              </div>
            )}

            {/* A4 FOOTER & SIGNATORIES */}
            <div className="mt-8 pt-6 border-t border-slate-300 text-[10px] text-slate-600">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mx-auto w-32 mb-1" />
                  <p className="font-bold text-slate-800">Faculty Supervisor</p>
                  <p className="text-[9px]">Academic Operations</p>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mx-auto w-32 mb-1" />
                  <p className="font-bold text-slate-800">Vice Principal (Academic)</p>
                  <p className="text-[9px]">Salamah International School</p>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mx-auto w-32 mb-1" />
                  <p className="font-bold text-slate-800">The Principal</p>
                  <p className="text-[9px]">Executive Endorsement</p>
                </div>
              </div>
              <div className="mt-4 text-center text-[9px] text-slate-500 italic">
                * All staff on duty are required to report at least 30 minutes prior to school assembly and remain vigilant until the final dismissal bus departs.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: AUTOMATIC STAFF DISTRIBUTION GENERATOR */}
      {/* ======================================================== */}
      {activeTab === "generator" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#dfba73]/30 bg-[#061b29] p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Equal Faculty Distribution Engine</h3>
                <p className="text-xs text-slate-300">
                  Evenly and cyclically assigns the {staffList.length} faculty and operations personnel in the database across duty posts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Roster Title *
                </label>
                <input
                  type="text"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Total Academic Weeks *
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={genWeeks}
                  onChange={(e) => setGenWeeks(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Term Start Date (Week 1) *
                </label>
                <input
                  type="date"
                  value={genStartDate}
                  onChange={(e) => setGenStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>
            </div>

            {/* Duties Configuration */}
            <div className="mt-4 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-teal-300">
                  Duty Posts ({genDuties.length})
                </label>
                <button
                  type="button"
                  onClick={() => setGenDuties([...genDuties, `Duty Post ${genDuties.length + 1}`])}
                  className="flex items-center gap-1 text-[11px] text-[#dfba73] hover:underline"
                >
                  <PlusCircle className="h-3 w-3" />
                  <span>Add Duty Post</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {genDuties.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={d}
                      onChange={(e) => {
                        const next = [...genDuties];
                        next[idx] = e.target.value;
                        setGenDuties(next);
                      }}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                    {genDuties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGenDuties(genDuties.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <div className="text-xs text-slate-400">
                Available Staff: <strong className="text-teal-300">{staffList.length} members</strong> in active directory.
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={generateDistribution}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#dfba73]" />
                  <span>Run Equal Distribution</span>
                </button>

                {generatedPreview && (
                  <button
                    onClick={() => handleSaveGeneratedRoster(true)}
                    disabled={isSavingGenerator}
                    className="flex items-center gap-1.5 rounded-xl bg-[#dfba73] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition shadow-md"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isSavingGenerator ? "Saving..." : "Save as Active Roster"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Generated Preview Table */}
          {generatedPreview && (
            <div className="space-y-3">
              <h3 className="font-serif text-lg font-bold text-white">Generated Distribution Preview</h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#092233] shadow-md">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Week</th>
                      <th className="px-4 py-3">Date Range</th>
                      {genDuties.map((d, idx) => (
                        <th key={idx} className="px-4 py-3">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {generatedPreview.map((w) => (
                      <tr key={w.weekNumber} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-bold text-white">Week {w.weekNumber}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {w.startDate} → {w.endDate}
                        </td>
                        {w.duties.map((d, dIdx) => (
                          <td key={dIdx} className="px-4 py-3">
                            {d.staff.map((s, sIdx) => (
                              <div key={sIdx} className="text-white font-medium">
                                • {s.name}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ROSTER ARCHIVES */}
      {/* ======================================================== */}
      {activeTab === "archives" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rosters.map((roster) => (
              <div
                key={roster.id}
                className={`rounded-2xl border p-5 transition ${
                  roster.is_active
                    ? "border-emerald-500/50 bg-[#061b29] shadow-lg shadow-emerald-500/5"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {roster.is_active ? (
                      <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                        Active Roster
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-800 text-slate-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-slate-700">
                        Archived
                      </span>
                    )}
                    <h4 className="mt-2 font-serif text-base font-bold text-white">{roster.title}</h4>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Weeks:</span>
                    <strong className="text-white">{roster.total_weeks} Weeks</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Date Span:</span>
                    <span className="font-mono text-[11px] text-slate-300">{roster.start_date} → {roster.end_date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Created:</span>
                    <span suppressHydrationWarning>{formatDate(roster.created_at)}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
                  <button
                    onClick={() => {
                      setSelectedRosterId(roster.id);
                      setActiveTab("roster");
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-[#dfba73] hover:underline"
                  >
                    <span>View A4 Paper</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {!roster.is_active && (
                      <button
                        onClick={() => handleSetActiveRoster(roster.id)}
                        className="rounded-lg bg-teal-500/15 border border-teal-500/30 px-2 py-1 text-[11px] font-bold text-teal-300 hover:bg-teal-500/25 transition"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRoster(roster.id, roster.title)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Delete Roster"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT WEEK ASSIGNMENT */}
      {/* ======================================================== */}
      {editingWeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-[#dfba73]/40 bg-[#061b29] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">
                  Edit Duty Assignments · Week {editingWeek.weekNumber}
                </h3>
                <p className="text-xs text-[#dfba73]">
                  {editingWeek.startDate} to {editingWeek.endDate}
                </p>
              </div>
              <button
                onClick={() => setEditingWeek(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {editWeekDuties.map((duty, dIdx) => (
                <div key={dIdx} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                  <h4 className="text-xs font-bold text-teal-300 mb-2">{duty.dutyName}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {duty.staff.map((s, sIdx) => (
                      <div key={sIdx}>
                        <label className="block text-[10px] text-slate-400 mb-1">
                          Officer Slot {sIdx + 1}
                        </label>
                        <select
                          value={s.staffId}
                          onChange={(e) => {
                            const selectedStaff = staffList.find((st) => st.staff_id === e.target.value);
                            const updated = [...editWeekDuties];
                            if (selectedStaff) {
                              updated[dIdx].staff[sIdx] = {
                                staffId: selectedStaff.staff_id,
                                name: selectedStaff.full_name,
                                qualification: selectedStaff.qualification,
                              };
                              setEditWeekDuties(updated);
                            }
                          }}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                        >
                          {staffList.map((st) => (
                            <option key={st.staff_id} value={st.staff_id}>
                              {st.full_name} ({st.department || "Faculty"})
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingWeek(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditWeek}
                  disabled={isSavingEditWeek}
                  className="rounded-xl bg-[#dfba73] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition shadow-md"
                >
                  {isSavingEditWeek ? "Saving Changes..." : "Save Week Duties"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
