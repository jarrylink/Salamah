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
    const {
      studentId,
      entryType,
      title,
      content,
      fileUrl,
      fileName,
      fileSize,
      urlLink,
      category,
    } = body;

    if (!studentId || !entryType || !title) {
      return NextResponse.json(
        { message: "studentId, entryType, and title are required" },
        { status: 400 }
      );
    }

    const [author] = await sqlClient.query(`
      SELECT p.first_name || ' ' || p.last_name as name
      FROM users u
      LEFT JOIN people p ON p.id = u.person_id
      WHERE u.id = $1
    `, [session.userId]) as { name: string | null }[];

    const authorName = author?.name || (session.role === "superadmin" ? "Super Admin" : "Teacher");

    const result = await sqlClient.query(`
      INSERT INTO student_file_entries (
        student_id, entry_type, title, content, file_url, file_name, file_size, url_link, category, author_user_id, author_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      studentId,
      entryType,
      title,
      content || null,
      fileUrl || null,
      fileName || null,
      fileSize || null,
      urlLink || null,
      category || "general",
      session.userId,
      authorName
    ]);

    return NextResponse.json({ success: true, entry: result[0] });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving activity" },
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
      return NextResponse.json({ message: "Entry id is required" }, { status: 400 });
    }

    await sqlClient.query("DELETE FROM student_file_entries WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error deleting entry" },
      { status: 500 }
    );
  }
}
