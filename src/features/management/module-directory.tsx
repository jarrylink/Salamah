import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { modules } from "./config";

export async function ModuleDirectory({ peopleOnly = false }: { peopleOnly?: boolean }) {
  const user = await getSession();
  if (!user || !["admin", "superadmin"].includes(user.role)) redirect("/dashboard");
  const entries = Object.entries(modules).filter(([, module]) => (!peopleOnly || module.group === "People") && (!module.superadmin || user.role === "superadmin"));
  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><p className="text-xs font-bold tracking-[.16em] text-[#1e8c7a] uppercase">School administration</p><h1 className="mt-2 font-display text-4xl text-[#03283a]">{peopleOnly ? "People & access" : "Academic & school records"}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{peopleOnly ? "Start with a person, add their school profile, then create a sign-in account when needed." : "Set up sections, grades, classes and subjects, then enrol students and assign teachers for an academic session."}</p><Link href="/dashboard/academic-sessions" className="mt-5 inline-block font-semibold text-teal-700">Manage sessions & terms →</Link>{[...new Set(entries.map(([, module]) => module.group))].map((group) => <section key={group} className="mt-8"><h2 className="text-lg font-bold text-[#043e52]">{group}</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{entries.filter(([, module]) => module.group === group).map(([key, module]) => <Link key={key} href={`/dashboard/manage/${key}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-400 hover:shadow-sm"><h3 className="font-bold text-[#043e52]">{module.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{module.description}</p></Link>)}</div></section>)}</div>;
}
