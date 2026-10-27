"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Award,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileCheck2,
  FilePlus,
  FileText,
  FolderOpen,
  GraduationCap,
  KeyRound,
  Link as LinkIcon,
  Mail,
  Phone,
  PlusCircle,
  Power,
  PowerOff,
  Save,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

export type AccessUserRecord = {
  user_id: string;
  email: string;
  role: "superadmin" | "manager" | "staff" | "student";
  designation: string;
  account_status: "active" | "inactive" | "suspended";
  passport_url: string | null;
  last_login_at: string | null;
  person_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone: string | null;
  gender: string | null;
  avatar_url: string | null;
  staff_id: string | null;
  staff_number: string | null;
  department: string | null;
  employment_type: string | null;
  employment_date: string | null;
  student_id: string | null;
  admission_number: string | null;
  current_class_name: string | null;
  current_class_code: string | null;
  manager_user_id: string | null;
  manager_first_name: string | null;
  manager_last_name: string | null;
  document_count: number;
};

export type StudentOption = {
  student_id: string;
  admission_number: string;
  person_id: string;
  first_name: string;
  last_name: string;
  gender: string | null;
  avatar_url: string | null;
  class_id: string | null;
  class_name: string | null;
  class_code: string | null;
  linked_user_id: string | null;
  linked_email: string | null;
};

export type ManagerOption = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: string | null;
};

export type UserDoc = {
  id: string;
  user_id: string;
  title: string;
  doc_type: string;
  file_url: string;
  file_name: string | null;
  file_size: string | null;
  category: string | null;
  notes: string | null;
  created_at: string;
};

export function AccessControlClient({
  users: initialUsers,
  students,
  managers,
  initialTab = "all",
}: {
  users: AccessUserRecord[];
  students: StudentOption[];
  managers: ManagerOption[];
  initialTab?: string;
}) {
  const [users, setUsers] = useState<AccessUserRecord[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<"all" | "staff" | "managers" | "students" | "superadmin" | "hierarchy">(
    initialTab === "managers"
      ? "managers"
      : initialTab === "staff"
      ? "staff"
      : initialTab === "students"
      ? "students"
      : initialTab === "hierarchy"
      ? "hierarchy"
      : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Create / Edit User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AccessUserRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [role, setRole] = useState<"superadmin" | "manager" | "staff" | "student">("staff");
  const [designation, setDesignation] = useState("teaching staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("12345678");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("male");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [passportUrl, setPassportUrl] = useState("");
  const [staffNumber, setStaffNumber] = useState("");
  const [department, setDepartment] = useState("Languages & Quran");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [managerUserId, setManagerUserId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // User Documents / Dossier Modal State
  const [dossierUser, setDossierUser] = useState<AccessUserRecord | null>(null);
  const [userDocs, setUserDocs] = useState<UserDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState("certificate");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [newDocNotes, setNewDocNotes] = useState("");
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Hierarchy Tab state
  const [selectedManager, setSelectedManager] = useState<string>(managers[0]?.user_id || "");
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState<string>("");
  const [isAssigningManager, setIsAssigningManager] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateModal = (targetRole: "superadmin" | "manager" | "staff" | "student" = "staff") => {
    setEditingUser(null);
    setRole(targetRole);
    setDesignation(
      targetRole === "staff"
        ? "teaching staff"
        : targetRole === "student"
        ? "student"
        : targetRole === "manager"
        ? "manager"
        : "superadmin"
    );
    setEmail("");
    setPassword("12345678");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setPhone("");
    setGender("male");
    setStatus("active");
    setPassportUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face");
    setStaffNumber(`SIS-STF-${Math.floor(100 + Math.random() * 900)}`);
    setDepartment("Academic Operations");
    setEmploymentType("full_time");
    setManagerUserId(managers[0]?.user_id || "");
    setSelectedStudentId("");
    setIsModalOpen(true);
  };

  const openEditModal = (u: AccessUserRecord) => {
    setEditingUser(u);
    setRole(u.role);
    setDesignation(u.designation || u.role);
    setEmail(u.email);
    setPassword("");
    setFirstName(u.first_name);
    setMiddleName(u.middle_name || "");
    setLastName(u.last_name);
    setPhone(u.phone || "");
    setGender(u.gender || "male");
    setStatus(u.account_status === "active" ? "active" : "inactive");
    setPassportUrl(u.passport_url || u.avatar_url || "");
    setStaffNumber(u.staff_number || "");
    setDepartment(u.department || "Academic Operations");
    setEmploymentType(u.employment_type || "full_time");
    setManagerUserId(u.manager_user_id || managers[0]?.user_id || "");
    setSelectedStudentId(u.student_id || "");
    setIsModalOpen(true);
  };

  const handleStudentSelect = (stdId: string) => {
    setSelectedStudentId(stdId);
    if (!stdId) return;
    const std = students.find((s) => s.student_id === stdId);
    if (std) {
      setFirstName(std.first_name);
      setLastName(std.last_name);
      setGender(std.gender || "male");
      if (std.avatar_url) setPassportUrl(std.avatar_url);
      if (!editingUser) {
        const cleanName = `${std.first_name.toLowerCase().replace(/[^a-z0-9]/g, "")}.${std.last_name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        setEmail(cleanName);
      }
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      alert("Please provide email/username, first name, and last name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: editingUser?.user_id,
        role,
        designation,
        email: email.trim(),
        password: password.trim() ? password : (editingUser ? undefined : "12345678"),
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        gender,
        status,
        passportUrl: passportUrl.trim() || undefined,
        staffNumber: role === "staff" || role === "manager" ? staffNumber : undefined,
        department: role === "staff" || role === "manager" ? department : undefined,
        employmentType: role === "staff" || role === "manager" ? employmentType : undefined,
        managerUserId: role === "staff" ? managerUserId : undefined,
        studentId: role === "student" ? selectedStudentId : undefined,
      };

      const res = await fetch("/api/access-control/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save account.");

      showToast(editingUser ? "Account updated successfully." : "New user account created successfully with credentials.");
      setIsModalOpen(false);

      // Refresh list
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AccessUserRecord) => {
    const nextStatus = user.account_status === "active" ? "inactive" : "active";
    const confirmMsg = `Are you sure you want to ${nextStatus === "active" ? "ACTIVATE" : "DEACTIVATE"} account ${user.email}?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/access-control/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.user_id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status.");

      setUsers((prev) =>
        prev.map((u) => (u.user_id === user.user_id ? { ...u, account_status: nextStatus } : u))
      );
      showToast(`Account ${user.email} is now ${nextStatus.toUpperCase()}.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error toggling status.");
    }
  };

  const openDossier = async (u: AccessUserRecord) => {
    setDossierUser(u);
    setIsLoadingDocs(true);
    setNewDocTitle("");
    setNewDocType("certificate");
    setNewDocUrl("");
    setNewDocNotes("");
    try {
      const res = await fetch(`/api/access-control/documents?userId=${u.user_id}`);
      const data = await res.json();
      if (res.ok && data.documents) {
        setUserDocs(data.documents);
      }
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossierUser || !newDocTitle.trim()) {
      alert("Please provide a title for the document.");
      return;
    }

    setIsAddingDoc(true);
    try {
      const payload = {
        userId: dossierUser.user_id,
        title: newDocTitle.trim(),
        docType: newDocType,
        fileUrl: newDocUrl.trim() || `/docs/${newDocType}-sample.pdf`,
        fileName: `${newDocTitle.replace(/\s+/g, "_")}.pdf`,
        fileSize: "185 KB",
        category: "official",
        notes: newDocNotes.trim() || undefined,
      };

      const res = await fetch("/api/access-control/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add document.");

      setUserDocs((prev) => [data.document, ...prev]);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === dossierUser.user_id ? { ...u, document_count: u.document_count + 1 } : u))
      );
      setNewDocTitle("");
      setNewDocUrl("");
      setNewDocNotes("");
      showToast("Document added to user file.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error adding document.");
    } finally {
      setIsAddingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Remove this document from the user's file?")) return;
    try {
      const res = await fetch(`/api/access-control/documents?id=${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document.");
      setUserDocs((prev) => prev.filter((d) => d.id !== docId));
      if (dossierUser) {
        setUsers((prev) =>
          prev.map((u) => (u.user_id === dossierUser.user_id ? { ...u, document_count: Math.max(0, u.document_count - 1) } : u))
        );
      }
      showToast("Document removed.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting document.");
    }
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManager || !selectedStaffToAssign) {
      alert("Please select both a manager and a staff member.");
      return;
    }
    setIsAssigningManager(true);
    try {
      const res = await fetch("/api/access-control/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-manager",
          managerUserId: selectedManager,
          staffUserId: selectedStaffToAssign,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign staff.");
      showToast("Staff supervision link established.");
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error establishing assignment.");
    } finally {
      setIsAssigningManager(false);
    }
  };

  // Filtered List
  const filteredUsers = users.filter((u) => {
    // Role filter based on tab
    if (activeTab === "staff" && u.role !== "staff") return false;
    if (activeTab === "managers" && u.role !== "manager") return false;
    if (activeTab === "students" && u.role !== "student") return false;
    if (activeTab === "superadmin" && u.role !== "superadmin") return false;

    // Status filter
    if (statusFilter !== "all" && u.account_status !== statusFilter) return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const fullName = `${u.first_name} ${u.middle_name || ""} ${u.last_name}`.toLowerCase();
    const emailMatch = u.email.toLowerCase().includes(q);
    const staffMatch = u.staff_number?.toLowerCase().includes(q);
    const admMatch = u.admission_number?.toLowerCase().includes(q);
    const designationMatch = u.designation?.toLowerCase().includes(q);
    const classMatch = u.current_class_name?.toLowerCase().includes(q);

    return fullName.includes(q) || emailMatch || Boolean(staffMatch) || Boolean(admMatch) || Boolean(designationMatch) || Boolean(classMatch);
  });

  const staffCount = users.filter((u) => u.role === "staff").length;
  const managerCount = users.filter((u) => u.role === "manager").length;
  const studentCount = users.filter((u) => u.role === "student").length;
  const adminCount = users.filter((u) => u.role === "superadmin").length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/50 bg-[#042017] px-4 py-3 text-xs font-bold text-emerald-200 shadow-2xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div
          onClick={() => setActiveTab("all")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === "all"
              ? "border-[#dfba73] bg-[#0c2f45] shadow-lg ring-1 ring-[#dfba73]/40"
              : "border-slate-800 bg-[#092233] hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">All Accounts</span>
            <Users className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-white">{users.length}</div>
          <span className="text-[10px] text-slate-400">Total verified logins</span>
        </div>

        <div
          onClick={() => setActiveTab("staff")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === "staff"
              ? "border-[#dfba73] bg-[#0c2f45] shadow-lg ring-1 ring-[#dfba73]/40"
              : "border-slate-800 bg-[#092233] hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Faculty & Staff</span>
            <GraduationCap className="h-4 w-4 text-[#dfba73]" />
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-white">{staffCount}</div>
          <span className="text-[10px] text-teal-300/80">Teachers & academic</span>
        </div>

        <div
          onClick={() => setActiveTab("managers")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === "managers"
              ? "border-[#dfba73] bg-[#0c2f45] shadow-lg ring-1 ring-[#dfba73]/40"
              : "border-slate-800 bg-[#092233] hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Managers</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-white">{managerCount}</div>
          <span className="text-[10px] text-slate-400">Section leadership</span>
        </div>

        <div
          onClick={() => setActiveTab("students")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === "students"
              ? "border-[#dfba73] bg-[#0c2f45] shadow-lg ring-1 ring-[#dfba73]/40"
              : "border-slate-800 bg-[#092233] hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Scholars</span>
            <UserCheck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-white">{studentCount}</div>
          <span className="text-[10px] text-slate-400">Enrolled pupils</span>
        </div>

        <div
          onClick={() => setActiveTab("superadmin")}
          className={`cursor-pointer rounded-2xl border p-4 transition col-span-2 sm:col-span-1 ${
            activeTab === "superadmin"
              ? "border-[#dfba73] bg-[#0c2f45] shadow-lg ring-1 ring-[#dfba73]/40"
              : "border-slate-800 bg-[#092233] hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73]">Super Admins</span>
            <Shield className="h-4 w-4 text-[#dfba73]" />
          </div>
          <div className="mt-2 font-serif text-2xl font-bold text-white">{adminCount}</div>
          <span className="text-[10px] text-slate-400">Full system access</span>
        </div>
      </div>

      {/* Top Action & Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-[#092233] p-4 shadow-xl">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "all" ? "bg-[#dfba73] text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            All ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "staff" ? "bg-[#dfba73] text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Staff & Faculty ({staffCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("managers")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "managers" ? "bg-[#dfba73] text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Managers ({managerCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "students" ? "bg-[#dfba73] text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Students ({studentCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("superadmin")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "superadmin" ? "bg-[#dfba73] text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Superadmin ({adminCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hierarchy")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "hierarchy" ? "bg-[#dfba73] text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Hierarchy Link
          </button>
        </div>

        {/* Create Account Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openCreateModal("staff")}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md hover:from-teal-400 hover:to-teal-500 transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>New Staff</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateModal("student")}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-950/60 px-3.5 py-2 text-xs font-bold text-blue-200 hover:bg-blue-900/60 transition"
          >
            <GraduationCap className="h-4 w-4 text-blue-400" />
            <span>New Student Account</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateModal("manager")}
            className="flex items-center gap-1.5 rounded-xl border border-[#dfba73]/40 bg-[#dfba73]/10 px-3.5 py-2 text-xs font-bold text-[#dfba73] hover:bg-[#dfba73]/20 transition"
          >
            <Award className="h-4 w-4 text-[#dfba73]" />
            <span>New Manager</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab !== "hierarchy" && (
        <div className="space-y-4">
          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#092233] p-3 shadow-md">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name, email, username, staff ID, admission #, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#dfba73] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white focus:border-[#dfba73] focus:outline-none cursor-pointer"
              >
                <option value="all">All Status ({users.length})</option>
                <option value="active">Active Only</option>
                <option value="inactive">Deactivated Only</option>
              </select>
            </div>
          </div>

          {/* User Directory Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#092233] shadow-xl">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="border-b border-slate-800 bg-[#061826] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">User & Passport</th>
                  <th className="px-4 py-4">Role & Designation</th>
                  <th className="px-4 py-4">Academic / Org Context</th>
                  <th className="px-4 py-4">Files & Dossier</th>
                  <th className="px-4 py-4">Status & Action</th>
                  <th className="px-4 py-4 text-right">Account Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => {
                  const isActive = u.account_status === "active";
                  const passport = u.passport_url || u.avatar_url;

                  return (
                    <tr key={u.user_id} className="hover:bg-slate-900/40 transition">
                      {/* 1. User & Passport */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 border-slate-700 bg-slate-950 shadow-sm">
                            {passport ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={passport} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-slate-900 font-bold text-slate-400 text-xs">
                                {u.first_name[0]}{u.last_name[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white block text-sm">
                              {u.first_name} {u.middle_name ? `${u.middle_name} ` : ""}{u.last_name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-teal-300 text-[11px]">{u.email}</span>
                              {u.phone && <span className="text-[10px] text-slate-400">• {u.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role & Designation */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              u.role === "superadmin"
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                : u.role === "manager"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : u.role === "staff"
                                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            }`}
                          >
                            {u.role}
                          </span>
                          <span className="block text-[11px] font-medium text-slate-300 capitalize">
                            {u.designation}
                          </span>
                        </div>
                      </td>

                      {/* 3. Academic / Org Context */}
                      <td className="px-4 py-3.5">
                        {u.role === "student" ? (
                          <div>
                            <span className="font-bold text-white block">
                              Class: {u.current_class_name || "Unenrolled"}
                            </span>
                            <span className="text-[10.5px] font-mono text-blue-300 block">
                              Adm: {u.admission_number || "Pending"}
                            </span>
                          </div>
                        ) : u.role === "staff" || u.role === "manager" ? (
                          <div>
                            <span className="font-bold text-slate-200 block">
                              {u.department || "Operations"}
                            </span>
                            <span className="text-[10.5px] font-mono text-slate-400 block">
                              Staff ID: {u.staff_number || "N/A"}
                            </span>
                            {u.manager_first_name && (
                              <span className="text-[9.5px] text-amber-400 block">
                                Mgr: {u.manager_first_name} {u.manager_last_name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">System Director</span>
                        )}
                      </td>

                      {/* 4. Files & Dossier */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => openDossier(u)}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:text-white hover:border-[#dfba73] transition shadow-xs"
                        >
                          <FolderOpen className="h-3.5 w-3.5 text-[#dfba73]" />
                          <span>{u.document_count} File{u.document_count !== 1 ? "s" : ""}</span>
                        </button>
                      </td>

                      {/* 5. Status & One-Click Toggle */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isActive
                                ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/40"
                                : "bg-rose-950/70 text-rose-400 border border-rose-500/40"
                            }`}
                          >
                            {isActive ? "Active" : "Deactivated"}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`rounded-lg p-1.5 border transition ${
                              isActive
                                ? "border-rose-800/80 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60"
                                : "border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60"
                            }`}
                            title={isActive ? "Deactivate Account" : "Activate Account"}
                          >
                            {isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* 6. Account Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-[#dfba73] hover:text-[#dfba73] transition ml-auto"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!filteredUsers.length && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No accounts found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Manager Hierarchy Supervision */}
      {activeTab === "hierarchy" && (
        <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#dfba73]" />
              <span>Manager Supervision &amp; Staff Hierarchy</span>
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Assign teachers and operational staff members to report directly to specific Section Managers.
            </p>
          </div>

          <form onSubmit={handleAssignManager} className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-4xl">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73] block mb-1.5">
                Select Section Manager
              </label>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
              >
                {managers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.first_name} {m.last_name} ({m.department || "Manager"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block mb-1.5">
                Select Staff Member
              </label>
              <select
                value={selectedStaffToAssign}
                onChange={(e) => setSelectedStaffToAssign(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
              >
                <option value="">-- Choose Staff Member --</option>
                {users
                  .filter((u) => u.role === "staff")
                  .map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.first_name} {s.last_name} ({s.designation})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isAssigningManager}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#dfba73] p-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition shadow-md"
              >
                <LinkIcon className="h-4 w-4" />
                <span>{isAssigningManager ? "Assigning..." : "Assign Supervision Link"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CREATE / EDIT USER ACCOUNT                      */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#dfba73]/40 bg-[#092233] p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="rounded-full bg-[#dfba73]/20 border border-[#dfba73]/40 px-3 py-0.5 text-[10px] font-bold tracking-widest text-[#dfba73] uppercase">
                  {editingUser ? "Modify Account Credentials" : "Provision New User Account"}
                </span>
                <h3 className="mt-1 font-serif text-xl font-bold text-white">
                  {editingUser ? `Edit ${editingUser.first_name} ${editingUser.last_name}` : "Create Verified Account"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {/* Role & Designation */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73] block mb-1">
                    Account Role (Core Role) *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const r = e.target.value as any;
                      setRole(r);
                      if (r === "student") setDesignation("student");
                      else if (r === "manager") setDesignation("manager");
                      else if (r === "superadmin") setDesignation("superadmin");
                      else setDesignation("teaching staff");
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    <option value="staff">Staff (Faculty &amp; Operations)</option>
                    <option value="student">Student (Scholar)</option>
                    <option value="manager">Manager (Section Head)</option>
                    <option value="superadmin">Superadmin (Executive Directorate)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block mb-1">
                    Designation (Specific Title) *
                  </label>
                  {role === "staff" ? (
                    <select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    >
                      <option value="teaching staff">Teaching Staff (Form &amp; Subject Teacher)</option>
                      <option value="academic staff">Academic Staff (Examinations, Curriculum)</option>
                      <option value="non academic staff">Non Academic Staff (Bursary, Facilities, Admin)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                      placeholder="e.g. manager, student, principal..."
                    />
                  )}
                </div>
              </div>

              {/* Special Link for Student Account */}
              {role === "student" && (
                <div className="rounded-2xl border border-blue-500/40 bg-blue-950/40 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-300" />
                    <label className="text-xs font-bold text-blue-200">
                      Link Account to Existing Student Record (Recommended)
                    </label>
                  </div>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full rounded-xl border border-blue-500/50 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Or Create New Independent Student Profile --</option>
                    {students.map((s) => (
                      <option key={s.student_id} value={s.student_id}>
                        {s.first_name} {s.last_name} ({s.admission_number}) — {s.class_name || "Unenrolled"}
                        {s.linked_email ? ` [Already linked to ${s.linked_email}]` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-blue-300">
                    Selecting an enrolled student automatically links their academic score ledger and passport to this login account.
                  </p>
                </div>
              )}

              {/* Email / Username & Password */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73]">
                      Email or Username *
                    </label>
                    {email.trim() && !email.includes("@") && (
                      <span className="text-[9.5px] font-mono text-teal-300 font-bold">
                        → {email.trim()}@salamah.ng
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. staff1 or staff1@salamah.ng"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none font-mono"
                  />
                  <span className="text-[9.5px] text-slate-400 mt-0.5 block">
                    Domain @salamah.ng is automatically appended if omitted.
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73] block mb-1">
                    Password {editingUser ? "(Leave blank to keep current)" : "*"}
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Defaults to 12345678"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact, Gender, Status */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Account Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    <option value="active">Active (Can Login)</option>
                    <option value="inactive">Inactive (Deactivated)</option>
                  </select>
                </div>
              </div>

              {/* Passport Photograph URL */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73] block mb-1">
                  Passport Photograph URL
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                    {passportUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={passportUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600 text-[10px]">None</div>
                    )}
                  </div>
                  <input
                    type="url"
                    value={passportUrl}
                    onChange={(e) => setPassportUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
              </div>

              {/* Staff Specific Fields */}
              {(role === "staff" || role === "manager") && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Staff ID Number
                    </label>
                    <input
                      type="text"
                      value={staffNumber}
                      onChange={(e) => setStaffNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Reporting Manager
                    </label>
                    <select
                      value={managerUserId}
                      onChange={(e) => setManagerUserId(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                    >
                      <option value="">-- No Manager Assigned --</option>
                      {managers.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.first_name} {m.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? "Saving..." : editingUser ? "Update Account" : "Create Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: USER DOSSIER & FILE MANAGEMENT SYSTEM            */}
      {/* ======================================================== */}
      {dossierUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#dfba73]/40 bg-[#092233] p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[#dfba73] bg-slate-950">
                  {dossierUser.passport_url || dossierUser.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dossierUser.passport_url || dossierUser.avatar_url || ""}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-slate-400">
                      {dossierUser.first_name[0]}{dossierUser.last_name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[9.5px] font-bold text-teal-300 border border-teal-500/30 uppercase">
                    Official User Dossier
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                    {dossierUser.first_name} {dossierUser.last_name}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {dossierUser.email} • {dossierUser.designation}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDossierUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List of Files */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#dfba73]">
                  Stored Documents &amp; Credentials ({userDocs.length})
                </span>
                <span className="text-[11px] text-slate-400">File System Ledger</span>
              </div>

              {isLoadingDocs ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading documents...</div>
              ) : (
                <div className="space-y-2">
                  {userDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-teal-500/10 p-2 text-teal-300 border border-teal-500/20">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{doc.title}</span>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span className="rounded-md bg-slate-800 px-1.5 py-0.2 font-mono text-[#dfba73] capitalize">
                              {doc.doc_type.replace("_", " ")}
                            </span>
                            <span>• {doc.file_size || "150 KB"}</span>
                            <span>• {new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white hover:border-[#dfba73]"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="rounded-lg p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40"
                          title="Delete document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {!userDocs.length && (
                    <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                      No documents currently filed in this user&apos;s folder. Use the form below to upload or attach.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Add Document Form */}
            <form onSubmit={handleAddDocument} className="rounded-2xl border border-slate-800 bg-[#061826] p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <FilePlus className="h-4 w-4" />
                <span>Attach New Document to Dossier</span>
              </span>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Promotion Letter, Degree Certificate..."
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Document Type
                  </label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  >
                    <option value="employment_agreement">Employment Agreement</option>
                    <option value="id_card">Official ID Card</option>
                    <option value="promotion_letter">Promotion Letter</option>
                    <option value="certificate">Academic / Degree Certificate</option>
                    <option value="medical_clearance">Medical Clearance</option>
                    <option value="other">General Credential</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  File URL or Reference Path
                </label>
                <input
                  type="text"
                  placeholder="https://... or /docs/my-file.pdf"
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-[#dfba73] focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={isAddingDoc}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition shadow-md"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{isAddingDoc ? "Adding..." : "Add Document to File"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
