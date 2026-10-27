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
    const { studentId, classId, category, comment, commentDate } = body;

    if (!studentId || !classId || !comment) {
      return NextResponse.json(
        { message: "studentId, classId, and comment are required" },
        { status: 400 }
      );
    }

    const [author] = await sqlClient.query(`
      SELECT p.first_name || ' ' || p.last_name as name
      FROM users u
      LEFT JOIN people p ON p.id = u.person_id
      WHERE u.id = $1
    `, [session.userId]) as { name: string | null }[];

    const authorName = author?.name || (session.role === "superadmin" ? "Super Admin" : "Class Teacher");

    const result = await sqlClient.query(`
      INSERT INTO student_classroom_comments (
        student_id, class_id, category, comment, comment_date, author_user_id, author_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      studentId,
      classId,
      category || "general",
      comment,
      commentDate || new Date().toISOString().split("T")[0],
      session.userId,
      authorName
    ]);

    // Also mirror into student file as a text activity so it shows in the student dossier!
    const activityTitle = category === "sickness" 
      ? "Classroom Health & Sickness Log"
      : category === "misbehavior"
      ? "Classroom Conduct & Behavioral Log"
      : category === "praise"
      ? "Classroom Commendation & Star Achievement"
      : "Classroom Teacher Observation";

    await sqlClient.query(`
      INSERT INTO student_file_entries (
        student_id, entry_type, title, content, category, author_user_id, author_name
      ) VALUES ($1, 'text', $2, $3, $4, $5, $6)
    `, [
      studentId,
      activityTitle,
      comment,
      category === "sickness" ? "medical" : category === "misbehavior" ? "discipline" : "academic",
      session.userId,
      authorName
    ]);

    return NextResponse.json({ success: true, comment: result[0] });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Comment id is required" }, { status: 400 });
    }

    await sqlClient.query("DELETE FROM student_classroom_comments WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error deleting comment" },
      { status: 500 }
    );
  }
}
