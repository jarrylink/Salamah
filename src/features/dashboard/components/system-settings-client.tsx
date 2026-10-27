"use client";

import { useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  Lock,
  Save,
  Settings,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export function SystemSettingsClient({
  settings,
  sessions,
  terms,
  initialTab,
}: {
  settings: Record<string, unknown>;
  sessions: { id: string; name: string; is_current: boolean }[];
  terms: { id: string; name: string; term_number: number; is_current: boolean; session_id: string; session_name: string }[];
  initialTab: string;
}) {
  const [activeTab, setActiveTab] = useState(
    initialTab === "signatories"
      ? "signatories"
      : initialTab === "profile"
      ? "profile"
      : initialTab === "security"
      ? "security"
      : "academic"
  );

  // Academic Period State
  const currentSession = sessions.find((s) => s.is_current) || sessions[0];
  const currentTerm = terms.find((t) => t.is_current) || terms[0];
  const [selectedSessionId, setSelectedSessionId] = useState(currentSession?.id || "");
  const [selectedTermId, setSelectedTermId] = useState(currentTerm?.id || "");

  // Signatories State
  const initialSignatories = (settings["academic_signatories"] as Record<string, Record<string, string>>) || {};
  const [principalName, setPrincipalName] = useState(initialSignatories?.principal?.name || "Dr. Kabiru Muhammad");
  const [principalTitle, setPrincipalTitle] = useState(initialSignatories?.principal?.title || "Executive Principal");
  const [vpName, setVpName] = useState(initialSignatories?.vicePrincipal?.name || "Mrs. Zainab Abdullahi");
  const [vpTitle, setVpTitle] = useState(initialSignatories?.vicePrincipal?.title || "Vice Principal (Academics)");
  const [registrarName, setRegistrarName] = useState(initialSignatories?.registrar?.name || "Mallam Musa Sani");
  const [registrarTitle, setRegistrarTitle] = useState(initialSignatories?.registrar?.title || "Academic Registrar");

  // Profile State
  const initialProfile = (settings["school_profile"] as Record<string, string>) || {};
  const [schoolName, setSchoolName] = useState(initialProfile.name || "Salamah International School");
  const [motto, setMotto] = useState(initialProfile.motto || "Knowledge, Character & Leadership in Service of Humanity");
  const [address, setAddress] = useState(initialProfile.address || "Plot 1042 Diplomatic Zone, Maitama Extension, Abuja, Nigeria");
  const [email, setEmail] = useState(initialProfile.email || "info@salamah.edu.ng");
  const [phone, setPhone] = useState(initialProfile.phone || "+234 9 461 8000");
  const [rcNumber, setRcNumber] = useState(initialProfile.rcNumber || "RC-1849204");

  // Security Form State
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSaveAcademic(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSessionId: selectedSessionId,
          currentTermId: selectedTermId,
        }),
      });
      if (!res.ok) throw new Error("Failed to update active academic pointers");
      setFeedback("Active academic session and term successfully updated!");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Error saving academic period");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveSignatories(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "academic_signatories",
          value: {
            principal: { name: principalName, title: principalTitle },
            vicePrincipal: { name: vpName, title: vpTitle },
            registrar: { name: registrarName, title: registrarTitle },
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save signatories");
      setFeedback("Official signatories updated and recorded in Neon DB!");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Error saving signatories");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "school_profile",
          value: {
            name: schoolName,
            motto,
            address,
            email,
            phone,
            rcNumber,
            currency: "NGN",
            currencySymbol: "₦",
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save school profile");
      setFeedback("School identity and accreditation parameters saved to Neon DB!");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (adminPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (adminPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/access-management/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "superadmin@salamah.edu.ng",
          password: adminPassword,
          role: "superadmin",
          status: "active",
          firstName: "Ibrahim",
          lastName: "Suleiman",
        }),
      });
      if (!res.ok) throw new Error("Failed to update password");
      setFeedback("Super Admin password successfully updated!");
      setAdminPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Error updating credential");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub-menu Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => { setActiveTab("academic"); setFeedback(null); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "academic"
              ? "bg-teal-500 text-slate-950 shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Academic Sessions & Terms</span>
        </button>

        <button
          onClick={() => { setActiveTab("signatories"); setFeedback(null); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "signatories"
              ? "bg-teal-500 text-slate-950 shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Official Signatories</span>
        </button>

        <button
          onClick={() => { setActiveTab("profile"); setFeedback(null); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "profile"
              ? "bg-teal-500 text-slate-950 shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>School Identity & Location</span>
        </button>

        <button
          onClick={() => { setActiveTab("security"); setFeedback(null); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "security"
              ? "bg-teal-500 text-slate-950 shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Admin Security</span>
        </button>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-300">
          {feedback}
        </div>
      )}

      {/* TAB 1: ACADEMIC POINTERS */}
      {activeTab === "academic" && (
        <form onSubmit={handleSaveAcademic} className="max-w-xl rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-4">
          <h3 className="font-display text-lg font-bold text-white border-b border-slate-800 pb-3">
            Active Academic Year & Term
          </h3>
          <p className="text-xs text-slate-300">
            Designate the live operational session and term for all grade assessments, student registrations, and financial billing.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Academic Session *</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-semibold"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_current ? "★ (Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Academic Term *</label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-semibold"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.session_name}) {t.is_current ? "★ (Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Setting Active..." : "Set Active Academic Period"}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: SIGNATORIES */}
      {activeTab === "signatories" && (
        <form onSubmit={handleSaveSignatories} className="max-w-2xl rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-4">
          <h3 className="font-display text-lg font-bold text-white border-b border-slate-800 pb-3">
            Authorized Institutional Signatories
          </h3>
          <p className="text-xs text-slate-300">
            These dignitaries are automatically printed on official report cards, student transcripts, and letterhead studio dispatches.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Principal Name *</label>
              <input
                type="text"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Principal Title *</label>
              <input
                type="text"
                value={principalTitle}
                onChange={(e) => setPrincipalTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vice Principal Name</label>
              <input
                type="text"
                value={vpName}
                onChange={(e) => setVpName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vice Principal Title</label>
              <input
                type="text"
                value={vpTitle}
                onChange={(e) => setVpTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Registrar Name</label>
              <input
                type="text"
                value={registrarName}
                onChange={(e) => setRegistrarName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Registrar Title</label>
              <input
                type="text"
                value={registrarTitle}
                onChange={(e) => setRegistrarTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Saving..." : "Save Signatories to DB"}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: SCHOOL PROFILE */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="max-w-2xl rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-4">
          <h3 className="font-display text-lg font-bold text-white border-b border-slate-800 pb-3">
            Institutional Identity & Diplomatic Zone Campus
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">School Official Name *</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">RC Corporate Number</label>
              <input
                type="text"
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Motto</label>
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Campus Physical Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hotline Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Saving..." : "Save School Profile"}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: SECURITY */}
      {activeTab === "security" && (
        <form onSubmit={handleSavePassword} className="max-w-md rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-4">
          <h3 className="font-display text-lg font-bold text-white border-b border-slate-800 pb-3">
            Super Admin Authentication & Password
          </h3>
          <p className="text-xs text-slate-300">
            Account: <strong className="text-teal-300">superadmin@salamah.edu.ng</strong>
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">New Password *</label>
            <input
              type="password"
              required
              placeholder="At least 8 characters"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400 disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              <span>{isSaving ? "Updating..." : "Update Super Admin Password"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
