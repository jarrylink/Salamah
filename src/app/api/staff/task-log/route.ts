import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { submitTaskLog, createOrUpdateSchoolTask } from "@/lib/services/tasks";
import { sqlClient } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskId, report, notes } = body;
    if (!taskId || !report) {
      return NextResponse.json({ message: "Task ID and report are required" }, { status: 400 });
    }

    const log = await submitTaskLog({
      taskId,
      staffUserId: session.userId,
      report,
      notes,
    });

    return NextResponse.json({ success: true, log });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error submitting task report" }, { status: 500 });
  }
}
