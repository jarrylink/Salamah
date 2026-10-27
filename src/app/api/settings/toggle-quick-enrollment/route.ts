import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sqlClient } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json(
      { message: "Unauthorized. Super Admin access required." },
      { status: 403 }
    );
  }

  try {
    const { enabled } = await request.json();
    await sqlClient.query(`
      INSERT INTO system_settings (setting_key, setting_value, description)
      VALUES ('quick_enrollment_enabled', $1, 'Allows teachers with assigned classes to quick-enroll students from the Classroom Management Cockpit')
      ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_at = NOW()
    `, [JSON.stringify({ enabled: Boolean(enabled) })]);

    return NextResponse.json({ success: true, enabled: Boolean(enabled) });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to toggle setting" },
      { status: 500 }
    );
  }
}
