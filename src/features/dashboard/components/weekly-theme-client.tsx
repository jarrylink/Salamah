"use client";

import { useState } from "react";
import {
  BookMarked,
  Sparkles,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle2,
  Quote,
  Heart,
  X,
  Compass,
  ArrowRight
} from "lucide-react";

export type WeeklyThemeItem = {
  id: string;
  week_number: number;
  theme_title: string;
  scripture_reference: string | null;
  quote_or_hadith: string | null;
  assembly_focus: string | null;
  core_values: string | null;
  created_at: string;
};

export function WeeklyThemeClient({
  themes: initialThemes,
  currentWeek,
  initialAction,
}: {
  themes: WeeklyThemeItem[];
  currentWeek: number;
  initialAction?: string;
}) {
  const [themes, setThemes] = useState<WeeklyThemeItem[]>(initialThemes);
  const [isModalOpen, setIsModalOpen] = useState(initialAction === "create");
  const [editingTheme, setEditingTheme] = useState<WeeklyThemeItem | null>(null);

  // Form State
  const [weekNumber, setWeekNumber] = useState(1);
  const [themeTitle, setThemeTitle] = useState("");
  const [scriptureRef, setScriptureRef] = useState("");
  const [quoteHadith, setQuoteHadith] = useState("");
  const [assemblyFocus, setAssemblyFocus] = useState("");
  const [coreValues, setCoreValues] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeTheme = themes.find((t) => t.week_number === currentWeek) || themes[0];

  function openCreateModal() {
    setEditingTheme(null);
    setWeekNumber(themes.length + 1);
    setThemeTitle("");
    setScriptureRef("");
    setQuoteHadith("");
    setAssemblyFocus("");
    setCoreValues("");
    setIsModalOpen(true);
  }

  function openEditModal(theme: WeeklyThemeItem) {
    setEditingTheme(theme);
    setWeekNumber(theme.week_number);
    setThemeTitle(theme.theme_title);
    setScriptureRef(theme.scripture_reference || "");
    setQuoteHadith(theme.quote_or_hadith || "");
    setAssemblyFocus(theme.assembly_focus || "");
    setCoreValues(theme.core_values || "");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!themeTitle.trim() || !weekNumber) return;

    setIsSubmitting(true);
    try {
      if (editingTheme) {
        // Update
        const res = await fetch("/api/weekly-theme/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update-theme",
            themeId: editingTheme.id,
            weekNumber,
            themeTitle: themeTitle.trim(),
            scriptureReference: scriptureRef.trim() || undefined,
            quoteOrHadith: quoteHadith.trim() || undefined,
            assemblyFocus: assemblyFocus.trim() || undefined,
            coreValues: coreValues.trim() || undefined,
          }),
        });

        if (!res.ok) throw new Error("Failed to update theme");

        setThemes((prev) =>
          prev.map((t) =>
            t.id === editingTheme.id
              ? {
                  ...t,
                  week_number: weekNumber,
                  theme_title: themeTitle.trim(),
                  scripture_reference: scriptureRef.trim() || null,
                  quote_or_hadith: quoteHadith.trim() || null,
                  assembly_focus: assemblyFocus.trim() || null,
                  core_values: coreValues.trim() || null,
                }
              : t
          )
        );
      } else {
        // Create
        const res = await fetch("/api/weekly-theme/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create-theme",
            weekNumber,
            themeTitle: themeTitle.trim(),
            scriptureReference: scriptureRef.trim() || undefined,
            quoteOrHadith: quoteHadith.trim() || undefined,
            assemblyFocus: assemblyFocus.trim() || undefined,
            coreValues: coreValues.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create theme");

        setThemes((prev) => [
          ...prev,
          {
            id: data.themeId,
            week_number: weekNumber,
            theme_title: themeTitle.trim(),
            scripture_reference: scriptureRef.trim() || null,
            quote_or_hadith: quoteHadith.trim() || null,
            assembly_focus: assemblyFocus.trim() || null,
            core_values: coreValues.trim() || null,
            created_at: new Date().toISOString(),
          },
        ].sort((a, b) => a.week_number - b.week_number));
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving theme");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(themeId: string, title: string) {
    if (!confirm(`Delete theme "${title}"?`)) return;

    try {
      const res = await fetch("/api/weekly-theme/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-theme",
          themeId,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete theme");
      setThemes((prev) => prev.filter((t) => t.id !== themeId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting theme");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
            Total {themes.length} Weekly Themes in Catalogue
          </span>
          <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold">
            Current Week: Week {currentWeek}
          </span>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition shadow-md"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Weekly Theme</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* ACTIVE WEEK THEME HERO BANNER */}
      {/* ======================================================== */}
      {activeTheme && (
        <div className="relative overflow-hidden rounded-3xl border border-[#dfba73]/40 bg-gradient-to-r from-[#031726] via-[#082b42] to-[#031726] p-6 text-white shadow-2xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#dfba73]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfba73]/50 bg-[#dfba73]/20 px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] text-[#dfba73] uppercase">
                <Sparkles className="h-3 w-3" />
                Active Scholastic Week {activeTheme.week_number} Theme
              </span>

              {activeTheme.scripture_reference && (
                <span className="rounded-full bg-slate-950/80 border border-slate-700 px-3 py-0.5 text-xs font-mono text-teal-300">
                  {activeTheme.scripture_reference}
                </span>
              )}
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
              "{activeTheme.theme_title}"
            </h2>

            {activeTheme.quote_or_hadith && (
              <blockquote className="rounded-2xl border border-slate-700/60 bg-[#020d17]/70 p-4 text-xs italic text-slate-200 leading-relaxed max-w-3xl">
                "{activeTheme.quote_or_hadith}"
              </blockquote>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-700/50 text-xs">
              {activeTheme.assembly_focus && (
                <div>
                  <span className="text-slate-400 font-semibold">Assembly Focus: </span>
                  <span className="text-[#dfba73] font-medium">{activeTheme.assembly_focus}</span>
                </div>
              )}

              {activeTheme.core_values && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-semibold">Core Values: </span>
                  {activeTheme.core_values.split(",").map((v, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-teal-500/20 border border-teal-500/30 px-2 py-0.5 text-[10px] font-bold text-teal-300"
                    >
                      {v.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* GRID OF ALL 12 WEEKLY THEMES */}
      {/* ======================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const isCurrent = theme.week_number === currentWeek;
          return (
            <div
              key={theme.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition ${
                isCurrent
                  ? "border-[#dfba73] bg-[#061e30] shadow-xl shadow-[#dfba73]/10"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      isCurrent
                        ? "bg-[#dfba73] text-slate-950 font-extrabold"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    Week {theme.week_number}
                  </span>

                  {isCurrent && (
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                      Current Week
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-base font-bold text-white leading-snug">
                  {theme.theme_title}
                </h3>

                {theme.scripture_reference && (
                  <div className="text-[11px] font-mono text-teal-300">
                    📖 {theme.scripture_reference}
                  </div>
                )}

                {theme.quote_or_hadith && (
                  <p className="text-xs text-slate-300 italic border-l-2 border-[#dfba73]/40 pl-2.5 py-0.5 leading-relaxed line-clamp-3">
                    "{theme.quote_or_hadith}"
                  </p>
                )}

                {theme.assembly_focus && (
                  <div className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">Assembly:</strong> {theme.assembly_focus}
                  </div>
                )}

                {theme.core_values && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {theme.core_values.split(",").map((v, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 font-semibold"
                      >
                        {v.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => openEditModal(theme)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Edit Weekly Theme"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(theme.id, theme.theme_title)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                  title="Delete Theme"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE OR EDIT THEME */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-[#dfba73]/40 bg-[#061b29] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">
                  {editingTheme ? `Edit Theme · Week ${weekNumber}` : "Create Weekly School Theme"}
                </h3>
                <p className="text-xs text-[#dfba73]">Moral Philosophy & Devotional Direction</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Week Number *</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    required
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Theme Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Discipline, Orderliness & Scholastic Ambition"
                    value={themeTitle}
                    onChange={(e) => setThemeTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Scriptural Reference (Quranic / Biblical)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Surah Al-Alaq (96:1-5) · Proverbs 1:7"
                  value={scriptureRef}
                  onChange={(e) => setScriptureRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Moral Quote, Hadith, or Cambridge Philosophy
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Read! In the name of your Lord who created. He taught man by the pen that which he knew not."
                  value={quoteHadith}
                  onChange={(e) => setQuoteHadith(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assembly & Classroom Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arrival punctuality, clean uniform dress code, and classroom order."
                  value={assemblyFocus}
                  onChange={(e) => setAssemblyFocus(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Core Values (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reverence, Self-Discipline, Focus"
                  value={coreValues}
                  onChange={(e) => setCoreValues(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#dfba73] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition shadow-md"
                >
                  {isSubmitting ? "Saving..." : editingTheme ? "Update Theme" : "Create Theme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
