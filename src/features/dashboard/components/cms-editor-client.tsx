"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileCode2,
  Globe,
  Layers,
  Save,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { CmsSection } from "@/lib/services/cms";

const sectionTabs = [
  { key: "hero", label: "Hero & Motto" },
  { key: "about", label: "About & Chairman" },
  { key: "curriculum", label: "Curriculum & Wings" },
  { key: "programs", label: "Integrated Programs" },
  { key: "proprietress", label: "Proprietress Directorate" },
  { key: "leadership", label: "Executive Leadership" },
  { key: "facilities", label: "Facilities & Infrastructure" },
  { key: "fees", label: "Fees & Investment" },
  { key: "testimonials", label: "Testimonials & Voices" },
  { key: "contact", label: "Contact & Information" },
];

export function CmsEditorClient({
  sections,
  initialSectionKey,
}: {
  sections: Record<string, CmsSection>;
  initialSectionKey: string;
}) {
  const [activeTab, setActiveTab] = useState(initialSectionKey);
  const currentSection = sections[activeTab] || {
    id: "",
    sectionKey: activeTab,
    title: "",
    subtitle: "",
    content: {},
    isActive: true,
    updatedAt: "",
  };

  const [title, setTitle] = useState(currentSection.title || "");
  const [subtitle, setSubtitle] = useState(currentSection.subtitle || "");
  const [contentJson, setContentJson] = useState(
    JSON.stringify(currentSection.content || {}, null, 2)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Switch tab
  function handleTabChange(tabKey: string) {
    setActiveTab(tabKey);
    const sec = sections[tabKey];
    if (sec) {
      setTitle(sec.title || "");
      setSubtitle(sec.subtitle || "");
      setContentJson(JSON.stringify(sec.content || {}, null, 2));
    } else {
      setTitle("");
      setSubtitle("");
      setContentJson("{}");
    }
    setFeedback(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    let parsedContent = {};
    try {
      parsedContent = JSON.parse(contentJson);
    } catch {
      alert("Invalid JSON format in the content configuration field.");
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/cms/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionKey: activeTab,
          title,
          subtitle,
          content: parsedContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update section");
      setFeedback("Section successfully updated and stored in Neon DB!");
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Error saving section");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Sub-Menu Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-[#041a27] p-2">
        {sectionTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === tab.key
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor Form */}
      <form
        onSubmit={handleSave}
        className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300 uppercase">
                Section: {activeTab}
              </span>
              <h3 className="font-display text-xl font-bold text-white">
                Edit {sectionTabs.find((t) => t.key === activeTab)?.label}
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Database Table: <code className="text-teal-300">cms_sections</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Preview Live Site</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-teal-400 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Saving to DB..." : "Save Changes to DB"}</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-semibold ${
              feedback.includes("success")
                ? "border border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                : "border border-rose-500/40 bg-rose-950/40 text-rose-300"
            }`}
          >
            {feedback}
          </div>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Section Title / Main Headline
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Section Subtitle / Narrative
            </label>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xs text-white focus:border-teal-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Structured Content Attributes (JSON Configuration)
              </label>
              <span className="text-[11px] text-teal-400">
                Stored in PostgreSQL jsonb column
              </span>
            </div>
            <textarea
              rows={14}
              value={contentJson}
              onChange={(e) => setContentJson(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-700 bg-[#031520] p-4 font-mono text-xs text-teal-300 focus:border-teal-500 focus:outline-none leading-relaxed"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
