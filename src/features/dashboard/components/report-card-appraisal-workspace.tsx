"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  HeartPulse,
  MessageSquare,
  PlusCircle,
  Save,
  Sparkles,
  Star,
  UserCheck,
} from "lucide-react";
import type { EnrolledStudent, TerminalReportItem, CommentItem } from "./classroom-management-client";
import { formatDate } from "@/lib/date-utils";

export function ReportCardAppraisalWorkspace({
  student,
  studentRankRow,
  enrolledStudents,
  savedReport,
  comments,
  classTeacherName,
  onSelectStudent,
  onSave,
  isSaving,
  toastVisible,
  onOpenCommentModal,
  onPreviewReportCard,
}: {
  student?: EnrolledStudent;
  studentRankRow?: any;
  enrolledStudents: EnrolledStudent[];
  savedReport?: TerminalReportItem;
  comments: CommentItem[];
  classTeacherName: string;
  onSelectStudent: (id: string) => void;
  onSave: (studentId: string, payload: Partial<TerminalReportItem>) => Promise<void>;
  isSaving: boolean;
  toastVisible: boolean;
  onOpenCommentModal: () => void;
  onPreviewReportCard: () => void;
}) {
  const currentIndex = enrolledStudents.findIndex((s) => s.id === student?.id);

  // Form State
  const [teacherComment, setTeacherComment] = useState("");
  const [principalComment, setPrincipalComment] = useState("");
  const [affectiveDomain, setAffectiveDomain] = useState<Record<string, number>>({
    punctuality: 5,
    neatness: 5,
    politeness: 5,
    honesty: 5,
    leadership: 4,
    attentiveness: 5,
    relationship: 5,
  });
  const [psychomotorDomain, setPsychomotorDomain] = useState<Record<string, number>>({
    handwriting: 4,
    sports: 5,
    verbalFluency: 4,
    artsCrafts: 4,
    toolHandling: 5,
  });
  const [daysOpened, setDaysOpened] = useState(60);
  const [daysPresent, setDaysPresent] = useState(58);
  const [daysAbsent, setDaysAbsent] = useState(2);
  const [nextResumption, setNextResumption] = useState("January 11, 2027");
  const [height, setHeight] = useState("145 cm");
  const [weight, setWeight] = useState("42 kg");
  const [showPastoralLogs, setShowPastoralLogs] = useState(false);

  // Synchronize when student or savedReport changes
  useEffect(() => {
    if (savedReport) {
      setTeacherComment(savedReport.teacher_comment || "");
      setPrincipalComment(savedReport.principal_comment || "");
      if (savedReport.affective_domain && Object.keys(savedReport.affective_domain).length > 0) {
        setAffectiveDomain(savedReport.affective_domain);
      } else {
        setAffectiveDomain({
          punctuality: 5,
          neatness: 5,
          politeness: 5,
          honesty: 5,
          leadership: 4,
          attentiveness: 5,
          relationship: 5,
        });
      }
      if (savedReport.psychomotor_domain && Object.keys(savedReport.psychomotor_domain).length > 0) {
        setPsychomotorDomain(savedReport.psychomotor_domain);
      } else {
        setPsychomotorDomain({
          handwriting: 4,
          sports: 5,
          verbalFluency: 4,
          artsCrafts: 4,
          toolHandling: 5,
        });
      }
      setDaysOpened(savedReport.days_school_opened ?? 60);
      setDaysPresent(savedReport.days_present ?? 58);
      setDaysAbsent(savedReport.days_absent ?? 2);
      setNextResumption(savedReport.next_term_resumption || "January 11, 2027");
      setHeight(savedReport.height || "145 cm");
      setWeight(savedReport.weight || "42 kg");
    } else {
      setTeacherComment("An exceptionally attentive and polite pupil who demonstrates strong analytic capability and harmonious teamwork.");
      setPrincipalComment("Promoted with commendation. Continue sustaining this exemplary standard of scholarly excellence.");
      setAffectiveDomain({
        punctuality: 5,
        neatness: 5,
        politeness: 5,
        honesty: 5,
        leadership: 4,
        attentiveness: 5,
        relationship: 5,
      });
      setPsychomotorDomain({
        handwriting: 4,
        sports: 5,
        verbalFluency: 4,
        artsCrafts: 4,
        toolHandling: 5,
      });
      setDaysOpened(60);
      setDaysPresent(58);
      setDaysAbsent(2);
      setNextResumption("January 11, 2027");
      setHeight("145 cm");
      setWeight("42 kg");
    }
  }, [student?.id, savedReport]);

  if (!student) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#092233] p-8 text-center text-slate-400">
        No students enrolled in this class to evaluate.
      </div>
    );
  }

  const affectiveTraits = [
    { key: "punctuality", label: "Punctuality & Regularity", desc: "Arrives early, attends daily" },
    { key: "neatness", label: "Neatness & Personal Hygiene", desc: "Uniform, books, appearance" },
    { key: "politeness", label: "Politeness & Courtesy", desc: "Respect for staff & fellow pupils" },
    { key: "honesty", label: "Honesty & Trustworthiness", desc: "Truthful, accountable, integer" },
    { key: "leadership", label: "Leadership & Initiative", desc: "Prefect duty, class participation" },
    { key: "attentiveness", label: "Attentiveness in Class", desc: "Focus, note-taking, curiosity" },
    { key: "relationship", label: "Peer Relations & Teamwork", desc: "Cooperative, compassionate" },
  ];

  const psychomotorTraits = [
    { key: "handwriting", label: "Handwriting & Penmanship", desc: "Legibility, neat presentation" },
    { key: "sports", label: "Sports, Games & Athletics", desc: "Physical coordination, fitness" },
    { key: "verbalFluency", label: "Verbal Fluency & Speaking", desc: "Oratory, debate, recitation" },
    { key: "artsCrafts", label: "Arts, Crafts & Drawing", desc: "Creativity, visual projects" },
    { key: "toolHandling", label: "Tool & Laboratory Handling", desc: "Safe handling of instruments" },
  ];

  const teacherSuggestions = [
    "An exceptionally attentive and polite pupil who demonstrates strong analytic capability and harmonious teamwork.",
    "Shows strong academic aptitude and consistent progress across all subjects. A pleasure to teach.",
    "Very obedient, respectful, and hardworking. Sustained an exemplary standard throughout the term.",
    "A capable pupil with great potential. Advised to dedicate more active focus to daily continuous assessments.",
  ];

  const principalSuggestions = [
    "Promoted with commendation. Continue sustaining this exemplary standard of scholarly excellence.",
    "Promoted in Good Standing. Commended for diligent conduct and academic perseverance.",
    "Promoted on Trial. Advised to focus diligently on continuous assessments and core subjects.",
    "Outstanding performance across all domains. An exemplary ambassador of Salamah Academy.",
  ];

  async function handleSaveCurrent(andNext = false) {
    if (!student) return;
    await onSave(student.id, {
      teacher_comment: teacherComment,
      principal_comment: principalComment,
      affective_domain: affectiveDomain,
      psychomotor_domain: psychomotorDomain,
      days_school_opened: daysOpened,
      days_present: daysPresent,
      days_absent: daysAbsent,
      next_term_resumption: nextResumption,
      height,
      weight,
    });

    if (andNext && currentIndex < enrolledStudents.length - 1) {
      onSelectStudent(enrolledStudents[currentIndex + 1].id);
    }
  }

  async function handleSaveCurrentAndJump(targetIndex: number) {
    if (!student) return;
    await onSave(student.id, {
      teacher_comment: teacherComment,
      principal_comment: principalComment,
      affective_domain: affectiveDomain,
      psychomotor_domain: psychomotorDomain,
      days_school_opened: daysOpened,
      days_present: daysPresent,
      days_absent: daysAbsent,
      next_term_resumption: nextResumption,
      height,
      weight,
    });

    if (targetIndex >= 0 && targetIndex < enrolledStudents.length) {
      onSelectStudent(enrolledStudents[targetIndex].id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Student Selection Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl overflow-hidden border border-[#dfba73]/40 bg-slate-900 shadow-sm">
            {student.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#dfba73]/30 to-teal-500/20 text-[#dfba73] font-bold text-base">
                {student.first_name[0]}{student.last_name[0]}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-500/40">
                Pupil {currentIndex + 1} of {enrolledStudents.length}
              </span>
              {studentRankRow && (
                <span className="rounded-md bg-[#dfba73]/20 px-2 py-0.5 text-[10px] font-bold text-[#dfba73] border border-[#dfba73]/40">
                  Rank #{studentRankRow.rank} ({studentRankRow.average}%)
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {student.first_name} {student.middle_name ? `${student.middle_name} ` : ""}{student.last_name}
            </h3>
            <span className="font-mono text-xs text-teal-300">{student.admission_number}</span>
          </div>
        </div>

        {/* Navigation & Preview Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick First / Last Jumps */}
          <button
            type="button"
            disabled={currentIndex <= 0}
            onClick={() => onSelectStudent(enrolledStudents[0].id)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-[#dfba73] hover:border-[#dfba73]/40 disabled:opacity-30 transition"
            title="Jump to First Student"
          >
            ⏮ First
          </button>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => onSelectStudent(enrolledStudents[currentIndex - 1].id)}
              className="rounded-lg p-2 text-slate-400 hover:text-white disabled:opacity-30 transition"
              title="Previous student"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={student.id}
              onChange={(e) => onSelectStudent(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold py-1 px-2 focus:outline-none cursor-pointer max-w-[190px] truncate"
            >
              {enrolledStudents.map((s, idx) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {idx + 1}. {s.first_name} {s.last_name} ({s.admission_number})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={currentIndex >= enrolledStudents.length - 1}
              onClick={() => onSelectStudent(enrolledStudents[currentIndex + 1].id)}
              className="rounded-lg p-2 text-slate-400 hover:text-white disabled:opacity-30 transition"
              title="Next student"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={currentIndex >= enrolledStudents.length - 1}
            onClick={() => onSelectStudent(enrolledStudents[enrolledStudents.length - 1].id)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-[#dfba73] hover:border-[#dfba73]/40 disabled:opacity-30 transition"
            title="Jump to Last Student"
          >
            Last ⏭
          </button>

          <button
            type="button"
            onClick={onPreviewReportCard}
            className="flex items-center gap-1.5 rounded-xl border border-[#dfba73]/40 bg-[#dfba73]/10 px-3.5 py-2 text-xs font-bold text-[#dfba73] hover:bg-[#dfba73] hover:text-slate-950 transition"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Preview Official Slip</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Appraisal Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* COLUMN 1: AFFECTIVE & PSYCHOMOTOR DOMAINS */}
        <div className="space-y-6">
          {/* Affective Domain */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="rounded-md bg-[#dfba73]/20 px-2 py-0.5 text-[10px] font-bold text-[#dfba73] uppercase tracking-wider">
                  Affective Evaluation
                </span>
                <h4 className="mt-1 text-sm font-bold text-white">
                  Behavioural & Character Development (1 to 5)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  const maxed: Record<string, number> = {};
                  affectiveTraits.forEach((t) => (maxed[t.key] = 5));
                  setAffectiveDomain(maxed);
                }}
                className="text-[11px] font-bold text-teal-400 hover:underline"
              >
                Mark All 5
              </button>
            </div>

            <div className="space-y-3">
              {affectiveTraits.map((trait) => {
                const currentVal = affectiveDomain[trait.key] ?? 5;
                return (
                  <div key={trait.key} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
                    <div>
                      <span className="text-xs font-bold text-white block">{trait.label}</span>
                      <span className="text-[10px] text-slate-400 block">{trait.desc}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() =>
                            setAffectiveDomain((prev) => ({
                              ...prev,
                              [trait.key]: num,
                            }))
                          }
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                            currentVal === num
                              ? num >= 4
                                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                                : num === 3
                                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                                : "bg-rose-500 text-white border-rose-400 shadow-sm"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Psychomotor Domain */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                  Psychomotor Evaluation
                </span>
                <h4 className="mt-1 text-sm font-bold text-white">
                  Practical Skills, Coordination & Sports (1 to 5)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  const maxed: Record<string, number> = {};
                  psychomotorTraits.forEach((t) => (maxed[t.key] = 5));
                  setPsychomotorDomain(maxed);
                }}
                className="text-[11px] font-bold text-teal-400 hover:underline"
              >
                Mark All 5
              </button>
            </div>

            <div className="space-y-3">
              {psychomotorTraits.map((trait) => {
                const currentVal = psychomotorDomain[trait.key] ?? 5;
                return (
                  <div key={trait.key} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
                    <div>
                      <span className="text-xs font-bold text-white block">{trait.label}</span>
                      <span className="text-[10px] text-slate-400 block">{trait.desc}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() =>
                            setPsychomotorDomain((prev) => ({
                              ...prev,
                              [trait.key]: num,
                            }))
                          }
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                            currentVal === num
                              ? num >= 4
                                ? "bg-teal-400 text-slate-950 border-teal-300 shadow-sm"
                                : num === 3
                                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                                : "bg-rose-500 text-white border-rose-400 shadow-sm"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 2: TEACHER COMMENTS, PRINCIPAL COMMENDATION & ATTENDANCE PROFILE */}
        <div className="space-y-6">
          {/* Form Teacher's Remarks */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                  Form Teacher Appraisal
                </span>
                <h4 className="mt-1 text-sm font-bold text-white">
                  Class Teacher&apos;s Terminal Comments & Pastoral Observation
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 italic">Signatory: {classTeacherName}</span>
            </div>

            <textarea
              rows={3}
              value={teacherComment}
              onChange={(e) => setTeacherComment(e.target.value)}
              placeholder="Enter comprehensive remarks regarding pupil's continuous academic progress, discipline, and participation..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none leading-relaxed"
            />

            {/* Quick Chips */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1.5 font-bold uppercase tracking-wider">
                Quick Recommendations (Click to insert):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {teacherSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTeacherComment(sug)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:text-[#dfba73] hover:border-[#dfba73]/40 text-left transition"
                  >
                    {sug.slice(0, 50)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Principal Endorsement */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  Executive Endorsement
                </span>
                <h4 className="mt-1 text-sm font-bold text-white">
                  Principal / Head of Academy Commendation
                </h4>
              </div>
              <span className="text-[10px] text-[#dfba73] font-bold">Official Seal</span>
            </div>

            <textarea
              rows={2}
              value={principalComment}
              onChange={(e) => setPrincipalComment(e.target.value)}
              placeholder="Principal's decision (e.g. Promoted with Commendation, Sustained academic excellence)..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none leading-relaxed"
            />

            {/* Quick Chips */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1.5 font-bold uppercase tracking-wider">
                Preset Endorsements:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {principalSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrincipalComment(sug)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:text-[#dfba73] hover:border-[#dfba73]/40 text-left transition"
                  >
                    {sug.slice(0, 45)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Term Attendance & Resumption Profile */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-md space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                Term Register Summary
              </span>
              <h4 className="mt-1 text-sm font-bold text-white">
                Attendance Counts & Next Term
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Days Opened
                </label>
                <input
                  type="number"
                  value={daysOpened}
                  onChange={(e) => setDaysOpened(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Days Present
                </label>
                <input
                  type="number"
                  value={daysPresent}
                  onChange={(e) => setDaysPresent(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-emerald-400 focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Days Absent
                </label>
                <input
                  type="number"
                  value={daysAbsent}
                  onChange={(e) => setDaysAbsent(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-rose-400 focus:border-[#dfba73] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Height
                </label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 145 cm"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Weight
                </label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 42 kg"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Next Term
                </label>
                <input
                  type="text"
                  value={nextResumption}
                  onChange={(e) => setNextResumption(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-[#dfba73] font-semibold focus:border-[#dfba73] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              {toastVisible && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Report Card Records Saved!</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveCurrentAndJump(0)}
                disabled={isSaving || currentIndex === 0}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-[#dfba73] disabled:opacity-40 transition"
                title="Update and Jump to First Pupil"
              >
                Update & First Pupil
              </button>

              <button
                type="button"
                onClick={() => handleSaveCurrent(false)}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-[#c5a059] disabled:opacity-50 transition shadow-md"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Saving..." : "Save Report Data"}</span>
              </button>

              {currentIndex < enrolledStudents.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleSaveCurrent(true)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl border border-teal-500/50 bg-teal-500/10 px-4 py-2.5 text-xs font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 disabled:opacity-50 transition"
                >
                  <span>Save & Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSaveCurrentAndJump(enrolledStudents.length - 1)}
                disabled={isSaving || currentIndex === enrolledStudents.length - 1}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-[#dfba73] disabled:opacity-40 transition"
                title="Update and Jump to Last Pupil"
              >
                Update & Last Pupil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Section: Classroom Pastoral & Behavioral Notes Log */}
      <div className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPastoralLogs(!showPastoralLogs)}
              className="flex items-center gap-2 text-sm font-bold text-white hover:text-[#dfba73] transition"
            >
              <MessageSquare className="h-4 w-4 text-[#dfba73]" />
              <span>Pastoral Incidents & Conduct Log ({comments.length} notes for this student)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenCommentModal}
            className="flex items-center gap-1.5 rounded-xl bg-teal-500/20 border border-teal-500/40 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Log Quick Pastoral Note</span>
          </button>
        </div>

        {showPastoralLogs && (
          <div className="pt-2 border-t border-slate-800 space-y-3">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No pastoral or sickness incidents recorded for {student.first_name}. Click &quot;Log Quick Pastoral Note&quot; if needed.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {comments.map((cm) => (
                  <div key={cm.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 uppercase">
                        {cm.category}
                      </span>
                      <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                        {formatDate(cm.comment_date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 italic">&quot;{cm.comment}&quot;</p>
                    <span className="text-[10px] text-slate-500 block">Logged by: {cm.author_name || "Form Teacher"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
