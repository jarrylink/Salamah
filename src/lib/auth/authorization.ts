import "server-only";

import { and, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { staff, teacherSubjectAssignments, teachers, users } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export class AuthorizationError extends Error {}

export async function requireAuthenticatedUser() {
  const session = await getSession();
  if (!session) throw new AuthorizationError("Sign in is required.");
  return session;
}

export async function requireSchoolAdministrator() {
  const session = await requireAuthenticatedUser();
  if (session.role !== "superadmin" && session.role !== "admin") throw new AuthorizationError("Administrator access is required.");
  return session;
}

export async function requireTeacherAssignment(input: { classId: string; subjectId: string; sessionId: string; termId: string }) {
  const session = await requireAuthenticatedUser();
  if (session.role === "superadmin" || session.role === "admin") return session;
  if (session.role !== "teacher") throw new AuthorizationError("Teacher access is required.");

  const [assignment] = await db
    .select({ id: teacherSubjectAssignments.id })
    .from(users)
    .innerJoin(staff, eq(staff.personId, users.personId))
    .innerJoin(teachers, eq(teachers.staffId, staff.id))
    .innerJoin(teacherSubjectAssignments, and(
      eq(teacherSubjectAssignments.teacherId, teachers.id),
      eq(teacherSubjectAssignments.classId, input.classId),
      eq(teacherSubjectAssignments.subjectId, input.subjectId),
      eq(teacherSubjectAssignments.sessionId, input.sessionId),
      or(eq(teacherSubjectAssignments.termId, input.termId), isNull(teacherSubjectAssignments.termId)),
      eq(teacherSubjectAssignments.status, "active"),
    ))
    .where(and(eq(users.id, session.userId), eq(staff.status, "active"), eq(teachers.status, "active")))
    .limit(1);

  if (!assignment) throw new AuthorizationError("You are not assigned to this class and subject.");
  return session;
}
