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

    // 1. CREATE WEEKLY THEME
    if (action === "create-theme") {
      const {
        weekNumber,
        themeTitle,
        scriptureReference,
        quoteOrHadith,
        assemblyFocus,
        coreValues,
      } = body;

      if (!weekNumber || !themeTitle) {
        return NextResponse.json({ message: "Week number and theme title are required." }, { status: 400 });
      }

      // Resolve session & term
      const sessions = await sqlClient.query("SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1") as { id: string }[];
      const sessionId = body.sessionId || sessions[0]?.id;

      const terms = await sqlClient.query("SELECT id FROM academic_terms WHERE session_id = $1 AND is_current = true LIMIT 1", [sessionId]) as { id: string }[];
      const termId = body.termId || terms[0]?.id;

      const [theme] = await sqlClient.query(`
        INSERT INTO weekly_themes (
          session_id, term_id, week_number, theme_title, scripture_reference, quote_or_hadith, assembly_focus, core_values
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING id
      `, [
        sessionId || null,
        termId || null,
        Number(weekNumber),
        themeTitle,
        scriptureReference || null,
        quoteOrHadith || null,
        assemblyFocus || null,
        coreValues || null,
      ]) as { id: string }[];

      return NextResponse.json({ success: true, themeId: theme.id });
    }

    // 2. UPDATE WEEKLY THEME
    if (action === "update-theme") {
      const {
        themeId,
        weekNumber,
        themeTitle,
        scriptureReference,
        quoteOrHadith,
        assemblyFocus,
        coreValues,
      } = body;

      if (!themeId) return NextResponse.json({ message: "themeId is required" }, { status: 400 });

      await sqlClient.query(`
        UPDATE weekly_themes
        SET week_number = COALESCE($1, week_number),
            theme_title = COALESCE($2, theme_title),
            scripture_reference = $3,
            quote_or_hadith = $4,
            assembly_focus = $5,
            core_values = $6,
            updated_at = NOW()
        WHERE id = $7
      `, [
        weekNumber ? Number(weekNumber) : null,
        themeTitle || null,
        scriptureReference || null,
        quoteOrHadith || null,
        assemblyFocus || null,
        coreValues || null,
        themeId,
      ]);

      return NextResponse.json({ success: true });
    }

    // 3. DELETE WEEKLY THEME
    if (action === "delete-theme") {
      const { themeId } = body;
      if (!themeId) return NextResponse.json({ message: "themeId is required" }, { status: 400 });

      await sqlClient.query("DELETE FROM weekly_themes WHERE id = $1", [themeId]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Weekly theme save error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving weekly theme" },
      { status: 500 }
    );
  }
}
