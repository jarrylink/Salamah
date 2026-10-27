"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Filter,
  GraduationCap,
  PlusCircle,
  Search,
  UserCheck,
  UserPlus,
  Users,
  X,
  Phone,
  Mail,
  ArrowRight,
  FolderOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Unlock,
  AlertCircle
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";

export type ActiveStudent = {
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
  address: string | null;
  avatar_url?: string | null;
  passport_url?: string | null;
  enrollment_id: string | null;
  enrollment_status: string | null;
  enrollment_date: string | null;
  enrollment_context?: string | null;
  class_id: string | null;
  class_name: string | null;
  class_code: string | null;
  grade_id: string | null;
  grade_name: string | null;
  section_id: string | null;
  section_name: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  dossier_entries_count: number;
};

export type IncomingStudent = {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string;
  date_of_birth: string;
  intended_class: string;
  previous_school: string | null;
  medical_info: string | null;
  avatar_url?: string | null;
  passport_url?: string | null;
  status: string;
  created_at: string;
  application_id: string;
  application_number: string;
  guardian_name: string;
  guardian_email: string;
  guardian_phone: string;
  guardian_address: string;
  payment_status: string;
};

export const PRESET_STUDENT_AVATARS = [
  { label: "Boy 1", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80" },
  { label: "Boy 2", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80" },
  { label: "Girl 1", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80" },
  { label: "Girl 2", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
];

export type ClassOption = {
  id: string;
  name: string;
  code: string;
  grade_name: string;
  section_name: string | null;
};

export type SectionOption = {
  id: string;
  name: string;
  code: string;
};

export type SessionOption = {
  id: string;
  name: string;
  is_current: boolean;
};

export function StudentsDirectoryClient({
  activeStudents: initialActive,
  quickStudents: initialQuick,
  pendingStudents: initialPending,
  classes,
  sections,
  sessions,
  initialTab,
  initialQuickEnrollmentEnabled = true,
}: {
  activeStudents: ActiveStudent[];
  quickStudents: ActiveStudent[];
  pendingStudents: IncomingStudent[];
  classes: ClassOption[];
  sections: SectionOption[];
  sessions: SessionOption[];
  initialTab: string;
  initialQuickEnrollmentEnabled?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "quick">(
    initialTab === "pending" || initialTab === "incoming"
      ? "pending"
      : initialTab === "quick"
      ? "quick"
      : "active"
  );

  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab") || initialTab;
    if (tab === "pending" || tab === "incoming") {
      setActiveTab("pending");
    } else if (tab === "quick") {
      setActiveTab("quick");
    } else if (tab === "active") {
      setActiveTab("active");
    }
  }, [searchParams, initialTab]);

  const [activeStudents, setActiveStudents] = useState<ActiveStudent[]>(initialActive);
  const [quickStudents, setQuickStudents] = useState<ActiveStudent[]>(initialQuick);
  const [pendingStudents, setPendingStudents] = useState<IncomingStudent[]>(initialPending);
  const [quickEnrollmentEnabled, setQuickEnrollmentEnabled] = useState(initialQuickEnrollmentEnabled);
  const [isTogglingEnrollment, setIsTogglingEnrollment] = useState(false);

  // Filters for Active Students
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Filters for Pending Students
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingClassFilter, setPendingClassFilter] = useState("all");
  const [pendingGenderFilter, setPendingGenderFilter] = useState("all");

  // Filters for Quick Students
  const [quickSearch, setQuickSearch] = useState("");
  const [quickClassFilter, setQuickClassFilter] = useState("all");

  // Enrol Incoming Student Modal
  const [enrollingChild, setEnrollingChild] = useState<IncomingStudent | null>(null);
  const [targetClassId, setTargetClassId] = useState(classes[0]?.id || "");
  const [customAdmissionNo, setCustomAdmissionNo] = useState("");
  const [isSubmittingEnrol, setIsSubmittingEnrol] = useState(false);

  // Create Student Modal (Active or Quick)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerMode, setRegisterMode] = useState<"official" | "quick">("official");
  const [regFirstName, setRegFirstName] = useState("");
  const [regMiddleName, setRegMiddleName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regGender, setRegGender] = useState("male");
  const [regDob, setRegDob] = useState("2015-01-01");
  const [regClassId, setRegClassId] = useState(classes[0]?.id || "");
  const [regAdmissionNo, setRegAdmissionNo] = useState(`SAL-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [regPassportUrl, setRegPassportUrl] = useState(PRESET_STUDENT_AVATARS[0].url);
  const [regGuardianName, setRegGuardianName] = useState("");
  const [regGuardianPhone, setRegGuardianPhone] = useState("");
  const [regGuardianEmail, setRegGuardianEmail] = useState("");
  const [regAddress, setRegAddress] = useState("Abuja, FCT, Nigeria");
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);

  // Edit Student Modal
  const [editingStudent, setEditingStudent] = useState<ActiveStudent | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editMiddleName, setEditMiddleName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAdmissionNo, setEditAdmissionNo] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [editGender, setEditGender] = useState("male");
  const [editDob, setEditDob] = useState("");
  const [editPassportUrl, setEditPassportUrl] = useState("");
  const [editGuardianName, setEditGuardianName] = useState("");
  const [editGuardianPhone, setEditGuardianPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Create Pending Applicant Modal
  const [isAddPendingModalOpen, setIsAddPendingModalOpen] = useState(false);
  const [newPendingFirstName, setNewPendingFirstName] = useState("");
  const [newPendingMiddleName, setNewPendingMiddleName] = useState("");
  const [newPendingLastName, setNewPendingLastName] = useState("");
  const [newPendingGender, setNewPendingGender] = useState("male");
  const [newPendingDob, setNewPendingDob] = useState("2016-01-01");
  const [newPendingClass, setNewPendingClass] = useState(classes[0]?.name || "Nursery 1");
  const [newPendingPrevSchool, setNewPendingPrevSchool] = useState("");
  const [newPendingMedical, setNewPendingMedical] = useState("");
  const [newPendingPassportUrl, setNewPendingPassportUrl] = useState(PRESET_STUDENT_AVATARS[0].url);
  const [newPendingGuardianName, setNewPendingGuardianName] = useState("");
  const [newPendingGuardianPhone, setNewPendingGuardianPhone] = useState("");
  const [newPendingGuardianEmail, setNewPendingGuardianEmail] = useState("");
  const [newPendingGuardianAddress, setNewPendingGuardianAddress] = useState("Abuja, Nigeria");
  const [isSubmittingNewPending, setIsSubmittingNewPending] = useState(false);

  // Edit Pending Applicant Modal
  const [editingPending, setEditingPending] = useState<IncomingStudent | null>(null);
  const [editPendingFirstName, setEditPendingFirstName] = useState("");
  const [editPendingMiddleName, setEditPendingMiddleName] = useState("");
  const [editPendingLastName, setEditPendingLastName] = useState("");
  const [editPendingGender, setEditPendingGender] = useState("male");
  const [editPendingDob, setEditPendingDob] = useState("");
  const [editPendingClass, setEditPendingClass] = useState("");
  const [editPendingPrevSchool, setEditPendingPrevSchool] = useState("");
  const [editPendingMedical, setEditPendingMedical] = useState("");
  const [editPendingPassportUrl, setEditPendingPassportUrl] = useState("");
  const [editPendingGuardianName, setEditPendingGuardianName] = useState("");
  const [editPendingGuardianPhone, setEditPendingGuardianPhone] = useState("");
  const [editPendingGuardianEmail, setEditPendingGuardianEmail] = useState("");
  const [isSubmittingEditPending, setIsSubmittingEditPending] = useState(false);

  // ==========================================
  // TOGGLE TEACHER QUICK ENROLLMENT PERMISSIONS
  // ==========================================
  async function handleToggleQuickEnrollment() {
    setIsTogglingEnrollment(true);
    const nextState = !quickEnrollmentEnabled;
    try {
      const res = await fetch("/api/students/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-quick-enrollment",
          enabled: nextState,
        }),
      });
      if (!res.ok) throw new Error("Failed to update system setting");
      setQuickEnrollmentEnabled(nextState);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating quick enrollment setting");
    } finally {
      setIsTogglingEnrollment(false);
    }
  }

  // ==========================================
  // ADMIT & ENROLL PENDING APPLICANT
  // ==========================================
  function openEnrolModal(child: IncomingStudent) {
    setEnrollingChild(child);
    const matchedClass = classes.find(
      (c) =>
        c.name.toLowerCase().includes(child.intended_class.toLowerCase()) ||
        child.intended_class.toLowerCase().includes(c.name.toLowerCase())
    );
    setTargetClassId(matchedClass?.id || classes[0]?.id || "");
    setCustomAdmissionNo(`SAL-2026-${Math.floor(100 + Math.random() * 900)}`);
  }

  async function handleEnrolSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollingChild || !targetClassId) return;

    setIsSubmittingEnrol(true);
    try {
      const res = await fetch("/api/students/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "admit-application-child",
          applicationChildId: enrollingChild.id,
          classId: targetClassId,
          admissionNumber: customAdmissionNo,
          sourceContext: "official_superadmin",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to enrol applicant");

      setPendingStudents((prev) => prev.filter((c) => c.id !== enrollingChild.id));
      setEnrollingChild(null);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error admitting student");
    } finally {
      setIsSubmittingEnrol(false);
    }
  }

  // ==========================================
  // CREATE ACTIVE / QUICK STUDENT
  // ==========================================
  function openRegisterModal(mode: "official" | "quick") {
    setRegisterMode(mode);
    setRegFirstName("");
    setRegMiddleName("");
    setRegLastName("");
    setRegGender("male");
    setRegDob("2015-01-01");
    setRegClassId(classes[0]?.id || "");
    setRegAdmissionNo(`SAL-2026-${Math.floor(100 + Math.random() * 900)}`);
    setRegPassportUrl(PRESET_STUDENT_AVATARS[0].url);
    setRegGuardianName("");
    setRegGuardianPhone("");
    setRegGuardianEmail("");
    setRegAddress("Abuja, FCT, Nigeria");
    setIsRegisterModalOpen(true);
  }

  async function handleDirectRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!regFirstName.trim() || !regLastName.trim() || !regClassId) {
      alert("First name, last name, and class are required.");
      return;
    }

    setIsSubmittingDirect(true);
    try {
      const context = registerMode === "quick" ? "teacher_quick" : "official_superadmin";
      const res = await fetch("/api/students/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-student",
          firstName: regFirstName.trim(),
          middleName: regMiddleName.trim() || undefined,
          lastName: regLastName.trim(),
          gender: regGender,
          dateOfBirth: regDob,
          admissionNumber: regAdmissionNo.trim(),
          classId: regClassId,
          passportUrl: regPassportUrl,
          avatarUrl: regPassportUrl,
          guardianName: regGuardianName.trim(),
          guardianPhone: regGuardianPhone.trim(),
          guardianEmail: regGuardianEmail.trim() || undefined,
          address: regAddress.trim(),
          context,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to register student");

      setIsRegisterModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error creating student");
    } finally {
      setIsSubmittingDirect(false);
    }
  }

  // ==========================================
  // EDIT ACTIVE / QUICK STUDENT
  // ==========================================
  function openEditModal(student: ActiveStudent) {
    setEditingStudent(student);
    setEditFirstName(student.first_name);
    setEditMiddleName(student.middle_name || "");
    setEditLastName(student.last_name);
    setEditAdmissionNo(student.admission_number);
    setEditClassId(student.class_id || classes[0]?.id || "");
    setEditGender(student.gender || "male");
    setEditDob(student.date_of_birth ? student.date_of_birth.split("T")[0] : "");
    setEditPassportUrl(student.avatar_url || student.passport_url || PRESET_STUDENT_AVATARS[0].url);
    setEditGuardianName(student.guardian_name || "");
    setEditGuardianPhone(student.guardian_phone || "");
    setEditAddress(student.address || "");
  }

  async function handleEditStudentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSubmittingEdit(true);
    try {
      const res = await fetch("/api/students/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-student",
          studentId: editingStudent.id,
          firstName: editFirstName.trim(),
          middleName: editMiddleName.trim() || undefined,
          lastName: editLastName.trim(),
          admissionNumber: editAdmissionNo.trim(),
          classId: editClassId,
          gender: editGender,
          dateOfBirth: editDob || undefined,
          passportUrl: editPassportUrl,
          avatarUrl: editPassportUrl,
          guardianName: editGuardianName.trim() || undefined,
          guardianPhone: editGuardianPhone.trim() || undefined,
          address: editAddress.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update student");

      setEditingStudent(null);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error editing student");
    } finally {
      setIsSubmittingEdit(false);
    }
  }

  // ==========================================
  // PROMOTE QUICK STUDENT TO OFFICIAL REGISTER
  // ==========================================
  async function handlePromoteQuick(studentId: string, studentName: string) {
    if (!confirm(`Are you sure you want to promote ${studentName} to the Official Active Students Register? This validates their permanent registration.`)) return;

    try {
      const res = await fetch("/api/students/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "promote-quick",
          studentId,
        }),
      });

      if (!res.ok) throw new Error("Failed to promote student");
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error promoting student");
    }
  }

  // ==========================================
  // DELETE ACTIVE / QUICK STUDENT
  // ==========================================
  async function handleDeleteStudent(studentId: string, studentName: string) {
    if (!confirm(`Withdraw and deactivate ${studentName} from scholastic records?`)) return;

    try {
      const res = await fetch("/api/students/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-student",
          studentId,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete student");
      setActiveStudents((prev) => prev.filter((s) => s.id !== studentId));
      setQuickStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting student");
    }
  }

  // ==========================================
  // PENDING APPLICANT CRUD
  // ==========================================
  async function handleCreatePendingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPendingFirstName.trim() || !newPendingLastName.trim() || !newPendingClass || !newPendingGuardianName.trim() || !newPendingGuardianPhone.trim()) {
      alert("Names, intended class, and guardian contact details are required.");
      return;
    }

    setIsSubmittingNewPending(true);
    try {
      const res = await fetch("/api/students/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-pending",
          firstName: newPendingFirstName.trim(),
          middleName: newPendingMiddleName.trim() || undefined,
          lastName: newPendingLastName.trim(),
          gender: newPendingGender,
          dateOfBirth: newPendingDob,
          intendedClass: newPendingClass,
          previousSchool: newPendingPrevSchool.trim() || undefined,
          medicalInfo: newPendingMedical.trim() || undefined,
          passportUrl: newPendingPassportUrl,
          avatarUrl: newPendingPassportUrl,
          guardianName: newPendingGuardianName.trim(),
          guardianPhone: newPendingGuardianPhone.trim(),
          guardianEmail: newPendingGuardianEmail.trim() || undefined,
          guardianAddress: newPendingGuardianAddress.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create application");

      setIsAddPendingModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error adding applicant");
    } finally {
      setIsSubmittingNewPending(false);
    }
  }

  function openEditPendingModal(child: IncomingStudent) {
    setEditingPending(child);
    setEditPendingFirstName(child.first_name);
    setEditPendingMiddleName(child.middle_name || "");
    setEditPendingLastName(child.last_name);
    setEditPendingGender(child.gender);
    setEditPendingDob(child.date_of_birth ? child.date_of_birth.split("T")[0] : "");
    setEditPendingClass(child.intended_class);
    setEditPendingPrevSchool(child.previous_school || "");
    setEditPendingMedical(child.medical_info || "");
    setEditPendingPassportUrl(child.avatar_url || child.passport_url || PRESET_STUDENT_AVATARS[0].url);
    setEditPendingGuardianName(child.guardian_name);
    setEditPendingGuardianPhone(child.guardian_phone);
    setEditPendingGuardianEmail(child.guardian_email);
  }

  async function handleEditPendingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPending) return;

    setIsSubmittingEditPending(true);
    try {
      const res = await fetch("/api/students/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-pending",
          childId: editingPending.id,
          firstName: editPendingFirstName.trim(),
          middleName: editPendingMiddleName.trim() || undefined,
          lastName: editPendingLastName.trim(),
          gender: editPendingGender,
          dateOfBirth: editPendingDob,
          intendedClass: editPendingClass,
          previousSchool: editPendingPrevSchool.trim() || undefined,
          medicalInfo: editPendingMedical.trim() || undefined,
          passportUrl: editPendingPassportUrl,
          avatarUrl: editPendingPassportUrl,
          guardianName: editPendingGuardianName.trim(),
          guardianPhone: editPendingGuardianPhone.trim(),
          guardianEmail: editPendingGuardianEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update applicant");

      setEditingPending(null);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating applicant");
    } finally {
      setIsSubmittingEditPending(false);
    }
  }

  async function handleDeletePending(childId: string, name: string) {
    if (!confirm(`Delete applicant ${name}? This action removes the entry from the admissions intake.`)) return;

    try {
      const res = await fetch("/api/students/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-pending",
          childId,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete applicant");
      setPendingStudents((prev) => prev.filter((c) => c.id !== childId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting applicant");
    }
  }

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const filteredActive = activeStudents.filter((s) => {
    const fullName = `${s.first_name} ${s.middle_name || ""} ${s.last_name}`.toLowerCase();
    const adm = (s.admission_number || "").toLowerCase();
    const guardian = (s.guardian_name || "").toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    if (q && !fullName.includes(q) && !adm.includes(q) && !guardian.includes(q)) return false;
    if (selectedSection !== "all" && s.section_name !== selectedSection) return false;
    if (selectedClass !== "all" && s.class_id !== selectedClass) return false;
    if (selectedGender !== "all" && s.gender?.toLowerCase() !== selectedGender.toLowerCase()) return false;
    if (selectedStatus !== "all" && s.student_status !== selectedStatus) return false;
    return true;
  });

  const filteredQuick = quickStudents.filter((s) => {
    const fullName = `${s.first_name} ${s.middle_name || ""} ${s.last_name}`.toLowerCase();
    const adm = (s.admission_number || "").toLowerCase();
    const q = quickSearch.toLowerCase().trim();

    if (q && !fullName.includes(q) && !adm.includes(q)) return false;
    if (quickClassFilter !== "all" && s.class_id !== quickClassFilter) return false;
    return true;
  });

  const filteredPending = pendingStudents.filter((c) => {
    const fullName = `${c.first_name} ${c.middle_name || ""} ${c.last_name}`.toLowerCase();
    const guardian = (c.guardian_name || "").toLowerCase();
    const appNum = (c.application_number || "").toLowerCase();
    const q = pendingSearch.toLowerCase().trim();

    if (q && !fullName.includes(q) && !guardian.includes(q) && !appNum.includes(q)) return false;
    if (pendingClassFilter !== "all" && !c.intended_class.toLowerCase().includes(pendingClassFilter.toLowerCase())) return false;
    if (pendingGenderFilter !== "all" && c.gender.toLowerCase() !== pendingGenderFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 3 SUB-MENU TABS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Pending Students */}
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "pending"
                ? "bg-[#dfba73] text-slate-950 shadow-lg shadow-[#dfba73]/20"
                : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Pending Students</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === "pending"
                  ? "bg-slate-950 text-[#dfba73]"
                  : "bg-amber-500/20 text-amber-300"
              }`}
            >
              {pendingStudents.length}
            </span>
          </button>

          {/* Tab 2: Active Students */}
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "active"
                ? "bg-[#dfba73] text-slate-950 shadow-lg shadow-[#dfba73]/20"
                : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Active Students</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === "active"
                  ? "bg-slate-950 text-[#dfba73]"
                  : "bg-teal-500/20 text-teal-300"
              }`}
            >
              {activeStudents.length}
            </span>
          </button>

          {/* Tab 3: Quick List */}
          <button
            onClick={() => setActiveTab("quick")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "quick"
                ? "bg-[#dfba73] text-slate-950 shadow-lg shadow-[#dfba73]/20"
                : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Quick List</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === "quick"
                  ? "bg-slate-950 text-[#dfba73]"
                  : "bg-purple-500/20 text-purple-300"
              }`}
            >
              {quickStudents.length}
            </span>
          </button>
        </div>

        {/* Action Buttons based on active tab */}
        <div className="flex items-center gap-2">
          {activeTab === "pending" && (
            <button
              onClick={() => setIsAddPendingModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Pending Applicant</span>
            </button>
          )}

          {activeTab === "active" && (
            <button
              onClick={() => openRegisterModal("official")}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Register Active Student</span>
            </button>
          )}

          {activeTab === "quick" && (
            <button
              onClick={() => openRegisterModal("quick")}
              className="flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2 text-xs font-bold text-white hover:bg-purple-400 transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add to Quick List</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PENDING STUDENTS (FROM ENROLLMENT FORM) */}
      {/* ======================================================== */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white">Incoming Admissions & Enrolment Intake</h3>
                <p className="text-xs text-slate-300">
                  Applications received directly from the landing page enrolment forms. Review applicant credentials, conduct screening, and formally admit scholars into active classroom registers.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-amber-400">
                {filteredPending.length} Awaiting Placement
              </span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name, application no, or guardian..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pendingClassFilter}
                onChange={(e) => setPendingClassFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-[#dfba73] focus:outline-none"
              >
                <option value="all">All Intended Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={pendingGenderFilter}
                onChange={(e) => setPendingGenderFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-[#dfba73] focus:outline-none"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#092233] shadow-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Applicant Name</th>
                  <th className="px-4 py-3">Application Ref</th>
                  <th className="px-4 py-3">Intended Class</th>
                  <th className="px-4 py-3">Gender / Age</th>
                  <th className="px-4 py-3">Parent / Contact</th>
                  <th className="px-4 py-3">Fee Status</th>
                  <th className="px-4 py-3 text-right">Actions & Admission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredPending.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      No pending student applications found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPending.map((child) => (
                    <tr key={child.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {child.avatar_url || child.passport_url ? (
                            <a
                              href={child.avatar_url || child.passport_url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 hover:scale-105 transition group"
                              title="Click to view full photo URL"
                            >
                              <img
                                src={child.avatar_url || child.passport_url || ""}
                                alt={child.first_name}
                                className="h-10 w-10 rounded-xl object-cover border border-amber-500/30 shadow-sm group-hover:border-amber-400"
                              />
                            </a>
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                              {child.first_name?.[0]}{child.last_name?.[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white">
                              {child.first_name} {child.middle_name ? `${child.middle_name} ` : ""}{child.last_name}
                            </div>
                            {child.previous_school && (
                              <div className="text-[10px] text-slate-400">Prev: {child.previous_school}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-[#dfba73]">
                        {child.application_number}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-teal-300 border border-slate-700">
                          {child.intended_class}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 capitalize">
                        {child.gender}
                        {child.date_of_birth && (
                          <div className="text-[10px] text-slate-400" suppressHydrationWarning>
                            DOB: {formatDate(child.date_of_birth)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-white font-medium">{child.guardian_name}</div>
                        <div className="text-[10px] text-slate-400">{child.guardian_phone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                          {child.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditPendingModal(child)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit Applicant"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePending(child.id, `${child.first_name} ${child.last_name}`)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                            title="Delete Applicant"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEnrolModal(child)}
                            className="flex items-center gap-1 rounded-lg bg-teal-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-teal-400 transition"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Admit & Enrol</span>
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

      {/* ======================================================== */}
      {/* TAB 2: ACTIVE STUDENTS (SUPERADMIN OFFICIAL REGISTER) */}
      {/* ======================================================== */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search active scholars by name, admission ID, or parent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-[#dfba73] focus:outline-none"
              >
                <option value="all">All Wings / Sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-[#dfba73] focus:outline-none"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.grade_name})
                  </option>
                ))}
              </select>

              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-[#dfba73] focus:outline-none"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* Active Students Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#092233] shadow-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Admission ID</th>
                  <th className="px-4 py-3">Scholar Name</th>
                  <th className="px-4 py-3">Academic Placement</th>
                  <th className="px-4 py-3">Gender / DOB</th>
                  <th className="px-4 py-3">Guardian Information</th>
                  <th className="px-4 py-3">File Dossier</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredActive.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      No active enrolled students found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredActive.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5 font-mono font-semibold text-[#dfba73]">
                        {student.admission_number}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/dashboard/students/${student.id}`}
                            className="shrink-0 hover:scale-105 transition group"
                            title="Open Student File Dossier"
                          >
                            {student.avatar_url ? (
                              <img
                                src={student.avatar_url}
                                alt={student.first_name}
                                className="h-10 w-10 rounded-xl object-cover border border-teal-500/30 shadow-sm group-hover:border-[#dfba73]"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-xs font-bold text-teal-300">
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </div>
                            )}
                          </Link>
                          <div>
                            <Link
                              href={`/dashboard/students/${student.id}`}
                              className="font-bold text-white hover:text-[#dfba73] hover:underline flex items-center gap-1.5"
                              title="Open Student File Dossier"
                            >
                              <span>{student.first_name} {student.middle_name ? `${student.middle_name} ` : ""}{student.last_name}</span>
                              <ArrowRight className="h-3 w-3 opacity-60" />
                            </Link>
                            <div className="text-[10px] text-slate-400" suppressHydrationWarning>
                              Enrolled: {formatDate(student.enrollment_date) || "Active"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {student.class_name ? (
                          <Link
                            href={`/dashboard/classes/${student.class_id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 text-[11px] font-semibold text-teal-300 hover:bg-teal-500/25 transition"
                            title="Open Classroom Cockpit"
                          >
                            <span>{student.class_name}</span>
                          </Link>
                        ) : (
                          <span className="text-amber-400 text-[11px]">Unassigned</span>
                        )}
                        {student.section_name && (
                          <div className="text-[10px] text-slate-400">{student.section_name} Wing</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 capitalize">
                        {student.gender || "—"}
                        {student.date_of_birth && (
                          <div className="text-[10px] text-slate-400" suppressHydrationWarning>
                            DOB: {formatDate(student.date_of_birth)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-white font-medium">{student.guardian_name || "Not registered"}</div>
                        {student.guardian_phone && (
                          <div className="text-[10px] text-slate-400">{student.guardian_phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/students/${student.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:border-[#dfba73] transition"
                        >
                          <FolderOpen className="h-3 w-3 text-[#dfba73]" />
                          <span>File ({student.dossier_entries_count || 0})</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit Student Information"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id, `${student.first_name} ${student.last_name}`)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                            title="Withdraw Student"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* ======================================================== */}
      {/* TAB 3: QUICK LIST (TEACHER CLASSROOM INTAKE) */}
      {/* ======================================================== */}
      {activeTab === "quick" && (
        <div className="space-y-4">
          {/* Master Permission Toggle Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#0a1f2e] to-purple-950/40 p-5 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Classroom Quick Intake Permissions</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      quickEnrollmentEnabled
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    {quickEnrollmentEnabled ? "Open to Teachers" : "Locked by Admin"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Controls the visibility of the <strong className="text-teal-300">"Enroll / Add Student"</strong> button inside the teacher's Classroom Management Cockpit. When open, assigned class teachers can register scholars directly into their classroom roster. When locked, only Super Admins can add scholars.
                </p>
              </div>
            </div>

            <div>
              <button
                onClick={handleToggleQuickEnrollment}
                disabled={isTogglingEnrollment}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-md ${
                  quickEnrollmentEnabled
                    ? "bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                    : "bg-emerald-500 px-4 py-2 text-slate-950 font-bold hover:bg-emerald-400"
                }`}
              >
                {quickEnrollmentEnabled ? (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>{isTogglingEnrollment ? "Updating..." : "Lock & Hide Button from Teachers"}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    <span>{isTogglingEnrollment ? "Updating..." : "Open / Show Button to Teachers"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick List Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search quick-registered scholars..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={quickClassFilter}
                onChange={(e) => setQuickClassFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-[#dfba73] focus:outline-none"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick List Table */}
          <div className="overflow-x-auto rounded-2xl border border-purple-500/20 bg-[#092233] shadow-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Admission ID</th>
                  <th className="px-4 py-3">Scholar Name</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Intake Origin</th>
                  <th className="px-4 py-3">Parent Contact</th>
                  <th className="px-4 py-3 text-right">Promote & Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredQuick.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      No scholars currently in Quick List. Students registered by teachers from their classroom management cockpit appear here.
                    </td>
                  </tr>
                ) : (
                  filteredQuick.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5 font-mono font-semibold text-purple-300">
                        {student.admission_number}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/dashboard/students/${student.id}`}
                            className="shrink-0 hover:scale-105 transition group"
                            title="Open Student File Dossier"
                          >
                            {student.avatar_url ? (
                              <img
                                src={student.avatar_url}
                                alt={student.first_name}
                                className="h-10 w-10 rounded-xl object-cover border border-purple-500/30 shadow-sm group-hover:border-purple-300"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </div>
                            )}
                          </Link>
                          <div>
                            <Link
                              href={`/dashboard/students/${student.id}`}
                              className="font-bold text-white hover:text-purple-300 hover:underline flex items-center gap-1.5"
                            >
                              <span>{student.first_name} {student.middle_name ? `${student.middle_name} ` : ""}{student.last_name}</span>
                              <ArrowRight className="h-3 w-3 opacity-60" />
                            </Link>
                            <div className="text-[10px] text-slate-400" suppressHydrationWarning>
                              Intake Date: {formatDate(student.enrollment_date) || "Recent"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-teal-300 border border-slate-700">
                          {student.class_name || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                          Teacher Quick Intake
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-white font-medium">{student.guardian_name || "—"}</div>
                        <div className="text-[10px] text-slate-400">{student.guardian_phone || "—"}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handlePromoteQuick(student.id, `${student.first_name} ${student.last_name}`)}
                            className="flex items-center gap-1 rounded-lg bg-[#dfba73] px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-[#c5a059] transition"
                            title="Promote to Official Active Students Register"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            <span>Promote to Active</span>
                          </button>
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit Student"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id, `${student.first_name} ${student.last_name}`)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                            title="Remove Student"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* ======================================================== */}
      {/* MODAL: ADMIT & ENROL PENDING APPLICANT */}
      {/* ======================================================== */}
      {enrollingChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#dfba73]/40 bg-[#061b29] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Admit & Enrol Scholar</h3>
                <p className="text-xs text-[#dfba73]">Admissions Portal Placement</p>
              </div>
              <button
                onClick={() => setEnrollingChild(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEnrolSubmit} className="mt-4 space-y-4">
              <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 text-xs flex items-center gap-3.5">
                {enrollingChild.avatar_url || enrollingChild.passport_url ? (
                  <img
                    src={enrollingChild.avatar_url || enrollingChild.passport_url || ""}
                    alt={enrollingChild.first_name}
                    className="h-12 w-12 rounded-xl object-cover border border-[#dfba73]/40 shrink-0 shadow"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-[#dfba73]/20 border border-[#dfba73]/30 flex items-center justify-center text-xs font-bold text-[#dfba73] shrink-0">
                    {enrollingChild.first_name?.[0]}{enrollingChild.last_name?.[0]}
                  </div>
                )}
                <div className="min-w-0 space-y-0.5">
                  <div className="font-bold text-white text-sm truncate">
                    {enrollingChild.first_name} {enrollingChild.last_name}
                  </div>
                  <div className="text-slate-400">
                    Intended Wing/Class: <span className="text-teal-300 font-medium">{enrollingChild.intended_class}</span>
                  </div>
                  <div className="text-slate-400 truncate">
                    Guardian: <span className="text-slate-200">{enrollingChild.guardian_name} ({enrollingChild.guardian_phone})</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assign to Classroom Register *
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade_name}) — {c.section_name || "Salamah"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assigned Admission Number *
                </label>
                <input
                  type="text"
                  value={customAdmissionNo}
                  onChange={(e) => setCustomAdmissionNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-[#dfba73] focus:border-[#dfba73] focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEnrollingChild(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEnrol}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
                >
                  {isSubmittingEnrol ? "Admitting..." : "Confirm Admission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTER STUDENT (OFFICIAL OR QUICK) */}
      {/* ======================================================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-[#dfba73]/40 bg-[#061b29] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">
                  {registerMode === "quick" ? "Add Student to Quick List" : "Register Active Student"}
                </h3>
                <p className="text-xs text-[#dfba73]">
                  {registerMode === "quick" ? "Provisional Classroom Intake — Specify Class & Scholar Info" : "Official Institution Roster Registration"}
                </p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {registerMode === "quick" && (
              <div className="mt-4 rounded-xl border border-purple-500/30 bg-purple-950/30 p-3 text-xs text-purple-200 flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                <span>
                  <strong>Independent Quick Intake:</strong> This student will be assigned directly to your selected class and displayed in both the classroom cockpit and the Quick List without registration delays.
                </span>
              </div>
            )}

            <form onSubmit={handleDirectRegisterSubmit} className="mt-4 space-y-4">
              {/* Target Class Selector (Prominently at the top as requested) */}
              <div className="rounded-xl border border-teal-500/30 bg-[#072433]/60 p-3.5 space-y-1.5">
                <label className="block text-xs font-bold text-teal-300 flex items-center justify-between">
                  <span>Class Placement (Select Class) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Mandatory for Student Registration</span>
                </label>
                <select
                  value={regClassId}
                  onChange={(e) => setRegClassId(e.target.value)}
                  className="w-full rounded-xl border border-teal-500/50 bg-slate-900 px-3 py-2.5 text-xs text-white font-semibold focus:border-[#dfba73] focus:outline-none"
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade_name}) — {c.section_name ? `${c.section_name} Wing` : "Salamah"}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Select the exact class where this scholar will be seated and tracked on daily registers.
                </p>
              </div>

              {/* Passport Picture Preview & Input */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Student Passport Photo
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                    {regPassportUrl ? (
                      <img
                        src={regPassportUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = PRESET_STUDENT_AVATARS[0].url;
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="Enter photo or passport URL..."
                      value={regPassportUrl}
                      onChange={(e) => setRegPassportUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Presets:</span>
                      {PRESET_STUDENT_AVATARS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setRegPassportUrl(preset.url)}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition ${
                            regPassportUrl === preset.url
                              ? "bg-[#dfba73] text-slate-950 font-bold"
                              : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={regMiddleName}
                    onChange={(e) => setRegMiddleName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Gender *</label>
                  <select
                    value={regGender}
                    onChange={(e) => {
                      setRegGender(e.target.value);
                      if (e.target.value === "female" && regPassportUrl === PRESET_STUDENT_AVATARS[0].url) {
                        setRegPassportUrl(PRESET_STUDENT_AVATARS[2].url);
                      } else if (e.target.value === "male" && regPassportUrl === PRESET_STUDENT_AVATARS[2].url) {
                        setRegPassportUrl(PRESET_STUDENT_AVATARS[0].url);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Admission Number</label>
                  <input
                    type="text"
                    value={regAdmissionNo}
                    onChange={(e) => setRegAdmissionNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-[#dfba73] focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="text-xs font-bold text-teal-300 mb-2">Guardian / Parent Contact</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Parent Full Name</label>
                    <input
                      type="text"
                      value={regGuardianName}
                      onChange={(e) => setRegGuardianName(e.target.value)}
                      placeholder="e.g. Alhaji Mustapha Danladi"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Parent Phone</label>
                    <input
                      type="text"
                      value={regGuardianPhone}
                      onChange={(e) => setRegGuardianPhone(e.target.value)}
                      placeholder="+234 803 000 0000"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDirect}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-slate-950 transition ${
                    registerMode === "quick"
                      ? "bg-purple-400 hover:bg-purple-300"
                      : "bg-teal-500 hover:bg-teal-400"
                  }`}
                >
                  {isSubmittingDirect ? "Saving..." : registerMode === "quick" ? "Add to Quick List" : "Register Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT ACTIVE OR QUICK STUDENT */}
      {/* ======================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-[#dfba73]/40 bg-[#061b29] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Edit Student Information</h3>
                <p className="text-xs text-[#dfba73]">{editingStudent.admission_number}</p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditStudentSubmit} className="mt-4 space-y-4">
              {/* Passport Picture Preview & Input */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Student Passport Photo
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                    {editPassportUrl ? (
                      <img
                        src={editPassportUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = PRESET_STUDENT_AVATARS[0].url;
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="Enter photo or passport URL..."
                      value={editPassportUrl}
                      onChange={(e) => setEditPassportUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Presets:</span>
                      {PRESET_STUDENT_AVATARS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setEditPassportUrl(preset.url)}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition ${
                            editPassportUrl === preset.url
                              ? "bg-[#dfba73] text-slate-950 font-bold"
                              : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={editMiddleName}
                    onChange={(e) => setEditMiddleName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Admission Number</label>
                  <input
                    type="text"
                    value={editAdmissionNo}
                    onChange={(e) => setEditAdmissionNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-[#dfba73] focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Enrolled Class *</label>
                <select
                  value={editClassId}
                  onChange={(e) => setEditClassId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade_name}) — {c.section_name || "Salamah"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="text-xs font-bold text-teal-300 mb-2">Guardian / Parent Contact</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={editGuardianName}
                      onChange={(e) => setEditGuardianName(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Guardian Phone</label>
                    <input
                      type="text"
                      value={editGuardianPhone}
                      onChange={(e) => setEditGuardianPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="rounded-xl bg-[#dfba73] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition"
                >
                  {isSubmittingEdit ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD PENDING APPLICANT */}
      {/* ======================================================== */}
      {isAddPendingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-amber-500/40 bg-[#061b29] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Add Pending Applicant</h3>
                <p className="text-xs text-amber-400">Manual Admissions Intake</p>
              </div>
              <button
                onClick={() => setIsAddPendingModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePendingSubmit} className="mt-4 space-y-4">
              {/* Passport Picture Preview & Input */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Applicant Passport Photo
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                    {newPendingPassportUrl ? (
                      <img
                        src={newPendingPassportUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = PRESET_STUDENT_AVATARS[0].url;
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="Enter photo or passport URL..."
                      value={newPendingPassportUrl}
                      onChange={(e) => setNewPendingPassportUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Presets:</span>
                      {PRESET_STUDENT_AVATARS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setNewPendingPassportUrl(preset.url)}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition ${
                            newPendingPassportUrl === preset.url
                              ? "bg-amber-500 text-slate-950 font-bold"
                              : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newPendingFirstName}
                    onChange={(e) => setNewPendingFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={newPendingMiddleName}
                    onChange={(e) => setNewPendingMiddleName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newPendingLastName}
                    onChange={(e) => setNewPendingLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Gender *</label>
                  <select
                    value={newPendingGender}
                    onChange={(e) => setNewPendingGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newPendingDob}
                    onChange={(e) => setNewPendingDob(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Intended Class *</label>
                  <select
                    value={newPendingClass}
                    onChange={(e) => setNewPendingClass(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Previous School</label>
                  <input
                    type="text"
                    value={newPendingPrevSchool}
                    onChange={(e) => setNewPendingPrevSchool(e.target.value)}
                    placeholder="e.g. British Oasis Academy"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Medical Advisory</label>
                  <input
                    type="text"
                    value={newPendingMedical}
                    onChange={(e) => setNewPendingMedical(e.target.value)}
                    placeholder="e.g. Mild asthma inhaler required"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="text-xs font-bold text-amber-400 mb-2">Guardian / Parent Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Guardian Name *</label>
                    <input
                      type="text"
                      required
                      value={newPendingGuardianName}
                      onChange={(e) => setNewPendingGuardianName(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Guardian Phone *</label>
                    <input
                      type="text"
                      required
                      value={newPendingGuardianPhone}
                      onChange={(e) => setNewPendingGuardianPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Guardian Email</label>
                    <input
                      type="email"
                      value={newPendingGuardianEmail}
                      onChange={(e) => setNewPendingGuardianEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPendingModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewPending}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  {isSubmittingNewPending ? "Submitting..." : "Add to Admissions Intake"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT PENDING APPLICANT */}
      {/* ======================================================== */}
      {editingPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-amber-500/40 bg-[#061b29] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Edit Applicant Record</h3>
                <p className="text-xs text-amber-400">{editingPending.application_number}</p>
              </div>
              <button
                onClick={() => setEditingPending(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditPendingSubmit} className="mt-4 space-y-4">
              {/* Passport Picture Preview & Input */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Applicant Passport Photo
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                    {editPendingPassportUrl ? (
                      <img
                        src={editPendingPassportUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = PRESET_STUDENT_AVATARS[0].url;
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="Enter photo or passport URL..."
                      value={editPendingPassportUrl}
                      onChange={(e) => setEditPendingPassportUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Presets:</span>
                      {PRESET_STUDENT_AVATARS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setEditPendingPassportUrl(preset.url)}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition ${
                            editPendingPassportUrl === preset.url
                              ? "bg-amber-500 text-slate-950 font-bold"
                              : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editPendingFirstName}
                    onChange={(e) => setEditPendingFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={editPendingMiddleName}
                    onChange={(e) => setEditPendingMiddleName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editPendingLastName}
                    onChange={(e) => setEditPendingLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Gender</label>
                  <select
                    value={editPendingGender}
                    onChange={(e) => setEditPendingGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editPendingDob}
                    onChange={(e) => setEditPendingDob(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Intended Class</label>
                  <select
                    value={editPendingClass}
                    onChange={(e) => setEditPendingClass(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="text-xs font-bold text-amber-400 mb-2">Guardian Contacts</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={editPendingGuardianName}
                      onChange={(e) => setEditPendingGuardianName(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Guardian Phone</label>
                    <input
                      type="text"
                      value={editPendingGuardianPhone}
                      onChange={(e) => setEditPendingGuardianPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Guardian Email</label>
                    <input
                      type="email"
                      value={editPendingGuardianEmail}
                      onChange={(e) => setEditPendingGuardianEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPending(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEditPending}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  {isSubmittingEditPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
