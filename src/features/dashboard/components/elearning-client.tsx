"use client";

import { useState } from "react";
import {
  Compass,
  Download,
  Edit2,
  ExternalLink,
  FileText,
  LinkIcon,
  PlusCircle,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { ElearningResourceItem } from "@/lib/services/elearning";

export function ElearningClient({
  resources: initialResources,
  subjects,
  classes,
  initialAction,
  initialType,
}: {
  resources: ElearningResourceItem[];
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  initialAction?: string;
  initialType?: "text" | "file" | "url";
}) {
  const [resources, setResources] = useState<ElearningResourceItem[]>(initialResources);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(initialAction === "create");
  const [editingItem, setEditingItem] = useState<ElearningResourceItem | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [classId, setClassId] = useState("");
  const [resourceType, setResourceType] = useState<"text" | "file" | "url">(initialType || "url");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  function openCreateModal(t?: "text" | "file" | "url") {
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setSubjectId(subjects[0]?.id || "");
    setClassId("");
    setResourceType(t || "url");
    setContent("");
    setFileName("");
    setIsModalOpen(true);
  }

  function openEditModal(item: ElearningResourceItem) {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || "");
    setSubjectId(item.subject_id || subjects[0]?.id || "");
    setClassId(item.class_id || "");
    setResourceType(item.resource_type);
    setContent(item.content);
    setFileName(item.file_name || "");
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/elearning/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem ? editingItem.id : undefined,
          title,
          description,
          subjectId: subjectId || undefined,
          classId: classId || undefined,
          resourceType,
          content,
          fileName: fileName || undefined,
          status: "active",
        }),
      });
      if (!res.ok) throw new Error("Failed to save resource");
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving learning resource");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      const res = await fetch("/api/elearning/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (!res.ok) throw new Error("Failed to delete resource");
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting resource");
    }
  }

  const filtered = resources.filter((r) => {
    if (typeFilter !== "all" && r.resource_type !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      (r.subject_name && r.subject_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "text", "file", "url"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase transition ${
                typeFilter === t
                  ? "bg-teal-500 text-slate-950 shadow-md"
                  : "bg-slate-800/80 text-slate-300 hover:text-white"
              }`}
            >
              {t === "all" ? "All Resources" : t}
            </button>
          ))}
        </div>

        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Publish New Resource</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white focus:border-teal-500 focus:outline-none"
        />
      </div>

      {/* Resources Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex flex-col rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-md transition hover:border-teal-500/40"
          >
            <div className="flex items-start justify-between">
              <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300">
                {item.subject_name || "General"}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                  {item.resource_type}
                </span>
                <button
                  onClick={() => openEditModal(item)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg p-1 text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <h3 className="mt-3 font-display text-base font-bold text-white leading-snug">
              {item.title}
            </h3>
            {item.description && (
              <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-3">
                {item.description}
              </p>
            )}

            <div className="mt-auto pt-5 border-t border-slate-800/80">
              {item.resource_type === "url" && (
                <a
                  href={item.content}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/30"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Launch Link</span>
                </a>
              )}
              {item.resource_type === "file" && (
                <a
                  href={item.content}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download File</span>
                </a>
              )}
              {item.resource_type === "text" && (
                <div className="rounded-xl bg-slate-900/60 p-2.5 text-[11px] text-slate-300 line-clamp-2">
                  {item.content}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT RESOURCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl border border-teal-500/40 bg-[#092233] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-display text-lg font-bold text-white">
                {editingItem ? "Edit Learning Resource" : "Create Learning Resource"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto mt-4 space-y-3.5 salamah-scrollbar">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quadratic Equations Masterclass & Video Simulations"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- General / Multi-subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Resource Type *</label>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value as "text" | "file" | "url")}
                    className="w-full rounded-xl border border-teal-500/40 bg-slate-950 px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="url">External URL / Interactive Test Link</option>
                    <option value="file">File Download (PDF, Presentation, Audio)</option>
                    <option value="text">Formatted Text Study Notes / Reading Material</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Syllabus Context</label>
                <textarea
                  rows={2}
                  placeholder="Summary of learning outcomes or exam preparation hints..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {resourceType === "url"
                    ? "Interactive Web / Test URL *"
                    : resourceType === "file"
                    ? "File Download URL *"
                    : "Study Notes Text Content *"}
                </label>
                {resourceType === "text" ? (
                  <textarea
                    rows={7}
                    required
                    placeholder="# Comprehensive Notes..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-teal-500 focus:outline-none font-mono leading-relaxed"
                  />
                ) : (
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                  />
                )}
              </div>

              {resourceType === "file" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display File Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics_Mechanics_Unit1.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              )}

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
                  {isSaving ? "Publishing..." : "Publish Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
