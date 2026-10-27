import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createOrUpdateSchoolTask } from "@/lib/services/tasks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, title, category, description, responsibilityDocument, assignedUserId, frequency, status } = body;

    if (!title || !category || !responsibilityDocument) {
      return NextResponse.json({ message: "Title, category and responsibility document are required" }, { status: 400 });
    }

    const result = await createOrUpdateSchoolTask({
      id,
      title,
      category,
      description,
      responsibilityDocument,
      assignedUserId,
      frequency,
      status,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error saving task" }, { status: 500 });
  }
}
