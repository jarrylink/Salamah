"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Coins,
  Eye,
  FileCheck,
  FileSpreadsheet,
  Mail,
  Phone,
  Save,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { formatNaira } from "@/lib/date-utils";

export type ApplicationItem = {
  id: string;
  application_number: string;
  guardian_name: string;
  guardian_email: string;
  guardian_phone: string;
  guardian_address: string;
  guardian_occupation: string | null;
  number_of_children: number;
  fee_per_child_kobo: number;
  total_fee_kobo: number;
  payment_status: string;
  payment_reference: string;
  payment_method: string;
  status: string;
  created_at: string;
  children: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    intendedClass: string;
    previousSchool: string | null;
    medicalInfo: string | null;
    status: string;
  }[];
};

export function ApplicationsManagerClient({
  applications: initialApplications,
  initialFeeKobo,
}: {
  applications: ApplicationItem[];
  initialFeeKobo: number;
}) {
  const [applications, setApplications] = useState<ApplicationItem[]>(initialApplications);
  const [activeTab, setActiveTab] = useState<"applications" | "pricing">("applications");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  // Pricing Form State
  const [feeInNaira, setFeeInNaira] = useState((initialFeeKobo / 100).toString());
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingFeedback, setPricingFeedback] = useState<string | null>(null);

  // Admission Action State
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const filtered = applications.filter((app) => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.application_number.toLowerCase().includes(q) ||
        app.guardian_name.toLowerCase().includes(q) ||
        app.guardian_email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalRevenueKobo = applications.reduce((acc, a) => acc + (a.total_fee_kobo || 0), 0);
  const admittedCount = applications.filter((a) => a.status === "admitted").length;
  const pendingCount = applications.filter((a) => a.status === "submitted" || a.status === "under_review").length;

  async function handleUpdateStatus(applicationId: string, newStatus: string) {
    try {
      const res = await fetch("/api/applications/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-status", applicationId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
      );
      if (selectedApp && selectedApp.id === applicationId) {
        setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating status");
    }
  }

  async function handleAdmitToDatabase(applicationId: string) {
    setIsAdmitting(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/applications/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admit", applicationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to admit application");
      setActionFeedback("Successfully admitted! Guardian and student records created in Neon DB.");
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: "admitted" } : a))
      );
      if (selectedApp && selectedApp.id === applicationId) {
        setSelectedApp((prev) => (prev ? { ...prev, status: "admitted" } : null));
      }
    } catch (err: unknown) {
      setActionFeedback(err instanceof Error ? err.message : "Error admitting application");
    } finally {
      setIsAdmitting(false);
    }
  }

  async function handleSavePricing(e: React.FormEvent) {
    e.preventDefault();
    const naira = parseFloat(feeInNaira);
    if (isNaN(naira) || naira <= 0) {
      alert("Please enter a valid positive Naira amount.");
      return;
    }
    setIsSavingPricing(true);
    setPricingFeedback(null);
    try {
      const kobo = Math.round(naira * 100);
      const res = await fetch("/api/applications/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-pricing", applicationFeeKobo: kobo }),
      });
      if (!res.ok) throw new Error("Failed to save pricing");
      setPricingFeedback("Application fee pricing updated successfully in database!");
      setTimeout(() => setPricingFeedback(null), 3000);
    } catch (err: unknown) {
      setPricingFeedback(err instanceof Error ? err.message : "Error saving fee");
    } finally {
      setIsSavingPricing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-[#092233] p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Total Applications</p>
          <p className="mt-2 font-display text-3xl font-bold text-white">{applications.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#092233] p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Application Fees Collected</p>
          <p className="mt-2 font-display text-3xl font-bold text-teal-300" suppressHydrationWarning>
            ₦{formatNaira(totalRevenueKobo / 100)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#092233] p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Admitted to School</p>
          <p className="mt-2 font-display text-3xl font-bold text-emerald-400">{admittedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#092233] p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Under Review</p>
          <p className="mt-2 font-display text-3xl font-bold text-amber-400">{pendingCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("applications")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "applications"
              ? "bg-teal-500 text-slate-950 shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Received Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab("pricing")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "pricing"
              ? "bg-teal-500 text-slate-950 shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Application Form Pricing & Configuration
        </button>
      </div>

      {/* TAB 1: APPLICATIONS LIST */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#041a27] p-3">
            <div className="flex flex-wrap gap-2">
              {(["all", "submitted", "under_review", "admitted", "rejected"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                    statusFilter === st
                      ? "bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {st.replaceAll("_", " ")}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by app #, guardian name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-9 pr-3 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#092233] shadow-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">App Number</th>
                  <th className="p-4">Guardian / Parent</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4 text-center">Children</th>
                  <th className="p-4 text-center">Total Fee</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4 font-mono font-bold text-teal-300">
                      {app.application_number}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-white">{app.guardian_name}</p>
                      {app.guardian_occupation && (
                        <p className="text-[11px] text-slate-400">{app.guardian_occupation}</p>
                      )}
                    </td>
                    <td className="p-4 text-slate-300">
                      <p>{app.guardian_email}</p>
                      <p className="text-[11px] text-slate-400">{app.guardian_phone}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-bold text-white">
                        {app.number_of_children}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-semibold text-emerald-400" suppressHydrationWarning>
                      ₦{formatNaira(app.total_fee_kobo / 100)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                          app.status === "admitted"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : app.status === "rejected"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {app.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:border-teal-500/40 hover:text-teal-300"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No admission applications found matching the criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRICING & CONFIGURATION */}
      {activeTab === "pricing" && (
        <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl sm:p-8">
          <div className="max-w-xl">
            <h3 className="font-display text-xl font-bold text-white">
              Application Form Fee Settings
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              Set the price per child for admission enrollment forms. When parents submit the registration form, the system automatically multiplies this price by the number of children added.
            </p>

            <form onSubmit={handleSavePricing} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Application Fee per Child (₦ Naira)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-teal-400">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={feeInNaira}
                    onChange={(e) => setFeeInNaira(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-base font-bold text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {pricingFeedback && (
                <p className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-300">
                  {pricingFeedback}
                </p>
              )}

              <button
                type="submit"
                disabled={isSavingPricing}
                className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingPricing ? "Saving Fee..." : "Save Pricing Configuration"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL & ADMIT MODAL */}
      {selectedApp && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApp(null);
          }}
        >
          <div className="relative my-auto flex max-h-[88vh] w-full max-w-3xl flex-col rounded-3xl border border-teal-500/40 bg-[#092233] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-5 sm:p-6 shrink-0 bg-[#071d2b]">
              <div>
                <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300">
                  Application ID: {selectedApp.application_number}
                </span>
                <h3 className="mt-1 font-display text-xl font-bold text-white">
                  Guardian &amp; Children Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 salamah-scrollbar">
              {/* Guardian Info Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">
                  Guardian Information
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="text-slate-400">Full Name:</span>
                    <p className="font-semibold text-white">{selectedApp.guardian_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Occupation:</span>
                    <p className="font-semibold text-white">{selectedApp.guardian_occupation || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Email Address:</span>
                    <p className="font-semibold text-white">{selectedApp.guardian_email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Phone Number:</span>
                    <p className="font-semibold text-white">{selectedApp.guardian_phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Residential Address:</span>
                    <p className="font-semibold text-white">{selectedApp.guardian_address}</p>
                  </div>
                </div>
              </div>

              {/* Children List */}
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase mb-3">
                  Registered Children ({selectedApp.children?.length || 0})
                </p>
                <div className="space-y-3">
                  {selectedApp.children?.map((child, idx) => (
                    <div
                      key={child.id || idx}
                      className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm">
                          {child.firstName} {child.middleName ? `${child.middleName} ` : ""}{child.lastName}
                        </h4>
                        <span className="rounded-md bg-teal-500/20 px-2 py-0.5 font-bold text-teal-300">
                          {child.intendedClass}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3 text-slate-300">
                        <p><span className="text-slate-500">Gender:</span> {child.gender}</p>
                        <p><span className="text-slate-500">Date of Birth:</span> {child.dateOfBirth}</p>
                        <p><span className="text-slate-500">Previous School:</span> {child.previousSchool || "None"}</p>
                      </div>
                      {child.medicalInfo && (
                        <p className="mt-2 rounded-lg bg-slate-950 p-2 text-slate-400">
                          <span className="font-semibold text-slate-300">Medical Notes:</span> {child.medicalInfo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Payment Reference: </span>
                  <code className="text-teal-300 font-mono">{selectedApp.payment_reference}</code>
                </div>
                <div>
                  <span className="text-slate-400">Total Fee: </span>
                  <span className="font-bold text-emerald-400 text-sm" suppressHydrationWarning>
                    ₦{formatNaira(selectedApp.total_fee_kobo / 100)} (Paid)
                  </span>
                </div>
              </div>

              {actionFeedback && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-300">
                  {actionFeedback}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 p-5 bg-[#071c2a]">
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedApp.id, "under_review")}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Mark Under Review
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApp.id, "rejected")}
                  className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/40"
                >
                  Reject Application
                </button>
              </div>

              <button
                onClick={() => handleAdmitToDatabase(selectedApp.id)}
                disabled={isAdmitting || selectedApp.status === "admitted"}
                className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400 disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4" />
                <span>
                  {selectedApp.status === "admitted"
                    ? "Already Admitted & Enrolled"
                    : isAdmitting
                    ? "Enrolling..."
                    : "Admit & Register in School DB"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
