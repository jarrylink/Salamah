"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db, sqlClient } from "@/db";
import { assessments, studentEnrollments } from "@/db/schema";
import { requireAuthenticatedUser, requireTeacherAssignment } from "@/lib/auth/authorization";
import type { ActionState } from "@/features/management/actions";

const scoreSchema = z.object({ assessmentId: z.string().uuid(), studentId: z.string().uuid(), score: z.coerce.number().int().min(0) });

export async function saveAssessmentScore(input: z.input<typeof scoreSchema>) {
  const actor = await requireAuthenticatedUser();
  if (!["superadmin", "admin", "teacher"].includes(actor.role)) throw new Error("You do not have access to score entry.");
  const data = scoreSchema.parse(input);
  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, data.assessmentId)).limit(1);
  if (!assessment) throw new Error("Assessment not found.");
  if (assessment.status !== "open") throw new Error("Scores can only be entered for an open assessment.");
  if (data.score > assessment.maximumScore) throw new Error(`Score cannot exceed ${assessment.maximumScore}.`);

  const session = await requireTeacherAssignment(assessment);
  const [enrollment] = await db.select({ id: studentEnrollments.id }).from(studentEnrollments).where(and(
    eq(studentEnrollments.studentId, data.studentId),
    eq(studentEnrollments.classId, assessment.classId),
    eq(studentEnrollments.sessionId, assessment.sessionId),
    eq(studentEnrollments.status, "active"),
  )).limit(1);
  if (!enrollment) throw new Error("This student is not enrolled in the assessment class.");

  const rows = await sqlClient.query(`insert into assessment_scores (assessment_id,student_id,score,entered_by_user_id)
    select a.id,$2,$3,$4 from assessments a
    join academic_sessions s on s.id=a.session_id join academic_terms t on t.id=a.term_id and t.session_id=s.id
    where a.id=$1 and a.status='open' and s.status<>'closed' and t.status<>'closed' and $3 between 0 and a.maximum_score
    and exists(select 1 from class_subjects cs where cs.class_id=a.class_id and cs.subject_id=a.subject_id and cs.session_id=a.session_id and cs.status='active')
    and exists(select 1 from users u where u.id=$4 and u.status='active' and (u.role in ('admin','superadmin') or (u.role='teacher' and exists(select 1 from staff st join teachers te on te.staff_id=st.id join teacher_subject_assignments ta on ta.teacher_id=te.id where st.person_id=u.person_id and st.status='active' and te.status='active' and ta.status='active' and ta.class_id=a.class_id and ta.subject_id=a.subject_id and ta.session_id=a.session_id and (ta.term_id=a.term_id or ta.term_id is null)))))
    and exists(select 1 from student_enrollments e where e.student_id=$2 and e.class_id=a.class_id and e.session_id=a.session_id and e.status='active')
    on conflict (assessment_id,student_id) do update set score=excluded.score,entered_by_user_id=excluded.entered_by_user_id,updated_at=now() returning id`, [data.assessmentId, data.studentId, data.score, session.userId]);
  if (!rows.length) throw new Error("The assessment or enrolment changed. Reload before entering scores.");
  revalidatePath("/dashboard/results");
}

export async function saveScoreForm(_state: ActionState, form: FormData): Promise<ActionState> {
  try {
    const score = form.get("score");
    if (typeof score !== "string" || !score.trim()) throw new Error("Enter a score; a blank score is not zero.");
    await saveAssessmentScore({ assessmentId: String(form.get("assessmentId")), studentId: String(form.get("studentId")), score });
    return { ok: true, message: "Score saved." };
  } catch (error) {
    if (error instanceof z.ZodError) return { ok: false, message: "Enter a valid whole-number score." };
    return { ok: false, message: error instanceof Error && !/query|fetch|connection/i.test(error.message) ? error.message : "Unable to save this score. Please try again." };
  }
}
