"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  GraduationCap,
  History,
  Info,
  Layers,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  X,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { SalamahCreativeLoader } from "@/components/ui/salamah-creative-loader";
import { formatDate } from "@/lib/date-utils";

export type PromotionClass = {
  id: string;
  name: string;
  code: string;
  grade_name: string;
  section_name: string;
};

export type AcademicSession = {
  id: string;
  name: string;
  is_current: boolean;
};

export type AcademicTerm = {
  id: string;
  session_id: string;
  name: string;
  term_number: number;
  is_current: boolean;
};

export type PromotionStudent = {
  id: string;
  admission_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string | null;
  avatar_url: string | null;
  enrollment_date: string;
  calculated_average: number | null;
};

export type PromotionRecord = {
  id: string;
  student_id: string;
  from_class_id: string;
  to_class_id: string;
  from_session_id: string;
  to_session_id: string;
  from_term_id: string | null;
  promotion_status: string;
  average_score: number | null;
  decision_reason: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  admission_number: string;
  from_class_name: string;
  from_grade_name: string;
  to_class_name: string;
  to_grade_name: string;
  from_session_name: string;
  to_session_name: string;
  decided_by_email: string | null;
};

export function StudentPromotionClient({
  classes,
  sessions,
  terms,
  initialHistory,
  currentSessionId,
  currentTermId,
}: {
  classes: PromotionClass[];
  sessions: AcademicSession[];
  terms: AcademicTerm[];
  initialHistory: PromotionRecord[];
  currentSessionId: string;
  currentTermId: string;
}) {
  const [activeTab, setActiveTab] = useState<"engine" | "history">("engine");

  // Promotion Selection State
  const [sourceClassId, setSourceClassId] = useState<string>(classes[0]?.id || "");
  const [targetClassId, setTargetClassId] = useState<string>(classes[1]?.id || classes[0]?.id || "");
  const [sourceSessionId, setSourceSessionId] = useState<string>(currentSessionId);
  const [targetSessionId, setTargetSessionId] = useState<string>(
    sessions.find((s) => s.id !== currentSessionId)?.id || currentSessionId
  );
  const [sourceTermId, setSourceTermId] = useState<string>(currentTermId);

  // Student Roster & Decisions State
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [students, setStudents] = useState<PromotionStudent[]>([]);
  const [decisions, setDecisions] = useState<
    Record<string, { status: "promoted" | "repeated" | "demoted" | "withdrawn"; remarks: string; selected: boolean }>
  >({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<PromotionRecord[]>(initialHistory);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");

  // Fetch students when source class changes
  useEffect(() => {
    if (!sourceClassId) return;
    let isCancelled = false;
    setIsLoadingStudents(true);

    fetch(`/api/students/promotion?classId=${sourceClassId}&sessionId=${sourceSessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.classStudents) {
          setStudents(data.classStudents);
          const initDecisions: Record<
            string,
            { status: "promoted" | "repeated" | "demoted" | "withdrawn"; remarks: string; selected: boolean }
          > = {};
          data.classStudents.forEach((st: PromotionStudent) => {
            const avg = st.calculated_average !== null ? Number(st.calculated_average) : 65;
            const status = avg >= 50 ? "promoted" : "repeated";
            initDecisions[st.id] = {
              status,
              remarks: avg >= 50 ? "Promoted in good academic standing." : "Advised to repeat class for foundation mastery.",
              selected: true,
            };
          });
          setDecisions(initDecisions);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!isCancelled) setIsLoadingStudents(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [sourceClassId, sourceSessionId]);

  const sourceClass = classes.find((c) => c.id === sourceClassId);
  const targetClass = classes.find((c) => c.id === targetClassId);

  // Auto-set reasonable default target class (e.g. Next Grade level)
  function handleSelectSourceClass(id: string) {
    setSourceClassId(id);
    const sourceIndex = classes.findIndex((c) => c.id === id);
    if (sourceIndex >= 0 && sourceIndex < classes.length - 1) {
      setTargetClassId(classes[sourceIndex + 1].id);
    }
  }

  // Batch Select / Toggle
  function handleToggleAll(selected: boolean) {
    setDecisions((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], selected };
      });
      return next;
    });
  }

  function handleBatchStatus(status: "promoted" | "repeated" | "demoted") {
    setDecisions((prev) => {
      const next = { ...prev };
      students.forEach((st) => {
        if (next[st.id]?.selected) {
          next[st.id] = {
            ...next[st.id],
            status,
            remarks: status === "promoted" ? "Promoted to next academic level." : "Retained in class.",
          };
        }
      });
      return next;
    });
  }

  const selectedCount = Object.values(decisions).filter((d) => d.selected).length;

  async function handleExecuteProgression() {
    if (selectedCount === 0) {
      alert("Please select at least one student to promote or retain.");
      return;
    }

    if (!confirm(`Are you sure you want to execute academic progression for ${selectedCount} student(s)?`)) {
      return;
    }

    setIsExecuting(true);
    setToastMessage(null);

    const payloadDecisions = students
      .filter((st) => decisions[st.id]?.selected)
      .map((st) => ({
        studentId: st.id,
        promotionStatus: decisions[st.id].status,
        averageScore: st.calculated_average,
        remarks: decisions[st.id].remarks,
      }));

    try {
      const res = await fetch("/api/students/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceClassId,
          targetClassId,
          sourceSessionId,
          targetSessionId,
          sourceTermId,
          decisions: payloadDecisions,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to process academic progression");
      }

      const data = await res.json();
      setToastMessage(data.message || "Progression processed successfully.");

      // Refresh history
      const histRes = await fetch("/api/students/promotion");
      const histData = await histRes.json();
      if (histData.history) setHistory(histData.history);

      // Re-query source class
      const stRes = await fetch(`/api/students/promotion?classId=${sourceClassId}&sessionId=${sourceSessionId}`);
      const stData = await stRes.json();
      if (stData.classStudents) setStudents(stData.classStudents);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error executing promotion");
    } finally {
      setIsExecuting(false);
    }
  }

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      const q = historySearch.toLowerCase();
      const matchSearch =
        h.first_name.toLowerCase().includes(q) ||
        h.last_name.toLowerCase().includes(q) ||
        h.admission_number.toLowerCase().includes(q);
      const matchStatus = historyStatusFilter === "all" || h.promotion_status === historyStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [history, historySearch, historyStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Academic Progression & Placement</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Student Class Promotion & Demotion
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Promote qualifying scholars to their next grade level, retain pupils on trial, or record academic demotions while keeping an immutable historical enrollment ledger in the database.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab("engine")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "engine"
                ? "bg-[#dfba73] text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Progression Engine</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-[#dfba73] text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Promotion Ledger ({history.length})</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/50 p-4 text-xs font-semibold text-emerald-300 shadow-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: PROGRESSION ENGINE */}
      {/* ============================================================ */}
      {activeTab === "engine" && (
        <div className="space-y-6">
          {/* Configuration Card */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#dfba73] flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Step 1: Configure Progression Route</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Source Session & Term */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Source Academic Session
                </label>
                <select
                  value={sourceSessionId}
                  onChange={(e) => setSourceSessionId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.is_current ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Class */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Source Class (Current Placement)
                </label>
                <select
                  value={sourceClassId}
                  onChange={(e) => handleSelectSourceClass(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.grade_name} - {c.name} ({c.section_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Academic Session */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Target Academic Session (New Year)
                </label>
                <select
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Class */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Target Destination Class (For Promotion)
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full rounded-xl border border-teal-500/50 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.grade_name} - {c.name} ({c.section_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visual Route Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-950/60 p-4 border border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-300 font-bold">
                  {sourceClass?.grade_name} - {sourceClass?.name}
                </span>
                <ArrowRight className="h-4 w-4 text-[#dfba73]" />
                <span className="rounded-lg bg-teal-500/20 px-2.5 py-1 text-teal-300 font-bold border border-teal-500/30">
                  {targetClass?.grade_name} - {targetClass?.name}
                </span>
                <span className="text-slate-400">
                  ({students.length} pupil{students.length === 1 ? "" : "s"} in register)
                </span>
              </div>

              {/* Batch Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBatchStatus("promoted")}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition"
                >
                  Mark Selected &ldquo;Promote&rdquo;
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchStatus("repeated")}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition"
                >
                  Mark Selected &ldquo;Repeat&rdquo;
                </button>
              </div>
            </div>
          </div>

          {/* Student Roster Table Card */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Class Roll & Progression Decisions</span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-mono text-teal-300">
                    {students.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Review student cumulative average scores and customize individual progression status.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAll(true)}
                  className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAll(false)}
                  className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Deselect All
                </button>

                <button
                  type="button"
                  disabled={isExecuting || selectedCount === 0}
                  onClick={handleExecuteProgression}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 px-5 py-2 text-xs font-extrabold text-slate-950 shadow-lg hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {isExecuting ? "Executing..." : `Execute Progression (${selectedCount})`}
                  </span>
                </button>
              </div>
            </div>

            {isLoadingStudents ? (
              <SalamahCreativeLoader
                label="Retrieving student enrollment records..."
                sublabel="Querying academic assessments and GPA averages"
                variant="inline"
              />
            ) : students.length === 0 ? (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-8 text-center text-slate-400 text-xs">
                No active students currently enrolled in this class.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <table className="w-full text-left text-xs text-slate-200 min-w-[750px]">
                  <thead className="bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCount === students.length && students.length > 0}
                          onChange={(e) => handleToggleAll(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-0"
                        />
                      </th>
                      <th className="p-4">Student Scholar</th>
                      <th className="p-4 text-center">Average Score</th>
                      <th className="p-4">Progression Decision</th>
                      <th className="p-4">Placement Destination</th>
                      <th className="p-4">Pastoral Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {students.map((st) => {
                      const decision = decisions[st.id] || { status: "promoted", remarks: "", selected: true };
                      const avg = st.calculated_average !== null ? Number(st.calculated_average) : 65;

                      return (
                        <tr
                          key={st.id}
                          className={`hover:bg-slate-800/30 transition ${
                            decision.selected ? "bg-slate-800/10" : "opacity-60"
                          }`}
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={decision.selected}
                              onChange={(e) =>
                                setDecisions((prev) => ({
                                  ...prev,
                                  [st.id]: { ...prev[st.id], selected: e.target.checked },
                                }))
                              }
                              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-0"
                            />
                          </td>

                          {/* Student Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="relative h-9 w-9 shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                                {st.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={st.avatar_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-teal-500/20 text-teal-300 font-bold text-xs">
                                    {st.first_name[0]}{st.last_name[0]}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-white block">
                                  {st.first_name} {st.middle_name ? `${st.middle_name} ` : ""}{st.last_name}
                                </span>
                                <span className="font-mono text-[10px] text-teal-300">
                                  {st.admission_number}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Cumulative Average */}
                          <td className="p-4 text-center">
                            <span
                              className={`rounded-lg px-2.5 py-1 font-mono font-bold text-xs inline-block ${
                                avg >= 70
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : avg >= 50
                                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {avg}%
                            </span>
                          </td>

                          {/* Decision Dropdown */}
                          <td className="p-4">
                            <select
                              value={decision.status}
                              onChange={(e) =>
                                setDecisions((prev) => ({
                                  ...prev,
                                  [st.id]: {
                                    ...prev[st.id],
                                    status: e.target.value as any,
                                  },
                                }))
                              }
                              className={`rounded-xl border px-3 py-1.5 text-xs font-bold focus:outline-none ${
                                decision.status === "promoted"
                                  ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                                  : decision.status === "repeated"
                                  ? "border-amber-500/40 bg-amber-950/40 text-amber-300"
                                  : "border-rose-500/40 bg-rose-950/40 text-rose-300"
                              }`}
                            >
                              <option value="promoted" className="bg-slate-900 text-white">Promote to Target Class</option>
                              <option value="repeated" className="bg-slate-900 text-white">Repeat Current Class</option>
                              <option value="demote" className="bg-slate-900 text-white">Demote to Lower Class</option>
                              <option value="withdrawn" className="bg-slate-900 text-white">Withdrawn Scholar</option>
                            </select>
                          </td>

                          {/* Placement Destination */}
                          <td className="p-4">
                            {decision.status === "promoted" ? (
                              <span className="font-semibold text-emerald-300 flex items-center gap-1">
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span>{targetClass?.grade_name} - {targetClass?.name}</span>
                              </span>
                            ) : decision.status === "repeated" ? (
                              <span className="font-semibold text-amber-300 flex items-center gap-1">
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>{sourceClass?.grade_name} - {sourceClass?.name} (Repeat)</span>
                              </span>
                            ) : (
                              <span className="font-semibold text-rose-300 flex items-center gap-1">
                                <TrendingDown className="h-3.5 w-3.5" />
                                <span>Demotion / Withdrawal</span>
                              </span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="p-4">
                            <input
                              type="text"
                              value={decision.remarks}
                              onChange={(e) =>
                                setDecisions((prev) => ({
                                  ...prev,
                                  [st.id]: {
                                    ...prev[st.id],
                                    remarks: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Enter decision rationale..."
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: PROMOTION LEDGER & AUDIT HISTORY */}
      {/* ============================================================ */}
      {activeTab === "history" && (
        <div className="space-y-4 rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Academic Progression Audit Ledger</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-mono text-teal-300">
                  {filteredHistory.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Permanent institutional log of student class promotions, retentions, and placements across all academic sessions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search student or ID..."
                  className="rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none w-48 sm:w-64"
                />
              </div>

              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
              >
                <option value="all">All Outcomes</option>
                <option value="promoted">Promoted</option>
                <option value="repeated">Repeated</option>
                <option value="demoted">Demoted</option>
              </select>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-8 text-center text-slate-400 text-xs">
              No promotion records found matching query.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full text-left text-xs text-slate-200 min-w-[780px]">
                <thead className="bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Student Scholar</th>
                    <th className="p-4">Origin Class</th>
                    <th className="p-4">Outcome</th>
                    <th className="p-4">Destination Class</th>
                    <th className="p-4">Average</th>
                    <th className="p-4">Authorized By</th>
                    <th className="p-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-800/20 transition">
                      <td className="p-4 font-mono text-[11px] text-slate-400" suppressHydrationWarning>
                        {formatDate(h.created_at)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-8 w-8 shrink-0 rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                            {h.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={h.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-teal-500/20 text-teal-300 font-bold text-xs">
                                {h.first_name[0]}{h.last_name[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white block">
                              {h.first_name} {h.last_name}
                            </span>
                            <span className="font-mono text-[10px] text-teal-300">
                              {h.admission_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-slate-300">
                          {h.from_grade_name} - {h.from_class_name}
                        </span>
                        <div className="text-[10px] text-slate-500">{h.from_session_name}</div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            h.promotion_status === "promoted"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : h.promotion_status === "repeated"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {h.promotion_status}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-teal-300">
                          {h.to_grade_name} - {h.to_class_name}
                        </span>
                        <div className="text-[10px] text-slate-500">{h.to_session_name}</div>
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-300">
                        {h.average_score !== null ? `${h.average_score}%` : "—"}
                      </td>

                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {h.decided_by_email || "System Admin"}
                      </td>

                      <td className="p-4 text-slate-300 italic text-[11px] max-w-xs truncate">
                        {h.decision_reason || "Standard academic progression."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
