import { redirect } from "next/navigation";

import { SuperadminShell } from "@/features/dashboard/components/superadmin-shell";
import { getSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role === "superadmin") return <SuperadminShell email={session.email}>{children}</SuperadminShell>;

  const labels = { admin: "Administrator", staff: "Staff member", student: "Student" } as const;
  return <main className="grid min-h-screen place-items-center bg-[#f8fafc] px-6"><section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(4,62,82,.08)] sm:p-12"><p className="text-xs font-bold tracking-[0.18em] text-[#1e8c7a] uppercase">Salamah School Management System</p><h1 className="mt-4 font-display text-4xl text-[#03283a]">Your workspace is being prepared.</h1><p className="mt-4 leading-7 text-slate-600">You are signed in as a {labels[session.role]}. Your role-specific workspace will be available as its modules are introduced.</p><form className="mt-8" action="/api/auth/logout" method="post"><button className="rounded-xl border border-[#043e52] px-5 py-3 text-sm font-bold text-[#043e52] transition hover:bg-[#043e52] hover:text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#28a38e]">Sign out</button></form></section></main>;
}
