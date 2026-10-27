import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sqlClient } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // Helper to resolve session
    const getResolvedSessionId = async (providedId?: string) => {
      if (providedId && providedId.trim()) return providedId.trim();
      const [current] = (await sqlClient.query(
        "SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1"
      )) as { id: string }[];
      if (current?.id) return current.id;
      const [first] = (await sqlClient.query(
        "SELECT id FROM academic_sessions ORDER BY created_at DESC LIMIT 1"
      )) as { id: string }[];
      return first?.id || null;
    };

    // 1. Create or edit subject combination
    if (action === "create-combination" || action === "edit-combination") {
      const { id: combId, name, description, subjectIds } = body;
      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ message: "Combination name is required." }, { status: 400 });
      }
      if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
        return NextResponse.json({ message: "At least one subject must be selected for the combination." }, { status: 400 });
      }

      let activeCombId = combId;
      if (activeCombId) {
        await sqlClient.query(
          "UPDATE subject_combinations SET name = $1, description = $2, updated_at = now() WHERE id = $3",
          [name.trim(), description?.trim() || null, activeCombId]
        );
        await sqlClient.query("DELETE FROM subject_combination_subjects WHERE combination_id = $1", [activeCombId]);
      } else {
        const [comb] = (await sqlClient.query(
          "INSERT INTO subject_combinations (name, description, status) VALUES ($1, $2, 'active') RETURNING id",
          [name.trim(), description?.trim() || null]
        )) as { id: string }[];
        activeCombId = comb.id;
      }

      for (let i = 0; i < subjectIds.length; i++) {
        await sqlClient.query(
          "INSERT INTO subject_combination_subjects (combination_id, subject_id, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [activeCombId, subjectIds[i], i + 1]
        );
      }

      return NextResponse.json({ success: true, combinationId: activeCombId, message: "Combination saved successfully." });
    }

    // 2. Delete combination
    if (action === "delete-combination") {
      const { combinationId } = body;
      if (!combinationId) {
        return NextResponse.json({ message: "Combination ID is required." }, { status: 400 });
      }
      await sqlClient.query("DELETE FROM class_subject_combinations WHERE combination_id = $1", [combinationId]);
      await sqlClient.query("DELETE FROM subject_combination_subjects WHERE combination_id = $1", [combinationId]);
      await sqlClient.query("DELETE FROM subject_combinations WHERE id = $1", [combinationId]);
      return NextResponse.json({ success: true, message: "Combination removed successfully." });
    }

    // 3. Assign or change teacher for a subject (flexible assignment)
    if (action === "assign-subject-teacher") {
      const { subjectId, teacherId, classId, sessionId: rawSessionId, termId } = body;
      if (!subjectId || !teacherId) {
        return NextResponse.json({ message: "Subject and Teacher are required." }, { status: 400 });
      }
      const activeSessionId = await getResolvedSessionId(rawSessionId);
      if (!activeSessionId) {
        return NextResponse.json({ message: "No active academic session found." }, { status: 400 });
      }

      if (classId) {
        // Replace existing assignment for this class & subject
        await sqlClient.query(
          "DELETE FROM teacher_subject_assignments WHERE subject_id = $1 AND class_id = $2 AND session_id = $3",
          [subjectId, classId, activeSessionId]
        );
        await sqlClient.query(
          "INSERT INTO teacher_subject_assignments (teacher_id, subject_id, class_id, session_id, term_id, status) VALUES ($1, $2, $3, $4, $5, 'active')",
          [teacherId, subjectId, classId, activeSessionId, termId || null]
        );
      } else {
        // Find all classes taking this subject via active combinations and assign teacher
        const classRows = (await sqlClient.query(
          `SELECT DISTINCT csc.class_id
           FROM class_subject_combinations csc
           JOIN subject_combination_subjects scs ON scs.combination_id = csc.combination_id
           WHERE scs.subject_id = $1 AND csc.status = 'active'`,
          [subjectId]
        )) as { class_id: string }[];

        for (const row of classRows) {
          await sqlClient.query(
            "DELETE FROM teacher_subject_assignments WHERE subject_id = $1 AND class_id = $2 AND session_id = $3",
            [subjectId, row.class_id, activeSessionId]
          );
          await sqlClient.query(
            "INSERT INTO teacher_subject_assignments (teacher_id, subject_id, class_id, session_id, term_id, status) VALUES ($1, $2, $3, $4, $5, 'active')",
            [teacherId, subjectId, row.class_id, activeSessionId, termId || null]
          );
        }
      }

      return NextResponse.json({ success: true, message: "Teacher assigned to subject successfully." });
    }

    // 4. Unassign teacher from subject
    if (action === "unassign-subject-teacher") {
      const { subjectId, classId, teacherId } = body;
      if (!subjectId) {
        return NextResponse.json({ message: "Subject ID is required." }, { status: 400 });
      }
      if (classId) {
        await sqlClient.query(
          "DELETE FROM teacher_subject_assignments WHERE subject_id = $1 AND class_id = $2" + (teacherId ? " AND teacher_id = $3" : ""),
          teacherId ? [subjectId, classId, teacherId] : [subjectId, classId]
        );
      } else {
        await sqlClient.query(
          "DELETE FROM teacher_subject_assignments WHERE subject_id = $1" + (teacherId ? " AND teacher_id = $2" : ""),
          teacherId ? [subjectId, teacherId] : [subjectId]
        );
      }
      return NextResponse.json({ success: true, message: "Teacher unassigned from subject." });
    }

    // 5. Default: create or update subject
    // Note: Subject names CAN be duplicated (e.g. English for Primary vs English for Nursery)
    // but subject codes MUST be strictly unique across the school.
    const { id, name, code, shortName, description, sectionIds } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ message: "Subject name is required." }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanCode = (code?.trim() || `SUB_${cleanName.replace(/[^A-Za-z0-9]+/g, "_")}`).toUpperCase();
    const cleanShortName = shortName?.trim() || cleanName;
    const cleanDescription = description?.trim() || null;

    let subjectId = id;

    if (subjectId) {
      // Check for code collision excluding the current subject being edited
      const existing = (await sqlClient.query(
        "SELECT id FROM subjects WHERE code = $1 AND id != $2 LIMIT 1",
        [cleanCode, subjectId]
      )) as { id: string }[];

      if (existing.length > 0) {
        return NextResponse.json(
          { message: `A subject with code '${cleanCode}' already exists. Please choose a unique subject code (e.g., ENG-PRI, ENG-NUR).` },
          { status: 400 }
        );
      }

      await sqlClient.query(
        "UPDATE subjects SET name = $1, code = $2, short_name = $3, description = $4, updated_at = now() WHERE id = $5",
        [cleanName, cleanCode, cleanShortName, cleanDescription, subjectId]
      );
    } else {
      // Check for code collision on create
      const existing = (await sqlClient.query(
        "SELECT id FROM subjects WHERE code = $1 LIMIT 1",
        [cleanCode]
      )) as { id: string }[];

      if (existing.length > 0) {
        return NextResponse.json(
          { message: `A subject with code '${cleanCode}' already exists. Please choose a unique subject code (e.g., ENG-PRI, ENG-NUR).` },
          { status: 400 }
        );
      }

      const [created] = (await sqlClient.query(
        "INSERT INTO subjects (name, code, short_name, description, status) VALUES ($1, $2, $3, $4, 'active') RETURNING id",
        [cleanName, cleanCode, cleanShortName, cleanDescription]
      )) as { id: string }[];
      subjectId = created.id;
    }

    // If sectionIds provided, associate with sections
    if (Array.isArray(sectionIds) && sectionIds.length > 0 && subjectId) {
      for (const sId of sectionIds) {
        await sqlClient.query(
          "INSERT INTO subject_sections (subject_id, section_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [subjectId, sId]
        );
      }
    }

    return NextResponse.json({ success: true, subjectId, message: "Subject saved successfully." });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error saving subject" }, { status: 500 });
  }
}
