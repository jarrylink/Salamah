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
      SELECT * FROM subject_lesson_plans
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

    const plans = await sqlClient.query(query, params);
    return NextResponse.json({ plans });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching lesson plans" },
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
      durationMinutes,
      behavioralObjectives,
      instructionalMaterials,
      previousKnowledge,
      steps,
      evaluation,
      conclusion,
      status,
    } = body;

    if (!subjectId || !weekNumber || !topic) {
      return NextResponse.json(
        { message: "subjectId, weekNumber, and topic are required" },
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

    // Check if a plan already exists for this subject, class & week
    const existing = await sqlClient.query(`
      SELECT id FROM subject_lesson_plans
      WHERE subject_id = $1 AND week_number = $2 AND ($3::uuid IS NULL OR class_id = $3)
      LIMIT 1
    `, [subjectId, weekNumber, classId || null]);

    let planId: string;
    if (existing.length > 0) {
      planId = existing[0].id;
      await sqlClient.query(`
        UPDATE subject_lesson_plans
        SET
          topic = $1,
          duration_minutes = $2,
          behavioral_objectives = $3,
          instructional_materials = $4,
          previous_knowledge = $5,
          steps = $6,
          evaluation = $7,
          conclusion = $8,
          status = $9,
          teacher_user_id = $10,
          updated_at = now()
        WHERE id = $11
      `, [
        topic,
        durationMinutes || 40,
        behavioralObjectives || null,
        instructionalMaterials || null,
        previousKnowledge || null,
        JSON.stringify(steps || []),
        evaluation || null,
        conclusion || null,
        status || "ready",
        session.userId,
        planId,
      ]);
    } else {
      const [newRow] = await sqlClient.query(`
        INSERT INTO subject_lesson_plans (
          subject_id, class_id, session_id, term_id, teacher_user_id,
          week_number, topic, duration_minutes, behavioral_objectives,
          instructional_materials, previous_knowledge, steps, evaluation, conclusion, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now(), now())
        RETURNING id
      `, [
        subjectId,
        classId || null,
        sessionId,
        termId,
        session.userId,
        weekNumber,
        topic,
        durationMinutes || 40,
        behavioralObjectives || null,
        instructionalMaterials || null,
        previousKnowledge || null,
        JSON.stringify(steps || []),
        evaluation || null,
        conclusion || null,
        status || "ready",
      ]);
      planId = newRow.id;
    }

    return NextResponse.json({
      success: true,
      planId,
      message: "Lesson plan saved successfully.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving lesson plan" },
      { status: 500 }
    );
  }
}
