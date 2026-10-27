"use client";

import { useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Edit2,
  PlusCircle,
  Save,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";

export type OfficeItem = {
  id: string;
  name: string;
  code: string;
  location: string | null;
  responsibilities: string;
  assigned_user_id: string | null;
  status: string;
  assigned_email: string | null;
  assigned_role: string | null;
  assigned_first_name: string | null;
  assigned_last_name: string | null;
  log_count: number;
  last_log_date: string | null;
};

export type OfficeLogItem = {
  id: string;
  office_id: string;
  log_date: string;
  week_summary: string;
  daily_tasks_carried_out: string;
  challenges: string | null;
  next_week_plan: string | null;
  status: string;
  office_name: string;
  office_code: string;
  first_name: string;
  last_name: string;
  email: string;
};

export function OfficesClient({
  offices: initialOffices,
  personnel,
  allLogs,
  initialTab,
}: {
  offices: OfficeItem[];
  personnel: { user_id: string; first_name: string; last_name: string; email: string; role: string }[];
  allLogs: OfficeLogItem[];
  initialTab: string;
}) {
  const [offices, setOffices] = useState<OfficeItem[]>(initialOffices);
  const [activeTab, setActiveTab] = useState(initialTab === "logs" ? "logs" : "directory");
  const [searchQuery, setSearchQuery] = useState("");

  // Office Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<OfficeItem | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [isSaving, setIsSaving] = useState(false);

  function openOfficeModal(off?: OfficeItem) {
    if (off) {
      setEditingOffice(off);
      setName(off.name);
      setCode(off.code);
      setLocation(off.location || "");
      setResponsibilities(off.responsibilities);
      setAssignedUserId(off.assigned_user_id || "");
      setStatus(off.status as "active" | "inactive");
    } else {
      setEditingOffice(null);
      setName("");
      setCode("");
      setLocation("");
      setResponsibilities("");
      setAssignedUserId("");
      setStatus("active");
    }
    setIsModalOpen(true);
  }

  async function handleSaveOffice(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/offices/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingOffice ? editingOffice.id : undefined,
          name,
          code,
          location,
          responsibilities,
          assignedUserId: assignedUserId || undefined,
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to save office");
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving office");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredOffices = offices.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Sub-menu Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("directory")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "directory"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Offices Directory ({offices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "logs"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Weekly Duty Logs & Updates ({allLogs.length})</span>
          </button>
        </div>

        <button
          onClick={() => openOfficeModal()}
          className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create Administrative Office</span>
        </button>
      </div>

      {/* TAB 1: DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search offices by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {filteredOffices.map((off) => (
              <div
                key={off.id}
                className="flex flex-col rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-md transition hover:border-teal-500/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-teal-500/20 px-2.5 py-1 text-xs font-bold text-teal-300 font-mono">
                      {off.code}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                      {off.status}
                    </span>
                  </div>
                  <button
                    onClick={() => openOfficeModal(off)}
                    className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  {off.name}
                </h3>
                {off.location && (
                  <p className="mt-1 text-xs text-slate-400">
                    Location: {off.location}
                  </p>
                )}

                <div className="mt-4 rounded-xl bg-slate-900/60 p-3 text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {off.responsibilities}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Assigned Officer: </span>
                    {off.assigned_first_name ? (
                      <span className="font-semibold text-teal-300">
                        {off.assigned_first_name} {off.assigned_last_name} ({off.assigned_role})
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Unassigned</span>
                    )}
                  </div>
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                    {off.log_count} Weekly Logs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {allLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-800 bg-[#092233] p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-mono font-bold text-teal-300">
                      {log.office_code}
                    </span>
                    <h4 className="font-bold text-white text-sm">{log.office_name}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{log.log_date}</span>
                    <span>•</span>
                    <span className="text-teal-300">Submitted by {log.first_name} {log.last_name}</span>
                  </div>
                </div>

                <div className="mt-3 text-xs space-y-2">
                  <p className="font-semibold text-white">{log.week_summary}</p>
                  <div className="rounded-xl bg-slate-900/60 p-3 leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {log.daily_tasks_carried_out}
                  </div>
                  {log.challenges && (
                    <p className="text-amber-300"><span className="font-semibold text-amber-400">Challenges: </span>{log.challenges}</p>
                  )}
                  {log.next_week_plan && (
                    <p className="text-emerald-300"><span className="font-semibold text-emerald-400">Next Week Plan: </span>{log.next_week_plan}</p>
                  )}
                </div>
              </div>
            ))}

            {allLogs.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-[#092233] p-8 text-center text-slate-400 text-xs">
                No weekly duty logs submitted yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* OFFICE MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="relative my-auto flex max-h-[88vh] w-full max-w-lg flex-col rounded-3xl border border-teal-500/40 bg-[#092233] p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <h3 className="font-display text-lg font-bold text-white">
                {editingOffice ? "Edit Office" : "Create Administrative Office"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffice} className="flex-1 overflow-y-auto mt-4 space-y-3 salamah-scrollbar">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Office Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office of the Principal / Bursary Directorate"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Office Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRIN-OFFICE"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Admin Block, Suite 201"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assign Manager or Staff to Office
                </label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full rounded-xl border border-teal-500/40 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="">-- No Personnel Assigned --</option>
                  {personnel.map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.first_name} {p.last_name} ({p.role.toUpperCase()}) - {p.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Office Mandate & Binding Responsibilities *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Detailed standard operating procedures, weekly objectives and duties of this office..."
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-teal-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
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
                  className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400"
                >
                  {isSaving ? "Saving..." : "Save Office"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
