"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Edit2,
  FileText,
  GraduationCap,
  KeyRound,
  Link as LinkIcon,
  Mail,
  PlusCircle,
  Save,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

export type PersonnelRecord = {
  user_id: string;
  email: string;
  role: string;
  account_status: string;
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
  metadata: Record<string, unknown> | null;
  manager_user_id: string | null;
  manager_first_name: string | null;
  manager_last_name: string | null;
};

export type ManagerOption = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: string | null;
};

export function AccessManagementClient({
  personnel: initialPersonnel,
  managers,
  initialTab,
}: {
  personnel: PersonnelRecord[];
  managers: ManagerOption[];
  initialTab: string;
}) {
  const [personnel, setPersonnel] = useState<PersonnelRecord[]>(initialPersonnel);
  const [activeTab, setActiveTab] = useState(initialTab === "managers" ? "managers" : initialTab === "hierarchy" ? "hierarchy" : "staff");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PersonnelRecord | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("male");
  const [role, setRole] = useState<"manager" | "staff" | "teacher">("staff");
  const [status, setStatus] = useState<"active" | "inactive" | "suspended">("active");
  const [staffNumber, setStaffNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [pictureUrl, setPictureUrl] = useState("");
  const [fileDocUrl, setFileDocUrl] = useState("");
  const [managerUserId, setManagerUserId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  function openCreateModal(defaultRole: "manager" | "staff" | "teacher" = "staff") {
    setEditingUser(null);
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setEmail("");
    setPassword("12345678");
    setPhone("");
    setGender("male");
    setRole(defaultRole);
    setStatus("active");
    setStaffNumber(`STF-${Math.floor(100 + Math.random() * 900)}`);
    setDepartment(defaultRole === "manager" ? "Executive Leadership" : "Academic Operations");
    setEmploymentType("full_time");
    setPictureUrl("");
    setFileDocUrl("");
    setManagerUserId(managers[0]?.user_id || "");
    setFormFeedback(null);
    setIsModalOpen(true);
  }

  function openEditModal(record: PersonnelRecord) {
    setEditingUser(record);
    setFirstName(record.first_name);
    setMiddleName(record.middle_name || "");
    setLastName(record.last_name);
    setEmail(record.email);
    setPassword("");
    setPhone(record.phone || "");
    setGender(record.gender || "male");
    setRole((record.role === "manager" ? "manager" : record.role === "teacher" ? "teacher" : "staff") as "manager" | "staff" | "teacher");
    setStatus(record.account_status as "active" | "inactive" | "suspended");
    setStaffNumber(record.staff_number || "");
    setDepartment(record.department || "");
    setEmploymentType(record.employment_type || "full_time");
    const meta = (record.metadata || {}) as Record<string, string>;
    setPictureUrl(meta.pictureUrl || record.avatar_url || "");
    setFileDocUrl(meta.fileDocUrl || "");
    setManagerUserId(record.manager_user_id || "");
    setFormFeedback(null);
    setIsModalOpen(true);
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFormFeedback(null);

    try {
      const res = await fetch("/api/access-management/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser ? editingUser.user_id : undefined,
          firstName,
          middleName,
          lastName,
          email,
          password: password.trim() ? password : undefined,
          phone,
          gender,
          role,
          status,
          staffNumber,
          department,
          employmentType,
          pictureUrl,
          fileDocUrl,
          managerUserId: role !== "manager" ? managerUserId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save account");
      setFormFeedback("Account successfully saved in database!");
      setTimeout(() => {
        setIsModalOpen(false);
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      setFormFeedback(err instanceof Error ? err.message : "Error saving account");
    } finally {
      setIsSaving(false);
    }
  }

  const managersList = personnel.filter((p) => p.role === "manager");
  const staffList = personnel.filter((p) => p.role !== "manager");

  const displayedList = (activeTab === "managers" ? managersList : staffList).filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.department && p.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Sub-Menu Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "staff"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Staff & Teachers ({staffList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("managers")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "managers"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Managers Directory ({managersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("hierarchy")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "hierarchy"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Supervision Hierarchy</span>
          </button>
        </div>

        <button
          onClick={() => openCreateModal(activeTab === "managers" ? "manager" : "staff")}
          className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New {activeTab === "managers" ? "Manager" : "Staff"}</span>
        </button>
      </div>

      {/* Search Bar */}
      {activeTab !== "hierarchy" && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white focus:border-teal-500 focus:outline-none"
          />
        </div>
      )}

      {/* TAB 1 & 2: LIST VIEW */}
      {activeTab !== "hierarchy" && (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#092233] shadow-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Personnel</th>
                <th className="p-4">Role & ID</th>
                <th className="p-4">Department</th>
                <th className="p-4">Supervising Manager</th>
                <th className="p-4">Documents / Files</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedList.map((rec) => {
                const meta = (rec.metadata || {}) as Record<string, string>;
                return (
                  <tr key={rec.user_id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-500/20 text-xs font-bold text-teal-300">
                          {rec.first_name[0]}{rec.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {rec.first_name} {rec.last_name}
                          </p>
                          <p className="text-[11px] text-slate-400">{rec.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 uppercase">
                        {rec.role}
                      </span>
                      {rec.staff_number && (
                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          {rec.staff_number}
                        </p>
                      )}
                    </td>

                    <td className="p-4 text-slate-300">
                      {rec.department || "General"}
                    </td>

                    <td className="p-4">
                      {rec.role === "manager" ? (
                        <span className="text-[11px] text-teal-400 font-semibold">
                          Self / Directorate
                        </span>
                      ) : rec.manager_first_name ? (
                        <span className="font-medium text-white">
                          {rec.manager_first_name} {rec.manager_last_name}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="p-4">
                      {meta.fileDocUrl ? (
                        <a
                          href={meta.fileDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-teal-400 underline hover:text-teal-300"
                        >
                          <LinkIcon className="h-3 w-3" />
                          <span>View Doc / CV</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No file</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          rec.account_status === "active"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {rec.account_status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEditModal(rec)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:border-teal-500/40 hover:text-teal-300"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {displayedList.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No personnel found matching the query.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUPERVISION HIERARCHY MAPPING */}
      {activeTab === "hierarchy" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-md">
            <h3 className="font-display text-lg font-bold text-white mb-4">
              Manager & Supervised Staff Directory Tree
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">
              {managersList.map((mgr) => {
                const subordinates = staffList.filter((s) => s.manager_user_id === mgr.user_id);
                return (
                  <div
                    key={mgr.user_id}
                    className="rounded-2xl border border-teal-500/30 bg-[#041a27] p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 uppercase">
                          Manager
                        </span>
                        <h4 className="mt-1 font-display font-bold text-white text-base">
                          {mgr.first_name} {mgr.last_name}
                        </h4>
                        <p className="text-xs text-slate-400">{mgr.email}</p>
                      </div>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-teal-300">
                        {subordinates.length} Staff
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Supervised Staff Members
                      </p>
                      {subordinates.map((sub) => (
                        <div
                          key={sub.user_id}
                          className="flex items-center justify-between rounded-xl bg-slate-900/60 p-2.5 text-xs text-slate-200"
                        >
                          <div>
                            <p className="font-semibold text-white">{sub.first_name} {sub.last_name}</p>
                            <p className="text-[10px] text-slate-400">{sub.department || "Operations"}</p>
                          </div>
                          <span className="rounded bg-teal-950 px-2 py-0.5 text-[10px] font-mono text-teal-300">
                            {sub.staff_number}
                          </span>
                        </div>
                      ))}

                      {subordinates.length === 0 && (
                        <p className="text-xs text-slate-500 italic">No staff assigned to this manager yet.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EDIT / CREATE PERSONNEL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl border border-teal-500/40 bg-[#092233] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-6">
              <div>
                <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300 uppercase">
                  {editingUser ? "Edit Account" : "Register Personnel"}
                </span>
                <h3 className="mt-1 font-display text-xl font-bold text-white">
                  {editingUser ? `${editingUser.first_name} ${editingUser.last_name}` : "New Account Record"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAccount} className="flex-1 overflow-y-auto p-6 space-y-4 salamah-scrollbar">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sign-In Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password {editingUser ? "(Leave blank to keep current)" : "*"}
                  </label>
                  <input
                    type="text"
                    placeholder={editingUser ? "Unchanged" : "e.g. 12345678"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "manager" | "staff" | "teacher")}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "active" | "inactive" | "suspended")}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Staff ID Number</label>
                  <input
                    type="text"
                    value={staffNumber}
                    onChange={(e) => setStaffNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
              </div>

              {role !== "manager" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assign Supervising Manager
                  </label>
                  <select
                    value={managerUserId}
                    onChange={(e) => setManagerUserId(e.target.value)}
                    className="w-full rounded-xl border border-teal-500/40 bg-slate-950 px-3 py-2 text-xs text-white font-medium"
                  >
                    <option value="">-- No Manager Assigned --</option>
                    {managers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.first_name} {m.last_name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Profile Picture URL / File Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://... photo link"
                    value={pictureUrl}
                    onChange={(e) => setPictureUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Document File / CV Link (or Text)
                  </label>
                  <input
                    type="text"
                    placeholder="https://... CV or document url"
                    value={fileDocUrl}
                    onChange={(e) => setFileDocUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {formFeedback && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold ${
                    formFeedback.includes("success")
                      ? "border border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                      : "border border-rose-500/40 bg-rose-950/40 text-rose-300"
                  }`}
                >
                  {formFeedback}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? "Saving..." : "Save Personnel Record"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
