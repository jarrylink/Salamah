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

    // 1. SET ACTIVE ROSTER
    if (action === "set-active") {
      const { rosterId } = body;
      if (!rosterId) return NextResponse.json({ message: "rosterId required" }, { status: 400 });

      // Deactivate all others, activate this one
      await sqlClient.query("UPDATE duty_rosters SET is_active = false");
      await sqlClient.query("UPDATE duty_rosters SET is_active = true WHERE id = $1", [rosterId]);

      return NextResponse.json({ success: true, activeRosterId: rosterId });
    }

    // 2. CREATE / GENERATE ROSTER
    if (action === "create-roster") {
      const {
        title,
        totalWeeks = 12,
        startDate,
        dutiesList = [
          "Assembly & Main Gate Supervision",
          "Break Time & Playground Oversight",
          "Dining Hall & Cafeteria Orderliness",
          "Dismissal & Bus Boarding Security",
        ],
        weeksData,
        isActive = false,
      } = body;

      if (!title || !startDate) {
        return NextResponse.json({ message: "Title and start date are required" }, { status: 400 });
      }

      // Resolve session & term
      const sessions = await sqlClient.query("SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1") as { id: string }[];
      const sessionId = body.sessionId || sessions[0]?.id;

      const terms = await sqlClient.query("SELECT id FROM academic_terms WHERE session_id = $1 AND is_current = true LIMIT 1", [sessionId]) as { id: string }[];
      const termId = body.termId || terms[0]?.id;

      // Calculate end date
      const sDate = new Date(startDate);
      const eDate = new Date(sDate);
      eDate.setDate(eDate.getDate() + Number(totalWeeks) * 7);

      if (isActive) {
        await sqlClient.query("UPDATE duty_rosters SET is_active = false");
      }

      const [roster] = await sqlClient.query(`
        INSERT INTO duty_rosters (
          title, session_id, term_id, total_weeks, start_date, end_date, duties_list, weeks_data, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING id
      `, [
        title,
        sessionId || null,
        termId || null,
        Number(totalWeeks),
        startDate,
        eDate.toISOString().split("T")[0],
        JSON.stringify(dutiesList),
        JSON.stringify(weeksData || []),
        Boolean(isActive),
      ]) as { id: string }[];

      return NextResponse.json({ success: true, rosterId: roster.id });
    }

    // 3. UPDATE ROSTER (OR EDIT WEEK ASSIGNMENTS)
    if (action === "update-roster") {
      const { rosterId, title, weeksData, dutiesList } = body;
      if (!rosterId) return NextResponse.json({ message: "rosterId required" }, { status: 400 });

      await sqlClient.query(`
        UPDATE duty_rosters
        SET title = COALESCE($1, title),
            weeks_data = COALESCE($2, weeks_data),
            duties_list = COALESCE($3, duties_list),
            updated_at = NOW()
        WHERE id = $4
      `, [
        title || null,
        weeksData ? JSON.stringify(weeksData) : null,
        dutiesList ? JSON.stringify(dutiesList) : null,
        rosterId,
      ]);

      return NextResponse.json({ success: true });
    }

    // 4. DELETE ROSTER
    if (action === "delete-roster") {
      const { rosterId } = body;
      if (!rosterId) return NextResponse.json({ message: "rosterId required" }, { status: 400 });
      await sqlClient.query("DELETE FROM duty_rosters WHERE id = $1", [rosterId]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Duty roster save error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving duty roster" },
      { status: 500 }
    );
  }
}
