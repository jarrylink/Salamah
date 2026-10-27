import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createOrUpdateElearningResource, deleteElearningResource } from "@/lib/services/elearning";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, id, title, description, subjectId, classId, resourceType, content, fileName, status } = body;

    if (action === "delete") {
      await deleteElearningResource(id);
      return NextResponse.json({ success: true });
    }

    if (!title || !content || !resourceType) {
      return NextResponse.json({ message: "Title, content and resource type are required" }, { status: 400 });
    }

    const result = await createOrUpdateElearningResource({
      id,
      title,
      description,
      subjectId,
      classId,
      resourceType,
      content,
      fileName,
      status,
      authorUserId: session.userId,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error saving elearning resource" }, { status: 500 });
  }
}
