import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  updateApplicationStatus,
  admitApplicationToDatabase,
} from "@/lib/services/applications";
import { updateSystemSetting } from "@/lib/services/settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, applicationId, status, applicationFeeKobo } = body;

    if (action === "update-status") {
      const updated = await updateApplicationStatus(applicationId, status);
      return NextResponse.json({ success: true, updated });
    }

    if (action === "admit") {
      const result = await admitApplicationToDatabase(applicationId);
      return NextResponse.json({ success: true, result });
    }

    if (action === "update-pricing") {
      const amount = Number(applicationFeeKobo);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ message: "Invalid fee amount" }, { status: 400 });
      }
      await updateSystemSetting("admissions_configuration", {
        applicationFeeKobo: amount,
        applicationFeeFormatted: `₦${(amount / 100).toLocaleString()}`,
        isOpen: true,
      });
      return NextResponse.json({ success: true, amount });
    }

    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error executing application action" }, { status: 500 });
  }
}
