"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ReportCardAppraisalWorkspace } from "./report-card-appraisal-workspace";
import { formatDate } from "@/lib/date-utils";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  Edit3,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  HeartPulse,
  History,
  Info,
  Layers,
  MessageSquare,
  MinusCircle,
  PlusCircle,
  Printer,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

export type EnrolledStudent = {
  id: string;
  admission_number: string;
  admission_date: string;
  student_status: string;
  person_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  avatar_url?: string | null;
  enrollment_id: string;
  enrollment_date: string;
  enrollment_status: string;
  guardian_name: string | null;
  guardian_phone: string | null;
};

export type AvailableStudent = {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  current_class_name: string | null;
};

export type SubjectItem = {
  id: string;
  name: string;
  code: string;
  short_name: string | null;
};

export type AttendanceItem = {
  student_id: string;
  attendance_date: string;
  status: "present" | "absent" | "late" | "excused";
  note: string | null;
};

export type ScoreItem = {
  student_id: string;
  score: number;
  assessment_id: string;
  subject_id: string;
  subject_name: string;
  type_name: string;
  type_code: string;
  maximum_score: number;
};

export type CommentItem = {
  id: string;
  student_id: string;
  category: string;
  comment: string;
  comment_date: string;
  author_name: string | null;
  student_name: string;
  admission_number: string;
};

export type TerminalReportItem = {
  id: string;
  student_id: string;
  class_id: string;
  session_id: string;
  term_id: string;
  teacher_comment: string | null;
  principal_comment: string | null;
  affective_domain: Record<string, number>;
  psychomotor_domain: Record<string, number>;
  days_school_opened: number | null;
  days_present: number | null;
  days_absent: number | null;
  next_term_resumption: string | null;
  height: string | null;
  weight: string | null;
};

export type ClassOption = {
  id: string;
  name: string;
  code: string;
  grade_name: string;
  section_name: string | null;
};

export function ClassroomManagementClient({
  classItem,
  subjects,
  enrolledStudents: initialEnrolled,
  availableStudents: initialAvailable,
  allClasses,
  attendanceRecords: initialAttendance,
  assessmentScores: initialScores,
  comments: initialComments,
  terminalReports: initialTerminalReports = [],
  currentSession,
  currentTerm,
  allSessions = [],
  allTerms = [],
  sectionHeads = [],
  initialTab,
  quickEnrollmentEnabled = true,
  isSuperAdmin = false,
}: {
  classItem: {
    id: string;
    name: string;
    code: string;
    status: string;
    grade_name: string;
    section_name: string | null;
    assigned_combination: string | null;
    class_teacher_name: string | null;
    class_teacher_number: string | null;
  };
  subjects: SubjectItem[];
  enrolledStudents: EnrolledStudent[];
  availableStudents: AvailableStudent[];
  allClasses?: ClassOption[];
  attendanceRecords: AttendanceItem[];
  assessmentScores: ScoreItem[];
  comments: CommentItem[];
  terminalReports?: TerminalReportItem[];
  currentSession: { id: string; name: string; is_current?: boolean };
  currentTerm: { id: string; name: string; term_number: number; is_current?: boolean };
  allSessions?: { id: string; name: string; is_current: boolean }[];
  allTerms?: { id: string; session_id: string; name: string; term_number: number; is_current: boolean }[];
  sectionHeads?: any[];
  initialTab: string;
  quickEnrollmentEnabled?: boolean;
  isSuperAdmin?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"roster" | "attendance" | "mastersheet" | "report-card" | "comments">(
    initialTab === "attendance"
      ? "attendance"
      : initialTab === "mastersheet"
      ? "mastersheet"
      : initialTab === "report-card"
      ? "report-card"
      : initialTab === "comments"
      ? "comments"
      : "roster"
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>(currentSession.id);
  const [selectedTermId, setSelectedTermId] = useState<string>(currentTerm.id);

  useEffect(() => {
    if (currentSession?.id) {
      setSelectedSessionId(currentSession.id);
    }
  }, [currentSession?.id]);

  useEffect(() => {
    if (currentTerm?.id) {
      setSelectedTermId(currentTerm.id);
    }
  }, [currentTerm?.id]);

  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>(initialEnrolled);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>(initialAvailable);
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [scores, setScores] = useState<ScoreItem[]>(initialScores);

  // Available classes list (falls back to current class)
  const classList = allClasses && allClasses.length > 0 ? allClasses : [{
    id: classItem.id,
    name: classItem.name,
    code: classItem.code,
    grade_name: classItem.grade_name,
    section_name: classItem.section_name,
  }];

  // Roster Search
  const [rosterSearch, setRosterSearch] = useState("");

  // Add Student to Class Modal State
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [addStudentMode, setAddStudentMode] = useState<"manual" | "transfer">("manual");
  const [targetClassSelection, setTargetClassSelection] = useState(classItem.id);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState("");
  const [addStudentSearch, setAddStudentSearch] = useState("");
  const [isSubmittingAddStudent, setIsSubmittingAddStudent] = useState(false);

  // Manual Student Entry Fields
  const [manualFirstName, setManualFirstName] = useState("");
  const [manualMiddleName, setManualMiddleName] = useState("");
  const [manualLastName, setManualLastName] = useState("");
  const [manualGender, setManualGender] = useState("male");
  const [manualDob, setManualDob] = useState("2014-01-01");
  const [manualAdmissionNo, setManualAdmissionNo] = useState(`SAL-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [manualGuardianName, setManualGuardianName] = useState("");
  const [manualGuardianPhone, setManualGuardianPhone] = useState("");
  const [manualGuardianEmail, setManualGuardianEmail] = useState("");
  const [manualAddress, setManualAddress] = useState("Plot 402 Cadastral Zone, Katsina, Nigeria");
  const [manualPreviousSchool, setManualPreviousSchool] = useState("");
  const [manualMedicalInfo, setManualMedicalInfo] = useState("");
  const [manualPassportUrl, setManualPassportUrl] = useState("https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80");
  const [isSubmittingManualStudent, setIsSubmittingManualStudent] = useState(false);

  function openAddStudentModal() {
    setAddStudentMode("manual");
    setTargetClassSelection(classItem.id); // Each button automatically selects the current class!
    setManualAdmissionNo(`SAL-2026-${Math.floor(100 + Math.random() * 900)}`);
    setManualFirstName("");
    setManualMiddleName("");
    setManualLastName("");
    setManualGender("male");
    setManualDob("2014-01-01");
    setManualPassportUrl("https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80");
    setManualGuardianName("");
    setManualGuardianPhone("");
    setManualGuardianEmail("");
    setManualAddress("Plot 402 Cadastral Zone, Katsina, Nigeria");
    setManualPreviousSchool("");
    setManualMedicalInfo("");
    setSelectedStudentToAdd("");
    setIsAddStudentModalOpen(true);
  }

  // Teacher Quick Comment Modal
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentStudentId, setCommentStudentId] = useState(enrolledStudents[0]?.id || "");
  const [commentCategory, setCommentCategory] = useState("academic");
  const [commentText, setCommentText] = useState("");
  const [commentDate, setCommentDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Attendance Tracker & Historical State
  const [attendanceRecordsList, setAttendanceRecordsList] = useState<AttendanceItem[]>(initialAttendance);
  const [attendanceViewMode, setAttendanceViewMode] = useState<"register" | "history">("register");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: "present" | "absent" | "late" | "excused"; note: string }>>(() => {
    const map: Record<string, { status: "present" | "absent" | "late" | "excused"; note: string }> = {};
    const today = new Date().toISOString().split("T")[0];
    initialEnrolled.forEach((st) => {
      const existing = initialAttendance.find((a) => a.student_id === st.id && String(a.attendance_date).split("T")[0] === today);
      map[st.id] = {
        status: existing ? existing.status : "present",
        note: existing?.note || "",
      };
    });
    return map;
  });
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSavedToast, setAttendanceSavedToast] = useState(false);

  function switchAttendanceDate(targetDate: string) {
    setAttendanceDate(targetDate);
    const map: Record<string, { status: "present" | "absent" | "late" | "excused"; note: string }> = {};
    enrolledStudents.forEach((st) => {
      const existing = attendanceRecordsList.find(
        (a) => a.student_id === st.id && String(a.attendance_date).split("T")[0] === targetDate
      );
      map[st.id] = {
        status: existing ? existing.status : "present",
        note: existing?.note || "",
      };
    });
    setAttendanceState(map);
  }

  const attendanceHistory = useMemo(() => {
    const datesMap = new Map<string, { date: string; present: number; absent: number; late: number; excused: number; total: number }>();
    attendanceRecordsList.forEach((r) => {
      const d = String(r.attendance_date).split("T")[0];
      if (!datesMap.has(d)) {
        datesMap.set(d, { date: d, present: 0, absent: 0, late: 0, excused: 0, total: 0 });
      }
      const entry = datesMap.get(d)!;
      entry.total++;
      if (r.status === "present") entry.present++;
      else if (r.status === "absent") entry.absent++;
      else if (r.status === "late") entry.late++;
      else if (r.status === "excused") entry.excused++;
    });
    return Array.from(datesMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecordsList]);

  // Terminal Reports (Affective, Psychomotor, Teacher Remark, Principal Commendation)
  const [terminalReportsList, setTerminalReportsList] = useState<TerminalReportItem[]>(initialTerminalReports || []);
  const [selectedAssessmentStudentId, setSelectedAssessmentStudentId] = useState<string>(
    initialEnrolled[0]?.id || ""
  );
  const [isSavingTerminalReport, setIsSavingTerminalReport] = useState(false);
  const [terminalReportToast, setTerminalReportToast] = useState(false);

  // Synchronize terminal reports when selected session or term changes
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/classroom/report-card?classId=${classItem.id}&sessionId=${selectedSessionId}&termId=${selectedTermId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.reports) {
          setTerminalReportsList(data.reports);
        }
      })
      .catch((err) => console.error("Error fetching terminal reports for period:", err));
    return () => {
      cancelled = true;
    };
  }, [classItem.id, selectedSessionId, selectedTermId]);

  async function handleSaveTerminalReport(studentId: string, payload: Partial<TerminalReportItem>) {
    setIsSavingTerminalReport(true);
    try {
      const res = await fetch("/api/classroom/report-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: classItem.id,
          studentId,
          sessionId: selectedSessionId,
          termId: selectedTermId,
          ...payload,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save terminal report");
      }
      const data = await res.json();
      setTerminalReportsList((prev) => {
        const filtered = prev.filter((r) => r.student_id !== studentId);
        return [...filtered, data.report];
      });
      setTerminalReportToast(true);
      setTimeout(() => setTerminalReportToast(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving report card");
    } finally {
      setIsSavingTerminalReport(false);
    }
  }

  // Score Entry Modal (3 CAs + Exam + Total)
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreSubjectId, setScoreSubjectId] = useState(subjects[0]?.id || "");
  const [scoreInputs, setScoreInputs] = useState<Record<string, { ca1: number; ca2: number; ca3: number; exam: number }>>({});
  const [isSavingScores, setIsSavingScores] = useState(false);

  // Scoresheet Upload Modal (3 CAs, Exam, Total CSV / Excel Parser)
  const [isScoresheetUploadModalOpen, setIsScoresheetUploadModalOpen] = useState(false);
  const [uploadSubjectId, setUploadSubjectId] = useState(subjects[0]?.id || "");
  const [uploadRawText, setUploadRawText] = useState("");
  const [parsedScoresheetData, setParsedScoresheetData] = useState<{
    studentId: string;
    studentName: string;
    admissionNo: string;
    ca1: number;
    ca2: number;
    ca3: number;
    exam: number;
    total: number;
    isValid: boolean;
    error?: string;
  }[]>([]);
  const [isUploadingScoresheet, setIsUploadingScoresheet] = useState(false);

  // Report Card Student Selection & View Mode
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string>(
    enrolledStudents[0]?.id || ""
  );
  const [reportCardViewMode, setReportCardViewMode] = useState<"single" | "all">("single");

  // Initialize Score Inputs when modal opens or subject changes
  function openScoreEntryModal(subjectId?: string) {
    const targetSub = subjectId || subjects[0]?.id;
    setScoreSubjectId(targetSub);

    const inputMap: Record<string, { ca1: number; ca2: number; ca3: number; exam: number }> = {};
    enrolledStudents.forEach((st) => {
      const subScores = scores.filter((sc) => sc.student_id === st.id && sc.subject_id === targetSub);
      const ca1 = subScores.find((sc) => sc.type_code === "CA1" || sc.type_name.toLowerCase().includes("first") || sc.type_name.toLowerCase().includes("ca 1"))?.score ?? 0;
      const ca2 = subScores.find((sc) => sc.type_code === "CA2" || sc.type_name.toLowerCase().includes("second") || sc.type_name.toLowerCase().includes("ca 2"))?.score ?? 0;
      const ca3 = subScores.find((sc) => sc.type_code === "CA3" || sc.type_name.toLowerCase().includes("third") || sc.type_name.toLowerCase().includes("ca 3"))?.score ?? 0;
      const exam = subScores.find((sc) => sc.type_code === "EXAM" || sc.type_name.toLowerCase().includes("exam"))?.score ?? 0;
      inputMap[st.id] = { ca1, ca2, ca3, exam };
    });
    setScoreInputs(inputMap);
    setIsScoreModalOpen(true);
  }

  // Handle Save Scores
  async function handleSaveScores(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingScores(true);
    try {
      const studentScores = Object.entries(scoreInputs).map(([studentId, data]) => ({
        studentId,
        ca1: Number(data.ca1),
        ca2: Number(data.ca2),
        ca3: Number(data.ca3),
        exam: Number(data.exam),
      }));

      const res = await fetch("/api/classroom/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: classItem.id,
          subjectId: scoreSubjectId,
          studentScores,
        }),
      });

      if (!res.ok) throw new Error("Failed to save scores");
      setIsScoreModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving scores");
    } finally {
      setIsSavingScores(false);
    }
  }

  // Download Scoresheet Template (CSV pre-filled with class roster supporting 3 CAs, Exam, Total)
  function handleDownloadScoresheetTemplate(targetSubjectId?: string) {
    const sub = subjects.find((s) => s.id === (targetSubjectId || uploadSubjectId || scoreSubjectId)) || subjects[0];
    const headers = [
      "Admission Number",
      "Student Name",
      "CA 1 (Max 10)",
      "CA 2 (Max 10)",
      "CA 3 (Max 10)",
      "Exam (Max 70)",
      "Total (Max 100)"
    ];

    const rows = enrolledStudents.map((st) => {
      const subScores = scores.filter((sc) => sc.student_id === st.id && sc.subject_id === sub.id);
      const ca1 = subScores.find((sc) => sc.type_code === "CA1" || sc.type_name.toLowerCase().includes("first") || sc.type_name.toLowerCase().includes("ca 1"))?.score ?? 0;
      const ca2 = subScores.find((sc) => sc.type_code === "CA2" || sc.type_name.toLowerCase().includes("second") || sc.type_name.toLowerCase().includes("ca 2"))?.score ?? 0;
      const ca3 = subScores.find((sc) => sc.type_code === "CA3" || sc.type_name.toLowerCase().includes("third") || sc.type_name.toLowerCase().includes("ca 3"))?.score ?? 0;
      const exam = subScores.find((sc) => sc.type_code === "EXAM" || sc.type_name.toLowerCase().includes("exam"))?.score ?? 0;
      const total = ca1 + ca2 + ca3 + exam;

      return [
        `"${st.admission_number}"`,
        `"${st.first_name} ${st.last_name}"`,
        ca1,
        ca2,
        ca3,
        exam,
        total
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Scoresheet_${classItem.name.replace(/\s+/g, "_")}_${sub?.name.replace(/\s+/g, "_") || "General"}_3CAs_Exam.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Parse Scoresheet CSV or pasted Excel text supporting 3 CAs, Exam, Total
  function parseScoresheetContent(content: string) {
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedScoresheetData([]);
      return;
    }

    // Skip header row if it contains descriptive text
    const hasHeader = lines[0].toLowerCase().includes("admission") || lines[0].toLowerCase().includes("name") || lines[0].toLowerCase().includes("ca") || lines[0].toLowerCase().includes("exam");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const parsed = dataLines.map((line, idx) => {
      // Support comma, tab, or semicolon delimiters
      const delimiter = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
      const rawCols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));

      const admNo = rawCols[0] || "";
      const nameInSheet = rawCols[1] || "";

      // Match student by admission number, or full name, or fallback by roster position
      const matchedStudent = enrolledStudents.find(
        (st) =>
          (admNo && st.admission_number.toLowerCase() === admNo.toLowerCase()) ||
          `${st.first_name} ${st.last_name}`.toLowerCase() === nameInSheet.toLowerCase() ||
          (nameInSheet && `${st.first_name} ${st.last_name}`.toLowerCase().includes(nameInSheet.toLowerCase()))
      ) || enrolledStudents[idx];

      const ca1 = Math.min(10, Math.max(0, Number(rawCols[2]) || 0));
      const ca2 = Math.min(10, Math.max(0, Number(rawCols[3]) || 0));
      const ca3 = Math.min(10, Math.max(0, Number(rawCols[4]) || 0));
      const exam = Math.min(70, Math.max(0, Number(rawCols[5]) || 0));
      const total = ca1 + ca2 + ca3 + exam;

      return {
        studentId: matchedStudent?.id || "",
        studentName: matchedStudent ? `${matchedStudent.first_name} ${matchedStudent.last_name}` : nameInSheet || `Student #${idx + 1}`,
        admissionNo: matchedStudent?.admission_number || admNo || "—",
        ca1,
        ca2,
        ca3,
        exam,
        total,
        isValid: Boolean(matchedStudent?.id),
        error: !matchedStudent?.id ? "Student not found in this class roster" : undefined,
      };
    });

    setParsedScoresheetData(parsed);
  }

  // Handle Scoresheet File Selection (CSV/TXT)
  function handleScoresheetFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || "";
      setUploadRawText(text);
      parseScoresheetContent(text);
    };
    reader.readAsText(file);
  }

  // Submit Bulk Uploaded Scoresheet to DB
  async function handleSubmitUploadedScoresheet() {
    if (parsedScoresheetData.length === 0) return;
    setIsUploadingScoresheet(true);
    try {
      const studentScores = parsedScoresheetData
        .filter((item) => item.isValid && item.studentId)
        .map((item) => ({
          studentId: item.studentId,
          ca1: item.ca1,
          ca2: item.ca2,
          ca3: item.ca3,
          exam: item.exam,
        }));

      const res = await fetch("/api/classroom/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: classItem.id,
          subjectId: uploadSubjectId,
          studentScores,
        }),
      });

      if (!res.ok) throw new Error("Failed to save uploaded scoresheet");
      setIsScoresheetUploadModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving uploaded scoresheet");
    } finally {
      setIsUploadingScoresheet(false);
    }
  }

  // Handle Save Attendance
  async function handleSaveAttendance() {
    setIsSavingAttendance(true);
    try {
      const records = Object.entries(attendanceState).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        note: data.note,
      }));

      const res = await fetch("/api/classroom/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: classItem.id,
          attendanceDate,
          records,
        }),
      });

      if (!res.ok) throw new Error("Failed to save attendance");
      setAttendanceRecordsList((prev) => {
        const otherRecords = prev.filter((r) => String(r.attendance_date).split("T")[0] !== attendanceDate);
        const newRecords = records.map((rec) => ({
          student_id: rec.studentId,
          attendance_date: attendanceDate,
          status: rec.status as any,
          note: rec.note,
        }));
        return [...newRecords, ...otherRecords];
      });
      setAttendanceSavedToast(true);
      setTimeout(() => setAttendanceSavedToast(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving attendance");
    } finally {
      setIsSavingAttendance(false);
    }
  }

  // Handle Manual Student Registration
  async function handleManualStudentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualFirstName.trim() || !manualLastName.trim() || !targetClassSelection) {
      alert("First name, last name, and class are required.");
      return;
    }
    if (!manualGuardianName.trim() || !manualGuardianPhone.trim()) {
      alert("Parent / Guardian name and phone number are required.");
      return;
    }

    setIsSubmittingManualStudent(true);
    try {
      const res = await fetch("/api/students/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "direct-register",
          firstName: manualFirstName.trim(),
          middleName: manualMiddleName.trim() || undefined,
          lastName: manualLastName.trim(),
          gender: manualGender,
          dateOfBirth: manualDob,
          admissionNumber: manualAdmissionNo.trim(),
          classId: targetClassSelection,
          guardianName: manualGuardianName.trim(),
          guardianPhone: manualGuardianPhone.trim(),
          guardianEmail: manualGuardianEmail.trim() || undefined,
          address: manualAddress.trim(),
          previousSchool: manualPreviousSchool.trim() || undefined,
          medicalInfo: manualMedicalInfo.trim() || undefined,
          passportUrl: manualPassportUrl.trim() || undefined,
          sourceContext: "teacher_quick",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to register student");

      setIsAddStudentModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error adding student");
    } finally {
      setIsSubmittingManualStudent(false);
    }
  }

  // Handle Transfer Student to Class
  async function handleAddStudentToClass(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentToAdd || !targetClassSelection) return;

    setIsSubmittingAddStudent(true);
    try {
      const res = await fetch("/api/classroom/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-student",
          classId: targetClassSelection,
          studentId: selectedStudentToAdd,
        }),
      });

      if (!res.ok) throw new Error("Failed to add student to class");

      setIsAddStudentModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error adding student");
    } finally {
      setIsSubmittingAddStudent(false);
    }
  }

  // Handle Remove Student from Class
  async function handleRemoveStudent(studentId: string, studentName: string) {
    if (!confirm(`Are you sure you want to remove ${studentName} from ${classItem.name}?`)) return;

    try {
      const res = await fetch("/api/classroom/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove-student",
          classId: classItem.id,
          studentId,
        }),
      });

      if (!res.ok) throw new Error("Failed to remove student");
      setEnrolledStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error removing student");
    }
  }

  // Handle Submit Comment
  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText || !commentStudentId) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch("/api/classroom/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: commentStudentId,
          classId: classItem.id,
          category: commentCategory,
          comment: commentText,
          commentDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to post comment");

      const student = enrolledStudents.find((s) => s.id === commentStudentId);
      const newComment: CommentItem = {
        ...data.comment,
        student_name: `${student?.first_name} ${student?.last_name}`,
        admission_number: student?.admission_number || "",
      };

      setComments((prev) => [newComment, ...prev]);
      setIsCommentModalOpen(false);
      setCommentText("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving comment");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  // Filtered Roster
  const filteredRoster = enrolledStudents.filter((st) => {
    const q = rosterSearch.toLowerCase().trim();
    if (!q) return true;
    const full = `${st.first_name} ${st.middle_name || ""} ${st.last_name}`.toLowerCase();
    return full.includes(q) || st.admission_number.toLowerCase().includes(q);
  });

  // Calculate Mastersheet Data (3 CAs + Exam + Total)
  const mastersheetRows = enrolledStudents.map((st) => {
    let totalScore = 0;
    const subjectScoresMap: Record<string, { ca1: number; ca2: number; ca3: number; exam: number; total: number; grade: string }> = {};

    subjects.forEach((sub) => {
      const studentSubScores = scores.filter((sc) => sc.student_id === st.id && sc.subject_id === sub.id);
      const ca1 = studentSubScores.find((sc) => sc.type_code === "CA1" || sc.type_name.toLowerCase().includes("first") || sc.type_name.toLowerCase().includes("ca 1"))?.score ?? 0;
      const ca2 = studentSubScores.find((sc) => sc.type_code === "CA2" || sc.type_name.toLowerCase().includes("second") || sc.type_name.toLowerCase().includes("ca 2"))?.score ?? 0;
      const ca3 = studentSubScores.find((sc) => sc.type_code === "CA3" || sc.type_name.toLowerCase().includes("third") || sc.type_name.toLowerCase().includes("ca 3"))?.score ?? 0;
      const exam = studentSubScores.find((sc) => sc.type_code === "EXAM" || sc.type_name.toLowerCase().includes("exam"))?.score ?? 0;
      const total = Math.min(100, ca1 + ca2 + ca3 + exam);
      totalScore += total;

      let grade = "F";
      if (total >= 75) grade = "A";
      else if (total >= 65) grade = "B";
      else if (total >= 50) grade = "C";
      else if (total >= 40) grade = "D";
      else grade = "F";

      subjectScoresMap[sub.id] = { ca1, ca2, ca3, exam, total, grade };
    });

    const average = subjects.length ? Math.round((totalScore / subjects.length) * 10) / 10 : 0;

    return {
      student: st,
      subjectScoresMap,
      totalScore,
      average,
    };
  });

  // Sort and calculate rank
  mastersheetRows.sort((a, b) => b.totalScore - a.totalScore);
  const rankedRows = mastersheetRows.map((row, idx) => ({
    ...row,
    rank: idx + 1,
  }));

  // Selected Student for Report Card
  const selectedReportRow = rankedRows.find((r) => r.student.id === selectedReportStudentId) || rankedRows[0];
  const currentReportIndex = rankedRows.findIndex((r) => r.student.id === selectedReportStudentId);

  // Class KPI calculations
  const classAvg = rankedRows.length
    ? Math.round((rankedRows.reduce((acc, r) => acc + r.average, 0) / rankedRows.length) * 10) / 10
    : 0;
  const presentCount = Object.values(attendanceState).filter((a) => a.status === "present").length;
  const attendanceRate = enrolledStudents.length ? Math.round((presentCount / enrolledStudents.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* CLASSROOM COCKPIT HERO HEADER */}
      <div className="rounded-3xl border border-[#dfba73]/30 bg-[#092233] p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl border border-[#dfba73]/40 bg-slate-950 px-3.5 py-2 text-xs font-bold text-[#dfba73] hover:text-white hover:border-[#dfba73] hover:bg-[#dfba73]/20 transition shadow-xs"
                title="Return to Staff Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
              {isSuperAdmin && (
                <Link
                  href="/dashboard/classes"
                  className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                  title="Return to Classes Catalogue"
                >
                  <span>Catalogue</span>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/30 to-[#dfba73]/20 text-teal-300 font-bold text-xl border border-teal-500/40 shadow-inner shrink-0">
                <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>

              <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-teal-500/40 bg-teal-500/15 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.16em] text-teal-300 uppercase">
                  Classroom Management Cockpit
                </span>
                <span className="rounded-full bg-slate-900 border border-slate-700 px-2.5 py-0.5 text-[10px] font-mono text-[#dfba73]">
                  {classItem.code}
                </span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                  {classItem.status}
                </span>
              </div>

              <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {classItem.name} ({classItem.grade_name})
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span>
                  Wing: <strong className="text-white">{classItem.section_name || "Salamah Academy"}</strong>
                </span>
                <span>•</span>
                <span>
                  Class Teacher:{" "}
                  <strong className="text-teal-300">
                    {classItem.class_teacher_name || "Unassigned"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Subjects:{" "}
                  <strong className="text-[#dfba73]">
                    {subjects.length} Core Subjects
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setCommentStudentId(enrolledStudents[0]?.id || "");
                setIsCommentModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl border border-[#dfba73]/40 bg-[#dfba73]/10 px-3.5 py-2 text-xs font-bold text-[#dfba73] hover:bg-[#dfba73] hover:text-slate-950 transition shadow-sm"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Log Teacher Comment</span>
            </button>

            <button
              onClick={() => openAddStudentModal()}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition shadow-md"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Student to Class</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Enrolled Students
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{enrolledStudents.length}</span>
              <span className="text-[10px] text-teal-400">Class Register</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Today&apos;s Attendance
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-400">{attendanceRate}%</span>
              <span className="text-[10px] text-slate-400">{presentCount} present</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Class Average Score
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#dfba73]">{classAvg}%</span>
              <span className="text-[10px] text-slate-400">All Subjects</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Teacher Observations
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-amber-300">{comments.length}</span>
              <span className="text-[10px] text-slate-400">Sickness & Conduct</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("roster")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "roster"
                ? "bg-[#dfba73] text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Class Roster ({enrolledStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "attendance"
                ? "bg-[#dfba73] text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Daily Attendance Register</span>
          </button>

          <button
            onClick={() => setActiveTab("mastersheet")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "mastersheet"
                ? "bg-[#dfba73] text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Master Score Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab("report-card")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "report-card"
                ? "bg-[#dfba73] text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Terminal Report Cards</span>
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
            <span>Teacher Comments Log ({comments.length})</span>
          </button>
        </div>
      </div>

      {/* Academic Period Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-950/70 p-3.5 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#dfba73]" />
          <span className="font-bold text-white">Scholastic Period Scope:</span>
          <span className="text-slate-400">Viewing attendance, mastersheet & terminal reports for:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-slate-400 font-semibold">Session:</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
            >
              {(allSessions && allSessions.length > 0 ? allSessions : [currentSession]).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_current ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-slate-400 font-semibold">Term:</label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
            >
              {(allTerms && allTerms.length > 0 ? allTerms : [currentTerm]).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_current ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: CLASS ROSTER */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search class roster by name or admission number..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
              />
            </div>

            {quickEnrollmentEnabled !== false && (
              <button
                onClick={() => openAddStudentModal()}
                className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Enroll / Add Student to {classItem.name}</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#092233] shadow-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Admission No</th>
                  <th className="p-4">Gender & Age</th>
                  <th className="p-4">Parent / Guardian</th>
                  <th className="p-4">Enrolment Date</th>
                  <th className="p-4 text-center">Teacher Comment</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No students found in this class. Click &quot;Add Student to Class&quot; to enroll pupils.
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-800/30 transition group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/dashboard/students/${st.id}`}
                            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-[#dfba73]/40 bg-slate-900 shadow-sm hover:border-[#dfba73] hover:scale-105 transition"
                            title="View Student File"
                          >
                            {st.avatar_url ? (
                              <img src={st.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#dfba73]/30 to-teal-500/20 text-[#dfba73] font-bold text-xs">
                                {st.first_name[0]}{st.last_name[0]}
                              </div>
                            )}
                          </Link>
                          <div>
                            <Link
                              href={`/dashboard/students/${st.id}`}
                              className="font-bold text-white text-sm hover:text-[#dfba73] transition"
                            >
                              {st.first_name} {st.middle_name ? `${st.middle_name} ` : ""}{st.last_name}
                            </Link>
                            <span className="text-[10px] text-teal-400 block">
                              Active Student File
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-semibold text-teal-300">
                        {st.admission_number}
                      </td>

                      <td className="p-4 capitalize text-slate-300">
                        {st.gender || "Unspecified"}
                      </td>

                      <td className="p-4">
                        <span className="font-medium text-slate-200 block">{st.guardian_name || "Guardian"}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {st.guardian_phone || "Primary contact"}
                        </span>
                      </td>

                      <td className="p-4 text-slate-400" suppressHydrationWarning>
                        {formatDate(st.enrollment_date) || "Active"}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setCommentStudentId(st.id);
                            setIsCommentModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Log Note</span>
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/students/${st.id}`}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white"
                          >
                            Dossier
                          </Link>
                          <button
                            onClick={() => handleRemoveStudent(st.id, `${st.first_name} ${st.last_name}`)}
                            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition"
                            title="Remove student from this class"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY ATTENDANCE TRACKER & ATTENDANCE HISTORY */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          {/* Sub-navigation: Daily Register vs Attendance History */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#092233] p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAttendanceViewMode("register")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  attendanceViewMode === "register"
                    ? "bg-[#dfba73] text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800"
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Daily Register</span>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceViewMode("history")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  attendanceViewMode === "history"
                    ? "bg-[#dfba73] text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800"
                }`}
              >
                <History className="h-4 w-4" />
                <span>Attendance History ({attendanceHistory.length} Days Recorded)</span>
              </button>
            </div>

            {attendanceViewMode === "register" && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Quick Date:</span>
                <button
                  type="button"
                  onClick={() => switchAttendanceDate(new Date().toISOString().split("T")[0])}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    switchAttendanceDate(y.toISOString().split("T")[0]);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceViewMode("history")}
                  className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-2.5 py-1 text-[11px] font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition"
                >
                  View All Days
                </button>
              </div>
            )}
          </div>

          {/* VIEW MODE 1: ATTENDANCE HISTORY TABLE */}
          {attendanceViewMode === "history" && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-[#092233] p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Recorded Sessions
                  </span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {attendanceHistory.length} Days
                  </span>
                  <span className="text-[10px] text-slate-400">Term total entries</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#092233] p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Overall Attendance
                  </span>
                  <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                    {attendanceHistory.length
                      ? Math.round(
                          (attendanceHistory.reduce((acc, h) => acc + (h.present / (h.total || 1)), 0) /
                            attendanceHistory.length) *
                            100
                        )
                      : 100}
                    %
                  </span>
                  <span className="text-[10px] text-slate-400">Class cumulative average</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#092233] p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Present Marks
                  </span>
                  <span className="text-2xl font-bold text-teal-300 mt-1 block">
                    {attendanceHistory.reduce((acc, h) => acc + h.present, 0)}
                  </span>
                  <span className="text-[10px] text-slate-400">Pupil attendance logs</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#092233] p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Absences Logged
                  </span>
                  <span className="text-2xl font-bold text-rose-400 mt-1 block">
                    {attendanceHistory.reduce((acc, h) => acc + h.absent, 0)}
                  </span>
                  <span className="text-[10px] text-slate-400">Unexcused & recorded</span>
                </div>
              </div>

              {/* History Table */}
              <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#092233] shadow-md">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-4">Recorded Date</th>
                      <th className="p-4 text-center">Enrolled</th>
                      <th className="p-4 text-center">Present</th>
                      <th className="p-4 text-center">Absent</th>
                      <th className="p-4 text-center">Late</th>
                      <th className="p-4 text-center">Excused</th>
                      <th className="p-4 text-center">Attendance Rate</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {attendanceHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No previous attendance history recorded yet for this class. Select &quot;Daily Register&quot; to save attendance.
                        </td>
                      </tr>
                    ) : (
                      attendanceHistory.map((h) => {
                        const rate = Math.round((h.present / (h.total || 1)) * 100);
                        const isSelected = h.date === attendanceDate;
                        return (
                          <tr key={h.date} className={`hover:bg-slate-800/20 transition ${isSelected ? "bg-teal-950/20" : ""}`}>
                            <td className="p-4 font-bold text-white flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-[#dfba73]" />
                              <span suppressHydrationWarning>{formatDate(h.date, "long")}</span>
                              {isSelected && (
                                <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-500/40">
                                  Loaded in Register
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center text-slate-300 font-mono">{h.total}</td>
                            <td className="p-4 text-center">
                              <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                                {h.present}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="rounded-md bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300 border border-rose-500/30">
                                {h.absent}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                                {h.late}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">
                                {h.excused}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="h-2 w-20 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${rate >= 90 ? "bg-emerald-400" : rate >= 75 ? "bg-teal-400" : "bg-amber-400"}`}
                                    style={{ width: `${rate}%` }}
                                  />
                                </div>
                                <span className="font-bold text-slate-200 font-mono text-xs">{rate}%</span>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  switchAttendanceDate(h.date);
                                  setAttendanceViewMode("register");
                                }}
                                className="rounded-xl border border-[#dfba73]/40 bg-[#dfba73]/10 px-3 py-1.5 text-xs font-bold text-[#dfba73] hover:bg-[#dfba73] hover:text-slate-950 transition"
                              >
                                Open Register
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: DAILY ATTENDANCE REGISTER */}
          {attendanceViewMode === "register" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#092233] p-4">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Registration Date
                    </label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => switchAttendanceDate(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const updated: Record<string, { status: "present" | "absent" | "late" | "excused"; note: string }> = {};
                      enrolledStudents.forEach((st) => {
                        updated[st.id] = { status: "present", note: attendanceState[st.id]?.note || "" };
                      });
                      setAttendanceState(updated);
                    }}
                    className="mt-5 rounded-xl border border-teal-500/50 bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition"
                  >
                    Mark All Present
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {attendanceSavedToast && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-fade-in">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Attendance Saved to Database!</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={isSavingAttendance}
                    className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] disabled:opacity-50 transition shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSavingAttendance ? "Saving..." : "Save Register"}</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#092233] shadow-md">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Admission No</th>
                      <th className="p-4 text-center">Status Pills (Click to toggle)</th>
                      <th className="p-4">Remarks / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {enrolledStudents.map((st) => {
                      const current = attendanceState[st.id] || { status: "present", note: "" };
                      return (
                        <tr key={st.id} className="hover:bg-slate-800/20">
                          <td className="p-4 font-bold text-white">
                            {st.first_name} {st.last_name}
                          </td>
                          <td className="p-4 font-mono text-teal-300">{st.admission_number}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {(["present", "absent", "late", "excused"] as const).map((stat) => (
                                <button
                                  key={stat}
                                  type="button"
                                  onClick={() => {
                                    setAttendanceState((prev) => ({
                                      ...prev,
                                      [st.id]: { ...prev[st.id], status: stat, note: prev[st.id]?.note || "" },
                                    }));
                                  }}
                                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition border ${
                                    current.status === stat
                                      ? stat === "present"
                                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                                        : stat === "absent"
                                        ? "bg-rose-500 text-white border-rose-400 shadow-sm"
                                        : stat === "late"
                                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                                        : "bg-blue-500 text-white border-blue-400 shadow-sm"
                                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                                  }`}
                                >
                                  {stat}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              placeholder="Add comment (e.g. sick in infirmary, excused travel)..."
                              value={current.note}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAttendanceState((prev) => ({
                                  ...prev,
                                  [st.id]: { ...prev[st.id], status: prev[st.id]?.status || "present", note: val },
                                }));
                              }}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-[#dfba73] focus:outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MASTER SCORE SHEET (MASTERSHEET) */}
      {activeTab === "mastersheet" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-serif text-lg font-bold text-white">Class Master Score Sheet</h3>
                <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-500/40 uppercase">
                  View-Only Mastersheet
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official composite performance matrix across assigned curriculum subjects, totals, and academic rank.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={isSuperAdmin ? "/dashboard/subjects" : "/dashboard"}
                className="flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3.5 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition shadow-sm"
                title="Enter or update scores in your assigned Subject Teaching Cockpit"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Subject Teaching Cockpit</span>
              </Link>

              <button
                onClick={() => handleDownloadScoresheetTemplate()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-[#dfba73] hover:border-[#dfba73]/50 transition shadow-sm"
                title="Download CSV roster"
              >
                <Download className="h-3.5 w-3.5 text-[#dfba73]" />
                <span>Export Summary (CSV)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-[#dfba73] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition shadow-md"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Master Sheet</span>
              </button>
            </div>
          </div>

          {/* Subject Teacher Score Upload Notice Banner */}
          <div className="flex items-center gap-3 rounded-2xl border border-teal-500/30 bg-teal-950/30 p-3.5 text-xs text-teal-200">
            <Info className="h-4 w-4 shrink-0 text-teal-400" />
            <div>
              <span className="font-bold">Subject Teacher Managed Scores:</span> Continuous assessment scores and examination submissions are entered and uploaded by the assigned subject teachers directly within their respective Subject Workspaces. The class mastersheet displays verified 3 CAs (Total 30) and Examination (Total 70) results.
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#092233] shadow-xl">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950/80 text-slate-300 uppercase tracking-wider text-[10px] border-b border-slate-800">
                {/* 2-Tier Header Row 1: Subject Names */}
                <tr>
                  <th rowSpan={2} className="p-3.5 sticky left-0 bg-slate-950/95 z-20 border-b border-slate-800">Rank</th>
                  <th rowSpan={2} className="p-3.5 sticky left-12 bg-slate-950/95 z-20 border-b border-slate-800">Student Name</th>
                  <th rowSpan={2} className="p-3.5 border-b border-slate-800">Admission No</th>
                  {subjects.map((sub) => (
                    <th key={sub.id} colSpan={3} className="p-2.5 text-center border-l border-b border-slate-800/80 bg-slate-900/60 font-bold text-white">
                      <div>{sub.short_name || sub.name}</div>
                    </th>
                  ))}
                  <th rowSpan={2} className="p-3.5 text-center bg-slate-900/90 border-l border-b border-slate-700">Total Score</th>
                  <th rowSpan={2} className="p-3.5 text-center bg-slate-900/90 border-b border-slate-700">Average %</th>
                  <th rowSpan={2} className="p-3.5 text-right bg-slate-900/90 pr-4 border-b border-slate-700">Standing</th>
                </tr>
                {/* 2-Tier Header Row 2: 3 CAs Total + Exam + Total */}
                <tr>
                  {subjects.map((sub) => (
                    <React.Fragment key={`${sub.id}-subheaders`}>
                      <th className="p-2 text-center border-l border-slate-800 text-[9px] text-[#dfba73]">
                        CA (30)
                      </th>
                      <th className="p-2 text-center text-[9px] text-teal-300">
                        Exam (70)
                      </th>
                      <th className="p-2 text-center text-[9px] text-white bg-slate-950/40">
                        Total (100)
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rankedRows.map((row) => (
                  <tr key={row.student.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5 sticky left-0 bg-[#092233] z-10 font-bold text-[#dfba73]">
                      #{row.rank}
                    </td>
                    <td className="p-3.5 sticky left-12 bg-[#092233] z-10 font-bold text-white">
                      <Link
                        href={`/dashboard/students/${row.student.id}`}
                        className="hover:text-[#dfba73] transition"
                      >
                        {row.student.first_name} {row.student.last_name}
                      </Link>
                    </td>
                    <td className="p-3.5 font-mono text-teal-300 text-[11px]">
                      {row.student.admission_number}
                    </td>

                    {subjects.map((sub) => {
                      const scoreData = row.subjectScoresMap[sub.id];
                      const caTotal = (scoreData?.ca1 || 0) + (scoreData?.ca2 || 0) + (scoreData?.ca3 || 0);
                      const examScore = scoreData?.exam || 0;
                      const totalScore = scoreData?.total || 0;
                      return (
                        <React.Fragment key={sub.id}>
                          <td className="p-2.5 text-center border-l border-slate-800/60 font-mono text-slate-300">
                            {caTotal}
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-300">
                            {examScore}
                          </td>
                          <td className="p-2.5 text-center bg-slate-950/20 font-mono">
                            <span
                              className={`font-bold ${
                                totalScore >= 70
                                  ? "text-emerald-400"
                                  : totalScore >= 50
                                  ? "text-slate-200"
                                  : "text-rose-400"
                              }`}
                            >
                              {totalScore}
                            </span>
                            <span className="text-[9px] text-slate-400 ml-1 font-semibold">
                              {scoreData?.grade || "F"}
                            </span>
                          </td>
                        </React.Fragment>
                      );
                    })}

                    <td className="p-3.5 text-center font-mono font-bold text-white bg-slate-950/40 border-l border-slate-700">
                      {row.totalScore}
                    </td>
                    <td className="p-3.5 text-center font-bold text-[#dfba73] bg-slate-950/40">
                      {row.average}%
                    </td>
                    <td className="p-3.5 text-right bg-slate-950/40 pr-4">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          row.average >= 75
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : row.average >= 60
                            ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {row.average >= 75 ? "Distinction" : row.average >= 60 ? "Credit" : "Pass"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TERMINAL REPORT CARD */}
      {activeTab === "report-card" && (
        <div className="space-y-6">
          {/* Top Control Bar for Report Card Tab */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#092233] p-4 no-print">
            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle: Single Scholar vs View All & Print Set */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 p-1">
                <button
                  type="button"
                  onClick={() => setReportCardViewMode("single")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    reportCardViewMode === "single"
                      ? "bg-[#dfba73] text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Single Scholar
                </button>
                <button
                  type="button"
                  onClick={() => setReportCardViewMode("all")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    reportCardViewMode === "all"
                      ? "bg-[#dfba73] text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>View All &amp; Print Set ({rankedRows.length})</span>
                </button>
              </div>

              {reportCardViewMode === "single" && (
                <>
                  <label className="text-xs font-bold text-slate-300">Select Scholar:</label>
                  <select
                    value={selectedReportStudentId}
                    onChange={(e) => setSelectedReportStudentId(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    {rankedRows.map((r) => (
                      <option key={r.student.id} value={r.student.id}>
                        {r.rank}. {r.student.first_name} {r.student.last_name} ({r.student.admission_number})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentReportIndex <= 0}
                      onClick={() => {
                        if (rankedRows.length > 0) {
                          setSelectedReportStudentId(rankedRows[0].student.id);
                        }
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-[#dfba73] hover:border-[#dfba73]/40 disabled:opacity-30 transition"
                      title="First scholar"
                    >
                      ⏮ First
                    </button>
                    <button
                      type="button"
                      disabled={currentReportIndex <= 0}
                      onClick={() => {
                        if (currentReportIndex > 0) {
                          setSelectedReportStudentId(rankedRows[currentReportIndex - 1].student.id);
                        }
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:text-white disabled:opacity-30 transition"
                      title="Previous scholar"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentReportIndex >= rankedRows.length - 1}
                      onClick={() => {
                        if (currentReportIndex < rankedRows.length - 1) {
                          setSelectedReportStudentId(rankedRows[currentReportIndex + 1].student.id);
                        }
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:text-white disabled:opacity-30 transition"
                      title="Next scholar"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentReportIndex >= rankedRows.length - 1}
                      onClick={() => {
                        if (rankedRows.length > 0) {
                          setSelectedReportStudentId(rankedRows[rankedRows.length - 1].student.id);
                        }
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-[#dfba73] hover:border-[#dfba73]/40 disabled:opacity-30 transition"
                      title="Last scholar"
                    >
                      Last ⏭
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {reportCardViewMode === "single" && (
                <button
                  onClick={() => {
                    setSelectedAssessmentStudentId(selectedReportStudentId);
                    setActiveTab("comments");
                  }}
                  className="flex items-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3.5 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Appraisal &amp; Domains</span>
                </button>
              )}

              {reportCardViewMode === "single" ? (
                <>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-xl border border-[#dfba73]/40 bg-[#dfba73]/10 px-4 py-2 text-xs font-bold text-[#dfba73] hover:bg-[#dfba73] hover:text-slate-950 transition shadow-sm"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Single Card</span>
                  </button>

                  <button
                    onClick={() => {
                      setReportCardViewMode("all");
                      setTimeout(() => window.print(), 300);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition shadow-md"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Set ({rankedRows.length})</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition shadow-lg ring-2 ring-amber-300/60"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Complete Class Set ({rankedRows.length} Report Cards)</span>
                </button>
              )}
            </div>
          </div>

          {/* In "View All & Print Set" Mode: Scholar Chips Navigation */}
          {reportCardViewMode === "all" && (
            <div className="rounded-2xl border border-slate-800 bg-[#092233] p-4 text-xs text-slate-300 space-y-2 no-print">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#dfba73] uppercase tracking-wider text-[11px]">
                  Continuous Class Set Preview ({rankedRows.length} Enrolled Scholars)
                </span>
                <span className="text-[11px] text-slate-400">
                  Each report card will print on an independent formal sheet.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {rankedRows.map((r) => (
                  <a
                    key={r.student.id}
                    href={`#report-${r.student.id}`}
                    className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:text-[#dfba73] hover:border-[#dfba73]/40 transition"
                  >
                    {r.rank}. {r.student.first_name} {r.student.last_name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* RENDER REPORT CARD(S) */}
          {(() => {
            const displayRows = reportCardViewMode === "all" ? rankedRows : (selectedReportRow ? [selectedReportRow] : []);
            if (displayRows.length === 0) {
              return (
                <div className="rounded-3xl border border-slate-800 bg-[#092233] p-12 text-center text-slate-400">
                  No scholars enrolled in this class stream.
                </div>
              );
            }

            return (
              <div className={reportCardViewMode === "all" ? "space-y-12 print:space-y-0" : ""}>
                {displayRows.map((selectedReportRow) => {
                  const currentReportData = terminalReportsList.find((r) => r.student_id === selectedReportRow.student.id);
                  const affective = currentReportData?.affective_domain || {
                    punctuality: 5,
                    neatness: 5,
                    politeness: 5,
                    honesty: 5,
                    leadership: 4,
                    attentiveness: 5,
                    relationship: 5,
                  };
                  const psychomotor = currentReportData?.psychomotor_domain || {
                    handwriting: 4,
                    sports: 5,
                    verbalFluency: 4,
                    artsCrafts: 4,
                    toolHandling: 5,
                  };
                  const daysOpened = currentReportData?.days_school_opened ?? 60;
                  const daysPresent = currentReportData?.days_present ?? attendanceRecordsList.filter((a) => a.student_id === selectedReportRow.student.id && a.status === "present").length;
                  const daysAbsent = currentReportData?.days_absent ?? attendanceRecordsList.filter((a) => a.student_id === selectedReportRow.student.id && a.status === "absent").length;
                  const resumptionDate = currentReportData?.next_term_resumption || "January 11, 2027";
                  const teacherRemark = currentReportData?.teacher_comment || "An exceptionally attentive and polite pupil who demonstrates strong analytic capability and harmonious teamwork.";
                  const principalRemark = currentReportData?.principal_comment || "";

                  const sectionCode = (classItem.section_name || "").toLowerCase().includes("nursery")
                    ? "NURSERY"
                    : (classItem.section_name || "").toLowerCase().includes("primary")
                    ? "PRIMARY"
                    : "SECONDARY";
                  const matchedHead = (sectionHeads || []).find((h: any) => h.section_code === sectionCode);
                  const currentSessionObj = (allSessions || []).find((s) => s.id === selectedSessionId) || currentSession;
                  const currentTermObj = (allTerms || []).find((t) => t.id === selectedTermId) || currentTerm;

                  return (
                    <div
                      key={selectedReportRow.student.id}
                      id={`report-${selectedReportRow.student.id}`}
                      className="printable-report-card report-card-print-page relative overflow-hidden rounded-3xl bg-white text-slate-900 max-w-4xl mx-auto shadow-2xl border-[6px] border-[#092233] ring-4 ring-[#c5a059]/80 p-6 sm:p-9 space-y-6 print:border-4 print:border-[#092233] print:ring-0 print:shadow-none print:m-0 print:p-6 print:text-black mb-10 print:mb-0"
                    >
                {/* Background Watermark Crest */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035] print:opacity-[0.05]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/djkudkxmx/image/upload/v1781003815/salamah_fav_icon_jxar2b.png"
                    alt=""
                    className="w-[480px] h-[480px] object-contain"
                  />
                </div>

                {/* Institutional Header with Crest & Luxury Framed Passport */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#092233] pb-6 gap-6 relative z-10 pt-2">
                  {/* Left: Crest & Institutional Details */}
                  <div className="flex items-center gap-5 flex-1">
                    <div className="relative rounded-2xl border-2 border-[#c5a059] p-1.5 bg-gradient-to-br from-amber-50 to-white shadow-sm shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://res.cloudinary.com/djkudkxmx/image/upload/v1781003815/salamah_fav_icon_jxar2b.png"
                        alt="Salamah Crest"
                        className="h-20 w-20 object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#092233] uppercase leading-none">
                        SALAMAH INTERNATIONAL SCHOOL
                      </h2>
                      <p className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[#8c6b2d] mt-1">
                        Government Accredited • British & Nigerian Curriculum • Cambridge Accredited
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Plot 402, Cadastral Zone, Katsina State, Nigeria
                      </p>
                      <p className="text-[11px] text-teal-800 font-semibold italic mt-0.5">
                        Motto: &quot;Knowledge, Character, Innovation and Peaceful Co-existence&quot;
                      </p>
                    </div>
                  </div>

                  {/* Right: Framed Luxury Student Passport Photograph */}
                  <div className="flex flex-col items-center justify-center shrink-0 self-center sm:self-auto">
                    <div className="relative h-32 w-28 rounded-xl overflow-hidden border-2 border-[#c5a059] bg-white shadow-md p-0.5 ring-1 ring-[#092233]/20 flex items-center justify-center">
                      {selectedReportRow.student.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedReportRow.student.avatar_url}
                          alt="Student Passport"
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-2 text-center rounded-lg">
                          <Users className="h-8 w-8 text-[#092233]/40 mb-1" />
                          <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#092233]/70 leading-tight">
                            Official Scholar Passport
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-[#092233]/85 text-[7.5px] font-bold text-amber-200 uppercase tracking-widest text-center py-0.5">
                        Verified
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 uppercase tracking-wider">
                      {selectedReportRow.student.admission_number}
                    </span>
                  </div>
                </div>

                {/* Report Document Title Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[#092233] via-[#0e354e] to-[#092233] px-5 py-2.5 text-white shadow-sm relative z-10">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#dfba73]" />
                    <span className="font-serif text-sm font-bold tracking-widest uppercase text-amber-100">
                      Official Terminal Academic Report
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="text-amber-200">
                      Term: <strong className="text-white">{currentTermObj.name}</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-amber-200">
                      Session: <strong className="text-white">{currentSessionObj.name}</strong>
                    </span>
                  </div>
                </div>

                {/* Student Biodata & Placement Grid */}
                <div className="rounded-2xl border border-[#c5a059]/40 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-4 shadow-xs relative z-10">
                  <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">
                        Student Full Name
                      </span>
                      <span className="font-serif font-bold text-slate-900 text-sm mt-0.5 block">
                        {selectedReportRow.student.first_name} {selectedReportRow.student.middle_name ? `${selectedReportRow.student.middle_name} ` : ""}{selectedReportRow.student.last_name}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">
                        Admission Number
                      </span>
                      <span className="font-mono font-bold text-[#092233] text-sm mt-0.5 block">
                        {selectedReportRow.student.admission_number}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">
                        Academic Class & Wing
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5 block">
                        {classItem.grade_name} - {classItem.name} ({classItem.section_name || "General"})
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">
                        Class Position / Rank
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 border border-amber-300 px-2 py-0.5 font-bold text-amber-900 text-xs mt-0.5">
                        ★ {selectedReportRow.rank} of {enrolledStudents.length} Scholars
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">
                        Gender / Sex
                      </span>
                      <span className="font-semibold text-slate-800 capitalize mt-0.5 block">
                        {selectedReportRow.student.gender || "Not Specified"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">
                        Date of Birth
                      </span>
                      <span className="font-semibold text-slate-800 mt-0.5 block" suppressHydrationWarning>
                        {selectedReportRow.student.date_of_birth ? formatDate(selectedReportRow.student.date_of_birth) : "On Record"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">
                        Overall Performance
                      </span>
                      <span className="font-mono font-bold text-[#092233] text-sm mt-0.5 block">
                        {selectedReportRow.average}% • {selectedReportRow.average >= 75 ? "Distinction" : selectedReportRow.average >= 50 ? "Credit" : "Pass"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Term Attendance & Calendar Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700 relative z-10">
                  <div className="flex flex-wrap items-center gap-5">
                    <span>School Sessions: <strong className="text-slate-900 font-bold">{daysOpened} Days</strong></span>
                    <span>Days Present: <strong className="text-emerald-700 font-bold">{daysPresent} Days</strong></span>
                    <span>Days Absent: <strong className="text-rose-700 font-bold">{daysAbsent} Days</strong></span>
                    <span>Attendance Rate: <strong className="text-[#092233] font-bold">{Math.round(((daysPresent || 0) / (daysOpened || 1)) * 100)}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#8c6b2d] font-bold uppercase text-[10px] tracking-wider">Next Term:</span>
                    <span className="font-bold text-[#092233] bg-white border border-slate-300 px-2 py-0.5 rounded-md">{resumptionDate}</span>
                  </div>
                </div>

                {/* Academic Performance Breakdown Table */}
                <div className="overflow-hidden rounded-2xl border-2 border-[#092233] bg-white shadow-xs relative z-10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#092233] text-amber-100 uppercase tracking-wider text-[10px] font-bold border-b border-[#c5a059]">
                      <tr>
                        <th className="p-3 w-8 text-center text-amber-300">#</th>
                        <th className="p-3">Subject Discipline</th>
                        <th className="p-3 text-center">1st CA (10)</th>
                        <th className="p-3 text-center">2nd CA (10)</th>
                        <th className="p-3 text-center">3rd CA (10)</th>
                        <th className="p-3 text-center">Exam (70)</th>
                        <th className="p-3 text-center font-bold text-white bg-[#0e354e]">Total (100)</th>
                        <th className="p-3 text-center font-bold text-amber-300">Grade</th>
                        <th className="p-3 text-right">Attainment Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-900">
                      {subjects.map((sub, idx) => {
                        const data = selectedReportRow.subjectScoresMap[sub.id];
                        const total = data?.total || 0;
                        let gradeBadge = "bg-rose-100 text-rose-800 border-rose-300";
                        if (total >= 75) gradeBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
                        else if (total >= 65) gradeBadge = "bg-blue-100 text-blue-800 border-blue-300";
                        else if (total >= 50) gradeBadge = "bg-amber-100 text-amber-800 border-amber-300";

                        return (
                          <tr key={sub.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                            <td className="p-3 text-center font-mono text-[11px] text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-bold text-[#092233]">
                              {sub.name}
                              <span className="ml-1.5 text-[10px] font-mono text-slate-400">({sub.code})</span>
                            </td>
                            <td className="p-3 text-center font-mono text-slate-700">{data?.ca1 || 0}</td>
                            <td className="p-3 text-center font-mono text-slate-700">{data?.ca2 || 0}</td>
                            <td className="p-3 text-center font-mono text-slate-700">{data?.ca3 || 0}</td>
                            <td className="p-3 text-center font-mono text-slate-700">{data?.exam || 0}</td>
                            <td className="p-3 text-center font-mono font-black text-[#092233] bg-amber-50/40 text-sm">
                              {total}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-black border ${gradeBadge}`}>
                                {data?.grade || "F"}
                              </span>
                            </td>
                            <td className="p-3 text-right text-slate-700 text-[11px] font-medium">
                              {total >= 75
                                ? "Excellent Mastery"
                                : total >= 65
                                ? "Very Good Performance"
                                : total >= 50
                                ? "Credit Attainment"
                                : total >= 40
                                ? "Pass Level"
                                : "Needs Diligent Remediation"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-[#092233] bg-slate-100 font-bold text-slate-900 text-xs">
                      <tr>
                        <td colSpan={6} className="p-3 text-right uppercase tracking-wider text-[11px] text-[#092233]">
                          Aggregate Total & Academic Average:
                        </td>
                        <td className="p-3 text-center font-mono font-black text-[#092233] text-sm bg-amber-100/60">
                          {selectedReportRow.totalScore}
                        </td>
                        <td className="p-3 text-center font-black text-amber-900">
                          {selectedReportRow.average}%
                        </td>
                        <td className="p-3 text-right text-[#092233] text-[11px]">
                          Class General Avg: <strong>{classAvg}%</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Behavioral & Domain Matrices (Affective & Psychomotor with visual 5-star/point bars) */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 relative z-10">
                  {/* Affective Domain Card */}
                  <div className="rounded-2xl border border-[#c5a059]/40 bg-white p-4 shadow-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8c6b2d]">
                        Affective Domain (Character & Work Habits)
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">Scale: 1 to 5</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { key: "punctuality", label: "Punctuality & Regularity" },
                        { key: "neatness", label: "Neatness & Uniform Deportment" },
                        { key: "politeness", label: "Politeness & Courtesy" },
                        { key: "honesty", label: "Honesty & Trustworthiness" },
                        { key: "leadership", label: "Leadership & Initiative" },
                        { key: "attentiveness", label: "Attentiveness in Class" },
                        { key: "relationship", label: "Peer Relations & Teamwork" },
                      ].map((item) => {
                        const val = affective[item.key] ?? 5;
                        return (
                          <div key={item.key} className="flex items-center justify-between border-b border-slate-100 pb-1">
                            <span className="text-slate-700 font-medium">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-xs ${
                                      star <= val ? "text-[#c5a059]" : "text-slate-300"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="font-mono font-bold text-[#092233] w-6 text-right">
                                {val}/5
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Psychomotor Domain Card */}
                  <div className="rounded-2xl border border-[#1e8c7a]/40 bg-white p-4 shadow-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
                        Psychomotor Domain (Practical Skills & Dexterity)
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">Scale: 1 to 5</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { key: "handwriting", label: "Handwriting & Penmanship" },
                        { key: "sports", label: "Sports, Athletics & Fitness" },
                        { key: "verbalFluency", label: "Verbal Fluency & Public Speaking" },
                        { key: "artsCrafts", label: "Arts, Crafts & Creative Design" },
                        { key: "toolHandling", label: "Laboratory & Practical Tool Handling" },
                      ].map((item) => {
                        const val = psychomotor[item.key] ?? 5;
                        return (
                          <div key={item.key} className="flex items-center justify-between border-b border-slate-100 pb-1">
                            <span className="text-slate-700 font-medium">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-xs ${
                                      star <= val ? "text-teal-600" : "text-slate-300"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="font-mono font-bold text-[#092233] w-6 text-right">
                                {val}/5
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Institutional Grading Scale Legend */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[10px] text-slate-700 relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
                    <span className="font-bold text-[#092233] uppercase tracking-wider">Official Grading Key:</span>
                    <span><strong>A*</strong> (90-100%) Distinction</span>
                    <span><strong>A</strong> (75-89%) Excellent</span>
                    <span><strong>B</strong> (65-74%) Very Good</span>
                    <span><strong>C</strong> (50-64%) Good Credit</span>
                    <span><strong>D</strong> (40-49%) Pass</span>
                    <span><strong>F</strong> (0-39%) Unsatisfactory</span>
                    <span className="text-slate-500 border-l border-slate-300 pl-2">Rating: 5=Exemplary, 4=Commendable, 3=Satisfactory, 2=Fair, 1=Poor</span>
                  </div>
                </div>

                {/* Dual Endorsement & Institutional Seal */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-2 border-t-2 border-[#092233] relative z-10">
                  {/* Form Teacher Endorsement */}
                  <div className="rounded-2xl bg-amber-50/30 p-4 border border-[#c5a059]/40 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">
                        Form Teacher&apos;s Appraisal & Conduct Note
                      </span>
                      <p className="text-xs text-slate-800 italic leading-relaxed mt-1">
                        &quot;{teacherRemark}&quot;
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-900 font-bold text-xs block">
                          {classItem.class_teacher_name || "Form Teacher"}
                        </span>
                        <span className="text-[10px] text-slate-500">Form Teacher Attestation</span>
                      </div>
                      <div className="text-right">
                        <span className="font-serif italic text-xs text-teal-800 border-b border-dashed border-teal-700 block">
                          Certified Digitally
                        </span>
                        <span className="text-[9px] text-slate-400">Class Form Signatory</span>
                      </div>
                    </div>
                  </div>

                  {/* Section Head / Principal Endorsement */}
                  <div className="rounded-2xl bg-teal-50/20 p-4 border border-teal-600/30 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                        {matchedHead?.title || "Section Head / Principal"} Official Endorsement
                      </span>
                      <p className="text-xs text-slate-800 italic leading-relaxed mt-1">
                        &quot;{principalRemark || matchedHead?.default_comment || "Promoted with commendation. Continue sustaining this exemplary standard of scholarly excellence."}&quot;
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-900 font-bold text-xs block">
                          {matchedHead?.full_name || "School Principal"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {matchedHead?.qualification || "Salamah Institutional Directorate"}
                        </span>
                      </div>
                      <div className="text-right">
                        {matchedHead?.signature_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={matchedHead.signature_url}
                            alt="Signature"
                            className="h-9 max-w-[110px] object-contain inline-block"
                          />
                        ) : (
                          <span className="font-serif italic text-xs text-[#092233] border-b border-dashed border-slate-400 block">
                            Executive Seal
                          </span>
                        )}
                        <span className="text-amber-800 font-bold text-[9px] block uppercase tracking-wider">
                          Official Institutional Seal
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    })()}
  </div>
)}

      {/* TAB 5: REPORT CARD APPRAISAL, AFFECTIVE/PSYCHOMOTOR DOMAINS & TEACHER COMMENTS */}
      {activeTab === "comments" && (() => {
        const activeStudent = enrolledStudents.find((s) => s.id === selectedAssessmentStudentId) || enrolledStudents[0];
        const studentRankRow = rankedRows.find((r) => r.student.id === activeStudent?.id);
        const savedData = terminalReportsList.find((r) => r.student_id === activeStudent?.id);

        return (
          <ReportCardAppraisalWorkspace
            student={activeStudent}
            studentRankRow={studentRankRow}
            enrolledStudents={enrolledStudents}
            savedReport={savedData}
            comments={comments.filter((c) => c.student_id === activeStudent?.id)}
            classTeacherName={classItem.class_teacher_name || "Form Teacher"}
            onSelectStudent={(id) => setSelectedAssessmentStudentId(id)}
            onSave={handleSaveTerminalReport}
            isSaving={isSavingTerminalReport}
            toastVisible={terminalReportToast}
            onOpenCommentModal={() => {
              setCommentStudentId(activeStudent?.id || "");
              setIsCommentModalOpen(true);
            }}
            onPreviewReportCard={() => {
              setSelectedReportStudentId(activeStudent?.id || "");
              setActiveTab("report-card");
            }}
          />
        );
      })()}

      {/* MODAL: ADD STUDENT TO CLASS */}
      {isAddStudentModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddStudentModalOpen(false);
          }}
        >
          <div className="relative my-auto flex max-h-[88vh] w-full max-w-xl flex-col rounded-3xl border border-teal-500/50 bg-[#092233] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0 bg-[#071d2b]">
              <div>
                <span className="rounded-full bg-teal-500/20 border border-teal-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                  Classroom Student Intake
                </span>
                <h3 className="mt-1 font-display text-lg font-bold text-white">
                  Add Student to Classroom
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStudentModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 salamah-scrollbar">
              {/* Mode Switcher */}
              <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setAddStudentMode("manual")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition ${
                  addStudentMode === "manual"
                    ? "bg-teal-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Type Info Manually (New Pupil)</span>
              </button>

              <button
                type="button"
                onClick={() => setAddStudentMode("transfer")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition ${
                  addStudentMode === "transfer"
                    ? "bg-teal-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Transfer from Directory</span>
              </button>
            </div>

            {/* MODE 1: TYPE STUDENT INFO MANUALLY */}
            {addStudentMode === "manual" && (
              <form onSubmit={handleManualStudentSubmit} className="mt-4 space-y-4">
                {/* Classroom Selector with Current Class Defaulted */}
                <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-3.5">
                  <label className="block text-xs font-bold text-teal-300 mb-1 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Academic Classroom & Arm * (Current Class Pre-selected)</span>
                  </label>
                  <select
                    value={targetClassSelection}
                    onChange={(e) => setTargetClassSelection(e.target.value)}
                    className="w-full rounded-xl border border-teal-500/50 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-teal-400 focus:outline-none"
                    required
                  >
                    {classList.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} — {cls.grade_name} ({cls.section_name || "General Wing"})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-teal-400/80 mt-1 block">
                    Automatically assigned to {classItem.name}. You may choose another class if needed.
                  </span>
                </div>

                {/* Personal Information */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#dfba73] block mb-2">
                    Student Personal Information
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Yusuf"
                        value={manualFirstName}
                        onChange={(e) => setManualFirstName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Middle Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Al-Hassan"
                        value={manualMiddleName}
                        onChange={(e) => setManualMiddleName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bello"
                        value={manualLastName}
                        onChange={(e) => setManualLastName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Gender, DOB, Admission No */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Gender *</label>
                    <select
                      value={manualGender}
                      onChange={(e) => setManualGender(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none"
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={manualDob}
                      onChange={(e) => setManualDob(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Admission Number *</label>
                    <input
                      type="text"
                      required
                      value={manualAdmissionNo}
                      onChange={(e) => setManualAdmissionNo(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono font-bold text-teal-300 focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Passport Picture */}
                <div className="border-t border-slate-800 pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#dfba73] block mb-2">
                    Student Passport Picture
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden border-2 border-teal-500/50 bg-slate-900 shadow-md">
                      {manualPassportUrl ? (
                        <img src={manualPassportUrl} alt="Passport Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-500 text-xs">No Photo</div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="url"
                        placeholder="Paste image URL (or select preset below)..."
                        value={manualPassportUrl}
                        onChange={(e) => setManualPassportUrl(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-slate-400">Presets:</span>
                        <button
                          type="button"
                          onClick={() => setManualPassportUrl("https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80")}
                          className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white hover:border-teal-400"
                        >
                          Boy Scholar 1
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualPassportUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80")}
                          className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white hover:border-teal-400"
                        >
                          Boy Scholar 2
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualPassportUrl("https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80")}
                          className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white hover:border-teal-400"
                        >
                          Girl Scholar 1
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualPassportUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80")}
                          className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white hover:border-teal-400"
                        >
                          Girl Scholar 2
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guardian & Residential Details */}
                <div className="border-t border-slate-800 pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#dfba73] block mb-2">
                    Parent / Guardian Contact
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Parent / Guardian Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alhaji Mustapha Bello"
                        value={manualGuardianName}
                        onChange={(e) => setManualGuardianName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Guardian Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+2348030000000"
                        value={manualGuardianPhone}
                        onChange={(e) => setManualGuardianPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Guardian Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="guardian@domain.com"
                        value={manualGuardianEmail}
                        onChange={(e) => setManualGuardianEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Residential Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Plot 402 Cadastral Zone, Abuja"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic & Medical History */}
                <div className="border-t border-slate-800 pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Academic & Medical History (Optional)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Previous School Attended
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Al-Huda International Academy"
                        value={manualPreviousSchool}
                        onChange={(e) => setManualPreviousSchool(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Medical Alert / Blood Group / Allergies
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Blood: O+, Genotype: AA, Asthma inhaler"
                        value={manualMedicalInfo}
                        onChange={(e) => setManualMedicalInfo(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentModalOpen(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingManualStudent}
                    className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50 transition shadow-md"
                  >
                    {isSubmittingManualStudent ? "Registering Pupil..." : "Register & Add to Class"}
                  </button>
                </div>
              </form>
            )}

            {/* MODE 2: TRANSFER FROM DIRECTORY */}
            {addStudentMode === "transfer" && (
              <form onSubmit={handleAddStudentToClass} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Classroom *
                  </label>
                  <select
                    value={targetClassSelection}
                    onChange={(e) => setTargetClassSelection(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-teal-300 focus:border-teal-400 focus:outline-none"
                    required
                  >
                    {classList.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} — {cls.grade_name} ({cls.section_name || "General Wing"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Search & Select Existing Student *
                  </label>
                  <input
                    type="text"
                    placeholder="Filter available students by name or admission number..."
                    value={addStudentSearch}
                    onChange={(e) => setAddStudentSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white mb-2 placeholder-slate-600 focus:border-teal-400 focus:outline-none"
                  />

                  <select
                    value={selectedStudentToAdd}
                    onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Student from Directory --</option>
                    {availableStudents
                      .filter((s) => {
                        const q = addStudentSearch.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          s.first_name.toLowerCase().includes(q) ||
                          s.last_name.toLowerCase().includes(q) ||
                          s.admission_number.toLowerCase().includes(q)
                        );
                      })
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.last_name} ({s.admission_number}) — Currently: {s.current_class_name || "Unassigned"}
                        </option>
                      ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Selecting a student currently in another class will transfer their active enrolment to this class.
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentModalOpen(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAddStudent || !selectedStudentToAdd}
                    className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50 transition shadow-md cursor-pointer"
                  >
                    {isSubmittingAddStudent ? "Enrolling..." : "Transfer / Enroll to Class"}
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUICK TEACHER COMMENT */}
      {isCommentModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCommentModalOpen(false);
          }}
        >
          <div className="relative my-auto w-full max-w-md rounded-3xl border border-[#dfba73]/50 bg-[#092233] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73]">
                  Teacher Observation Note
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  Classroom Comment
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

            <form onSubmit={handleSubmitComment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Student *
                </label>
                <select
                  value={commentStudentId}
                  onChange={(e) => setCommentStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  required
                >
                  {enrolledStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.first_name} {st.last_name} ({st.admission_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={commentCategory}
                  onChange={(e) => setCommentCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                >
                  <option value="sickness">Sickness / Health Alert</option>
                  <option value="misbehavior">Misbehavior / Conduct Caution</option>
                  <option value="praise">Commendation / Star Pupil</option>
                  <option value="academic">Academic Effort / Assessment Note</option>
                  <option value="pastoral">Pastoral / General Welfare</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Date of Observation *
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
                  Teacher Text Comment *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record what happened (e.g. reported severe stomach ache at 10:15am, transferred to infirmary, parent called)..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  This comment will be recorded in the classroom log and automatically synchronized to the student&apos;s personal dossier.
                </span>
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
                  className="rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] disabled:opacity-50 transition shadow-md"
                >
                  {isSubmittingComment ? "Saving..." : "Save Comment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBJECT SCORE ENTRY */}
      {isScoreModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsScoreModalOpen(false);
          }}
        >
          <div className="relative my-auto flex max-h-[88vh] w-full max-w-2xl flex-col rounded-3xl border border-teal-500/50 bg-[#092233] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0 bg-[#071d2b]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  Continuous Assessment &amp; Examination
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  Enter Subject Scores for {classItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScoreModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScores} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 salamah-scrollbar">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject *
                </label>
                <select
                  value={scoreSubjectId}
                  onChange={(e) => openScoreEntryModal(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3 text-center">1st CA (/10)</th>
                      <th className="p-3 text-center">2nd CA (/10)</th>
                      <th className="p-3 text-center">3rd CA (/10)</th>
                      <th className="p-3 text-center">Exam (/70)</th>
                      <th className="p-3 text-center font-bold text-white">Total (/100)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {enrolledStudents.map((st) => {
                      const input = scoreInputs[st.id] || { ca1: 0, ca2: 0, ca3: 0, exam: 0 };
                      const total =
                        (Number(input.ca1) || 0) +
                        (Number(input.ca2) || 0) +
                        (Number(input.ca3) || 0) +
                        (Number(input.exam) || 0);
                      return (
                        <tr key={st.id} className="hover:bg-slate-800/20">
                          <td className="p-3 font-medium text-white">
                            <div>{st.first_name} {st.last_name}</div>
                            <span className="text-[10px] font-mono text-slate-400">{st.admission_number}</span>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={input.ca1}
                              onChange={(e) => {
                                const val = Math.min(10, Math.max(0, Number(e.target.value) || 0));
                                setScoreInputs((prev) => ({
                                  ...prev,
                                  [st.id]: { ...prev[st.id], ca1: val },
                                }));
                              }}
                              className="w-14 text-center rounded-lg border border-slate-700 bg-slate-950 py-1 text-xs text-white"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={input.ca2}
                              onChange={(e) => {
                                const val = Math.min(10, Math.max(0, Number(e.target.value) || 0));
                                setScoreInputs((prev) => ({
                                  ...prev,
                                  [st.id]: { ...prev[st.id], ca2: val },
                                }));
                              }}
                              className="w-14 text-center rounded-lg border border-slate-700 bg-slate-950 py-1 text-xs text-white"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={input.ca3}
                              onChange={(e) => {
                                const val = Math.min(10, Math.max(0, Number(e.target.value) || 0));
                                setScoreInputs((prev) => ({
                                  ...prev,
                                  [st.id]: { ...prev[st.id], ca3: val },
                                }));
                              }}
                              className="w-14 text-center rounded-lg border border-slate-700 bg-slate-950 py-1 text-xs text-white"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="70"
                              value={input.exam}
                              onChange={(e) => {
                                const val = Math.min(70, Math.max(0, Number(e.target.value) || 0));
                                setScoreInputs((prev) => ({
                                  ...prev,
                                  [st.id]: { ...prev[st.id], exam: val },
                                }));
                              }}
                              className="w-16 text-center rounded-lg border border-slate-700 bg-slate-950 py-1 text-xs text-white font-mono"
                            />
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-teal-300">
                            {total}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScoreModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingScores}
                  className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50 transition shadow-md"
                >
                  {isSavingScores ? "Saving..." : "Save Scores to Mastersheet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: SCORESHEET UPLOAD (3 CAs, EXAM, TOTAL) */}
      {isScoresheetUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsScoresheetUploadModalOpen(false);
              setParsedScoresheetData([]);
              setUploadRawText("");
            }
          }}
        >
          <div className="relative my-auto flex max-h-[88vh] w-full max-w-4xl flex-col rounded-3xl border border-[#dfba73]/50 bg-[#092233] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#dfba73]/10 border border-[#dfba73]/30 p-2.5 text-[#dfba73]">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73]">
                    Bulk Scoresheet Ingestion
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white">
                    Upload Subject Scoresheet • 3 CAs + Exam + Total
                  </h3>
                  <p className="text-xs text-slate-400">
                    Import or paste scores for {classItem.name}. Expected format: CA 1 (10), CA 2 (10), CA 3 (10), Exam (70) = Total (100).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsScoresheetUploadModalOpen(false);
                  setParsedScoresheetData([]);
                  setUploadRawText("");
                }}
                className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Subject Selection & Template Download */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Subject *
                  </label>
                  <select
                    value={uploadSubjectId}
                    onChange={(e) => setUploadSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={() => handleDownloadScoresheetTemplate(uploadSubjectId)}
                    className="flex items-center gap-2 rounded-xl border border-[#dfba73]/40 bg-[#dfba73]/10 px-3.5 py-2 text-xs font-bold text-[#dfba73] hover:bg-[#dfba73]/20 transition shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Pre-filled Template (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Ingestion Methods: File Upload or Direct Paste */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* File Picker */}
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block mb-1">
                      Option A: File Upload
                    </span>
                    <p className="text-xs text-slate-300">
                      Upload a completed CSV file exported from Excel, Google Sheets, or Salamah template.
                    </p>
                  </div>

                  <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-200 hover:text-white hover:border-teal-400 hover:bg-slate-800/80 transition cursor-pointer">
                    <Upload className="h-4 w-4 text-teal-400" />
                    <span>Select CSV or TSV File</span>
                    <input
                      type="file"
                      accept=".csv,.txt,.tsv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleScoresheetFileSelected(file);
                      }}
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 text-center block">
                    Columns: Admission Number, Student Name, CA 1, CA 2, CA 3, Exam, Total
                  </span>
                </div>

                {/* Direct Paste */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73]">
                      Option B: Paste from Excel / Sheets
                    </span>
                    {uploadRawText && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadRawText("");
                          setParsedScoresheetData([]);
                        }}
                        className="text-[10px] text-slate-400 hover:text-rose-400 transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={uploadRawText}
                    onChange={(e) => {
                      setUploadRawText(e.target.value);
                      parseScoresheetContent(e.target.value);
                    }}
                    placeholder={"Paste tabular data copied from Excel here...\nADM-2024-001\tAisha Bello\t9\t8\t9\t60\t86\nADM-2024-002\tFatima Yusuf\t10\t9\t8\t65\t92"}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-xs text-white placeholder-slate-600 focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
              </div>

              {/* Parsed Preview Table */}
              {parsedScoresheetData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-teal-400" />
                      <span className="text-xs font-bold text-white">Parsed Scoresheet Preview</span>
                      <span className="rounded-md bg-teal-500/20 border border-teal-500/40 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                        {parsedScoresheetData.filter((r) => r.isValid).length} / {enrolledStudents.length} Students Matched
                      </span>
                    </div>
                    {parsedScoresheetData.some((r) => !r.isValid) && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Some rows could not be matched to this class roster
                      </span>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5 text-center">Status</th>
                          <th className="p-2.5">Admission No</th>
                          <th className="p-2.5">Student Name</th>
                          <th className="p-2.5 text-center">CA 1 (/10)</th>
                          <th className="p-2.5 text-center">CA 2 (/10)</th>
                          <th className="p-2.5 text-center">CA 3 (/10)</th>
                          <th className="p-2.5 text-center">Exam (/70)</th>
                          <th className="p-2.5 text-center font-bold text-white">Total (/100)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {parsedScoresheetData.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`transition ${
                              row.isValid ? "hover:bg-slate-800/30" : "bg-rose-950/20 text-rose-300"
                            }`}
                          >
                            <td className="p-2.5 text-center">
                              {row.isValid ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 inline-block" />
                              ) : (
                                <span title={row.error} className="inline-block">
                                  <AlertCircle className="h-4 w-4 text-rose-400 inline-block" />
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-teal-300 text-[11px]">
                              {row.admissionNo}
                            </td>
                            <td className="p-2.5 font-medium text-white">
                              {row.studentName}
                              {row.error && (
                                <span className="block text-[9px] text-rose-400">{row.error}</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-mono">{row.ca1}</td>
                            <td className="p-2.5 text-center font-mono">{row.ca2}</td>
                            <td className="p-2.5 text-center font-mono">{row.ca3}</td>
                            <td className="p-2.5 text-center font-mono">{row.exam}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-[#dfba73]">
                              {row.total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Saving will update First CA, Second CA, Third CA, and Examination scores in database.
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsScoresheetUploadModalOpen(false);
                    setParsedScoresheetData([]);
                    setUploadRawText("");
                  }}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitUploadedScoresheet}
                  disabled={
                    isUploadingScoresheet ||
                    parsedScoresheetData.filter((r) => r.isValid).length === 0
                  }
                  className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] disabled:opacity-40 transition shadow-md"
                >
                  {isUploadingScoresheet ? (
                    <span>Saving Scoresheet...</span>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>
                        Confirm & Save Scores ({parsedScoresheetData.filter((r) => r.isValid).length} Students)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
