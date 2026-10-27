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
  const sessionId = searchParams.get("sessionId");

  try {
    // 1. Fetch past promotion history
    const history = await sqlClient.query(`
      SELECT 
        sp.*,
        p.first_name, p.last_name, p.avatar_url,
        s.admission_number,
        from_c.name as from_class_name, from_g.name as from_grade_name,
        to_c.name as to_class_name, to_g.name as to_grade_name,
        from_sess.name as from_session_name,
        to_sess.name as to_session_name,
        u.email as decided_by_email
      FROM student_promotions sp
      JOIN students s ON s.id = sp.student_id
      JOIN people p ON p.id = s.person_id
      JOIN classes from_c ON from_c.id = sp.from_class_id
      JOIN grades from_g ON from_g.id = from_c.grade_id
      JOIN classes to_c ON to_c.id = sp.to_class_id
      JOIN grades to_g ON to_g.id = to_c.grade_id
      JOIN academic_sessions from_sess ON from_sess.id = sp.from_session_id
      JOIN academic_sessions to_sess ON to_sess.id = sp.to_session_id
      LEFT JOIN users u ON u.id = sp.decided_by_user_id
      ORDER BY sp.created_at DESC
      LIMIT 100
    `);

    // 2. If classId is provided, fetch current students in this class with their assessment performance
    let classStudents: any[] = [];
    if (classId) {
      classStudents = await sqlClient.query(`
        SELECT 
          s.id,
          s.admission_number,
          p.first_name,
          p.middle_name,
          p.last_name,
          p.gender,
          p.avatar_url,
          se.enrollment_date,
          (
            SELECT ROUND(AVG(sc.score), 1)
            FROM assessment_scores sc
            JOIN assessments a ON a.id = sc.assessment_id
            WHERE sc.student_id = s.id AND a.class_id = $1
          ) as calculated_average
        FROM student_enrollments se
        JOIN students s ON s.id = se.student_id
        JOIN people p ON p.id = s.person_id
        WHERE se.class_id = $1 AND se.status = 'active'
        ORDER BY p.last_name, p.first_name
      `, [classId]);
    }

    return NextResponse.json({
      history,
      classStudents,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching promotion data" },
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
    const {
      sourceClassId,
      targetClassId,
      sourceSessionId,
      targetSessionId,
      sourceTermId,
      decisions, // Array<{ studentId: string; promotionStatus: string; averageScore?: number; remarks?: string }>
    } = body;

    if (!sourceClassId || !targetClassId || !sourceSessionId || !targetSessionId || !Array.isArray(decisions)) {
      return NextResponse.json(
        { message: "sourceClassId, targetClassId, sourceSessionId, targetSessionId, and decisions array required" },
        { status: 400 }
      );
    }

    let processedCount = 0;

    for (const item of decisions) {
      const { studentId, promotionStatus = "promoted", averageScore, remarks } = item;
      if (!studentId) continue;

      const destClassId = promotionStatus === "repeated" ? sourceClassId : targetClassId;

      // 1. Record in student_promotions
      await sqlClient.query(`
        INSERT INTO student_promotions (
          student_id,
          from_class_id,
          to_class_id,
          from_session_id,
          to_session_id,
          from_term_id,
          promotion_status,
          average_score,
          decision_reason,
          decided_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        studentId,
        sourceClassId,
        destClassId,
        sourceSessionId,
        targetSessionId,
        sourceTermId || null,
        promotionStatus,
        averageScore !== undefined && averageScore !== null ? Number(averageScore) : null,
        remarks || `Batch academic progression decision: ${promotionStatus}`,
        session.userId,
      ]);

      // 2. Mark previous enrollment in sourceClassId as completed
      await sqlClient.query(`
        UPDATE student_enrollments
        SET status = 'completed', updated_at = now()
        WHERE student_id = $1 AND class_id = $2 AND status = 'active'
      `, [studentId, sourceClassId]);

      // 3. Insert or update enrollment in target class and target session
      await sqlClient.query(`
        INSERT INTO student_enrollments (
          student_id,
          class_id,
          session_id,
          enrollment_date,
          status,
          context
        ) VALUES ($1, $2, $3, CURRENT_DATE, 'active', $4)
        ON CONFLICT (student_id, session_id) DO UPDATE SET
          class_id = EXCLUDED.class_id,
          status = 'active',
          updated_at = now()
      `, [
        studentId,
        destClassId,
        targetSessionId,
        `Progression from previous class via ${promotionStatus}`,
      ]);

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      processedCount,
      message: `Successfully processed academic progression for ${processedCount} scholar${processedCount === 1 ? "" : "s"}.`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error processing promotion" },
      { status: 500 }
    );
  }
}
