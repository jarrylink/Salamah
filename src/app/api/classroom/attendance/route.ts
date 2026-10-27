import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sqlClient } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { classId, attendanceDate, records } = body;

    if (!classId || !attendanceDate || !Array.isArray(records)) {
      return NextResponse.json(
        { message: "classId, attendanceDate, and records array are required" },
        { status: 400 }
      );
    }

    // Resolve active session and term
    const [activeSession] = await sqlClient.query(
      "SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1"
    ) as { id: string }[];
    const [activeTerm] = await sqlClient.query(
      "SELECT id FROM academic_terms WHERE is_current = true LIMIT 1"
    ) as { id: string }[];

    const sessionId = activeSession?.id || (await sqlClient.query("SELECT id FROM academic_sessions LIMIT 1") as { id: string }[])[0]?.id;
    const termId = activeTerm?.id || (await sqlClient.query("SELECT id FROM academic_terms LIMIT 1") as { id: string }[])[0]?.id;

    if (!sessionId || !termId) {
      return NextResponse.json({ message: "Active session and term required" }, { status: 400 });
    }

    // Upsert each attendance record
    for (const rec of records) {
      await sqlClient.query(`
        INSERT INTO attendance_records (
          session_id, term_id, class_id, student_id, attendance_date, status, recorded_by_user_id, note, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
        ON CONFLICT (student_id, attendance_date) DO UPDATE SET
          class_id = $3,
          status = $6,
          note = $8,
          recorded_by_user_id = $7,
          updated_at = now()
      `, [
        sessionId,
        termId,
        classId,
        rec.studentId,
        attendanceDate,
        rec.status || "present",
        session.userId,
        rec.note || null,
      ]);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully saved attendance for ${records.length} students.`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving attendance" },
      { status: 500 }
    );
  }
}
