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
    const body = await request.json();
    const { action } = body;

    // 1. UPDATE CURRENT WEEK (OR MANUAL OVERRIDE)
    if (action === "set-current-week") {
      const { calendarId, weekNumber, isManualOverride } = body;
      if (!calendarId) return NextResponse.json({ message: "calendarId required" }, { status: 400 });

      await sqlClient.query(`
        UPDATE school_academic_calendars
        SET current_week = $1,
            manual_override_week = $2,
            updated_at = NOW()
        WHERE id = $3
      `, [
        Number(weekNumber),
        isManualOverride ? Number(weekNumber) : null,
        calendarId,
      ]);

      return NextResponse.json({ success: true, currentWeek: Number(weekNumber) });
    }

    // 2. UPDATE FULL CALENDAR CONFIGURATION
    if (action === "update-calendar") {
      const {
        calendarId,
        termName,
        startDate,
        endDate,
        totalWeeks,
        weeksConfig,
        currentWeek,
      } = body;

      if (!calendarId) return NextResponse.json({ message: "calendarId required" }, { status: 400 });

      await sqlClient.query(`
        UPDATE school_academic_calendars
        SET term_name = COALESCE($1, term_name),
            start_date = COALESCE($2, start_date),
            end_date = COALESCE($3, end_date),
            total_weeks = COALESCE($4, total_weeks),
            weeks_config = COALESCE($5, weeks_config),
            current_week = COALESCE($6, current_week),
            updated_at = NOW()
        WHERE id = $7
      `, [
        termName || null,
        startDate || null,
        endDate || null,
        totalWeeks ? Number(totalWeeks) : null,
        weeksConfig ? JSON.stringify(weeksConfig) : null,
        currentWeek ? Number(currentWeek) : null,
        calendarId,
      ]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("School AC save error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving school academic calendar" },
      { status: 500 }
    );
  }
}
