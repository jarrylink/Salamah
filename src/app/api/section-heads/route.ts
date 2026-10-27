import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sqlClient } from "@/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const sectionHeads = await sqlClient.query(`
      SELECT 
        sh.*,
        s.name as section_name,
        s.code as section_canonical_code
      FROM school_section_heads sh
      LEFT JOIN sections s ON s.id = sh.section_id
      ORDER BY 
        CASE 
          WHEN sh.section_code = 'NURSERY' THEN 1
          WHEN sh.section_code = 'PRIMARY' THEN 2
          WHEN sh.section_code = 'SECONDARY' THEN 3
          ELSE 4
        END
    `);

    return NextResponse.json({ sectionHeads });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching section heads" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      section_code,
      title,
      full_name,
      qualification,
      avatar_url,
      signature_url,
      stamp_url,
      default_comment,
      phone,
      email,
    } = body;

    if (!section_code && !id) {
      return NextResponse.json(
        { message: "section_code or id required" },
        { status: 400 }
      );
    }

    const [updated] = await sqlClient.query(`
      UPDATE school_section_heads SET
        title = COALESCE($1, title),
        full_name = COALESCE($2, full_name),
        qualification = COALESCE($3, qualification),
        avatar_url = COALESCE($4, avatar_url),
        signature_url = COALESCE($5, signature_url),
        stamp_url = COALESCE($6, stamp_url),
        default_comment = COALESCE($7, default_comment),
        phone = COALESCE($8, phone),
        email = COALESCE($9, email),
        updated_at = now()
      WHERE section_code = $10 OR id = $11
      RETURNING *
    `, [
      title || null,
      full_name || null,
      qualification || null,
      avatar_url || null,
      signature_url || null,
      stamp_url || null,
      default_comment || null,
      phone || null,
      email || null,
      section_code || "",
      id || "00000000-0000-0000-0000-000000000000",
    ]);

    if (!updated) {
      return NextResponse.json({ message: "Section head record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sectionHead: updated,
      message: `${updated.title} profile successfully updated.`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error saving section head" },
      { status: 500 }
    );
  }
}
