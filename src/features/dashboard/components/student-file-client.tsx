"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  GraduationCap,
  HeartPulse,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  PlusCircle,
  Printer,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/date-utils";

export type StudentFileProps = {
  student: {
    id: string;
    admission_number: string;
    admission_date: string;
    student_status: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    gender: string | null;
    date_of_birth: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    avatar_url: string | null;
    class_id: string | null;
    class_name: string | null;
    class_code: string | null;
    grade_name: string | null;
    section_name: string | null;
    class_teacher_name: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
    guardian_email: string | null;
    guardian_relationship: string | null;
  };
  fileEntries: {
    id: string;
    entry_type: "document" | "text" | "url" | "activity";
    title: string;
    content: string | null;
    file_url: string | null;
    file_name: string | null;
    file_size: string | null;
    url_link: string | null;
    category: string;
    author_name: string | null;
    created_at: string;
  }[];
  comments: {
    id: string;
    category: string;
    comment: string;
    comment_date: string;
    author_name: string | null;
    created_at: string;
  }[];
  attendanceSummary: {
    total_days: number;
    days_present: number;
    days_absent: number;
    days_late: number;
    days_excused: number;
  };
  scores: {
    score: number;
    assessment_name: string;
    maximum_score: number;
    subject_name: string;
    type_name: string;
  }[];
};

export function StudentFileClient({
  student,
  fileEntries: initialEntries,
  comments: initialComments,
  attendanceSummary,
  scores,
}: StudentFileProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [comments, setComments] = useState(initialComments);
  const [activeTab, setActiveTab] = useState<"documents" | "activity" | "comments" | "academics">("documents");

  // Activity Filter
  const [activityFilter, setActivityFilter] = useState("all");

  // Modal: Add Activity / File Entry
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<"document" | "text" | "url">("text");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryCategory, setEntryCategory] = useState("general");
  const [entryContent, setEntryContent] = useState("");
  const [entryFileUrl, setEntryFileUrl] = useState("");
  const [entryFileName, setEntryFileName] = useState("");
  const [entryUrlLink, setEntryUrlLink] = useState("");
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);

  // Modal: Add Teacher Comment
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentCategory, setCommentCategory] = useState("academic");
  const [commentText, setCommentText] = useState("");
  const [commentDate, setCommentDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Profile Picture URL State
  const [avatarUrl, setAvatarUrl] = useState(student.avatar_url);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [inputPhotoUrl, setInputPhotoUrl] = useState(student.avatar_url || "");
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);

  const PRESET_AVATARS = [
    { label: "Boy 1", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80" },
    { label: "Boy 2", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80" },
    { label: "Girl 1", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80" },
    { label: "Girl 2", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
  ];

  async function handleUpdatePhoto(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingPhoto(true);
    try {
      const res = await fetch("/api/students/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-student",
          studentId: student.id,
          avatarUrl: inputPhotoUrl.trim() || null,
          passportUrl: inputPhotoUrl.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile picture URL");
      setAvatarUrl(inputPhotoUrl.trim() || null);
      setIsPhotoModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating picture");
    } finally {
      setIsSubmittingPhoto(false);
    }
  }

  const fullName = `${student.first_name} ${student.middle_name ? `${student.middle_name} ` : ""}${student.last_name}`;

  // Filtered documents (entry_type === 'document')
  const documentEntries = entries.filter((e) => e.entry_type === "document");

  // Filtered timeline entries
  const timelineEntries = entries.filter((e) => {
    if (activityFilter === "all") return true;
    if (activityFilter === "document") return e.entry_type === "document";
    if (activityFilter === "text") return e.entry_type === "text";
    if (activityFilter === "url") return e.entry_type === "url";
    if (activityFilter === "medical") return e.category === "medical";
    if (activityFilter === "discipline") return e.category === "discipline";
    return true;
  });

  // Handle Add Activity
  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!entryTitle) return;

    setIsSubmittingEntry(true);
    try {
      const res = await fetch("/api/students/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          entryType,
          title: entryTitle,
          category: entryCategory,
          content: entryContent,
          fileUrl: entryType === "document" ? entryFileUrl || "https://res.cloudinary.com/djkudkxmx/image/upload/v1790626126/screen_2_fcf81s.jpg" : undefined,
          fileName: entryType === "document" ? entryFileName || `${entryTitle.replace(/\s+/g, "_")}.pdf` : undefined,
          fileSize: entryType === "document" ? "1.1 MB" : undefined,
          urlLink: entryType === "url" ? entryUrlLink : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save activity");

      setEntries((prev) => [data.entry, ...prev]);
      setIsActivityModalOpen(false);
      setEntryTitle("");
      setEntryContent("");
      setEntryFileUrl("");
      setEntryFileName("");
      setEntryUrlLink("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving activity");
    } finally {
      setIsSubmittingEntry(false);
    }
  }

  // Handle Add Comment
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText || !student.class_id) {
      alert("Comment text is required and student must be enrolled in a class.");
      return;
    }

    setIsSubmittingComment(true);
    try {
      const res = await fetch("/api/classroom/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          classId: student.class_id,
          category: commentCategory,
          comment: commentText,
          commentDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save comment");

      setComments((prev) => [data.comment, ...prev]);
      setIsCommentModalOpen(false);
      setCommentText("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving comment");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  // Handle Delete Entry
  async function handleDeleteEntry(id: string) {
    if (!confirm("Are you sure you want to remove this file entry?")) return;
    try {
      const res = await fetch(`/api/students/activity?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }

  const attendanceRate = attendanceSummary?.total_days
    ? Math.round((attendanceSummary.days_present / attendanceSummary.total_days) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* HEADER & DOSSIER BADGE */}
      <div className="rounded-3xl border border-[#dfba73]/30 bg-[#092233] p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/students"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition"
              title="Return to Student Registry"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="relative group shrink-0">
              <a
                href={avatarUrl || "#"}
                target={avatarUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl overflow-hidden border-2 border-[#dfba73]/50 shadow-md bg-slate-900 group-hover:border-[#dfba73] transition cursor-pointer"
                title={avatarUrl ? "Click to view full profile picture URL in new tab" : "Student profile photo"}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-full w-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#dfba73]/40 to-teal-500/20 text-[#dfba73] font-bold text-xl">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                )}
              </a>
              <button
                type="button"
                onClick={() => {
                  setInputPhotoUrl(avatarUrl || "");
                  setIsPhotoModalOpen(true);
                }}
                className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-[#dfba73] text-slate-950 shadow-md hover:bg-[#c5a059] transition hover:scale-110"
                title="Update Profile Picture URL"
              >
                <Camera className="h-3 w-3" />
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#dfba73]/40 bg-[#dfba73]/15 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.16em] text-[#dfba73] uppercase">
                  Official Dossier File
                </span>
                <span className="rounded-full bg-teal-500/20 border border-teal-500/30 px-2.5 py-0.5 text-[10px] font-bold text-teal-300 font-mono">
                  {student.admission_number}
                </span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                  {student.student_status}
                </span>
              </div>

              <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {fullName}
              </h1>

              <p className="mt-0.5 text-xs text-slate-300">
                {student.class_name ? (
                  <span>
                    Enrolled in <strong className="text-white">{student.class_name}</strong> ({student.grade_name || "Grade"}) • {student.section_name || "Salamah Academy"}
                  </span>
                ) : (
                  <span className="text-amber-400">Class placement pending</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {student.class_id && (
              <Link
                href={`/dashboard/classes/${student.class_id}`}
                className="flex items-center gap-2 rounded-xl border border-teal-500/50 bg-teal-500/10 px-4 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition shadow-sm"
              >
                <GraduationCap className="h-4 w-4" />
                <span>Open Classroom Cockpit</span>
              </Link>
            )}

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print File</span>
            </button>

            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition shadow-md"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add to File</span>
            </button>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: BIODATA, PLACEMENT, GUARDIAN & STATS */}
        <div className="space-y-4 lg:col-span-4">
          {/* Biodata Card */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-md">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#dfba73] mb-3 flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              <span>Student Biodata</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Date of Birth:</span>
                <span className="font-medium text-white" suppressHydrationWarning>
                  {formatDate(student.date_of_birth) || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Gender:</span>
                <span className="capitalize font-medium text-white">{student.gender || "Not specified"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Admission Date:</span>
                <span className="font-medium text-white" suppressHydrationWarning>
                  {formatDate(student.admission_date)}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Student Email:</span>
                <span className="font-medium text-teal-300 font-mono text-[11px] truncate max-w-[180px]">
                  {student.email || "student@salamah.sch.ng"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Residential Address:</span>
                <span className="text-slate-200 block text-[11px] leading-relaxed">
                  {student.address || "Plot 402 Cadastral Zone, Maitama District, Abuja"}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Placement Card */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-md">
            <h3 className="font-bold text-xs uppercase tracking-wider text-teal-400 mb-3 flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Academic Placement</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Current Class:</span>
                <span className="font-bold text-white">{student.class_name || "Unassigned"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Academic Wing:</span>
                <span className="font-medium text-[#dfba73]">{student.section_name || "Unified"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Class Code:</span>
                <span className="font-mono text-teal-300">{student.class_code || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Class Teacher:</span>
                <span className="font-medium text-white">{student.class_teacher_name || "Unassigned"}</span>
              </div>
            </div>
          </div>

          {/* Guardian / Family Dossier Card */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-md">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              <span>Guardian & Emergency Contact</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Primary Guardian:</span>
                <span className="font-bold text-white">{student.guardian_name || "Family Guardian"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Relationship:</span>
                <span className="font-medium text-slate-200">
                  {student.guardian_relationship || "Parent/Guardian"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {student.guardian_phone || "+2348000000000"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-[180px]">
                  {student.guardian_email || "guardian@domain.com"}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance KPI Card */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-md">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-300">Attendance Register</span>
              <span className="font-bold text-emerald-400">{attendanceRate}% Attendance</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="rounded-xl bg-slate-950 p-2 border border-slate-800">
                <span className="text-slate-400 block">Present</span>
                <span className="font-bold text-white text-xs">{attendanceSummary?.days_present || 0}</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-2 border border-slate-800">
                <span className="text-slate-400 block">Absent</span>
                <span className="font-bold text-rose-400 text-xs">{attendanceSummary?.days_absent || 0}</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-2 border border-slate-800">
                <span className="text-slate-400 block">Late</span>
                <span className="font-bold text-amber-400 text-xs">{attendanceSummary?.days_late || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE TABS & CONTENT */}
        <div className="space-y-4 lg:col-span-8">
          {/* TABS */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "documents"
                  ? "bg-[#dfba73] text-slate-950 shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span>Documents List ({documentEntries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("activity")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "activity"
                  ? "bg-[#dfba73] text-slate-950 shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Paperclip className="h-4 w-4" />
              <span>File Activity & Log ({entries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("comments")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "comments"
                  ? "bg-[#dfba73] text-slate-950 shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Teacher Comments ({comments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("academics")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "academics"
                  ? "bg-[#dfba73] text-slate-950 shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Academic Scores ({scores.length})</span>
            </button>
          </div>

          {/* TAB 1: DOCUMENTS LIST */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Student Official Documents</h3>
                  <p className="text-xs text-slate-400">
                    Official transcripts, birth certificates, medical forms, and verified records.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEntryType("document");
                    setEntryCategory("document");
                    setIsActivityModalOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-teal-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Attach Document</span>
                </button>
              </div>

              {documentEntries.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-800 bg-[#092233]/40 p-8 text-center text-slate-400 text-xs">
                  No documents attached yet. Click &quot;Attach Document&quot; to upload birth certificates or transcripts.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {documentEntries.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-2xl border border-slate-800 bg-[#092233] p-4 shadow-sm hover:border-slate-700 transition space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs group-hover:text-teal-300 transition line-clamp-1">
                              {doc.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {doc.file_name || "document.pdf"} • {doc.file_size || "1.0 MB"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteEntry(doc.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {doc.content && (
                        <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                          {doc.content}
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
                        <span>By {doc.author_name || "Admissions"}</span>
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-teal-400 hover:text-teal-300"
                          >
                            <Download className="h-3 w-3" />
                            <span>Download Document</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FILE ACTIVITY TIMELINE */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Student Dossier Activity Feed</h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive log of notes, external URLs, files, and administrative events.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    <option value="all">All Activities</option>
                    <option value="text">Notes & Written Logs</option>
                    <option value="document">Attached Files</option>
                    <option value="url">External URLs</option>
                    <option value="medical">Health / Medical</option>
                    <option value="discipline">Discipline / Conduct</option>
                  </select>

                  <button
                    onClick={() => {
                      setEntryType("text");
                      setEntryCategory("general");
                      setIsActivityModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[#dfba73] px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Log Activity</span>
                  </button>
                </div>
              </div>

              {timelineEntries.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-800 bg-[#092233]/40 p-8 text-center text-slate-400 text-xs">
                  No activity entries found matching your filter.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 border-l-2 border-slate-800">
                  {timelineEntries.map((act) => (
                    <div key={act.id} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-[31px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                          act.entry_type === "document"
                            ? "border-teal-500 bg-teal-950 text-teal-300"
                            : act.entry_type === "url"
                            ? "border-blue-500 bg-blue-950 text-blue-300"
                            : act.category === "medical"
                            ? "border-rose-500 bg-rose-950 text-rose-300"
                            : "border-[#dfba73] bg-amber-950 text-[#dfba73]"
                        }`}
                      >
                        {act.entry_type === "document" ? (
                          <Paperclip className="h-3 w-3" />
                        ) : act.entry_type === "url" ? (
                          <LinkIcon className="h-3 w-3" />
                        ) : act.category === "medical" ? (
                          <HeartPulse className="h-3 w-3" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="rounded-2xl border border-slate-800 bg-[#092233] p-4 shadow-sm hover:border-slate-700 transition space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-xs">{act.title}</h4>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                  act.entry_type === "document"
                                    ? "bg-teal-500/20 text-teal-300"
                                    : act.entry_type === "url"
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "bg-[#dfba73]/20 text-[#dfba73]"
                                }`}
                              >
                                {act.entry_type}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5" suppressHydrationWarning>
                              {formatDateTime(act.created_at)} • Logged by {act.author_name || "Admin"}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteEntry(act.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {act.content && (
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                            {act.content}
                          </p>
                        )}

                        {act.url_link && (
                          <div className="pt-1">
                            <a
                              href={act.url_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500 hover:text-slate-950 transition"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="truncate max-w-[280px]">{act.url_link}</span>
                            </a>
                          </div>
                        )}

                        {act.file_url && (
                          <div className="pt-1">
                            <a
                              href={act.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition"
                            >
                              <Download className="h-3 w-3" />
                              <span>{act.file_name || "Download Attached File"}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEACHER CLASSROOM COMMENTS */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Teacher Observations & Conduct Notes</h3>
                  <p className="text-xs text-slate-400">
                    Sickness alerts, behavioral conduct, and praise comments recorded by form tutors.
                  </p>
                </div>
                {student.class_id && (
                  <button
                    onClick={() => setIsCommentModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-teal-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Log Comment</span>
                  </button>
                )}
              </div>

              {comments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-800 bg-[#092233]/40 p-8 text-center text-slate-400 text-xs">
                  No teacher comments recorded for this student yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((cm) => (
                    <div
                      key={cm.id}
                      className="rounded-2xl border border-slate-800 bg-[#092233] p-4 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              cm.category === "sickness"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : cm.category === "misbehavior"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : cm.category === "praise"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                            }`}
                          >
                            {cm.category}
                          </span>
                          <span className="font-semibold text-white text-xs">{cm.author_name || "Class Teacher"}</span>
                        </div>
                        <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                          {formatDate(cm.comment_date)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                        &quot;{cm.comment}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACADEMIC SCORES */}
          {activeTab === "academics" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Continuous Assessment & Examinations</h3>
                  <p className="text-xs text-slate-400">
                    Subject scores recorded across current and previous academic evaluations.
                  </p>
                </div>
              </div>

              {scores.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-800 bg-[#092233]/40 p-8 text-center text-slate-400 text-xs">
                  No assessment scores uploaded yet for this student.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#092233] shadow-md">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Subject</th>
                        <th className="p-3.5">Assessment Type</th>
                        <th className="p-3.5 text-center">Score Obtained</th>
                        <th className="p-3.5 text-center">Max Marks</th>
                        <th className="p-3.5 text-right">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {scores.map((sc, idx) => {
                        const pct = Math.round((sc.score / sc.maximum_score) * 100);
                        return (
                          <tr key={idx} className="hover:bg-slate-800/20">
                            <td className="p-3.5 font-bold text-white">{sc.subject_name}</td>
                            <td className="p-3.5 text-slate-300">{sc.type_name}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-teal-300">
                              {sc.score}
                            </td>
                            <td className="p-3.5 text-center font-mono text-slate-400">
                              {sc.maximum_score}
                            </td>
                            <td className="p-3.5 text-right font-bold">
                              <span
                                className={
                                  pct >= 70
                                    ? "text-emerald-400"
                                    : pct >= 50
                                    ? "text-amber-400"
                                    : "text-rose-400"
                                }
                              >
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD ACTIVITY / FILE ENTRY */}
      {isActivityModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsActivityModalOpen(false);
          }}
        >
          <div className="relative my-auto w-full max-w-lg rounded-3xl border border-[#dfba73]/50 bg-[#092233] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73]">
                  Student File Dossier
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  Add Activity / Attachment to File
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Entry Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryType("text")}
                    className={`rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      entryType === "text"
                        ? "bg-[#dfba73] text-slate-950 border-[#dfba73]"
                        : "bg-slate-950 text-slate-300 border-slate-700 hover:text-white"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Text Note</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryType("document")}
                    className={`rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      entryType === "document"
                        ? "bg-[#dfba73] text-slate-950 border-[#dfba73]"
                        : "bg-slate-950 text-slate-300 border-slate-700 hover:text-white"
                    }`}
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>File Attach</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryType("url")}
                    className={`rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      entryType === "url"
                        ? "bg-[#dfba73] text-slate-950 border-[#dfba73]"
                        : "bg-slate-950 text-slate-300 border-slate-700 hover:text-white"
                    }`}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>URL Link</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    entryType === "document"
                      ? "e.g. Primary School Leaving Certificate"
                      : entryType === "url"
                      ? "e.g. Cambridge Learner Portfolio Link"
                      : "e.g. Pastoral Counseling & Academic Guidance Note"
                  }
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={entryCategory}
                  onChange={(e) => setEntryCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                >
                  <option value="general">General Administrative</option>
                  <option value="academic">Academic & Coursework</option>
                  <option value="medical">Medical & Health Clearance</option>
                  <option value="discipline">Conduct & Behavioral</option>
                  <option value="document">Official Legal / Certificate</option>
                </select>
              </div>

              {entryType === "url" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    External URL Address *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/... or https://..."
                    value={entryUrlLink}
                    onChange={(e) => setEntryUrlLink(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-blue-300 focus:border-blue-400 focus:outline-none"
                  />
                </div>
              )}

              {entryType === "document" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      File Resource Link (Cloudinary or Storage URL) *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://res.cloudinary.com/..."
                      value={entryFileUrl}
                      onChange={(e) => setEntryFileUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-teal-300 focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      File Name
                    </label>
                    <input
                      type="text"
                      placeholder="Certificate_Scan.pdf"
                      value={entryFileName}
                      onChange={(e) => setEntryFileName(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Notes / Content
                </label>
                <textarea
                  rows={3}
                  value={entryContent}
                  onChange={(e) => setEntryContent(e.target.value)}
                  placeholder="Add observational notes, verification remarks, or context..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEntry}
                  className="rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] disabled:opacity-50 transition shadow-md"
                >
                  {isSubmittingEntry ? "Saving..." : "Save to Student Dossier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TEACHER CLASSROOM COMMENT */}
      {isCommentModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCommentModalOpen(false);
          }}
        >
          <div className="relative my-auto w-full max-w-md rounded-3xl border border-teal-500/50 bg-[#092233] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  Classroom Conduct
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  Teacher Comment on {student.first_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCommentModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddComment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Comment Category *
                </label>
                <select
                  value={commentCategory}
                  onChange={(e) => setCommentCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none"
                >
                  <option value="academic">Academic Progress & Effort</option>
                  <option value="sickness">Sickness / Medical Notice</option>
                  <option value="misbehavior">Misbehavior / Conduct Caution</option>
                  <option value="praise">Commendation & Praise</option>
                  <option value="pastoral">Pastoral / General Welfare</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Incident / Observation Date *
                </label>
                <input
                  type="date"
                  required
                  value={commentDate}
                  onChange={(e) => setCommentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teacher Written Comment *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Reported migraine at 11am; attended infirmary. Or: Outstanding performance in Islamic studies recitation."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCommentModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50 transition shadow-md"
                >
                  {isSubmittingComment ? "Saving..." : "Log Teacher Comment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
