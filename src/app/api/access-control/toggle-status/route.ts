import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { toggleUserStatus } from "@/lib/services/access-management";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const { userId, status } = await request.json();
    if (!userId || !status) {
      return NextResponse.json({ message: "userId and status are required." }, { status: 400 });
    }

    if (userId === session.userId) {
      return NextResponse.json({ message: "Cannot deactivate your own active session account." }, { status: 400 });
    }

    const updated = await toggleUserStatus(userId, status);
    return NextResponse.json({
      success: true,
      updated,
      message: `Account status updated to ${status}.`,
    });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error updating status" }, { status: 500 });
  }
}
