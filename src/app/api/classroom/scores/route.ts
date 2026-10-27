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
    const { classId, subjectId, studentScores } = body;

    if (!classId || !subjectId || !Array.isArray(studentScores)) {
      return NextResponse.json(
        { message: "classId, subjectId, and studentScores array are required" },
        { status: 400 }
      );
    }

    let sessionId = body.sessionId || body.session_id;
    let termId = body.termId || body.term_id;

    if (!sessionId) {
      const [activeSession] = (await sqlClient.query(
        "SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1"
      )) as { id: string }[];
      sessionId =
        activeSession?.id ||
        ((await sqlClient.query("SELECT id FROM academic_sessions LIMIT 1")) as { id: string }[])[0]?.id;
    }

    if (!termId) {
      const [activeTerm] = (await sqlClient.query(
        "SELECT id FROM academic_terms WHERE session_id = $1 AND is_current = true LIMIT 1",
        [sessionId]
      )) as { id: string }[];
      termId =
        activeTerm?.id ||
        ((await sqlClient.query("SELECT id FROM academic_terms WHERE session_id = $1 ORDER BY term_number ASC LIMIT 1", [sessionId])) as { id: string }[])[0]?.id;
    }

    // Fetch assessment types: First CA, Second CA, Third CA, Examination
    const types = await sqlClient.query(
      "SELECT id, name, code, maximum_score FROM assessment_types ORDER BY sort_order ASC, name ASC"
    ) as { id: string; name: string; code: string; maximum_score: number }[];

    const ca1Type = types.find((t) => t.code === "CA1" || t.name.toLowerCase().includes("first") || t.name.toLowerCase().includes("ca 1")) || types[0];
    const ca2Type = types.find((t) => t.code === "CA2" || t.name.toLowerCase().includes("second") || t.name.toLowerCase().includes("ca 2")) || types[1] || types[0];
    const ca3Type = types.find((t) => t.code === "CA3" || t.name.toLowerCase().includes("third") || t.name.toLowerCase().includes("ca 3")) || types.find((t) => t.name.toLowerCase().includes("3")) || types[2] || types[0];
    const examType = types.find((t) => t.code === "EXAM" || t.name.toLowerCase().includes("exam")) || types[3] || types[0];

    // Helper to get or create assessment for a given type
    async function getOrCreateAssessment(typeId: string, defaultName: string, maxScore: number) {
      const existing = await sqlClient.query(`
        SELECT id FROM assessments
        WHERE session_id = $1 AND term_id = $2 AND class_id = $3 AND subject_id = $4 AND assessment_type_id = $5
        LIMIT 1
      `, [sessionId, termId, classId, subjectId, typeId]) as { id: string }[];

      if (existing.length) return existing[0].id;

      const [created] = await sqlClient.query(`
        INSERT INTO assessments (
          session_id, term_id, class_id, subject_id, assessment_type_id, name, maximum_score, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
        RETURNING id
      `, [sessionId, termId, classId, subjectId, typeId, defaultName, maxScore]) as { id: string }[];

      return created.id;
    }

    const ca1AssessmentId = ca1Type ? await getOrCreateAssessment(ca1Type.id, "First CA", ca1Type.maximum_score || 10) : null;
    const ca2AssessmentId = ca2Type ? await getOrCreateAssessment(ca2Type.id, "Second CA", ca2Type.maximum_score || 10) : null;
    const ca3AssessmentId = ca3Type ? await getOrCreateAssessment(ca3Type.id, "Third CA", ca3Type.maximum_score || 10) : null;
    const examAssessmentId = examType ? await getOrCreateAssessment(examType.id, "Examination", examType.maximum_score || 70) : null;

    for (const item of studentScores) {
      const { studentId, ca1, ca2, ca3, exam } = item;

      if (ca1AssessmentId && typeof ca1 === "number") {
        await sqlClient.query(`
          INSERT INTO assessment_scores (assessment_id, student_id, score, entered_by_user_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (assessment_id, student_id) DO UPDATE SET score = $3, updated_at = now()
        `, [ca1AssessmentId, studentId, Math.max(0, Math.min(10, ca1)), session.userId]);
      }

      if (ca2AssessmentId && typeof ca2 === "number") {
        await sqlClient.query(`
          INSERT INTO assessment_scores (assessment_id, student_id, score, entered_by_user_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (assessment_id, student_id) DO UPDATE SET score = $3, updated_at = now()
        `, [ca2AssessmentId, studentId, Math.max(0, Math.min(10, ca2)), session.userId]);
      }

      if (ca3AssessmentId && typeof ca3 === "number") {
        await sqlClient.query(`
          INSERT INTO assessment_scores (assessment_id, student_id, score, entered_by_user_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (assessment_id, student_id) DO UPDATE SET score = $3, updated_at = now()
        `, [ca3AssessmentId, studentId, Math.max(0, Math.min(10, ca3)), session.userId]);
      }

      if (examAssessmentId && typeof exam === "number") {
        await sqlClient.query(`
          INSERT INTO assessment_scores (assessment_id, student_id, score, entered_by_user_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (assessment_id, student_id) DO UPDATE SET score = $3, updated_at = now()
        `, [examAssessmentId, studentId, Math.max(0, Math.min(70, exam)), session.userId]);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scores are saved successfully for ${studentScores.length} scholars.`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving scores" },
      { status: 500 }
    );
  }
}
