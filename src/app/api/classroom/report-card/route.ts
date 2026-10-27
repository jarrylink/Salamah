import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sqlClient } from "@/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");
  const requestedSessionId = searchParams.get("sessionId");
  const requestedTermId = searchParams.get("termId");

  if (!classId) {
    return NextResponse.json({ message: "classId parameter required" }, { status: 400 });
  }

  try {
    let query = `
      SELECT
        tr.*,
        p.first_name, p.last_name, s.admission_number, p.avatar_url
      FROM student_terminal_reports tr
      JOIN students s ON s.id = tr.student_id
      JOIN people p ON p.id = s.person_id
      WHERE tr.class_id = $1
    `;
    const params: (string | number)[] = [classId];
    let paramIndex = 2;

    if (studentId) {
      query += ` AND tr.student_id = $${paramIndex++}`;
      params.push(studentId);
    }

    if (requestedSessionId) {
      query += ` AND tr.session_id = $${paramIndex++}`;
      params.push(requestedSessionId);
    }

    if (requestedTermId) {
      query += ` AND tr.term_id = $${paramIndex++}`;
      params.push(requestedTermId);
    }

    query += ` ORDER BY p.last_name, p.first_name`;

    const reports = await sqlClient.query(query, params);

    // Fetch all sessions and terms for switcher
    const sessions = await sqlClient.query(
      "SELECT id, name, is_current FROM academic_sessions ORDER BY name DESC"
    );
    const terms = await sqlClient.query(
      "SELECT id, session_id, name, term_number, is_current FROM academic_terms ORDER BY term_number ASC"
    );

    return NextResponse.json({
      reports,
      sessions,
      terms,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching terminal reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const classId = body.classId || body.class_id;
    const studentId = body.studentId || body.student_id;
    const inputSessionId = body.sessionId || body.session_id;
    const inputTermId = body.termId || body.term_id;

    const teacherComment = body.teacherComment ?? body.teacher_comment ?? null;
    const principalComment = body.principalComment ?? body.principal_comment ?? null;
    const affectiveDomain = body.affectiveDomain ?? body.affective_domain ?? {};
    const psychomotorDomain = body.psychomotorDomain ?? body.psychomotor_domain ?? {};
    const daysSchoolOpened = body.daysSchoolOpened ?? body.days_school_opened ?? 60;
    const daysPresent = body.daysPresent ?? body.days_present ?? null;
    const daysAbsent = body.daysAbsent ?? body.days_absent ?? null;
    const nextTermResumption = body.nextTermResumption ?? body.next_term_resumption ?? null;
    const height = body.height ?? null;
    const weight = body.weight ?? null;

    if (!classId || !studentId) {
      return NextResponse.json(
        { message: "classId and studentId are required" },
        { status: 400 }
      );
    }

    // Resolve target session and term
    let sessionId = inputSessionId;
    let termId = inputTermId;

    if (!sessionId) {
      const [activeSession] = await sqlClient.query(
        "SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1"
      ) as { id: string }[];
      sessionId = activeSession?.id || (await sqlClient.query("SELECT id FROM academic_sessions LIMIT 1") as { id: string }[])[0]?.id;
    }

    if (!termId) {
      const [activeTerm] = await sqlClient.query(
        "SELECT id FROM academic_terms WHERE session_id = $1 AND is_current = true LIMIT 1",
        [sessionId]
      ) as { id: string }[];
      termId =
        activeTerm?.id ||
        (await sqlClient.query("SELECT id FROM academic_terms WHERE session_id = $1 ORDER BY term_number ASC LIMIT 1", [sessionId]) as { id: string }[])[0]?.id;
    }

    if (!sessionId || !termId) {
      return NextResponse.json({ message: "Active academic session and term required" }, { status: 400 });
    }

    const [savedReport] = await sqlClient.query(`
      INSERT INTO student_terminal_reports (
        session_id,
        term_id,
        class_id,
        student_id,
        teacher_comment,
        principal_comment,
        affective_domain,
        psychomotor_domain,
        days_school_opened,
        days_present,
        days_absent,
        next_term_resumption,
        height,
        weight,
        recorded_by_user_id,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now())
      ON CONFLICT (session_id, term_id, class_id, student_id) DO UPDATE SET
        teacher_comment = EXCLUDED.teacher_comment,
        principal_comment = EXCLUDED.principal_comment,
        affective_domain = EXCLUDED.affective_domain,
        psychomotor_domain = EXCLUDED.psychomotor_domain,
        days_school_opened = EXCLUDED.days_school_opened,
        days_present = EXCLUDED.days_present,
        days_absent = EXCLUDED.days_absent,
        next_term_resumption = EXCLUDED.next_term_resumption,
        height = EXCLUDED.height,
        weight = EXCLUDED.weight,
        recorded_by_user_id = EXCLUDED.recorded_by_user_id,
        updated_at = now()
      RETURNING *
    `, [
      sessionId,
      termId,
      classId,
      studentId,
      teacherComment,
      principalComment,
      typeof affectiveDomain === "string" ? affectiveDomain : JSON.stringify(affectiveDomain || {}),
      typeof psychomotorDomain === "string" ? psychomotorDomain : JSON.stringify(psychomotorDomain || {}),
      daysSchoolOpened !== undefined ? Number(daysSchoolOpened) : 60,
      daysPresent !== undefined ? Number(daysPresent) : null,
      daysAbsent !== undefined ? Number(daysAbsent) : null,
      nextTermResumption || null,
      height || null,
      weight || null,
      session.userId,
    ]);

    return NextResponse.json({
      success: true,
      report: savedReport,
      message: "Terminal report records successfully saved.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving terminal report" },
      { status: 500 }
    );
  }
}
