import "server-only";
import { sqlClient } from "@/db";
import { modules } from "./config";

export type RecordRow = Record<string, string | number | null> & { id: string; updated_at?: string };
export type Option = { value: string; label: string };

export const lookupQueries: Record<string, string> = {
  invoices: "select i.id, concat(i.reference, ' · ', p.first_name, ' ', p.last_name) as label from student_invoices i join students s on s.id=i.student_id join people p on p.id=s.person_id",
  people: "select id, concat_ws(' ', first_name, last_name, '(' || coalesce(email, phone, id::text) || ')') as label from people",
  staff: "select s.id, concat(p.first_name, ' ', p.last_name, ' · ', s.staff_number) as label from staff s join people p on p.id=s.person_id",
  teachers: "select t.id, concat(p.first_name, ' ', p.last_name, ' · ', s.staff_number) as label from teachers t join staff s on s.id=t.staff_id join people p on p.id=s.person_id",
  students: "select s.id, concat(p.first_name, ' ', p.last_name, ' · ', s.admission_number) as label from students s join people p on p.id=s.person_id",
  guardians: "select g.id, concat(p.first_name, ' ', p.last_name, ' · ', coalesce(p.phone, p.email, g.id::text)) as label from guardians g join people p on p.id=g.person_id",
  sessions: "select id, name as label from academic_sessions",
  terms: "select t.id, concat(s.name, ' / ', t.name) as label from academic_terms t join academic_sessions s on s.id=t.session_id",
};

export async function getOptions(reference: string): Promise<Option[]> {
  const definition = modules[reference];
  const query = lookupQueries[reference] ?? (definition ? `select id, name as label from "${definition.table}"` : null);
  if (!query) throw new Error("Unknown record reference.");
  const rows = await sqlClient.query(`${query} order by label`);
  return rows.map((row) => ({ value: String(row.id), label: String(row.label) }));
}

export async function getRecords(key: string, search = "", page = 1) {
  const definition = modules[key];
  if (!definition) throw new Error("Unknown definition.");
  const columns = definition.fields.filter((f) => f.type !== "password").map((f) => `"${f.name}"`);
  const searchable = definition.fields.filter((f) => f.type !== "password").map((f) => {
    if (!f.reference) return `coalesce("${f.name}"::text, '')`;
    const lookup = lookupQueries[f.reference] ?? `select id, name as label from "${modules[f.reference].table}"`;
    return `coalesce((select label from (${lookup}) lookup where lookup.id="${definition.table}"."${f.name}"), '')`;
  });
  const where = search && searchable.length ? `where concat_ws(' ', ${searchable.join(", ")}) ilike $1` : "";
  const params = where ? [`%${search}%`] : [];
  const [rows, totals] = await Promise.all([
    sqlClient.query(`select id, updated_at::text, ${columns.join(", ")} from "${definition.table}" ${where} order by created_at desc, id limit 50 offset $${params.length + 1}`, [...params, (page - 1) * 50]),
    sqlClient.query(`select count(*)::int as total from "${definition.table}" ${where}`, params),
  ]);
  return { rows: rows as RecordRow[], total: Number(totals[0].total) };
}
