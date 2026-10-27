import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { updateCmsSection } from "@/lib/services/cms";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const { sectionKey, title, subtitle, content } = await request.json();
    if (!sectionKey || !title) {
      return NextResponse.json({ message: "Section key and title are required." }, { status: 400 });
    }

    const updated = await updateCmsSection(sectionKey, title, subtitle, content || {});
    return NextResponse.json({ success: true, updated });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error updating CMS section" }, { status: 500 });
  }
}
