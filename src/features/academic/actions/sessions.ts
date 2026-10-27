"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { sqlClient } from "@/db";
import type { ActionState } from "@/features/management/actions";
import { requireSchoolAdministrator } from "@/lib/auth/authorization";

const sessionSchema = z.object({ name: z.string().trim().min(4).max(80), startDate: z.string().date(), endDate: z.string().date() }).refine((data) => data.endDate > data.startDate, { message: "End date must follow start date." });

export async function createAcademicSession(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireSchoolAdministrator();
    const data = sessionSchema.parse(Object.fromEntries(formData));
    const id = randomUUID();
    await sqlClient.transaction([
      sqlClient.query("insert into academic_sessions (id,name,start_date,end_date) values ($1,$2,$3,$4)", [id, data.name, data.startDate, data.endDate]),
      sqlClient.query("insert into academic_terms (session_id,term_number,name) select $1,n,'Term ' || n from generate_series(1,3) n", [id]),
    ]);
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Session and three terms created. Select a term below to make this the current academic period." };
  } catch (error) { return { ok: false, message: error instanceof z.ZodError ? error.issues[0].message : "Could not create the session. Check that its name is unique and try again." }; }
}

export async function setCurrentAcademicSession(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireSchoolAdministrator();
    const id = z.uuid().parse(formData.get("id"));
    const termId = z.uuid().parse(formData.get("termId"));
    const [, valid] = await sqlClient.transaction([
      sqlClient.query("lock table academic_sessions, academic_terms in share row exclusive mode"),
      sqlClient.query("select 1 from academic_terms t join academic_sessions s on s.id=t.session_id where t.id=$1 and s.id=$2 and s.status<>'closed' and t.status<>'closed'", [termId, id]),
      sqlClient.query("update academic_sessions set is_current=(id=$2), status=case when id=$2 then 'active'::academic_session_status else status end, updated_at=now() where exists(select 1 from academic_terms t join academic_sessions s on s.id=t.session_id where t.id=$1 and s.id=$2 and s.status<>'closed' and t.status<>'closed')", [termId, id]),
      sqlClient.query("update academic_terms set is_current=(id=$1), status=case when id=$1 then 'active'::academic_session_status else status end, updated_at=now() where exists(select 1 from academic_terms t join academic_sessions s on s.id=t.session_id where t.id=$1 and s.id=$2 and s.status<>'closed' and t.status<>'closed')", [termId, id]),
    ]);
    if (!valid.length) return { ok: false, message: "Choose an open session and one of its terms." };
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Current academic session and term updated." };
  } catch { return { ok: false, message: "Could not change the academic period. Check your selection and try again." }; }
}
