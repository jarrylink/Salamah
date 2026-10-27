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
    const { taskId, responsibilityDocument } = await request.json();
    if (!taskId || !responsibilityDocument) {
      return NextResponse.json({ message: "Task ID and responsibility document required" }, { status: 400 });
    }

    await sqlClient.query(
      "UPDATE school_tasks SET responsibility_document = $1, updated_at = now() WHERE id = $2",
      [responsibilityDocument, taskId]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error updating document" }, { status: 500 });
  }
}
