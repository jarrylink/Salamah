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
  const subjectId = searchParams.get("subjectId");
  const classId = searchParams.get("classId");
  const weekNumber = searchParams.get("weekNumber");

  if (!subjectId) {
    return NextResponse.json({ message: "subjectId is required" }, { status: 400 });
  }

  try {
    let query = `
      SELECT * FROM subject_lesson_notes
      WHERE subject_id = $1
    `;
    const params: (string | number)[] = [subjectId];

    if (classId) {
      params.push(classId);
      query += ` AND (class_id = $${params.length} OR class_id IS NULL)`;
    }

    if (weekNumber) {
      params.push(parseInt(weekNumber, 10));
      query += ` AND week_number = $${params.length}`;
    }

    query += ` ORDER BY week_number ASC`;

    const notes = await sqlClient.query(query, params);
    return NextResponse.json({ notes });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching lesson notes" },
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
      subjectId,
      classId,
      weekNumber,
      topic,
      subtopics,
      content,
      learningMaterials,
      homework,
      status,
    } = body;

    if (!subjectId || !weekNumber || !topic || !content) {
      return NextResponse.json(
        { message: "subjectId, weekNumber, topic, and content are required" },
        { status: 400 }
      );
    }

    const [activeSession] = await sqlClient.query(
      "SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1"
    ) as { id: string }[];
    const [activeTerm] = await sqlClient.query(
      "SELECT id FROM academic_terms WHERE is_current = true LIMIT 1"
    ) as { id: string }[];

    const sessionId = activeSession?.id || (await sqlClient.query("SELECT id FROM academic_sessions LIMIT 1") as { id: string }[])[0]?.id;
    const termId = activeTerm?.id || (await sqlClient.query("SELECT id FROM academic_terms LIMIT 1") as { id: string }[])[0]?.id;

    // Check if a note already exists for this subject, class & week
    const existing = await sqlClient.query(`
      SELECT id FROM subject_lesson_notes
      WHERE subject_id = $1 AND week_number = $2 AND ($3::uuid IS NULL OR class_id = $3)
      LIMIT 1
    `, [subjectId, weekNumber, classId || null]);

    let noteId: string;
    if (existing.length > 0) {
      noteId = existing[0].id;
      await sqlClient.query(`
        UPDATE subject_lesson_notes
        SET
          topic = $1,
          subtopics = $2,
          content = $3,
          learning_materials = $4,
          homework = $5,
          status = $6,
          teacher_user_id = $7,
          updated_at = now()
        WHERE id = $8
      `, [
        topic,
        subtopics || null,
        content,
        learningMaterials || null,
        homework || null,
        status || "approved",
        session.userId,
        noteId,
      ]);
    } else {
      const [newRow] = await sqlClient.query(`
        INSERT INTO subject_lesson_notes (
          subject_id, class_id, session_id, term_id, teacher_user_id,
          week_number, topic, subtopics, content, learning_materials, homework, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
        RETURNING id
      `, [
        subjectId,
        classId || null,
        sessionId,
        termId,
        session.userId,
        weekNumber,
        topic,
        subtopics || null,
        content,
        learningMaterials || null,
        homework || null,
        status || "approved",
      ]);
      noteId = newRow.id;
    }

    return NextResponse.json({
      success: true,
      noteId,
      message: "Lesson note saved successfully.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving lesson note" },
      { status: 500 }
    );
  }
}
