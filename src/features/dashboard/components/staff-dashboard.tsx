"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileEdit,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers,
  LogOut,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  Printer,
  QrCode,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { SubjectTeachingCockpit } from "./subject-teaching-cockpit";

export type StaffDashboardProps = {
  staff: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    gender?: string | null;
    avatarUrl?: string | null;
    designation?: string | null;
    department: string | null;
    staffNumber: string | null;
    employmentDate?: string | null;
    employmentType?: string | null;
    managerName?: string | null;
    managerEmail?: string | null;
  };
  classes: {
    id: string;
    name: string;
    code: string;
    assignmentType: string;
    studentCount: number;
    students: { id: string; admissionNumber: string; name: string }[];
  }[];
  subjects: {
    id: string;
    name: string;
    code: string;
    classId: string;
    className: string;
    students: { id: string; admissionNumber: string; name: string }[];
    scores?: { studentId: string; score: number; typeCode: string; typeName: string }[];
    schemeWeeks?: any[];
    lessonNotes?: any[];
    lessonPlans?: any[];
  }[];
  offices: {
    id: string;
    name: string;
    code: string;
    location: string | null;
    responsibilities: string;
    logs: {
      id: string;
      logDate: string;
      weekSummary: string;
      dailyTasksCarriedOut: string;
      challenges: string | null;
      nextWeekPlan: string | null;
    }[];
  }[];
  tasks: {
    id: string;
    title: string;
    category: string;
    description: string | null;
    responsibilityDocument: string;
    frequency: string;
    status: string;
    logs: {
      id: string;
      logDate: string;
      report: string;
      status: string;
    }[];
  }[];
  notices?: {
    id: string;
    title: string;
    content: string;
    publishDate: string;
    status: string;
  }[];
  documents?: {
    id: string;
    title: string;
    docType: string;
    fileUrl: string;
    fileName?: string | null;
    fileSize?: string | null;
    category?: string | null;
    notes?: string | null;
    createdAt: string;
  }[];
};

export function StaffDashboardClient({
  staff,
  classes,
  subjects,
  offices,
  tasks,
  notices = [],
  documents = [],
}: StaffDashboardProps) {
  // Determine smart initial active tab: prioritize assigned classes or subjects so teacher sees cockpits immediately
  const initialActiveTab: "classes" | "subjects" | "noticeboard" | "tasks" | "profile" | "documents" =
    classes.length > 0 ? "classes" : subjects.length > 0 ? "subjects" : "noticeboard";
  const [activeTab, setActiveTab] = useState<"classes" | "subjects" | "noticeboard" | "tasks" | "profile" | "documents">(initialActiveTab);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Sub-tab under "tasks"
  const [taskSubTab, setTaskSubTab] = useState<"tasks" | "offices">("tasks");

  // Document Modals
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [activeViewerDoc, setActiveViewerDoc] = useState<{ title: string; docType: string; fileUrl: string; notes?: string | null } | null>(null);

  // Task Report Form State
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || "");
  const [taskReport, setTaskReport] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [isSubmittingTaskLog, setIsSubmittingTaskLog] = useState(false);
  const [taskLogFeedback, setTaskLogFeedback] = useState<string | null>(null);

  // Office Weekly Log Form State
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(offices[0]?.id || "");
  const [weekSummary, setWeekSummary] = useState("");
  const [dailyTasksCarriedOut, setDailyTasksCarriedOut] = useState("");
  const [challenges, setChallenges] = useState("");
  const [nextWeekPlan, setNextWeekPlan] = useState("");
  const [isSubmittingOfficeLog, setIsSubmittingOfficeLog] = useState(false);
  const [officeLogFeedback, setOfficeLogFeedback] = useState<string | null>(null);

  // Handler for Office Weekly Log Submission
  async function handleOfficeLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOfficeId || !weekSummary.trim() || !dailyTasksCarriedOut.trim()) {
      alert("Please fill in the Week Summary and Daily Tasks Carried Out.");
      return;
    }
    setIsSubmittingOfficeLog(true);
    setOfficeLogFeedback(null);
    try {
      const res = await fetch("/api/staff/office-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officeId: selectedOfficeId,
          weekSummary,
          dailyTasksCarriedOut,
          challenges,
          nextWeekPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit weekly log");
      setOfficeLogFeedback("Weekly office log submitted successfully.");
      setWeekSummary("");
      setDailyTasksCarriedOut("");
      setChallenges("");
      setNextWeekPlan("");
      setTimeout(() => setOfficeLogFeedback(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error submitting office log");
    } finally {
      setIsSubmittingOfficeLog(false);
    }
  }

  // Handler for Task Report Submission
  async function handleTaskLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTaskId || !taskReport.trim()) {
      alert("Please write your report before submitting.");
      return;
    }
    setIsSubmittingTaskLog(true);
    setTaskLogFeedback(null);
    try {
      const res = await fetch("/api/staff/task-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTaskId,
          report: taskReport,
          notes: taskNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit task log");
      setTaskLogFeedback("Task execution report submitted successfully.");
      setTaskReport("");
      setTaskNotes("");
      setTimeout(() => setTaskLogFeedback(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error submitting task report");
    } finally {
      setIsSubmittingTaskLog(false);
    }
  }

  const selectedSubjectObj = subjects.find((s) => s.id === selectedSubjectId);

  // If a subject is selected for embedded cockpit mode
  if (selectedSubjectId && selectedSubjectObj) {
    return (
      <SubjectTeachingCockpit
        subject={selectedSubjectObj}
        onBack={() => setSelectedSubjectId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 salamah-enter">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#092233] via-[#041a29] to-[#020d18] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[#dfba73] bg-slate-950 shadow-md">
              {staff.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={staff.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-2xl font-bold text-[#dfba73]">
                  {staff.firstName[0]}{staff.lastName[0]}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-500/20 px-3 py-0.5 text-[10px] font-bold tracking-wider text-teal-300 border border-teal-500/30 uppercase">
                  {staff.designation || "Teaching Staff"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {staff.staffNumber || "SIS-STF"}
                </span>
              </div>
              <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Welcome back, {staff.firstName} {staff.lastName}
              </h1>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#dfba73]" />
                <span>Salamah International School · Katsina State Campus</span>
                {staff.managerName && (
                  <span className="text-[#dfba73]">
                    • Reporting to Manager: <strong>{staff.managerName}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:border-rose-400 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>

        {/* Primary Workspace Navigation Tabs with Mobile Horizontal Scrolling */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-800/80 pt-4 overflow-x-auto pb-2 scrollbar-none sm:flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("classes")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === "classes"
                ? "bg-[#dfba73] text-slate-950 shadow-md ring-2 ring-amber-300/40"
                : "bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:border-[#dfba73]/50"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>My Classes</span>
            <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
              activeTab === "classes" ? "bg-slate-950 text-[#dfba73]" : "bg-teal-500/20 text-teal-300"
            }`}>
              {classes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("subjects")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === "subjects"
                ? "bg-[#dfba73] text-slate-950 shadow-md ring-2 ring-amber-300/40"
                : "bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:border-[#dfba73]/50"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>My Subjects</span>
            <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
              activeTab === "subjects" ? "bg-slate-950 text-[#dfba73]" : "bg-teal-500/20 text-teal-300"
            }`}>
              {subjects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("noticeboard")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === "noticeboard"
                ? "bg-[#dfba73] text-slate-950 shadow-md ring-2 ring-amber-300/40"
                : "bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:border-[#dfba73]/50"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Noticeboard</span>
            {notices.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                activeTab === "noticeboard" ? "bg-slate-950 text-[#dfba73]" : "bg-teal-500/20 text-teal-300"
              }`}>
                {notices.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === "tasks"
                ? "bg-[#dfba73] text-slate-950 shadow-md ring-2 ring-amber-300/40"
                : "bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:border-[#dfba73]/50"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Duties &amp; Tasks ({tasks.length + offices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === "profile"
                ? "bg-[#dfba73] text-slate-950 shadow-md ring-2 ring-amber-300/40"
                : "bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:border-[#dfba73]/50"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === "documents"
                ? "bg-[#dfba73] text-slate-950 shadow-md ring-2 ring-amber-300/40"
                : "bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:border-[#dfba73]/50"
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span>Documents ({documents.length || 2})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB: MY CLASSES (CLASSROOM MANAGEMENT COCKPITS)           */}
      {/* ======================================================== */}
      {activeTab === "classes" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#092233] p-4 shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73] block">
                Classroom Leadership &amp; Form Master Administration
              </span>
              <h2 className="font-serif text-lg font-bold text-white">
                Assigned Class Management Cockpits ({classes.length})
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Complete pastoral control: take daily student attendance, manage continuous assessment scoresheets, appraise affective/psychomotor domains, record term remarks, and print single or bulk batch report cards.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="rounded-3xl border-2 border-slate-800 bg-[#092233] p-6 shadow-xl flex flex-col justify-between hover:border-[#dfba73]/60 transition space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-teal-500/20 px-2.5 py-1 text-xs font-bold text-teal-300 border border-teal-500/30 font-mono">
                      {cls.code}
                    </span>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                      {cls.studentCount} Pupils Enrolled
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-2xl font-bold text-white">
                    {cls.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Role in Class: <strong className="text-amber-300 capitalize">{cls.assignmentType.replace("_", " ")}</strong>
                  </p>
                </div>

                <div className="space-y-2.5 border-t border-slate-800 pt-4">
                  <Link
                    href={`/dashboard/classes/${cls.id}`}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#dfba73] py-2.5 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition font-semibold"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Launch Full Classroom Management Cockpit</span>
                  </Link>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/dashboard/classes/${cls.id}?tab=attendance`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 hover:border-teal-500 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                      <span>Daily Register</span>
                    </Link>
                    <Link
                      href={`/dashboard/classes/${cls.id}?tab=continuous-assessment`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 hover:border-amber-500 transition"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-amber-400" />
                      <span>Scores Mastersheet</span>
                    </Link>
                    <Link
                      href={`/dashboard/classes/${cls.id}?tab=report-cards`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 hover:border-blue-500 transition"
                    >
                      <Printer className="h-3.5 w-3.5 text-blue-400" />
                      <span>Report Cards &amp; Print</span>
                    </Link>
                    <Link
                      href={`/dashboard/classes/${cls.id}?tab=comments`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 hover:border-emerald-500 transition"
                    >
                      <FileEdit className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Remarks &amp; Domains</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {!classes.length && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-800 bg-[#092233]/40 p-12 text-center text-slate-400">
                <GraduationCap className="mx-auto h-10 w-10 text-slate-600 mb-3" />
                <h4 className="font-bold text-white text-base">No Assigned Classes Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  You are not currently assigned as a Form Teacher or Class Lead to any class stream.
                  Your school administrator can assign you to a class in Academic Structure.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: MY SUBJECTS (SUBJECT TEACHING COCKPITS)             */}
      {/* ======================================================== */}
      {activeTab === "subjects" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#092233] p-4 shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73] block">
                Instructional Delivery &amp; Subject Mastery
              </span>
              <h2 className="font-serif text-lg font-bold text-white">
                Assigned Subject Teaching Cockpits ({subjects.length})
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Curriculum instructional delivery: curate your 12-week Schemes of Work, draft and publish Weekly Lesson Notes, prepare Lesson Plans, and record or batch-upload Continuous Assessment marks.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {subjects.map((s) => (
              <div
                key={`${s.id}-${s.classId}`}
                className="rounded-3xl border-2 border-slate-800 bg-[#092233] p-6 shadow-xl flex flex-col justify-between hover:border-teal-500/60 transition space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-300 border border-blue-500/30 font-mono">
                      {s.code}
                    </span>
                    <span className="rounded-md bg-teal-500/20 px-2.5 py-1 text-xs font-bold text-teal-300 border border-teal-500/30">
                      Class: {s.className}
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-2xl font-bold text-white">
                    {s.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Enrolled Pupils taking this Subject: <strong className="text-teal-300 font-mono">{s.students?.length || 0}</strong>
                  </p>
                </div>

                <div className="space-y-2.5 border-t border-slate-800 pt-4">
                  <Link
                    href={`/dashboard/subjects/${s.id}?classId=${s.classId}`}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400 transition"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Launch Full Subject Teaching Cockpit</span>
                  </Link>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/dashboard/subjects/${s.id}?classId=${s.classId}&tab=scheme`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 hover:border-amber-500 transition"
                    >
                      <Layers className="h-3.5 w-3.5 text-amber-400" />
                      <span>Scheme of Work (12 Wks)</span>
                    </Link>
                    <Link
                      href={`/dashboard/subjects/${s.id}?classId=${s.classId}&tab=notes`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 hover:border-blue-500 transition"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-400" />
                      <span>Weekly Lesson Notes</span>
                    </Link>
                    <Link
                      href={`/dashboard/subjects/${s.id}?classId=${s.classId}&tab=plans`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 hover:border-teal-500 transition"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5 text-teal-400" />
                      <span>Lesson Plans</span>
                    </Link>
                    <Link
                      href={`/dashboard/subjects/${s.id}?classId=${s.classId}&tab=scores`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 hover:border-emerald-500 transition"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Scores &amp; Upload</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {!subjects.length && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-800 bg-[#092233]/40 p-12 text-center text-slate-400">
                <BookOpen className="mx-auto h-10 w-10 text-slate-600 mb-3" />
                <h4 className="font-bold text-white text-base">No Teaching Subjects Assigned Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  You are not currently assigned to teach any subjects.
                  Your school administrator can assign you to subjects in the Curriculum Architecture module.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MY NOTICEBOARD                                     */}
      {/* ======================================================== */}
      {activeTab === "noticeboard" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#092233] p-4 shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73] block">
                Official School Communications
              </span>
              <h2 className="font-serif text-lg font-bold text-white">
                Faculty &amp; Assembly Noticeboard
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Active Session: <strong className="text-teal-300">2026/2027</strong> • First Term
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notices.map((n) => (
              <div
                key={n.id}
                className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-md bg-[#dfba73]/15 px-2 py-0.5 text-[9.5px] font-bold text-[#dfba73] border border-[#dfba73]/30 uppercase">
                      Circular Notice
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {n.publishDate}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-white leading-snug">
                    {n.title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {n.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-teal-400 font-semibold">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Verified Directorate Notice</span>
                  </span>
                  <span>Katsina Campus</span>
                </div>
              </div>
            ))}

            {!notices.length && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
                No active announcements on the noticeboard at this time.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PROFILE                                            */}
      {/* ======================================================== */}
      {activeTab === "profile" && (
        <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 sm:p-8 shadow-xl max-w-4xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73] block">
              Official Faculty Ledger
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">
              Teacher Profile &amp; Appointment Details
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex flex-col items-center">
              <div className="relative h-36 w-32 overflow-hidden rounded-2xl border-2 border-[#dfba73] bg-slate-950 shadow-md">
                {staff.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={staff.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-serif text-3xl font-bold text-[#dfba73]">
                    {staff.firstName[0]}{staff.lastName[0]}
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-[#092233]/90 text-[8px] font-bold text-amber-200 uppercase tracking-widest text-center py-0.5">
                  Verified Staff
                </div>
              </div>
              <span className="mt-2 text-xs font-mono font-bold text-teal-300">{staff.staffNumber}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Full Legal Name</span>
                <span className="font-serif text-base font-bold text-white mt-1 block">
                  {staff.firstName} {staff.lastName}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Designation</span>
                <span className="font-bold text-teal-300 mt-1 block capitalize">
                  {staff.designation || "Teaching Staff"}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Official Email</span>
                <span className="font-mono text-white mt-1 block">{staff.email}</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Department</span>
                <span className="text-white mt-1 block">{staff.department}</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Appointment Date</span>
                <span className="text-white mt-1 block">{staff.employmentDate || "September 1, 2024"}</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Supervisory Manager</span>
                <span className="text-amber-300 mt-1 block">{staff.managerName || "School Directorate"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MY DUTIES & TASKS (SPECIAL TASKS & OFFICES)        */}
      {/* ======================================================== */}
      {activeTab === "tasks" && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setTaskSubTab("tasks")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                taskSubTab === "tasks" ? "bg-[#dfba73] text-slate-950 shadow-md" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Special Duties &amp; School Tasks ({tasks.length})
            </button>
            {offices.length > 0 && (
              <button
                type="button"
                onClick={() => setTaskSubTab("offices")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  taskSubTab === "offices" ? "bg-[#dfba73] text-slate-950 shadow-md" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Assigned Offices ({offices.length})
              </button>
            )}
          </div>

          {/* 1. SPECIAL SCHOOL TASKS */}
          {taskSubTab === "tasks" && (
            <div className="space-y-6">
              {taskLogFeedback && (
                <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/50 p-4 text-xs font-bold text-emerald-200">
                  {taskLogFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {tasks.map((tsk) => (
                  <div
                    key={tsk.id}
                    className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30 uppercase">
                        {tsk.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono capitalize">
                        {tsk.frequency}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-white">
                      {tsk.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {tsk.description || tsk.responsibilityDocument}
                    </p>

                    <div className="pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSelectedTaskId(tsk.id)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition ${
                          selectedTaskId === tsk.id
                            ? "bg-[#dfba73] text-slate-950 shadow-md"
                            : "bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
                        }`}
                      >
                        {selectedTaskId === tsk.id ? "Selected for Report" : "Select to Submit Report"}
                      </button>
                    </div>
                  </div>
                ))}

                {!tasks.length && (
                  <div className="col-span-full rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
                    No special school tasks assigned.
                  </div>
                )}
              </div>

              {/* Task Report Submission Form */}
              {tasks.length > 0 && (
                <form
                  onSubmit={handleTaskLogSubmit}
                  className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-4 max-w-2xl"
                >
                  <h3 className="font-serif text-lg font-bold text-white">
                    Submit Task Execution Report
                  </h3>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Report &amp; Evidence
                    </label>
                    <textarea
                      rows={4}
                      value={taskReport}
                      onChange={(e) => setTaskReport(e.target.value)}
                      placeholder="Detail actions taken, students supervised, or outcomes achieved..."
                      required
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingTaskLog}
                      className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition shadow-md"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isSubmittingTaskLog ? "Submitting..." : "Submit Task Report"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 4. ASSIGNED OFFICES */}
          {taskSubTab === "offices" && offices.length > 0 && (
            <div className="space-y-6">
              {officeLogFeedback && (
                <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/50 p-4 text-xs font-bold text-emerald-200">
                  {officeLogFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {offices.map((off) => (
                  <div key={off.id} className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#dfba73]">{off.code}</span>
                      <span className="text-xs text-slate-400">{off.location}</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white">{off.name}</h3>
                    <p className="text-xs text-slate-300">{off.responsibilities}</p>
                  </div>
                ))}
              </div>

              {/* Office Weekly Log Submission */}
              <form onSubmit={handleOfficeLogSubmit} className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-4 max-w-2xl">
                <h3 className="font-serif text-lg font-bold text-white">Submit Weekly Office Log</h3>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Week Summary</label>
                  <input
                    type="text"
                    value={weekSummary}
                    onChange={(e) => setWeekSummary(e.target.value)}
                    placeholder="e.g. Conducted laboratory calibrations and safety inspection"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Daily Tasks Carried Out</label>
                  <textarea
                    rows={4}
                    value={dailyTasksCarriedOut}
                    onChange={(e) => setDailyTasksCarriedOut(e.target.value)}
                    placeholder="Monday: ..., Tuesday: ..."
                    required
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingOfficeLog}
                    className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isSubmittingOfficeLog ? "Submitting..." : "Submit Weekly Log"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MY DOCUMENTS                                       */}
      {/* ======================================================== */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#092233] p-4 shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73] block">
                Official Credential &amp; Employment Dossier
              </span>
              <h2 className="font-serif text-lg font-bold text-white">
                Institutional File System
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Verified by School Directorate · Katsina Campus
            </span>
          </div>

          {/* Quick Access to Primary Credentials */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* 1. Employment Agreement Document */}
            <div className="rounded-3xl border border-teal-500/40 bg-gradient-to-br from-[#0c3552] to-[#092233] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-teal-500/20 px-2.5 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-500/40 uppercase">
                  Primary Contract
                </span>
                <span className="text-xs text-slate-400">Legal Agreement</span>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-white">
                  Official Employment Agreement
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Binding contract of appointment, salary terms, code of conduct, and service conditions at Salamah International School Katsina.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Status: Signed &amp; Active</span>
                <button
                  type="button"
                  onClick={() => setIsAgreementModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition shadow-md"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Official Agreement</span>
                </button>
              </div>
            </div>

            {/* 2. Official Staff ID Card */}
            <div className="rounded-3xl border border-[#dfba73]/40 bg-gradient-to-br from-[#1c1809] to-[#092233] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-[#dfba73]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#dfba73] border border-[#dfba73]/40 uppercase">
                  Campus Credential
                </span>
                <span className="text-xs text-slate-400">Security Access</span>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-white">
                  Staff Identity Card (Digital Badge)
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Official institutional ID badge with security barcode, passport photo, staff ID number, and verification clearance.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">ID: {staff.staffNumber}</span>
                <button
                  type="button"
                  onClick={() => setIsIdCardModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#dfba73] px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition shadow-md"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Staff ID Card</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dossier File System List */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-white">
              All Files in Dossier ({documents.length})
            </h3>
            <p className="text-xs text-slate-300">
              Documents added or updated in your file system via Access Control (e.g. Promotion Letters, Academic Degrees, NYSC, and Certificates).
            </p>

            <div className="space-y-2 pt-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-300 border border-teal-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{doc.title}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="rounded-md bg-slate-800 px-1.5 py-0.2 font-mono text-[#dfba73] capitalize">
                          {doc.docType.replace("_", " ")}
                        </span>
                        <span>• {doc.fileSize || "180 KB"}</span>
                        <span>• {new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveViewerDoc({ title: doc.title, docType: doc.docType, fileUrl: doc.fileUrl, notes: doc.notes })}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:border-[#dfba73] transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View File</span>
                  </button>
                </div>
              ))}

              {!documents.length && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No additional files currently uploaded to your dossier.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: EMPLOYMENT AGREEMENT DOCUMENT VIEWER            */}
      {/* ======================================================== */}
      {isAgreementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-teal-500/50 bg-white text-slate-900 p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://res.cloudinary.com/djkudkxmx/image/upload/v1781003815/salamah_fav_icon_jxar2b.png"
                  alt="Salamah Crest"
                  className="h-14 w-14 object-contain"
                />
                <div>
                  <h2 className="font-serif text-xl font-bold uppercase text-[#092233]">
                    Salamah International School · Katsina
                  </h2>
                  <p className="text-[10px] uppercase font-bold text-[#8c6b2d] tracking-wider">
                    Official Contract of Employment &amp; Conditions of Service
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAgreementModalOpen(false)}
                className="text-slate-400 hover:text-slate-900"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="text-xs space-y-4 leading-relaxed text-slate-800">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <span className="font-bold text-[#092233] block">APPOINTEE DETAILS:</span>
                <p className="mt-1">
                  <strong>Employee:</strong> {staff.firstName} {staff.lastName} | <strong>Staff ID:</strong> {staff.staffNumber}
                </p>
                <p>
                  <strong>Designation:</strong> {staff.designation} | <strong>Department:</strong> {staff.department}
                </p>
                <p>
                  <strong>Appointment Date:</strong> {staff.employmentDate || "September 1, 2024"} | <strong>Location:</strong> Katsina Campus
                </p>
              </div>

              <h3 className="font-serif text-sm font-bold text-[#092233] uppercase">
                1. Instructional Duties &amp; Classroom Governance
              </h3>
              <p>
                The employee agrees to deliver high-quality instruction in accordance with the British Cambridge and Nigerian National Curricula. The employee shall prepare and maintain weekly schemes of work, lesson notes, and lesson plans for all assigned subjects before the commencement of each academic week.
              </p>

              <h3 className="font-serif text-sm font-bold text-[#092233] uppercase">
                2. Continuous Assessment &amp; Ledger Integrity
              </h3>
              <p>
                Continuous assessment (CA 1, CA 2, CA 3) and terminal examination scores must be entered promptly into the official Salamah Subject Cockpit. Falsification or unauthorized tampering with academic scores constitutes immediate grounds for disciplinary review.
              </p>

              <h3 className="font-serif text-sm font-bold text-[#092233] uppercase">
                3. Pastoral Care &amp; Code of Professional Conduct
              </h3>
              <p>
                The employee shall maintain exemplary moral conduct, punctuality, and compassionate guidance toward all scholars, reflecting the core Salamah values of Knowledge, Character, and Peaceful Co-existence.
              </p>

              <div className="pt-6 border-t flex items-center justify-between text-xs">
                <div>
                  <span className="block font-bold text-[#092233]">Dr. Aminu Katsina</span>
                  <span className="text-[10px] text-slate-500">Director of Academic Affairs</span>
                  <span className="block text-[9px] text-[#8c6b2d] font-bold uppercase mt-1">Official Seal Affixed</span>
                </div>

                <div className="text-right">
                  <span className="block font-bold text-[#092233]">{staff.firstName} {staff.lastName}</span>
                  <span className="text-[10px] text-slate-500">Employee Signature</span>
                  <span className="block text-[9px] text-emerald-700 font-bold uppercase mt-1">Electronically Signed</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-[#092233] px-4 py-2 text-xs font-bold text-white hover:bg-[#061826]"
              >
                <Printer className="h-4 w-4 text-[#dfba73]" />
                <span>Print Agreement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: STAFF ID CARD VIEWER                            */}
      {/* ======================================================== */}
      {isIdCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border-2 border-[#dfba73] bg-gradient-to-b from-[#092233] via-[#041a29] to-[#020b14] p-6 text-white shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#dfba73]">
                Official Staff Credential
              </span>
              <button type="button" onClick={() => setIsIdCardModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/djkudkxmx/image/upload/v1781003815/salamah_fav_icon_jxar2b.png"
                alt="Salamah"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-white">
                  Salamah International School
                </h3>
                <p className="text-[9px] text-[#dfba73] uppercase tracking-widest">
                  Katsina State Campus · Nigeria
                </p>
              </div>

              {/* Passport Photo */}
              <div className="relative h-28 w-24 overflow-hidden rounded-xl border-2 border-[#dfba73] bg-slate-950 shadow-md">
                {staff.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={staff.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-serif text-2xl font-bold text-[#dfba73]">
                    {staff.firstName[0]}{staff.lastName[0]}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-serif text-lg font-bold text-white">
                  {staff.firstName} {staff.lastName}
                </h4>
                <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-500/30 uppercase block mt-1">
                  {staff.designation}
                </span>
                <span className="font-mono text-xs text-[#dfba73] block mt-1 font-bold">
                  ID: {staff.staffNumber}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Dept: {staff.department}
                </span>
              </div>

              {/* Barcode / Security Strip */}
              <div className="w-full pt-3 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>SECURITY LEVEL: A1</span>
                <span>EXP: 2027/08</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: GENERIC DOSSIER DOCUMENT VIEWER                 */}
      {/* ======================================================== */}
      {activeViewerDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-teal-500/40 bg-[#092233] p-6 text-white shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                  Dossier Document
                </span>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  {activeViewerDoc.title}
                </h3>
              </div>
              <button type="button" onClick={() => setActiveViewerDoc(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
              <p>
                <strong>Type:</strong> <span className="capitalize">{activeViewerDoc.docType.replace("_", " ")}</span>
              </p>
              <p>
                <strong>File Reference:</strong> <span className="font-mono text-teal-300">{activeViewerDoc.fileUrl}</span>
              </p>
              {activeViewerDoc.notes && (
                <p>
                  <strong>Directorate Notes:</strong> {activeViewerDoc.notes}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <a
                href={activeViewerDoc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400"
              >
                <Download className="h-4 w-4" />
                <span>Open / Download Document</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
