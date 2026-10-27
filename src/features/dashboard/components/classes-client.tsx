"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Edit2,
  GraduationCap,
  Layers,
  PlusCircle,
  Save,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";

export type ClassItem = {
  id: string;
  name: string;
  code: string;
  status: string;
  grade_id: string;
  grade_name: string;
  student_count: number;
  assigned_combination: string | null;
  class_teacher_name: string | null;
};

export function ClassesClient({
  classes: initialClasses,
  grades,
  combinations,
  teachers,
  sessionId,
  initialTab,
}: {
  classes: ClassItem[];
  grades: { id: string; name: string }[];
  combinations: { id: string; name: string }[];
  teachers: { id: string; name: string; staff_number: string | null; email?: string }[];
  sessionId?: string;
  initialTab: string;
}) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [activeTab, setActiveTab] = useState(
    initialTab === "combinations" ? "combinations" : initialTab === "teachers" ? "teachers" : "classes"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Create/Edit Class Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [gradeId, setGradeId] = useState(grades[0]?.id || "");
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");

  // Combination Link Modal
  const [isCombModalOpen, setIsCombModalOpen] = useState(false);
  const [targetClassId, setTargetClassId] = useState("");
  const [combinationId, setCombinationId] = useState(combinations[0]?.id || "");

  // Teacher Assignment Modal
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || "");

  const [isSaving, setIsSaving] = useState(false);

  function openClassModal(cls?: ClassItem) {
    if (cls) {
      setEditingClass(cls);
      setGradeId(cls.grade_id);
      setClassName(cls.name);
      setClassCode(cls.code);
    } else {
      setEditingClass(null);
      setGradeId(grades[0]?.id || "");
      setClassName("");
      setClassCode("");
    }
    setIsClassModalOpen(true);
  }

  async function handleSaveClass(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/classes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingClass ? editingClass.id : undefined,
          gradeId,
          name: className,
          code: classCode,
        }),
      });
      if (!res.ok) throw new Error("Failed to save class");
      setIsClassModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving class");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssignCombination(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/classes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-combination",
          classId: targetClassId,
          combinationId: combinationId || null,
          sessionId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update combination attachment");
      }
      setIsCombModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating combination");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDetachCombination(classId: string) {
    if (!confirm("Are you sure you want to detach the subject combination from this class?")) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/classes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "detach-combination",
          classId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to detach combination");
      }
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error detaching combination");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssignTeacher(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/classes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-teacher",
          classId: targetClassId,
          teacherId: teacherId || null,
          sessionId,
          assignmentType: "class_teacher",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update class teacher");
      }
      setIsTeacherModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating class teacher");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUnassignTeacher(classId: string) {
    if (!confirm("Are you sure you want to unassign the class teacher from this class?")) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/classes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unassign-teacher",
          classId,
          assignmentType: "class_teacher",
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

  const filtered = classes.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.grade_name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Sub-menu Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("classes")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "classes"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Class Directory ({classes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("combinations")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "combinations"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <BookOpenCheck className="h-4 w-4" />
            <span>Subject Combination Attachments</span>
          </button>

          <button
            onClick={() => setActiveTab("teachers")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "teachers"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Class Teachers</span>
          </button>
        </div>

        <button
          onClick={() => openClassModal()}
          className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add New Class</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search classes by name, grade or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white focus:border-teal-500 focus:outline-none"
        />
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#092233] shadow-md">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4">Class Name</th>
              <th className="p-4">Grade Group</th>
              <th className="p-4">Code</th>
              <th className="p-4">Assigned Combination</th>
              <th className="p-4">Class Teacher</th>
              <th className="p-4 text-center">Enrolled Students</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/20 transition group">
                <td className="p-4">
                  <Link
                    href={`/dashboard/classes/${c.id}`}
                    className="font-bold text-white text-sm hover:text-teal-300 transition flex items-center gap-1.5"
                  >
                    <span>{c.name}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition text-teal-400" />
                  </Link>
                </td>
                <td className="p-4 text-slate-300">{c.grade_name}</td>
                <td className="p-4 font-mono text-teal-300">{c.code}</td>
                <td className="p-4">
                  {c.assigned_combination ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-300">
                        {c.assigned_combination}
                      </span>
                      <button
                        onClick={() => {
                          setTargetClassId(c.id);
                          const matched = combinations.find((cb) => cb.name === c.assigned_combination);
                          setCombinationId(matched?.id || combinations[0]?.id || "");
                          setIsCombModalOpen(true);
                        }}
                        className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 hover:text-teal-300 hover:bg-slate-700 transition"
                        title="Change Combination"
                      >
                        Change
                      </button>
                      <button
                        onClick={() => handleDetachCombination(c.id)}
                        className="rounded-md bg-rose-950/40 border border-rose-800/40 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-900/60 transition"
                        title="Detach Combination"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setTargetClassId(c.id);
                        setCombinationId(combinations[0]?.id || "");
                        setIsCombModalOpen(true);
                      }}
                      className="text-xs text-slate-400 hover:text-teal-400 underline"
                    >
                      + Attach Combination
                    </button>
                  )}
                </td>
                <td className="p-4">
                  {c.class_teacher_name ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-emerald-300">
                        {c.class_teacher_name}
                      </span>
                      <button
                        onClick={() => {
                          setTargetClassId(c.id);
                          const matched = teachers.find((t) => t.name === c.class_teacher_name);
                          setTeacherId(matched?.id || teachers[0]?.id || "");
                          setIsTeacherModalOpen(true);
                        }}
                        className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 hover:text-teal-300 hover:bg-slate-700 transition"
                        title="Change Teacher"
                      >
                        Change
                      </button>
                      <button
                        onClick={() => handleUnassignTeacher(c.id)}
                        className="rounded-md bg-rose-950/40 border border-rose-800/40 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-900/60 transition"
                        title="Unassign Teacher"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setTargetClassId(c.id);
                        setTeacherId(teachers[0]?.id || "");
                        setIsTeacherModalOpen(true);
                      }}
                      className="text-xs text-slate-400 hover:text-teal-400 underline"
                    >
                      + Assign Teacher
                    </button>
                  )}
                </td>
                <td className="p-4 text-center">
                  <span className="rounded-full bg-slate-800 px-3 py-1 font-bold text-white text-xs">
                    {c.student_count}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/classes/${c.id}`}
                      className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition"
                    >
                      Manage Class
                    </Link>
                    <button
                      onClick={() => openClassModal(c)}
                      className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white"
                      title="Edit class code/name"
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

      {/* CREATE / EDIT CLASS MODAL */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-teal-500/40 bg-[#092233] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-display text-lg font-bold text-white">
                {editingClass ? "Edit Class" : "Create New Class"}
              </h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Grade *</label>
                <select
                  value={gradeId}
                  onChange={(e) => setGradeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Class Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JSS 1 Gold / SS 2 Science A"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Class Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JSS_1_GOLD"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono uppercase"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400"
                >
                  {isSaving ? "Saving..." : "Save Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMBINATION ATTACHMENT MODAL */}
      {isCombModalOpen && (() => {
        const targetClass = classes.find((c) => c.id === targetClassId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-teal-500/40 bg-[#092233] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-display text-lg font-bold text-white">
                  {targetClass?.assigned_combination ? "Change / Detach Combination" : "Attach Subject Combination"}
                </h3>
                <button onClick={() => setIsCombModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAssignCombination} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Class *</label>
                  <select
                    value={targetClassId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setTargetClassId(cid);
                      const cls = classes.find((c) => c.id === cid);
                      const matched = combinations.find((cb) => cb.name === cls?.assigned_combination);
                      setCombinationId(matched?.id || combinations[0]?.id || "");
                    }}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.assigned_combination ? `(Currently: ${c.assigned_combination})` : "(Unattached)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Combination *</label>
                  <select
                    value={combinationId}
                    onChange={(e) => setCombinationId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Detach / No Combination --</option>
                    {combinations.map((comb) => (
                      <option key={comb.id} value={comb.id}>{comb.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-800">
                  {targetClass?.assigned_combination ? (
                    <button
                      type="button"
                      onClick={() => handleDetachCombination(targetClassId)}
                      disabled={isSaving}
                      className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60"
                    >
                      Detach Combination
                    </button>
                  ) : <div />}

                  <div className="flex gap-2">
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
                      {isSaving ? "Saving..." : combinationId ? "Save Combination" : "Detach"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* CLASS TEACHER ASSIGNMENT MODAL */}
      {isTeacherModalOpen && (() => {
        const targetClass = classes.find((c) => c.id === targetClassId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-teal-500/40 bg-[#092233] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-display text-lg font-bold text-white">
                  {targetClass?.class_teacher_name ? "Change / Unassign Class Teacher" : "Assign Class Teacher"}
                </h3>
                <button onClick={() => setIsTeacherModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAssignTeacher} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Class *</label>
                  <select
                    value={targetClassId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setTargetClassId(cid);
                      const cls = classes.find((c) => c.id === cid);
                      const matched = teachers.find((t) => t.name === cls?.class_teacher_name);
                      setTeacherId(matched?.id || teachers[0]?.id || "");
                    }}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.class_teacher_name ? `(Current Teacher: ${c.class_teacher_name})` : "(Unassigned)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Teacher *</label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Unassign / No Class Teacher --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.email ? `• ${t.email}` : t.staff_number ? `(${t.staff_number})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-800">
                  {targetClass?.class_teacher_name ? (
                    <button
                      type="button"
                      onClick={() => handleUnassignTeacher(targetClassId)}
                      disabled={isSaving}
                      className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60"
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
                      disabled={isSaving}
                      className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400"
                    >
                      {isSaving ? "Saving..." : teacherId ? "Save Teacher" : "Unassign"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
