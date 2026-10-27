import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sqlClient } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const { classId, attendanceDate, records } = await request.json();
    if (!classId || !attendanceDate || !records) {
      return NextResponse.json({ message: "Missing required attendance parameters" }, { status: 400 });
    }

    const [activeSession] = await sqlClient.query("SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1");
    const [activeTerm] = await sqlClient.query("SELECT id FROM academic_terms WHERE session_id = $1 AND is_current = true LIMIT 1", [activeSession?.id]);

    const sessionId = activeSession?.id;
    const termId = activeTerm?.id;

    for (const [studentId, status] of Object.entries(records as Record<string, string>)) {
      await sqlClient.query(
        `INSERT INTO attendance_records (session_id, term_id, class_id, student_id, attendance_date, status, recorded_by_user_id)
         VALUES ($1, $2, $3, $4, $5::date, $6::attendance_status, $7)
         ON CONFLICT (student_id, attendance_date) DO UPDATE
         SET status = excluded.status, updated_at = now()`,
        [sessionId, termId, classId, studentId, attendanceDate, status, session.userId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error recording attendance" }, { status: 500 });
  }
}
