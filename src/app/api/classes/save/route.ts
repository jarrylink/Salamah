import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sqlClient } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // Helper to resolve session
    const getResolvedSessionId = async (providedId?: string) => {
      if (providedId && providedId.trim()) return providedId.trim();
      const [current] = (await sqlClient.query(
        "SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1"
      )) as { id: string }[];
      if (current?.id) return current.id;
      const [first] = (await sqlClient.query(
        "SELECT id FROM academic_sessions ORDER BY created_at DESC LIMIT 1"
      )) as { id: string }[];
      return first?.id || null;
    };

    // 1. Assign or change combination attached to class
    if (action === "assign-combination") {
      const { classId, combinationId, sessionId: rawSessionId } = body;
      if (!classId) {
        return NextResponse.json({ message: "Class ID is required." }, { status: 400 });
      }

      // If empty combinationId, remove assignment (unassign)
      if (!combinationId) {
        await sqlClient.query("DELETE FROM class_subject_combinations WHERE class_id = $1", [classId]);
        return NextResponse.json({ success: true, message: "Subject combination detached from class." });
      }

      const activeSessionId = await getResolvedSessionId(rawSessionId);
      if (!activeSessionId) {
        return NextResponse.json({ message: "No active academic session found." }, { status: 400 });
      }

      // Replace existing combination assignment for this class to ensure flexible re-assignment
      await sqlClient.query("DELETE FROM class_subject_combinations WHERE class_id = $1", [classId]);
      await sqlClient.query(
        "INSERT INTO class_subject_combinations (class_id, combination_id, session_id, status) VALUES ($1, $2, $3, 'active')",
        [classId, combinationId, activeSessionId]
      );
      return NextResponse.json({ success: true, message: "Subject combination attached successfully." });
    }

    // 1b. Detach combination from class
    if (action === "detach-combination") {
      const { classId } = body;
      if (!classId) {
        return NextResponse.json({ message: "Class ID is required." }, { status: 400 });
      }
      await sqlClient.query("DELETE FROM class_subject_combinations WHERE class_id = $1", [classId]);
      return NextResponse.json({ success: true, message: "Combination detached successfully." });
    }

    // 2. Assign or change class teacher
    if (action === "assign-teacher") {
      const { classId, teacherId, sessionId: rawSessionId, assignmentType } = body;
      if (!classId) {
        return NextResponse.json({ message: "Class ID is required." }, { status: 400 });
      }

      // If empty teacherId, unassign class teacher
      if (!teacherId) {
        await sqlClient.query(
          "DELETE FROM teacher_class_assignments WHERE class_id = $1 AND assignment_type = $2",
          [classId, assignmentType || "class_teacher"]
        );
        return NextResponse.json({ success: true, message: "Class teacher unassigned successfully." });
      }

      const activeSessionId = await getResolvedSessionId(rawSessionId);
      if (!activeSessionId) {
        return NextResponse.json({ message: "No active academic session found." }, { status: 400 });
      }

      // Replace existing class teacher for this assignment type to ensure flexible re-assignment
      await sqlClient.query(
        "DELETE FROM teacher_class_assignments WHERE class_id = $1 AND assignment_type = $2",
        [classId, assignmentType || "class_teacher"]
      );
      await sqlClient.query(
        "INSERT INTO teacher_class_assignments (teacher_id, class_id, session_id, assignment_type, status) VALUES ($1, $2, $3, $4, 'active')",
        [teacherId, classId, activeSessionId, assignmentType || "class_teacher"]
      );
      return NextResponse.json({ success: true, message: "Class teacher assigned successfully." });
    }

    // 2b. Unassign class teacher
    if (action === "unassign-teacher") {
      const { classId, assignmentType } = body;
      if (!classId) {
        return NextResponse.json({ message: "Class ID is required." }, { status: 400 });
      }
      await sqlClient.query(
        "DELETE FROM teacher_class_assignments WHERE class_id = $1 AND assignment_type = $2",
        [classId, assignmentType || "class_teacher"]
      );
      return NextResponse.json({ success: true, message: "Class teacher unassigned successfully." });
    }

    // 3. Create or update class
    const { id, gradeId, name, code } = body;
    if (!gradeId || !name || !code) {
      return NextResponse.json({ message: "Grade, name and code are required." }, { status: 400 });
    }

    if (id) {
      await sqlClient.query(
        "UPDATE classes SET grade_id = $1, name = $2, code = $3, updated_at = now() WHERE id = $4",
        [gradeId, name, code.toUpperCase(), id]
      );
    } else {
      await sqlClient.query(
        "INSERT INTO classes (grade_id, name, code, status) VALUES ($1, $2, $3, 'active')",
        [gradeId, name, code.toUpperCase()]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error saving class" }, { status: 500 });
  }
}
