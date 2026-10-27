"use server";

import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sqlClient } from "@/db";
import { requireSchoolAdministrator } from "@/lib/auth/authorization";
import { modules } from "./config";
import { assertImmutable, parseRecord } from "./validation";

export type ActionState = { ok: boolean; message: string };

export async function removeCombinationSubject(_state: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSchoolAdministrator();
    const id = z.uuid().parse(form.get("id"));
    const rows = await sqlClient.query("delete from subject_combination_subjects m where m.id=$1 and m.updated_at=$2::timestamptz and not exists(select 1 from class_subject_combinations c where c.combination_id=m.combination_id) returning id", [id, form.get("version")]);
    if (!rows.length) return { ok: false, message: "This combination is already assigned or the record changed. Assigned combinations are preserved." };
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Subject removed from the unassigned combination." };
  } catch { return { ok: false, message: "Unable to remove this subject. Check your access and reload the page." }; }
}

export async function saveRecord(key: string, _previous: ActionState, form: FormData): Promise<ActionState> {
  try {
    const actor = await requireSchoolAdministrator();
    const definition = Object.hasOwn(modules, key) ? modules[key] : undefined;
    if (!definition || (definition.superadmin && actor.role !== "superadmin")) throw new Error("You do not have access to this module.");
    const rawId = form.get("id");
    const id = rawId ? z.uuid().parse(rawId) : randomUUID();
    const editing = Boolean(rawId);
    if (!editing && definition.editOnly) throw new Error("Create sessions from the Sessions & terms page.");
    if (editing && definition.appendOnly) throw new Error("Ledger entries cannot be edited. They are retained for the school's records.");
    const data = parseRecord(definition, form, editing);
    const [existing] = editing ? await sqlClient.query(`select * from "${definition.table}" where id=$1`, [id]) : [];
    if (editing && !existing) throw new Error("This record no longer exists.");
    if (existing) assertImmutable(definition, data, existing);
    for (const field of definition.fields) {
      if (!field.reference || !data[field.name] || ["sessions", "terms"].includes(field.reference)) continue;
      const target = modules[field.reference];
      const mustValidate = !editing || data[field.name] !== existing?.[field.name] || (data.status === "active" && existing?.status !== "active");
      if (mustValidate && target?.fields.some((candidate) => candidate.name === "status")) {
        const [active] = await sqlClient.query(`select id from "${target.table}" where id=$1 and status='active'`, [data[field.name]]);
        if (!active) throw new Error(`Choose an active ${field.label.toLowerCase()}.`);
      }
    }
    if (key === "sessions") {
      if (existing?.is_current && data.status !== "active") throw new Error("Select a different current session before changing this session's status.");
      if (String(data.end_date) <= String(data.start_date)) throw new Error("Session end date must follow its start date.");
      const [outside] = await sqlClient.query("select 1 from academic_terms where session_id=$1 and (start_date < $2::date or end_date > $3::date) limit 1", [id, data.start_date, data.end_date]);
      if (outside) throw new Error("Existing term dates must remain within the session dates.");
    }
    if (key === "terms") {
      if (existing?.is_current && data.status !== "active") throw new Error("Select a different current term before changing this term's status.");
      if (Boolean(data.start_date) !== Boolean(data.end_date)) throw new Error("Provide both term dates, or leave both blank.");
      if (data.start_date && String(data.start_date) >= String(data.end_date)) throw new Error("Term end date must follow its start date.");
      if (data.start_date) {
        const [period] = await sqlClient.query("select 1 from academic_sessions where id=$1 and $2::date >= start_date and $3::date <= end_date", [data.session_id, data.start_date, data.end_date]);
        if (!period) throw new Error("Term dates must fall within the academic session.");
      }
    }

    if (key === "accounts") {
      if (existing?.role === "superadmin" && (data.role !== "superadmin" || data.status !== "active")) throw new Error("An existing Super Admin must remain active with their role intact.");
      if (id === actor.userId && (data.status !== "active" || data.role !== actor.role)) throw new Error("You cannot remove your own access.");
      if (data.password) {
        const salt = randomBytes(16).toString("hex");
        data.password_hash = `scrypt$${salt}$${scryptSync(String(data.password), salt, 64).toString("hex")}`;
      }
      delete data.password;
      if (["teacher", "student", "guardian"].includes(String(data.role))) {
        const table = data.role === "teacher" ? "teachers t join staff s on s.id=t.staff_id" : `${data.role}s s`;
        const condition = data.role === "teacher" ? "s.person_id=$1 and t.status='active' and s.status='active'" : "s.person_id=$1 and s.status='active'";
        const linked = await sqlClient.query(`select 1 from ${table} where ${condition}`, [data.person_id]);
        if (!linked.length) throw new Error(`Create an active ${data.role} profile for the selected person first.`);
      }
    }

    if (data.session_id) {
      const [session] = await sqlClient.query("select status from academic_sessions where id=$1", [data.session_id]);
      if (!session || session.status === "closed") throw new Error("Choose an academic session that is not closed.");
    }
    if (data.term_id) {
      const [term] = await sqlClient.query("select status from academic_terms where id=$1 and session_id=$2", [data.term_id, data.session_id]);
      if (!term || term.status === "closed") throw new Error("The term must belong to the selected session and must not be closed.");
    }
    if (key === "enrolments" || key === "attendance") {
      const [student] = await sqlClient.query("select id from students where id=$1 and status='active'", [data.student_id]);
      if (!student) throw new Error("Choose an active student.");
    }
    if (key === "assignments") {
      const [teacher] = await sqlClient.query("select t.id from teachers t join staff s on s.id=t.staff_id where t.id=$1 and t.status='active' and s.status='active'", [data.teacher_id]);
      if (!teacher) throw new Error("Choose an active teacher and staff profile.");
    }
    if (key === "assignments" || key === "assessments") {
      const [offered] = await sqlClient.query("select 1 from class_subjects where class_id=$1 and subject_id=$2 and session_id=$3 and status='active'", [data.class_id, data.subject_id, data.session_id]);
      if (!offered) throw new Error("Assign this subject to the class for the selected session first.");
    }
    if (key === "combination-subjects") {
      const [used] = await sqlClient.query("select 1 from class_subject_combinations where combination_id=$1 limit 1", [data.combination_id]);
      if (used) throw new Error("This combination has been assigned. Create a new combination to change its subjects.");
    }
    if (key === "class-combinations") {
      const [member] = await sqlClient.query("select 1 from subject_combination_subjects where combination_id=$1 limit 1", [data.combination_id]);
      if (!member) throw new Error("Add at least one subject to this combination first.");
    }
    if (key === "attendance") {
      const [enrolment] = await sqlClient.query("select 1 from student_enrollments where student_id=$1 and session_id=$2 and class_id=$3 and status='active'", [data.student_id, data.session_id, data.class_id]);
      if (!enrolment) throw new Error("The student is not actively enrolled in this class for the selected session.");
      const [period] = await sqlClient.query("select 1 from academic_sessions s join academic_terms t on t.session_id=s.id where s.id=$1 and t.id=$2 and $3::date between coalesce(t.start_date,s.start_date) and coalesce(t.end_date,s.end_date)", [data.session_id, data.term_id, data.attendance_date]);
      if (!period) throw new Error("Attendance date must fall within the selected academic period.");
      data.recorded_by_user_id = actor.userId;
    }
    if (key === "notices" && !editing) data.created_by_user_id = actor.userId;
    if (key === "grade-sections" && !editing) {
      const [, saved] = await sqlClient.transaction([
        sqlClient.query("select id from grades where id=$1 for update", [data.grade_id]),
        sqlClient.query("insert into grade_sections (grade_id,section_id) select $1,$2 where not exists(select 1 from grade_sections where grade_id=$1) returning id", [data.grade_id, data.section_id]),
      ]);
      if (!saved.length) throw new Error("This grade already belongs to a section.");
      revalidatePath("/dashboard", "layout");
      return { ok: true, message: "Grade linked to section." };
    }
    if (key === "payments") {
      const [, saved] = await sqlClient.transaction([
        sqlClient.query("select id from student_invoices where id=$1 for update", [data.invoice_id]),
        sqlClient.query("insert into fee_payments (invoice_id,amount_kobo,payment_date,reference,payment_method,received_by_user_id) select i.id,$2,$3,$4,$5,$6 from student_invoices i where i.id=$1 and i.status='active' and $2::integer <= i.amount_kobo-coalesce((select sum(amount_kobo) from fee_payments where invoice_id=i.id),0) returning id", [data.invoice_id, data.amount_kobo, data.payment_date, data.reference, data.payment_method, actor.userId]),
      ]);
      if (!saved.length) throw new Error("The invoice is inactive or this payment exceeds its remaining balance.");
      revalidatePath("/dashboard", "layout");
      return { ok: true, message: "Payment recorded." };
    }
    if (key === "inventory-movements") {
      const [, saved] = await sqlClient.transaction([
        sqlClient.query("select id from inventory_items where id=$1 for update", [data.item_id]),
        sqlClient.query("insert into inventory_transactions (item_id,supplier_id,transaction_type,quantity,transaction_date,reference,note,recorded_by_user_id) select i.id,$2,$3,$4,$5,$6,$7,$8 from inventory_items i where i.id=$1 and i.status='active' and ($3='stock_in' or $4::integer <= coalesce((select sum(case when transaction_type in ('stock_in','in') then quantity when transaction_type in ('stock_out','out') then -quantity else 0 end) from inventory_transactions where item_id=i.id),0)) returning id", [data.item_id, data.supplier_id, data.transaction_type, data.quantity, data.transaction_date, data.reference, data.note, actor.userId]),
      ]);
      if (!saved.length) throw new Error("The item is inactive or there is not enough stock to issue this quantity.");
      revalidatePath("/dashboard", "layout");
      return { ok: true, message: "Stock movement recorded." };
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    const version = form.get("version");
    const mutation = editing
      ? sqlClient.query(`update "${definition.table}" set ${columns.map((c, i) => `"${c}"=$${i + 1}`).join(", ")}, updated_at=now() where id=$${values.length + 1} and updated_at=$${values.length + 2}::timestamptz returning id`, [...values, id, version])
      : sqlClient.query(`insert into "${definition.table}" (id, ${columns.map((c) => `"${c}"`).join(", ")}) values ($1, ${columns.map((_, i) => `$${i + 2}`).join(", ")}) returning id`, [id, ...values]);
    // HTTP batch transactions retain the configured Neon transport.
    const queries = [mutation];
    if (key === "class-combinations" && data.status === "active") {
      queries.push(sqlClient.query("insert into class_subjects (class_id,subject_id,session_id,status) select $1, subject_id, $2, 'active' from subject_combination_subjects where combination_id=$3 and exists(select 1 from class_subject_combinations where id=$4 and updated_at=transaction_timestamp()) on conflict (class_id,subject_id,session_id) do update set status='active', updated_at=now() returning id", [data.class_id, data.session_id, data.combination_id, id]));
    }
    const [saved] = await sqlClient.transaction(queries);
    if (!saved.length) throw new Error("This record was updated elsewhere. Reload the page before saving.");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: editing ? "Changes saved." : "Record created. You can add another below." };
  } catch (error) {
    const cause = error as { code?: string; message?: string; cause?: { code?: string } };
    const code = cause.code ?? cause.cause?.code;
    if (code === "23505") return { ok: false, message: "A record with these details already exists. Open the existing record to edit it." };
    if (code === "23503") return { ok: false, message: "A selected record is no longer available. Reload and try again." };
    if (error instanceof z.ZodError) return { ok: false, message: "Some submitted details are invalid. Reload the page and try again." };
    if (code || !(error instanceof Error)) return { ok: false, message: "The record could not be saved. Please try again." };
    // Database errors may include query values; only application errors are shown.
    if (/query|fetch|connection|relation|column|constraint/i.test(error.message)) return { ok: false, message: "The database could not complete this request. Please try again." };
    return { ok: false, message: error.message };
  }
}
