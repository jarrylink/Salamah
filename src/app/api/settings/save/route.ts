import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { updateSystemSetting } from "@/lib/services/settings";
import { sqlClient } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const { key, value, description, currentSessionId, currentTermId } = await request.json();

    if (currentSessionId) {
      await sqlClient.query("UPDATE academic_sessions SET is_current = false");
      await sqlClient.query("UPDATE academic_sessions SET is_current = true WHERE id = $1", [currentSessionId]);
    }

    if (currentTermId) {
      await sqlClient.query("UPDATE academic_terms SET is_current = false");
      await sqlClient.query("UPDATE academic_terms SET is_current = true WHERE id = $1", [currentTermId]);
    }

    if (key && value) {
      const updated = await updateSystemSetting(key, value, description);
      return NextResponse.json({ success: true, updated });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error saving settings" }, { status: 500 });
  }
}
