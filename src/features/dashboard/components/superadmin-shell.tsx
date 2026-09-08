"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Bell, FileText, GraduationCap, LayoutDashboard, Settings2, ShieldCheck, UsersRound } from "lucide-react";

import { brand } from "@/config/brand";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "People & access", href: "/dashboard/people-access", icon: UsersRound },
  { label: "Academic structure", href: "/dashboard/academic-structure", icon: GraduationCap },
  { label: "School settings", href: "/dashboard/school-settings", icon: Settings2 },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
] as const;

export function SuperadminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  return <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] lg:pl-70">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-70 border-r border-slate-200 bg-white px-5 py-6 lg:flex lg:flex-col"><div className="flex items-center gap-3 px-2"><Logo /><div><p className="font-display text-lg leading-none text-[#043e52]">Salamah</p><p className="mt-1 text-[8px] font-bold tracking-[0.18em] text-[#1e8c7a] uppercase">Management system</p></div></div><nav className="mt-12 space-y-1" aria-label="Superadmin navigation">{navigation.map(({ label, href, icon: Icon }) => { const active = pathname === href; return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-[#043e52] text-white shadow-[0_8px_18px_rgba(4,62,82,.16)]" : "text-slate-600 hover:bg-slate-50 hover:text-[#043e52]"}`}><Icon className="h-[18px] w-[18px]" aria-hidden="true" />{label}</Link>; })}</nav><div className="mt-auto rounded-2xl border border-teal-100 bg-teal-50/70 p-4"><ShieldCheck className="h-5 w-5 text-[#1e8c7a]" aria-hidden="true" /><p className="mt-3 text-sm font-bold text-[#043e52]">Superadmin workspace</p><p className="mt-1 text-xs leading-5 text-slate-600">Shape the secure foundation for every school role.</p></div></aside>
    <header className="fixed inset-x-0 top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur lg:left-70 sm:px-8 lg:px-10"><div className="flex items-center gap-3 lg:hidden"><Logo /><p className="font-display text-xl text-[#043e52]">Salamah</p></div><div className="hidden lg:block"><p className="text-xs font-bold tracking-[0.16em] text-[#1e8c7a] uppercase">System administration</p><p className="mt-1 text-sm text-slate-500">Secure school operations workspace</p></div><div className="flex items-center gap-3"><button type="button" aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-[#1e8c7a] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#28a38e]"><Bell className="h-[18px] w-[18px]" aria-hidden="true" /></button><div className="hidden border-l border-slate-200 pl-3 sm:block"><p className="max-w-45 truncate text-sm font-bold text-[#043e52]">{email}</p><p className="mt-0.5 text-xs text-slate-500">Super administrator</p></div><form action="/api/auth/logout" method="post"><button className="rounded-xl border border-[#043e52] px-3 py-2 text-xs font-bold text-[#043e52] transition hover:bg-[#043e52] hover:text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#28a38e] sm:px-4 sm:text-sm">Sign out</button></form></div></header>
    <main className="pt-20">{children}</main>
  </div>;
}

function Logo() { return <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"><Image src={brand.assets.logo} alt="Salamah International School" fill sizes="40px" className="object-cover" /></div>; }
