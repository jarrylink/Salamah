"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  LogOut,
  Printer,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { brand } from "@/config/brand";

export type StudentDashboardProps = {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    className: string;
    sessionName: string;
  };
  resultsByTerm: {
    termNumber: number;
    termName: string;
    subjects: {
      subjectName: string;
      ca1: number | null;
      ca2: number | null;
      ca3?: number | null;
      exam: number | null;
      total: number;
      grade: string;
      remark: string;
    }[];
    termAverage: number;
  }[];
  elearningResources: {
    id: string;
    title: string;
    description: string | null;
    subjectName: string;
    resourceType: "text" | "file" | "url";
    content: string;
    fileName: string | null;
    createdAt: string;
  }[];
};

export function StudentDashboardClient({
  student,
  resultsByTerm,
  elearningResources,
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"results" | "elearning">("results");
  const [selectedTermIndex, setSelectedTermIndex] = useState(0);
  const [selectedResource, setSelectedResource] = useState<(typeof elearningResources)[0] | null>(null);
  const [subjectFilter, setSubjectFilter] = useState("all");

  const currentTermResults = resultsByTerm[selectedTermIndex] || resultsByTerm[0];

  const filteredResources = elearningResources.filter((r) => {
    if (subjectFilter === "all") return true;
    return r.subjectName.toLowerCase().includes(subjectFilter.toLowerCase());
  });

  const uniqueSubjects = Array.from(new Set(elearningResources.map((r) => r.subjectName))).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#061824] text-slate-100 antialiased selection:bg-teal-500/30">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#04141e]/95 px-4 sm:px-6 lg:px-8 py-3.5 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
              <Image src={brand.assets.logo} alt="Salamah" width={40} height={40} className="h-full w-auto object-contain" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white tracking-tight">
                Salamah International School
              </h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">
                Student Academic &amp; E-Learning Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-white">
                {student.firstName} {student.lastName}
              </p>
              <p className="text-[11px] text-teal-400">
                {student.admissionNumber} • {student.className}
              </p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Student Welcome Banner */}
        <div className="rounded-3xl border border-teal-500/30 bg-gradient-to-r from-[#041a27] via-slate-900 to-[#082232] p-6 shadow-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-bold text-teal-300">
                Active Student Profile • {student.sessionName}
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">
                Hello, {student.firstName}!
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Admitted into <strong>{student.className}</strong> • Admission ID: <strong>{student.admissionNumber}</strong>
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("results")}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                  activeTab === "results"
                    ? "bg-teal-500 text-slate-950 shadow-md"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Academic Results</span>
              </button>
              <button
                onClick={() => setActiveTab("elearning")}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                  activeTab === "elearning"
                    ? "bg-teal-500 text-slate-950 shadow-md"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>E-Learning Resources ({elearningResources.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: RESULTS SLIP */}
        {activeTab === "results" && (
          <div className="mt-8 space-y-6">
            {/* Term Selector & Print Button */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {resultsByTerm.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTermIndex(idx)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                      selectedTermIndex === idx
                        ? "bg-teal-500 text-slate-950 shadow-sm"
                        : "border border-slate-800 bg-[#092233] text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {t.termName}
                  </button>
                ))}
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-teal-500/40 bg-teal-950/40 px-4 py-2 text-xs font-bold text-teal-300 hover:bg-teal-900/40"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official Result Slip</span>
              </button>
            </div>

            {/* Results Sheet Card */}
            {currentTermResults && (
              <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl sm:p-8">
                {/* Official Crest Header for Results */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-white">
                      Terminal Academic Evaluation
                    </h3>
                    <p className="mt-1 text-xs text-teal-400">
                      {currentTermResults.termName} • {student.sessionName} • {student.className}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-teal-500/20 bg-slate-900/60 px-4 py-3 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Term Average</p>
                    <p className="text-2xl font-display font-bold text-emerald-400">
                      {currentTermResults.termAverage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Subject Scores Table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3 text-center">CA 1 (10)</th>
                        <th className="p-3 text-center">CA 2 (10)</th>
                        <th className="p-3 text-center">CA 3 (10)</th>
                        <th className="p-3 text-center">Exam (70)</th>
                        <th className="p-3 text-center">Total (100)</th>
                        <th className="p-3 text-center">Grade</th>
                        <th className="p-3 text-right">Teacher Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {currentTermResults.subjects.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20 transition">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-semibold text-white">{sub.subjectName}</td>
                          <td className="p-3 text-center font-mono text-teal-300">{sub.ca1 ?? "-"}</td>
                          <td className="p-3 text-center font-mono text-teal-300">{sub.ca2 ?? "-"}</td>
                          <td className="p-3 text-center font-mono text-teal-300">{sub.ca3 ?? "-"}</td>
                          <td className="p-3 text-center font-mono text-teal-300">{sub.exam ?? "-"}</td>
                          <td className="p-3 text-center font-mono font-bold text-white">{sub.total}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                sub.grade.startsWith("A")
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : sub.grade.startsWith("B")
                                  ? "bg-teal-500/20 text-teal-300"
                                  : sub.grade.startsWith("C")
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {sub.grade}
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-300 font-medium">{sub.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Grading Scale Guide */}
                <div className="mt-8 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-[11px] text-slate-400">
                  <p className="font-semibold text-slate-300 mb-1">Salamah Grading Key:</p>
                  <p>A (75 - 100%): Distinction | B (65 - 74%): Very Good | C (50 - 64%): Credit | D (40 - 49%): Pass | F (0 - 39%): Fail</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: E-LEARNING */}
        {activeTab === "elearning" && (
          <div className="mt-8 space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSubjectFilter("all")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    subjectFilter === "all"
                      ? "bg-teal-500 text-slate-950 font-bold"
                      : "bg-[#092233] text-slate-300 hover:text-white"
                  }`}
                >
                  All Subjects
                </button>
                {uniqueSubjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSubjectFilter(sub)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      subjectFilter === sub
                        ? "bg-teal-500 text-slate-950 font-bold"
                        : "bg-[#092233] text-slate-300 hover:text-white"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources Cards Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((res) => (
                <div
                  key={res.id}
                  className="flex flex-col rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-md transition hover:border-teal-500/40"
                >
                  <div className="flex items-start justify-between">
                    <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[11px] font-bold text-teal-300">
                      {res.subjectName}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase">
                      {res.resourceType}
                    </span>
                  </div>

                  <h4 className="mt-3 font-display text-base font-bold text-white leading-snug">
                    {res.title}
                  </h4>
                  {res.description && (
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {res.description}
                    </p>
                  )}

                  <div className="mt-auto pt-6 border-t border-slate-800/80">
                    {res.resourceType === "text" && (
                      <button
                        onClick={() => setSelectedResource(res)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-teal-400"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Read Study Notes</span>
                      </button>
                    )}

                    {res.resourceType === "file" && (
                      <a
                        href={res.content}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-emerald-400"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Resource</span>
                      </a>
                    )}

                    {res.resourceType === "url" && (
                      <a
                        href={res.content}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-blue-400"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Launch Study Link</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {filteredResources.length === 0 && (
                <div className="col-span-full rounded-2xl border border-slate-800 bg-[#092233] p-8 text-center text-slate-400">
                  No learning resources found for the selected subject.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Resource Reader Modal */}
        {selectedResource && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedResource(null);
            }}
          >
            <div className="relative my-auto flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-teal-500/40 bg-[#092233] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 p-5 shrink-0 bg-[#071d2b]">
                <div>
                  <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300">
                    {selectedResource.subjectName}
                  </span>
                  <h3 className="mt-1 font-display text-lg font-bold text-white">
                    {selectedResource.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap salamah-scrollbar">
                {selectedResource.content}
              </div>

              <div className="border-t border-slate-800 p-4 text-right shrink-0 bg-[#071d2b]/60">
                <button
                  onClick={() => setSelectedResource(null)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition cursor-pointer"
                >
                  Close Reader
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
