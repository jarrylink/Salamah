import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sqlClient } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin" && session.role !== "teacher")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, classId, studentId, targetClassId } = body;

    let sessionId = body.sessionId;
    if (!sessionId) {
      const activeSessions = await sqlClient.query(
        "SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1"
      ) as { id: string }[];
      sessionId = activeSessions[0]?.id;
      if (!sessionId) {
        const anySession = await sqlClient.query("SELECT id FROM academic_sessions LIMIT 1") as { id: string }[];
        sessionId = anySession[0]?.id;
      }
    }

    if (action === "add-student") {
      if (!classId || !studentId) {
        return NextResponse.json({ message: "classId and studentId are required" }, { status: 400 });
      }

      await sqlClient.query(`
        INSERT INTO student_enrollments (student_id, session_id, class_id, enrollment_date, status, context)
        VALUES ($1, $2, $3, CURRENT_DATE, 'active', 'Assigned via classroom management')
        ON CONFLICT (student_id, session_id) DO UPDATE
        SET class_id = $3, status = 'active', updated_at = now()
      `, [studentId, sessionId, classId]);

      return NextResponse.json({ success: true, message: "Student enrolled in class" });
    }

    if (action === "remove-student") {
      if (!classId || !studentId) {
        return NextResponse.json({ message: "classId and studentId are required" }, { status: 400 });
      }

      await sqlClient.query(`
        UPDATE student_enrollments
        SET status = 'transferred', updated_at = now()
        WHERE student_id = $1 AND class_id = $2
      `, [studentId, classId]);

      return NextResponse.json({ success: true, message: "Student removed from class" });
    }

    if (action === "transfer-student") {
      if (!studentId || !targetClassId) {
        return NextResponse.json({ message: "studentId and targetClassId are required" }, { status: 400 });
      }

      await sqlClient.query(`
        UPDATE student_enrollments
        SET class_id = $1, status = 'active', updated_at = now()
        WHERE student_id = $2
      `, [targetClassId, studentId]);

      return NextResponse.json({ success: true, message: "Student transferred to new class" });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error updating class roster" },
      { status: 500 }
    );
  }
}
