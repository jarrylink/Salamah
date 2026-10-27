import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createOrUpdateAccessAccount, assignStaffToManager } from "@/lib/services/access-management";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "assign-manager") {
      const { managerUserId, staffUserId } = body;
      if (!managerUserId || !staffUserId) {
        return NextResponse.json({ message: "Both manager and staff IDs are required." }, { status: 400 });
      }
      await assignStaffToManager(managerUserId, staffUserId, session.userId);
      return NextResponse.json({ success: true, message: "Staff assigned to manager successfully." });
    }

    const result = await createOrUpdateAccessAccount({
      ...body,
      actingUserId: session.userId,
    });

    return NextResponse.json({ success: true, result, message: "User account saved successfully." });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error saving account" }, { status: 500 });
  }
}
