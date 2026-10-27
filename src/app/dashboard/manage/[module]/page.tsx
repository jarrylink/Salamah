import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { sqlClient } from "@/db";
import { getSession } from "@/lib/auth/session";
import { modules, relatedModules } from "@/features/management/config";
import { getOptions, getRecords, type RecordRow } from "@/features/management/data";
import { RecordForm } from "@/features/management/record-form";
import { ActionForm } from "@/features/management/action-form";
import { removeCombinationSubject } from "@/features/management/actions";

export default async function ManagementPage({ params, searchParams }: { params: Promise<{ module: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { module: key } = await params;
  const definition = Object.hasOwn(modules, key) ? modules[key] : undefined;
  if (!definition) notFound();
  const user = await getSession();
  if (!user) redirect("/");
  if (!["admin", "superadmin"].includes(user.role) || (definition.superadmin && user.role !== "superadmin")) redirect("/dashboard");
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.slice(0, 100) : "";
  const page = Math.floor(Math.max(1, Math.min(100000, Number(query.page) || 1)));
  const editId = typeof query.edit === "string" && z.uuid().safeParse(query.edit).success ? query.edit : undefined;
  const refs = [...new Set(definition.fields.flatMap((field) => field.reference ? [field.reference] : []))];
  const [{ rows, total }, choices, editRows] = await Promise.all([
    getRecords(key, search, page),
    Promise.all(refs.map(async (reference) => [reference, await getOptions(reference)] as const)),
    editId ? sqlClient.query(`select id, updated_at::text, ${definition.fields.filter((f) => f.type !== "password").map((f) => `"${f.name}"`).join(", ")} from "${definition.table}" where id=$1`, [editId]) : Promise.resolve([]),
  ]);
  if (editId && (!editRows.length || definition.appendOnly)) notFound();
  const options = Object.fromEntries(choices);
  const editRecord = editRows[0] as RecordRow | undefined;
  const columns = definition.fields.filter((f) => f.type !== "password" && f.type !== "textarea").slice(0, 6);
  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <p className="text-xs font-bold tracking-[.16em] text-[#1e8c7a] uppercase">{definition.group}</p>
    <h1 className="mt-2 font-display text-4xl text-[#03283a]">{definition.title}</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{definition.description}</p>
    <nav aria-label="Related records" className="mt-5 flex flex-wrap gap-2"><Link className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#043e52]" href="/dashboard/academic-structure">All modules</Link>{(relatedModules[key] ?? []).filter((item) => !modules[item].superadmin || user.role === "superadmin").map((item) => <Link key={item} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#043e52]" href={`/dashboard/manage/${item}`}>{modules[item].title}</Link>)}</nav>
    {(!definition.editOnly || editRecord) && <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-[#043e52]">{editRecord ? "Edit record" : "Add a record"}</h2>{editRecord && <Link href={`/dashboard/manage/${key}`} className="text-sm font-semibold text-teal-700">Cancel editing</Link>}</div>
      <div className="mt-5"><RecordForm key={`${key}-${editRecord?.id ?? "new"}`} moduleKey={key} fields={definition.fields} options={options} record={editRecord} /></div>
    </section>}
    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-bold text-[#043e52]">Records <span className="text-sm font-normal text-slate-500">({total})</span></h2><form className="flex gap-2"><label className="sr-only" htmlFor="record-search">Search records</label><input id="record-search" name="q" defaultValue={search} placeholder="Search record fields…" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button className="rounded-lg border border-[#043e52] px-3 py-2 text-sm font-semibold text-[#043e52]">Search</button></form></div>
      <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{columns.map((field) => <th key={field.name} className="border-b px-3 py-3 text-xs text-slate-500">{field.label}</th>)}<th className="border-b px-3 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map((field) => <td key={field.name} className="border-b border-slate-100 px-3 py-3 text-slate-700">{field.reference ? options[field.reference]?.find((option) => option.value === row[field.name])?.label ?? "—" : field.type === "money" ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(row[field.name]) / 100) : String(row[field.name] ?? "—").replaceAll("_", " ")}</td>)}<td className="border-b border-slate-100 px-3 py-3">{!definition.appendOnly && <Link className="font-semibold text-teal-700" href={`/dashboard/manage/${key}?edit=${row.id}`}>Edit<span className="sr-only"> record</span></Link>}{key === "combination-subjects" && <div className="mt-3"><ActionForm action={removeCombinationSubject} label="Remove subject"><input type="hidden" name="id" value={row.id} /><input type="hidden" name="version" value={row.updated_at ?? ""} /></ActionForm></div>}</td></tr>)}</tbody></table>{!rows.length && <p className="py-8 text-center text-sm text-slate-500">No records found. Add a record using the form above.</p>}</div>
      <nav className="mt-5 flex justify-between text-sm font-semibold text-teal-700" aria-label="Pagination">{page > 1 ? <Link href={`?page=${page - 1}&q=${encodeURIComponent(search)}`}>Previous</Link> : <span />}{page * 50 < total && <Link href={`?page=${page + 1}&q=${encodeURIComponent(search)}`}>Next</Link>}</nav>
    </section>
  </div>;
}

