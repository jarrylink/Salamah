"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Calendar, ChevronDown, Layers } from "lucide-react";

type Session = { id: string; name: string };
type Term = { id: string; sessionId: string; name: string };

export function AcademicContextSwitcher({
  sessions,
  terms,
  sessionId,
  termId,
}: {
  sessions: Session[];
  terms: Term[];
  sessionId?: string;
  termId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [selection, setSelection] = useState({ sessionId, termId });

  // Ensure sessions start from 2026/2027 upwards
  const sortedSessions = [...sessions].sort((a, b) => a.name.localeCompare(b.name));

  const update = (key: "sessionId" | "termId", value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    if (key === "sessionId") {
      const firstTerm = terms.find((term) => term.sessionId === value);
      if (firstTerm) {
        next.set("termId", firstTerm.id);
      } else {
        next.delete("termId");
      }
    }
    const preference = {
      sessionId: next.get("sessionId") ?? selection.sessionId,
      termId: next.get("termId") ?? selection.termId,
    };
    setSelection(preference);
    if (preference.sessionId && preference.termId) {
      document.cookie = `salamah_academic_context=${encodeURIComponent(
        JSON.stringify(preference)
      )}; Path=/; Max-Age=2592000; SameSite=Lax`;
    }
    router.replace(`${pathname}?${next.toString()}`);
  };

  const selectedSessionId = params.get("sessionId") ?? selection.sessionId;
  const selectedTermId = params.get("termId") ?? selection.termId;
  const activeSession = selectedSessionId;
  const availableTerms = terms.filter((term) => term.sessionId === activeSession);

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl border border-[#c5a059]/30 bg-[#041a29]/90 px-3 py-1.5 shadow-sm backdrop-blur-xs"
      aria-label="Academic context selector"
    >
      {/* Session Selector */}
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-[#dfba73] shrink-0" />
        <span className="text-[9.5px] font-extrabold tracking-[0.14em] text-[#c5a059] uppercase hidden sm:inline">
          Session
        </span>
        <div className="relative">
          <select
            value={activeSession ?? ""}
            onChange={(event) => update("sessionId", event.target.value)}
            className="appearance-none rounded-lg border border-[#c5a059]/40 bg-[#072133] py-1 pl-2.5 pr-7 text-xs font-semibold text-amber-100 shadow-inner hover:border-[#dfba73] focus:border-[#dfba73] focus:outline-none cursor-pointer transition"
          >
            <option value="" disabled className="bg-[#041a29] text-slate-400">
              Select Session
            </option>
            {sortedSessions.map((session) => (
              <option
                key={session.id}
                value={session.id}
                className="bg-[#072133] text-slate-100 py-1"
              >
                {session.name} {session.name === "2026/2027" ? "★ Current" : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#dfba73]" />
        </div>
      </div>

      <span className="text-slate-600 hidden sm:inline">•</span>

      {/* Term Selector */}
      <div className="flex items-center gap-1.5">
        <Layers className="h-3.5 w-3.5 text-[#1e8c7a] shrink-0" />
        <span className="text-[9.5px] font-extrabold tracking-[0.14em] text-teal-300 uppercase hidden sm:inline">
          Term
        </span>
        <div className="relative">
          <select
            value={selectedTermId ?? ""}
            onChange={(event) => update("termId", event.target.value)}
            className="appearance-none rounded-lg border border-[#1e8c7a]/40 bg-[#072133] py-1 pl-2.5 pr-7 text-xs font-semibold text-teal-100 shadow-inner hover:border-teal-400 focus:border-teal-400 focus:outline-none cursor-pointer transition"
          >
            <option value="" disabled className="bg-[#041a29] text-slate-400">
              Select Term
            </option>
            {availableTerms.map((term) => (
              <option
                key={term.id}
                value={term.id}
                className="bg-[#072133] text-slate-100 py-1"
              >
                {term.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-teal-300" />
        </div>
      </div>
    </div>
  );
}
