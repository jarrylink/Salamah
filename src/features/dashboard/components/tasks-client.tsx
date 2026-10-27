"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Edit2,
  FileEdit,
  FileText,
  PlusCircle,
  Save,
  Search,
  Users,
  Wrench,
  X,
} from "lucide-react";

export type TaskItem = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  responsibility_document: string;
  assigned_user_id: string | null;
  frequency: string;
  status: string;
  assigned_email: string | null;
  assigned_first_name: string | null;
  assigned_last_name: string | null;
  log_count: number;
  last_log_date: string | null;
};

export type TaskLogItem = {
  id: string;
  task_id: string;
  log_date: string;
  report: string;
  status: string;
  notes: string | null;
  task_title: string;
  task_category: string;
  first_name: string;
  last_name: string;
  email: string;
};

export function TasksClient({
  tasks: initialTasks,
  personnel,
  allLogs,
  initialTab,
}: {
  tasks: TaskItem[];
  personnel: { user_id: string; first_name: string; last_name: string; email: string; role: string }[];
  allLogs: TaskLogItem[];
  initialTab: string;
}) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [activeTab, setActiveTab] = useState(
    initialTab === "documents" ? "documents" : initialTab === "logs" ? "logs" : "directory"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Gardening & Grounds");
  const [description, setDescription] = useState("");
  const [responsibilityDoc, setResponsibilityDoc] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [status, setStatus] = useState("active");

  const [isSaving, setIsSaving] = useState(false);

  function openTaskModal(t?: TaskItem) {
    if (t) {
      setEditingTask(t);
      setTitle(t.title);
      setCategory(t.category);
      setDescription(t.description || "");
      setResponsibilityDoc(t.responsibility_document);
      setAssignedUserId(t.assigned_user_id || "");
      setFrequency(t.frequency);
      setStatus(t.status);
    } else {
      setEditingTask(null);
      setTitle("");
      setCategory("Gardening & Grounds");
      setDescription("");
      setResponsibilityDoc(`# Duty Guidelines & Standard Operating Procedures\n1. Daily schedule...\n2. Safety precautions...\n3. Required equipment...`);
      setAssignedUserId("");
      setFrequency("daily");
      setStatus("active");
    }
    setIsModalOpen(true);
  }

  async function handleSaveTask(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/tasks/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask ? editingTask.id : undefined,
          title,
          category,
          description,
          responsibilityDocument: responsibilityDoc,
          assignedUserId: assignedUserId || undefined,
          frequency,
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to save task");
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving task");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
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
            <Wrench className="h-4 w-4" />
            <span>Task Catalogue ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "documents"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Editable Responsibility Documents</span>
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
            <span>Staff Execution Reports ({allLogs.length})</span>
          </button>
        </div>

        <button
          onClick={() => openTaskModal()}
          className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create School Task</span>
        </button>
      </div>

      {/* TAB 1: CATALOGUE */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {filteredTasks.map((tsk) => (
              <div
                key={tsk.id}
                className="flex flex-col rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-md transition hover:border-teal-500/40"
              >
                <div className="flex items-start justify-between">
                  <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300">
                    {tsk.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                      {tsk.frequency}
                    </span>
                    <button
                      onClick={() => openTaskModal(tsk)}
                      className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  {tsk.title}
                </h3>
                {tsk.description && (
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    {tsk.description}
                  </p>
                )}

                <div className="mt-auto pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Assigned Worker: </span>
                    {tsk.assigned_first_name ? (
                      <span className="font-semibold text-teal-300">
                        {tsk.assigned_first_name} {tsk.assigned_last_name}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Unassigned</span>
                    )}
                  </div>
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                    {tsk.log_count} Execution Logs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RESPONSIBILITY DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          {tasks.map((tsk) => (
            <div
              key={tsk.id}
              className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-md"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                    {tsk.category}
                  </span>
                  <h4 className="mt-1 font-display text-lg font-bold text-white">{tsk.title}</h4>
                </div>
                <button
                  onClick={() => openTaskModal(tsk)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:border-teal-500/40 hover:text-teal-300"
                >
                  <FileEdit className="h-3.5 w-3.5" />
                  <span>Edit SOP Document</span>
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-900/60 p-4 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-mono">
                {tsk.responsibility_document}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: EXECUTION REPORTS */}
      {activeTab === "logs" && (
        <div className="space-y-3">
          {allLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-slate-800 bg-[#092233] p-4 text-xs shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
                    {log.task_category}
                  </span>
                  <h5 className="font-bold text-white">{log.task_title}</h5>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{log.log_date}</span>
                </div>
              </div>
              <p className="mt-2 text-slate-200 leading-relaxed">{log.report}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-slate-400">
                <span>Executed by {log.first_name} {log.last_name} ({log.email})</span>
                <span className="font-semibold text-emerald-400 uppercase">{log.status}</span>
              </div>
            </div>
          ))}

          {allLogs.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-[#092233] p-8 text-center text-slate-400 text-xs">
              No task execution logs submitted yet.
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="relative my-auto flex max-h-[88vh] w-full max-w-xl flex-col rounded-3xl border border-teal-500/40 bg-[#092233] p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <h3 className="font-display text-lg font-bold text-white">
                {editingTask ? "Edit School Task" : "Create New School Task"}
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

            <form onSubmit={handleSaveTask} className="flex-1 overflow-y-auto mt-4 space-y-3 salamah-scrollbar">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24/7 Campus Armed Security Patrol & Gatehouse Control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">Task Type / Category *</label>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Classes / Subjects / Security / Gardening / Sanitation"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {["Classes", "Subjects", "Gardening & Grounds", "Security & Safety", "Sanitation", "Maintenance"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCategory(preset)}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition border ${
                          category === preset
                            ? "bg-teal-500 text-slate-950 border-teal-400"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="on-demand">On Demand / As Needed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Short task description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Worker / Staff</label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full rounded-xl border border-teal-500/40 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="">-- No Worker Assigned --</option>
                  {personnel.map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.first_name} {p.last_name} ({p.role.toUpperCase()}) - {p.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Binding Responsibility Document (Editable SOP) *
                </label>
                <textarea
                  rows={6}
                  required
                  value={responsibilityDoc}
                  onChange={(e) => setResponsibilityDoc(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-teal-500 focus:outline-none font-mono leading-relaxed"
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
                  {isSaving ? "Saving..." : "Save School Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
