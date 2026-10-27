"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  X,
  History,
  GraduationCap,
  Activity,
  ChevronRight
} from "lucide-react";

export type ClassStat = {
  id: string;
  name: string;
  code: string;
  total: number;
  present: number;
  absent: number;
  rate: number;
};

export type DayHistory = {
  date: string;
  present: number;
  absent: number;
  total: number;
  rate: number;
};

export type SectionTelemetry = {
  sectionName: string;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  rate: number;
  classes: ClassStat[];
  history: DayHistory[];
};

export function SuperadminAttendanceTelemetry({
  sectionsData,
  overallTotal,
  overallHistory,
  todayStr,
}: {
  sectionsData: SectionTelemetry[];
  overallTotal: {
    total: number;
    present: number;
    absent: number;
    rate: number;
  };
  overallHistory: DayHistory[];
  todayStr: string;
}) {
  const [historyModalTarget, setHistoryModalTarget] = useState<string | null>(null);

  const selectedSectionHistory = historyModalTarget === "overall"
    ? { name: "Overall School Attendance History", history: overallHistory }
    : sectionsData.find((s) => s.sectionName === historyModalTarget)
    ? {
        name: `${historyModalTarget} Wing Attendance History`,
        history: sectionsData.find((s) => s.sectionName === historyModalTarget)!.history,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* SECTIONAL STUDENTS LIVE STATISTICS (NURSERY, PRIMARY, SECONDARY) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {sectionsData.map((sec) => (
          <div
            key={sec.sectionName}
            className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-white">
                      {sec.sectionName} Wing
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">Roll-Call Telemetry</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="rounded-full bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                    {sec.rate}% Present
                  </span>
                </div>
              </div>

              {/* Section Totals Summary Banner */}
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950/60 p-2.5 border border-slate-800/80 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total</div>
                  <div className="font-bold text-white text-sm">{sec.totalStudents}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Present</div>
                  <div className="font-bold text-emerald-300 text-sm">{sec.presentStudents}</div>
                </div>
                <div>
                  <div className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold">Absent</div>
                  <div className="font-bold text-rose-300 text-sm">{sec.absentStudents}</div>
                </div>
              </div>

              {/* Classes List */}
              <div className="mt-4 space-y-2.5">
                {sec.classes.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">No active classes in this wing.</p>
                ) : (
                  sec.classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-2.5 transition hover:border-slate-700 hover:bg-slate-900"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <Link
                          href={`/dashboard/classes/${cls.id}`}
                          className="font-bold text-white hover:text-[#dfba73] hover:underline flex items-center gap-1"
                        >
                          <span>{cls.name}</span>
                          <ChevronRight className="h-3 w-3 opacity-60" />
                        </Link>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-emerald-300 font-semibold">{cls.present} pres</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-rose-400 font-semibold">{cls.absent} abs</span>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-300 font-bold">{cls.total}</span>
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${cls.rate}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Small History Button under Section */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Day Record: {todayStr}</span>
              <button
                onClick={() => setHistoryModalTarget(sec.sectionName)}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-[#dfba73] transition"
              >
                <History className="h-3 w-3" />
                <span>History</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* OVERALL SCHOOL TOTALS BAR */}
      {/* ======================================================== */}
      <div className="rounded-3xl border border-[#dfba73]/30 bg-gradient-to-r from-[#031522] via-[#08293d] to-[#031522] p-5 shadow-xl text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dfba73]/20 border border-[#dfba73]/40 text-[#dfba73] font-bold">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <span className="rounded-full border border-[#dfba73]/40 bg-[#dfba73]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
                Consolidated Roll-Call Telemetry
              </span>
              <h3 className="mt-1 font-serif text-lg font-bold text-white sm:text-xl">
                Institution-Wide Attendance Overview
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Students</div>
              <div className="text-xl font-bold font-serif text-white">{overallTotal.total}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-emerald-400 uppercase font-semibold">Total Present</div>
              <div className="text-xl font-bold font-serif text-emerald-300">{overallTotal.present}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-rose-400 uppercase font-semibold">Total Absent</div>
              <div className="text-xl font-bold font-serif text-rose-400">{overallTotal.absent}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-[#dfba73] uppercase font-semibold">Roll Rate</div>
              <div className="text-xl font-bold font-serif text-[#dfba73]">{overallTotal.rate}%</div>
            </div>

            <button
              onClick={() => setHistoryModalTarget("overall")}
              className="flex items-center gap-1.5 rounded-xl bg-[#dfba73] px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition shadow-md"
            >
              <History className="h-3.5 w-3.5" />
              <span>Full History</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* HISTORICAL ATTENDANCE MODAL */}
      {/* ======================================================== */}
      {selectedSectionHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#dfba73]/40 bg-[#061b29] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#dfba73]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  {selectedSectionHistory.name}
                </h3>
              </div>
              <button
                onClick={() => setHistoryModalTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5 text-center">Present</th>
                      <th className="px-3.5 py-2.5 text-center">Absent</th>
                      <th className="px-3.5 py-2.5 text-center">Total</th>
                      <th className="px-3.5 py-2.5 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {selectedSectionHistory.history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3.5 py-6 text-center text-slate-400">
                          No historical roll-call logs found for this period.
                        </td>
                      </tr>
                    ) : (
                      selectedSectionHistory.history.map((h, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="px-3.5 py-2.5 font-mono text-white font-medium">
                            {h.date}
                          </td>
                          <td className="px-3.5 py-2.5 text-center text-emerald-300 font-bold">
                            {h.present}
                          </td>
                          <td className="px-3.5 py-2.5 text-center text-rose-400 font-bold">
                            {h.absent}
                          </td>
                          <td className="px-3.5 py-2.5 text-center text-slate-300 font-semibold">
                            {h.total}
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <span className="rounded-full bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                              {h.rate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setHistoryModalTarget(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
