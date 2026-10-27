"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Award,
  CheckCircle2,
  FileSignature,
  Mail,
  Phone,
  Save,
  Sparkles,
  User,
  GraduationCap,
  ShieldCheck,
  Building,
  Image as ImageIcon,
  Stamp,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export type SectionHeadItem = {
  id: string;
  section_id: string | null;
  section_code: string;
  title: string;
  full_name: string;
  qualification: string | null;
  avatar_url: string | null;
  signature_url: string | null;
  stamp_url: string | null;
  default_comment: string | null;
  phone: string | null;
  email: string | null;
  section_name?: string | null;
};

export function SectionHeadsClient({
  initialSectionHeads,
}: {
  initialSectionHeads: SectionHeadItem[];
}) {
  const [sectionHeads, setSectionHeads] = useState<SectionHeadItem[]>(initialSectionHeads);
  const [activeCode, setActiveCode] = useState<string>("NURSERY");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeHead = sectionHeads.find((h) => h.section_code === activeCode) || sectionHeads[0];

  // Editable Form State
  const [title, setTitle] = useState(activeHead?.title || "");
  const [fullName, setFullName] = useState(activeHead?.full_name || "");
  const [qualification, setQualification] = useState(activeHead?.qualification || "");
  const [avatarUrl, setAvatarUrl] = useState(activeHead?.avatar_url || "");
  const [signatureUrl, setSignatureUrl] = useState(activeHead?.signature_url || "");
  const [stampUrl, setStampUrl] = useState(activeHead?.stamp_url || "");
  const [defaultComment, setDefaultComment] = useState(activeHead?.default_comment || "");
  const [phone, setPhone] = useState(activeHead?.phone || "");
  const [email, setEmail] = useState(activeHead?.email || "");

  function handleSwitchHead(code: string) {
    setActiveCode(code);
    const target = sectionHeads.find((h) => h.section_code === code);
    if (target) {
      setTitle(target.title || "");
      setFullName(target.full_name || "");
      setQualification(target.qualification || "");
      setAvatarUrl(target.avatar_url || "");
      setSignatureUrl(target.signature_url || "");
      setStampUrl(target.stamp_url || "");
      setDefaultComment(target.default_comment || "");
      setPhone(target.phone || "");
      setEmail(target.email || "");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!activeHead) return;
    setIsSaving(true);
    setToastMessage(null);

    try {
      const res = await fetch("/api/section-heads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeHead.id,
          section_code: activeHead.section_code,
          title,
          full_name: fullName,
          qualification,
          avatar_url: avatarUrl,
          signature_url: signatureUrl,
          stamp_url: stampUrl,
          default_comment: defaultComment,
          phone,
          email,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update section head");
      }

      const data = await res.json();
      setSectionHeads((prev) =>
        prev.map((h) => (h.id === activeHead.id ? data.sectionHead : h))
      );
      setToastMessage(data.message || "Section head personalization saved successfully.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setIsSaving(false);
    }
  }

  const commentSuggestions: Record<string, string[]> = {
    NURSERY: [
      "A joyful, inquisitive, and blossoming child who interacts warmly with peers and engages enthusiastically in foundational literacy and numeracy activities.",
      "Shows tremendous developmental growth in fine motor coordination, social interactions, and auditory comprehension. Promoted happily to the next stage.",
      "Very gentle, obedient, and receptive to classroom guidance. Demonstrates delightful curiosity during sensorial and creative play.",
    ],
    PRIMARY: [
      "Demonstrates commendable intellectual curiosity, disciplined deportment, and consistent academic diligence. Promoted in good standing.",
      "An upright, conscientious pupil who has sustained high scholarly standards and harmonious relationships across the primary school.",
      "Shows promising potential across quantitative and verbal areas. Advised to cultivate more active engagement in daily reading and assignments.",
    ],
    SECONDARY: [
      "An exemplary academic showing sterling character, critical analytical thinking, and virtuous citizenship. Promoted with distinction.",
      "Commended for sustained intellectual dedication and disciplined comportment across all subjects throughout the academic session.",
      "Promoted on trial. Advised to focus diligently on foundational continuous assessments and rigorous personal study routines.",
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfba73]/40 bg-[#dfba73]/10 px-3 py-1 text-xs font-semibold text-[#dfba73]">
            <Award className="h-3.5 w-3.5" />
            <span>Section Heads & Leadership Personalization</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            School Section Managers
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Configure authoritative names, photographs, official signatures, and endorsement comments for the Head of Nursery, Head Teacher, and Principal. These dynamically populate official report cards and administrative memos.
          </p>
        </div>

        {/* Section Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          {[
            { code: "NURSERY", label: "Head of Nursery", wing: "Early Years" },
            { code: "PRIMARY", label: "Head Teacher", wing: "Primary (Grades 1-6)" },
            { code: "SECONDARY", label: "Principal", wing: "College (JSS-SS)" },
          ].map((tab) => {
            const isSelected = activeCode === tab.code;
            return (
              <button
                key={tab.code}
                onClick={() => handleSwitchHead(tab.code)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#dfba73] text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/50 p-4 text-xs font-semibold text-emerald-300 shadow-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Form and Live Document Mockup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5 rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                {activeHead?.section_code} SECTION
              </span>
              <h2 className="text-lg font-bold text-white">{title || "Section Head Profile"}</h2>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#dfba73] to-[#c5a059] px-5 py-2.5 text-xs font-bold text-slate-950 shadow hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Official Title / Designation</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Head of Nursery, Principal"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Full Name (with Titles)</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Al-Mansur Bello, Ph.D"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Qualifications & Accreditations</label>
            <input
              type="text"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="e.g. M.Ed Curriculum Studies & Primary Pedagogy, TRCN"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
            />
          </div>

          {/* Media Links Grid: Photo, Signature, Stamp */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5">
                <span>Passport / Portrait Photograph URL</span>
                <span className="text-[10px] text-slate-400">High-res square or portrait image</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5">
                <span>Official Digital Signature URL / SVG</span>
                <span className="text-[10px] text-slate-400">Transparent PNG or SVG signature</span>
              </label>
              <input
                type="url"
                value={signatureUrl}
                onChange={(e) => setSignatureUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5">
                <span>Section Seal / Official Stamp URL (Optional)</span>
                <span className="text-[10px] text-slate-400">Embossed circular seal</span>
              </label>
              <input
                type="url"
                value={stampUrl}
                onChange={(e) => setStampUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Official Direct Line</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 803 000 0000"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Official Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@salamah.sch.ng"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
              />
            </div>
          </div>

          {/* Default Comment / Commendation Template */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Default Section Appraisal Remark (Pre-fills Student Report Cards)
              </label>
              <span className="text-[10px] text-teal-400 font-semibold">Auto-suggest presets</span>
            </div>
            <textarea
              rows={3}
              value={defaultComment}
              onChange={(e) => setDefaultComment(e.target.value)}
              placeholder="Enter official remark that pre-populates terminal reports for this section..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none leading-relaxed"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(commentSuggestions[activeCode] || []).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDefaultComment(preset)}
                  className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-700 transition text-left"
                >
                  &ldquo;{preset.slice(0, 45)}...&rdquo;
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Live Document Preview Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-[#061826] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-[#dfba73] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Live Report Card Endorsement Preview</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {activeHead?.section_code} Wing
              </span>
            </div>

            {/* Simulated White Paper Endorsement Box */}
            <div className="rounded-2xl border-2 border-slate-300 bg-white p-5 text-slate-900 shadow-sm space-y-4">
              <div className="flex items-center gap-3.5 border-b border-slate-200 pb-4">
                <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-100 shadow-xs">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-500 font-bold text-xs">
                      PHOTO
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#092233] block">
                    {title || "Section Head"}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {fullName || "Officer Full Name"}
                  </h3>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {qualification || "Qualifications & TRCN Number"}
                  </p>
                </div>
              </div>

              {/* Endorsement Remark */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Official Section Commendation:
                </span>
                <p className="text-xs italic text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  &ldquo;{defaultComment || "Enter default comment in form to preview..."}&rdquo;
                </p>
              </div>

              {/* Signature & Date Row */}
              <div className="flex items-end justify-between pt-2 border-t border-slate-200">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                    Institutional Signature:
                  </span>
                  <div className="h-10 w-28 flex items-center justify-center">
                    {signatureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={signatureUrl} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="font-serif italic text-sm text-slate-700 border-b border-dashed border-slate-400">
                        {fullName || "Signed Digitally"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                    Official Endorsement
                  </span>
                  <span className="inline-block rounded border border-emerald-600 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    APPROVED & SEALED
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Helper Tips */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-teal-300 font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>How This Works</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When generating terminal report cards for a classroom, the system checks whether the class belongs to the Nursery, Primary, or Secondary section, and automatically attaches this manager&apos;s name, photo, signature, and appraisal remarks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
