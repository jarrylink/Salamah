import Link from "next/link";
import { redirect } from "next/navigation";
import { sqlClient } from "@/db";
import { getSession } from "@/lib/auth/session";
import { resolveAcademicContext } from "@/features/academic/lib/context";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getSession();
  if (!user || !["admin", "superadmin"].includes(user.role)) redirect("/dashboard");
  const query = await searchParams;
  const context = await resolveAcademicContext({ sessionId: typeof query.sessionId === "string" ? query.sessionId : undefined, termId: typeof query.termId === "string" ? query.termId : undefined });
  const rows = context ? await sqlClient.query(`select c.id,c.name,
    (select count(*) from student_enrollments e where e.class_id=c.id and e.session_id=$1 and e.status='active') as students,
    (select count(*) from attendance_records ar where ar.class_id=c.id and ar.session_id=$1 and ar.term_id=$2) as attendance,
    (select count(*) from assessments a where a.class_id=c.id and a.session_id=$1 and a.term_id=$2) as assessments,
    (select count(*) from assessment_scores sc join assessments a on a.id=sc.assessment_id where a.class_id=c.id and a.session_id=$1 and a.term_id=$2) as scores
    from classes c where c.status='active' order by c.name`, [context.sessionId, context.termId]) : [];
  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><p className="text-xs font-bold tracking-[.16em] text-[#1e8c7a] uppercase">School reporting</p><h1 className="mt-2 font-display text-4xl text-[#03283a]">Academic activity</h1><p className="mt-3 text-sm text-slate-600">{context ? `${context.sessionName} / ${context.termName}` : "Choose a current academic session and term."}</p><div className="mt-5 flex gap-4 text-sm font-semibold text-teal-700"><Link href="/dashboard/fees">Fee balances</Link><Link href="/dashboard/inventory">Inventory balances</Link><Link href="/dashboard/results">Assessment scores</Link></div><section className="mt-7 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5"><table className="w-full text-left text-sm"><thead><tr>{["Class", "Enrolled students", "Attendance entries", "Assessments", "Scores entered"].map((title) => <th className="border-b px-3 py-3 text-xs text-slate-500" key={title}>{title}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{[row.name,row.students,row.attendance,row.assessments,row.scores].map((value,index) => <td key={index} className="border-b border-slate-100 px-3 py-3">{value}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="py-6 text-sm text-slate-500">No report data for this period.</p>}</section></div>;
}
