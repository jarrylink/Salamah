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

  if (!subjectId) {
    return NextResponse.json({ message: "subjectId is required" }, { status: 400 });
  }

  try {
    let query = `
      SELECT * FROM subject_schemes_of_work
      WHERE subject_id = $1
    `;
    const params: string[] = [subjectId];

    if (classId) {
      query += ` AND (class_id = $2 OR class_id IS NULL)`;
      params.push(classId);
    }

    query += ` ORDER BY updated_at DESC LIMIT 1`;

    const [scheme] = await sqlClient.query(query, params);
    return NextResponse.json({ scheme: scheme || null });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching scheme of work" },
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
    const { subjectId, classId, weeksData } = body;

    if (!subjectId || !Array.isArray(weeksData)) {
      return NextResponse.json(
        { message: "subjectId and weeksData are required" },
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

    // Check if an existing scheme exists for this subject & class
    const existing = await sqlClient.query(`
      SELECT id FROM subject_schemes_of_work
      WHERE subject_id = $1 AND ($2::uuid IS NULL OR class_id = $2)
      LIMIT 1
    `, [subjectId, classId || null]);

    let savedId: string;
    if (existing.length > 0) {
      savedId = existing[0].id;
      await sqlClient.query(`
        UPDATE subject_schemes_of_work
        SET
          weeks_data = $1,
          teacher_user_id = $2,
          session_id = $3,
          term_id = $4,
          updated_at = now()
        WHERE id = $5
      `, [JSON.stringify(weeksData), session.userId, sessionId, termId, savedId]);
    } else {
      const [newRow] = await sqlClient.query(`
        INSERT INTO subject_schemes_of_work (
          subject_id, class_id, session_id, term_id, teacher_user_id, weeks_data, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, now(), now())
        RETURNING id
      `, [subjectId, classId || null, sessionId, termId, session.userId, JSON.stringify(weeksData)]);
      savedId = newRow.id;
    }

    return NextResponse.json({
      success: true,
      schemeId: savedId,
      message: "Scheme of work saved successfully.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving scheme of work" },
      { status: 500 }
    );
  }
}
