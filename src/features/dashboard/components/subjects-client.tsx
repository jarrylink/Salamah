"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Edit2,
  Layers,
  Plus,
  PlusCircle,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

export type SubjectItem = {
  id: string;
  name: string;
  code: string;
  short_name: string | null;
  description: string | null;
  status: string;
  class_count: number;
  teacher_count: number;
  assigned_teacher_name?: string | null;
  assigned_teacher_email?: string | null;
  assigned_teacher_id?: string | null;
};

export type CombinationItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  member_subjects: { id: string; name: string; code: string }[];
};

export function SubjectsClient({
  subjects: initialSubjects,
  combinations: initialCombinations,
  teachers = [],
  initialTab,
}: {
  subjects: SubjectItem[];
  combinations: CombinationItem[];
  teachers?: { id: string; name: string; staff_number: string | null; email?: string }[];
  initialTab: string;
}) {
  const [subjects, setSubjects] = useState<SubjectItem[]>(initialSubjects);
  const [combinations, setCombinations] = useState<CombinationItem[]>(initialCombinations);
  const [activeTab, setActiveTab] = useState(initialTab === "combinations" ? "combinations" : "catalogue");
  const [searchQuery, setSearchQuery] = useState("");

  // Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectShortName, setSubjectShortName] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");

  // Combination Modal State
  const [isCombModalOpen, setIsCombModalOpen] = useState(false);
  const [editingCombination, setEditingCombination] = useState<CombinationItem | null>(null);
  const [combName, setCombName] = useState("");
  const [combDesc, setCombDesc] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Teacher Assignment Modal State
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [targetSubject, setTargetSubject] = useState<SubjectItem | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  function openAssignTeacherModal(sub: SubjectItem) {
    setTargetSubject(sub);
    const matched = teachers.find((t) => t.id === sub.assigned_teacher_id);
    setSelectedTeacherId(matched?.id || teachers[0]?.id || "");
    setIsTeacherModalOpen(true);
  }

  async function handleAssignTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!targetSubject || !selectedTeacherId) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/subjects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-subject-teacher",
          subjectId: targetSubject.id,
          teacherId: selectedTeacherId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to assign teacher");
      }
      setIsTeacherModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error assigning teacher");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUnassignTeacher(subjectId: string) {
    if (!confirm("Are you sure you want to unassign the teacher from this subject?")) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/subjects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unassign-subject-teacher",
          subjectId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to unassign teacher");
      }
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error unassigning teacher");
    } finally {
      setIsSaving(false);
    }
  }

  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Open Subject Modal
  function openSubjectModal(item?: SubjectItem) {
    setModalError(null);
    if (item) {
      setEditingSubject(item);
      setSubjectName(item.name);
      setSubjectCode(item.code);
      setSubjectShortName(item.short_name || "");
      setSubjectDesc(item.description || "");
    } else {
      setEditingSubject(null);
      setSubjectName("");
      setSubjectCode("");
      setSubjectShortName("");
      setSubjectDesc("");
    }
    setIsSubjectModalOpen(true);
  }

  // Open Combination Modal
  function openCombModal(item?: CombinationItem) {
    setModalError(null);
    if (item) {
      setEditingCombination(item);
      setCombName(item.name);
      setCombDesc(item.description || "");
      setSelectedSubjectIds((item.member_subjects || []).map((s) => s.id));
    } else {
      setEditingCombination(null);
      setCombName("");
      setCombDesc("");
      setSelectedSubjectIds([]);
    }
    setIsCombModalOpen(true);
  }

  async function handleDeleteCombination(combinationId: string) {
    if (!confirm("Are you sure you want to delete this subject combination? Any class attached to it will be detached.")) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/subjects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-combination",
          combinationId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete combination");
      }
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting combination");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveSubject(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);
    try {
      const res = await fetch("/api/subjects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSubject ? editingSubject.id : undefined,
          name: subjectName.trim(),
          code: (subjectCode || `SUB_${subjectName}`).trim().toUpperCase(),
          shortName: subjectShortName.trim() || undefined,
          description: subjectDesc.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to save subject. Please try again.");
      }
      setIsSubjectModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Error saving subject");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveCombination(e: React.FormEvent) {
    e.preventDefault();
    if (selectedSubjectIds.length === 0) {
      setModalError("Please select at least one subject to include in the combination.");
      return;
    }
    setIsSaving(true);
    setModalError(null);
    try {
      const res = await fetch("/api/subjects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingCombination ? "edit-combination" : "create-combination",
          id: editingCombination ? editingCombination.id : undefined,
          name: combName.trim(),
          description: combDesc.trim() || undefined,
          subjectIds: selectedSubjectIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to save combination.");
      }
      setIsCombModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Error saving combination");
    } finally {
      setIsSaving(false);
    }
  }

  const toggleSubjectSelect = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredSubjects = subjects.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Sub-menu Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("catalogue")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "catalogue"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Subject Catalogue ({subjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("combinations")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "combinations"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Subject Combinations ({combinations.length})</span>
          </button>
        </div>

        {activeTab === "catalogue" ? (
          <button
            onClick={() => openSubjectModal()}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add New Subject</span>
          </button>
        ) : (
          <button
            onClick={() => openCombModal()}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400"
          >
            <Plus className="h-4 w-4" />
            <span>Create Subject Combination</span>
          </button>
        )}
      </div>

      {/* TAB 1: SUBJECT CATALOGUE */}
      {activeTab === "catalogue" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#092233] shadow-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Subject Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Short Name</th>
                  <th className="p-4">Assigned Teacher</th>
                  <th className="p-4 text-center">Classes Offering</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4 font-semibold text-white">{sub.name}</td>
                    <td className="p-4 font-mono text-teal-300 font-bold">{sub.code}</td>
                    <td className="p-4 text-slate-400">{sub.short_name || "-"}</td>
                    <td className="p-4">
                      {sub.assigned_teacher_name ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div>
                            <span className="font-semibold text-emerald-300 block">{sub.assigned_teacher_name}</span>
                            {sub.assigned_teacher_email && (
                              <span className="text-[10px] text-slate-400 font-mono block">{sub.assigned_teacher_email}</span>
                            )}
                          </div>
                          <button
                            onClick={() => openAssignTeacherModal(sub)}
                            className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 hover:text-teal-300 hover:bg-slate-700 transition"
                            title="Change Assigned Teacher"
                          >
                            Change
                          </button>
                          <button
                            onClick={() => handleUnassignTeacher(sub.id)}
                            className="rounded-md bg-rose-950/40 border border-rose-800/40 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-900/60 transition"
                            title="Unassign Teacher"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openAssignTeacherModal(sub)}
                          className="text-xs text-teal-400 hover:text-teal-300 underline font-medium"
                        >
                          + Assign Teacher
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-bold text-white">
                        {sub.class_count}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/subjects/${sub.id}`}
                          className="flex items-center gap-1.5 rounded-xl border border-[#dfba73]/40 bg-[#dfba73]/10 px-3 py-1.5 text-xs font-bold text-[#dfba73] hover:bg-[#dfba73] hover:text-slate-950 transition shadow-xs"
                          title="Open Subject Teaching & Scheme Cockpit"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span>Manage</span>
                        </Link>
                        <button
                          onClick={() => openSubjectModal(sub)}
                          className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white"
                          title="Edit metadata"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUBJECT COMBINATIONS */}
      {activeTab === "combinations" && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {combinations.map((comb) => {
            const validMembers = (comb.member_subjects || []).filter((s) => s && s.id);
            return (
              <div
                key={comb.id}
                className="flex flex-col rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-md transition hover:border-teal-500/40"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-teal-500/20 px-2.5 py-1 text-xs font-bold text-teal-300">
                    Combination Track
                  </span>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                    {comb.status}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  {comb.name}
                </h3>
                {comb.description && (
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    {comb.description}
                  </p>
                )}

                <div className="mt-4 border-t border-slate-800/80 pt-3">
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                    Member Subjects ({validMembers.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {validMembers.map((m) => (
                      <span
                        key={m.id}
                        className="rounded-lg bg-slate-900/80 px-2 py-1 text-[11px] font-medium text-teal-200"
                      >
                        {m.name}
                      </span>
                    ))}
                    {validMembers.length === 0 && (
                      <span className="text-xs text-slate-500 italic">No subjects added</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openCombModal(comb)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCombination(comb.id)}
                    className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBJECT MODAL */}
      {isSubjectModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSubjectModalOpen(false);
          }}
        >
          <div className="relative my-auto w-full max-w-md rounded-3xl border border-teal-500/40 bg-[#092233] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-display text-lg font-bold text-white">
                {editingSubject ? "Edit Subject" : "Create New Subject"}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="mt-4 space-y-3">
              {modalError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-200">
                  {modalError}
                </div>
              )}

              <div className="rounded-xl border border-teal-500/30 bg-teal-950/30 p-2.5 text-[11px] text-teal-200 leading-relaxed">
                💡 <strong>Subject Logic:</strong> Subject names can be duplicated across sections (e.g., <em>English</em> for Primary and <em>English</em> for Nursery), but subject codes must be unique (e.g. <em>ENG-PRI</em> and <em>ENG-NUR</em>).
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. English"
                  value={subjectName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSubjectName(val);
                    if (!editingSubject && (!subjectCode || subjectCode.startsWith("SUB_"))) {
                      setSubjectCode(`SUB_${val.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Code * (Must be Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENG-PRI or ENG-NUR"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Short Name</label>
                <input
                  type="text"
                  placeholder="e.g. Further Math"
                  value={subjectShortName}
                  onChange={(e) => setSubjectShortName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief curriculum scope..."
                  value={subjectDesc}
                  onChange={(e) => setSubjectDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400"
                >
                  {isSaving ? "Saving..." : "Save Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMBINATION MODAL */}
      {isCombModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCombModalOpen(false);
          }}
        >
          <div className="relative my-auto flex max-h-[88vh] w-full max-w-2xl flex-col rounded-3xl border border-teal-500/40 bg-[#092233] p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <h3 className="font-display text-lg font-bold text-white">
                {editingCombination ? "Edit Subject Combination" : "Create Multi-Subject Combination"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCombModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCombination} className="flex-1 overflow-y-auto space-y-4 py-4 salamah-scrollbar">
              {modalError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-200">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Combination Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Secondary Arts & Humanities"
                  value={combName}
                  onChange={(e) => setCombName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Core combination for literature and government students"
                  value={combDesc}
                  onChange={(e) => setCombDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Select Member Subjects ({selectedSubjectIds.length} Selected)
                  </label>
                  <span className="text-[11px] text-teal-400">Multiple existing subjects</span>
                </div>

                <div className="grid max-h-56 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:grid-cols-2 gap-2 salamah-scrollbar">
                  {subjects.map((sub) => {
                    const isSelected = selectedSubjectIds.includes(sub.id);
                    return (
                      <label
                        key={sub.id}
                        className={`flex items-center gap-2.5 rounded-xl p-2 text-xs cursor-pointer transition ${
                          isSelected
                            ? "bg-teal-500/20 text-teal-200 ring-1 ring-teal-500/40"
                            : "hover:bg-slate-900 text-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSubjectSelect(sub.id)}
                          className="h-3.5 w-3.5 rounded border-slate-700 accent-teal-500"
                        />
                        <span className="truncate">{sub.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCombModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400"
                >
                  {isSaving ? "Saving..." : editingCombination ? "Save Changes" : "Create Combination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ASSIGN TEACHER TO SUBJECT MODAL */}
      {isTeacherModalOpen && targetSubject && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTeacherModalOpen(false);
          }}
        >
          <div className="relative my-auto w-full max-w-md rounded-3xl border border-teal-500/40 bg-[#092233] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  Instructional Staff Assignment
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  {targetSubject.assigned_teacher_name ? "Change Subject Teacher" : "Assign Subject Teacher"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Selected Subject</span>
                <span className="text-white font-bold text-sm mt-0.5 block">{targetSubject.name}</span>
                <span className="text-teal-400 font-mono text-xs block">{targetSubject.code}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Teacher *
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="">-- Choose Assigned Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.email ? `• ${t.email}` : t.staff_number ? `(${t.staff_number})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Assigning a teacher grants them access to this subject&apos;s scheme of work, lesson notes, lesson plans, and marks entry in their staff dashboard.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-800">
                {targetSubject.assigned_teacher_name ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeacherModalOpen(false);
                      handleUnassignTeacher(targetSubject.id);
                    }}
                    disabled={isSaving}
                    className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60 transition"
                  >
                    Unassign Teacher
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTeacherModalOpen(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !selectedTeacherId}
                    className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50 transition"
                  >
                    {isSaving ? "Saving..." : "Save Assignment"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
