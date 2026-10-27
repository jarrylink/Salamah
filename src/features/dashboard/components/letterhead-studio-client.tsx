"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Archive,
  Award,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileText,
  PenTool,
  Printer,
  Save,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import { brand } from "@/config/brand";
import type { LetterheadDoc } from "@/lib/services/letterhead";

export function LetterheadStudioClient({
  archivedLetters: initialLetters,
  initialTab,
}: {
  archivedLetters: LetterheadDoc[];
  initialTab: string;
}) {
  const [activeTab, setActiveTab] = useState(
    initialTab === "archive" ? "archive" : initialTab === "preview" ? "preview" : "composer"
  );
  const [archivedLetters, setArchivedLetters] = useState<LetterheadDoc[]>(initialLetters);

  // Form State
  const [referenceNumber, setReferenceNumber] = useState(
    `SIS/ADM/2026/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [letterDate, setLetterDate] = useState(new Date().toISOString().split("T")[0]);
  const [senderTitle, setSenderTitle] = useState("Office of the Executive Principal");
  const [senderOffice, setSenderOffice] = useState("Directorate of Academic Admissions & Student Affairs");
  const [recipientName, setRecipientName] = useState("Mallam Farouk & Hajiya Maryam Bello");
  const [recipientAddress, setRecipientAddress] = useState("Plot 42, Aso Drive, Asokoro, Abuja, Nigeria");
  const [salutation, setSalutation] = useState("Respected Parents / Guardians,");
  const [heading, setHeading] = useState("PROVISIONAL ADMISSION OFFER & ENROLMENT INTO 2026/2027 ACADEMIC SESSION");
  const [content, setContent] = useState(`Following your child's commendable performance in our competitive entrance assessment and subsequent family interview, the Admissions Committee has recommended, and the Board of Governors has approved, the offer of provisional admission into Salamah International School for the 2026/2027 Academic Session.

At Salamah, we consider the education of every young scholar as a sacred trust. Our rigorous Cambridge British and Nigerian curriculum, world-class science laboratories, Olympic sports pavilion, and deeply grounded moral guidance are designed to help your child realize their highest potential.

Kindly note the following key milestones:
1. Acceptance confirmation and payment of acceptance deposit must be finalized within fourteen (14) days.
2. Orientation for new scholars and boarding induction will commence on Sunday, 31st August 2026.
3. Complete boarding kits, uniform fittings, and health clearances are to be submitted to the School Matron during registration.

We congratulate your family and warmly welcome you to our distinguished school community.`);
  const [closure, setClosure] = useState("Yours faithfully,");
  const [signatoryName, setSignatoryName] = useState("Dr. Kabiru Muhammad");
  const [signatoryRole, setSignatoryRole] = useState("Executive Principal & Director of Studies");
  const [signatureUrl, setSignatureUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Handle Signature File Upload
  function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSignatureUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSaveLetter(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/letterhead/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceNumber,
          letterDate,
          senderTitle,
          senderOffice,
          recipientName,
          recipientAddress,
          salutation,
          heading,
          content,
          closure,
          signatoryName,
          signatoryRole,
          signatureUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save letter");
      setFeedback("Letter successfully issued and archived in Neon DB!");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Error saving letter");
    } finally {
      setIsSaving(false);
    }
  }

  function loadArchivedLetter(doc: LetterheadDoc) {
    setReferenceNumber(doc.reference_number);
    setLetterDate(doc.letter_date);
    setSenderTitle(doc.sender_title);
    setSenderOffice(doc.sender_office);
    setRecipientName(doc.recipient_name);
    setRecipientAddress(doc.recipient_address || "");
    setSalutation(doc.salutation);
    setHeading(doc.heading);
    setContent(doc.content);
    setClosure(doc.closure);
    setSignatoryName(doc.signatory_name);
    setSignatoryRole(doc.signatory_role);
    setSignatureUrl(doc.signature_url || "");
    setActiveTab("composer");
  }

  return (
    <div className="space-y-6">
      {/* Sub-menu Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("composer")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "composer"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <PenTool className="h-4 w-4" />
            <span>Letterhead Composer</span>
          </button>

          <button
            onClick={() => setActiveTab("archive")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "archive"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Archive className="h-4 w-4" />
            <span>Document Archive ({archivedLetters.length})</span>
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Export Letterhead PDF</span>
        </button>
      </div>

      {activeTab === "composer" && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* LEFT: Composer Controls */}
          <form
            onSubmit={handleSaveLetter}
            className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-4"
          >
            <h3 className="font-display text-lg font-bold text-white border-b border-slate-800 pb-3">
              Correspondence Parameters
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Official Ref Number *
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Letter Date *
                </label>
                <input
                  type="date"
                  required
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Sender Title *
                </label>
                <input
                  type="text"
                  required
                  value={senderTitle}
                  onChange={(e) => setSenderTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Sender Office / Directorate
                </label>
                <input
                  type="text"
                  value={senderOffice}
                  onChange={(e) => setSenderOffice(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Salutation *
                </label>
                <input
                  type="text"
                  required
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Recipient Address (Optional)
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Heading / Subject Line *
              </label>
              <input
                type="text"
                required
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Letter Body Content *
              </label>
              <textarea
                rows={7}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-teal-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Valediction / Closure *
                </label>
                <input
                  type="text"
                  required
                  value={closure}
                  onChange={(e) => setClosure(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Signatory Name *
                </label>
                <input
                  type="text"
                  required
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Signatory Role *
                </label>
                <input
                  type="text"
                  required
                  value={signatoryRole}
                  onChange={(e) => setSignatoryRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Signature Upload */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Upload Authorized Signature File (PNG / JPG / Signature Image)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 rounded-xl border border-teal-500/40 bg-teal-950/40 px-3 py-2 text-xs font-semibold text-teal-300 cursor-pointer hover:bg-teal-900/40">
                  <Upload className="h-4 w-4" />
                  <span>Choose Signature File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </label>
                {signatureUrl && (
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    ✓ Signature Loaded
                  </span>
                )}
              </div>
            </div>

            {feedback && (
              <p className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-300">
                {feedback}
              </p>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Saving to Archive..." : "Save & Archive Letter to Database"}</span>
            </button>
          </form>

          {/* RIGHT: LIVE READY-MADE NIGERIAN SCHOOL LETTERHEAD DEMO */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 px-2">
              <span className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">
                Official Ready-Made Letterhead Demo
              </span>
              <span className="text-[10px] text-slate-400">
                Format: Nigerian Elite Academy Official Stationery
              </span>
            </div>

            {/* Simulated A4 Letterhead Sheet */}
            <div
              id="official-letterhead-sheet"
              className="relative mx-auto rounded-xl bg-white p-8 text-slate-900 shadow-2xl min-h-[750px] flex flex-col font-serif"
            >
              {/* Top Heraldic Letterhead Header */}
              <div className="flex items-center justify-between border-b-2 border-[#043e52] pb-4">
                <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
                  <Image src={brand.assets.logo} alt="Salamah" width={64} height={64} className="h-full w-auto object-contain" />
                </div>

                <div className="text-center flex-1 px-4">
                  <h2 className="font-display text-2xl font-black tracking-tight text-[#03283a] uppercase">
                    Salamah International School
                  </h2>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-[#1e8c7a] uppercase font-sans">
                    Knowledge • Character • Leadership in Service of Humanity
                  </p>
                  <p className="mt-1 text-[9px] text-slate-600 font-sans">
                    Plot 1042 Diplomatic Zone, Maitama Extension, Abuja, FCT, Nigeria • RC: 1849204
                  </p>
                  <p className="text-[9px] text-slate-600 font-sans">
                    Tel: +234 9 461 8000 • Email: info@salamah.edu.ng • Web: www.salamah.edu.ng
                  </p>
                </div>

                {/* Cambridge Accreditation Stamp */}
                <div className="text-right font-sans text-[8px] text-slate-500 uppercase tracking-wider hidden sm:block">
                  <p className="font-bold text-[#043e52]">Cambridge Int&apos;l</p>
                  <p>School NG482</p>
                  <p className="mt-1 font-bold text-amber-700">WAEC & NECO</p>
                  <p>Accredited</p>
                </div>
              </div>

              {/* Watermark Crest */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
                <div className="relative h-80 w-80">
                  <Image src={brand.assets.logo} alt="" fill sizes="320px" className="object-contain" />
                </div>
              </div>

              {/* Ref & Date Bar */}
              <div className="mt-4 flex justify-between font-sans text-[11px] text-slate-700 font-medium">
                <p><strong>Our Ref:</strong> <span className="font-mono">{referenceNumber}</span></p>
                <p><strong>Date:</strong> {letterDate}</p>
              </div>

              {/* Recipient */}
              <div className="mt-4 text-[12px] leading-tight font-sans">
                <p className="font-bold text-[#03283a]">{recipientName}</p>
                {recipientAddress && <p className="text-slate-600 text-[11px] mt-0.5">{recipientAddress}</p>}
              </div>

              {/* Salutation */}
              <p className="mt-4 text-[12px] font-sans font-medium">{salutation}</p>

              {/* Heading */}
              <div className="mt-3 border-b border-slate-300 pb-1">
                <h4 className="text-center font-sans font-black text-xs uppercase tracking-wide text-[#03283a]">
                  {heading}
                </h4>
              </div>

              {/* Content Body */}
              <div className="mt-4 text-[11.5px] leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                {content}
              </div>

              {/* Closure & Signatory */}
              <div className="mt-8 font-sans text-[12px]">
                <p>{closure}</p>

                {/* Signature Preview */}
                <div className="mt-2 h-14 w-36 relative">
                  {signatureUrl ? (
                    <img
                      src={signatureUrl}
                      alt="Authorized Signature"
                      className="h-full object-contain"
                    />
                  ) : (
                    <div className="h-full border-b border-dashed border-slate-400 flex items-end">
                      <span className="text-[10px] text-slate-400 italic">Dr. K. Muhammad (Ph.D)</span>
                    </div>
                  )}
                </div>

                <p className="mt-2 font-bold text-[#03283a]">{signatoryName}</p>
                <p className="text-[10px] text-slate-600">{signatoryRole}</p>
                <p className="text-[9px] text-[#1e8c7a] font-semibold uppercase">{senderOffice}</p>
              </div>

              {/* Official Seal Graphic */}
              <div className="mt-auto pt-6 border-t border-slate-200 flex items-center justify-between text-[9px] font-sans text-slate-500">
                <span>OFFICIAL SEAL • SALAMAH INTERNATIONAL SCHOOL</span>
                <span>AUTHENTICITY VERIFIED • DOCUMENT ID: {referenceNumber}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE TAB */}
      {activeTab === "archive" && (
        <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl">
          <h3 className="font-display text-lg font-bold text-white mb-4">
            Archived Letterhead Correspondence ({archivedLetters.length})
          </h3>

          <div className="space-y-3">
            {archivedLetters.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-teal-500/40"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-mono font-bold text-teal-300">
                      {doc.reference_number}
                    </span>
                    <span className="text-xs text-slate-400">{doc.letter_date}</span>
                  </div>
                  <h4 className="mt-1 font-bold text-white text-sm">{doc.heading}</h4>
                  <p className="text-xs text-slate-300">
                    Recipient: {doc.recipient_name} • Signatory: {doc.signatory_name}
                  </p>
                </div>

                <button
                  onClick={() => loadArchivedLetter(doc)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:border-teal-500/40 hover:text-teal-300"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Inspect & Load to Composer</span>
                </button>
              </div>
            ))}

            {archivedLetters.length === 0 && (
              <p className="text-slate-400 text-xs italic">No letters issued yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
