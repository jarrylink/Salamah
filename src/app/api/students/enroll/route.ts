import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sqlClient } from "@/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin" && session.role !== "manager" && session.role !== "teacher")) {
    return NextResponse.json(
      { message: "Unauthorized. Staff access required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    // Resolve active session if not provided
    let sessionId = body.sessionId;
    if (!sessionId) {
      const activeSessions = await sqlClient.query(
        "SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1"
      ) as { id: string }[];
      sessionId = activeSessions[0]?.id;
      if (!sessionId) {
        const anySession = await sqlClient.query("SELECT id FROM academic_sessions LIMIT 1") as { id: string }[];
        sessionId = anySession[0]?.id;
      }
    }

    // ACTION 1: Admit & Enroll an incoming application child
    if (action === "admit-application-child") {
      const { applicationChildId, classId, admissionNumber } = body;

      if (!applicationChildId || !classId) {
        return NextResponse.json(
          { message: "applicationChildId and classId are required" },
          { status: 400 }
        );
      }

      // Fetch the child application info
      const children = await sqlClient.query(`
        SELECT c.*, a.guardian_name, a.guardian_email, a.guardian_phone, a.guardian_address
        FROM application_children c
        JOIN admission_applications a ON a.id = c.application_id
        WHERE c.id = $1
      `, [applicationChildId]) as any[];

      if (!children.length) {
        return NextResponse.json({ message: "Application child not found" }, { status: 404 });
      }

      const child = children[0];
      const admNum = admissionNumber?.trim() || `SAL-2026-${Math.floor(100 + Math.random() * 900)}`;
      const childAvatar = child.avatar_url || child.passport_url || (child.gender === "female"
        ? "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80");

      // 1. Create person for the child (Do NOT set guardian email as student email!)
      const [person] = await sqlClient.query(`
        INSERT INTO people (first_name, middle_name, last_name, gender, date_of_birth, phone, email, address, avatar_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $8, 'active')
        RETURNING id
      `, [
        child.first_name,
        child.middle_name,
        child.last_name,
        child.gender,
        child.date_of_birth,
        child.guardian_phone,
        child.guardian_address,
        childAvatar,
      ]) as { id: string }[];

      // 2. Create student record
      const [student] = await sqlClient.query(`
        INSERT INTO students (person_id, admission_number, admission_date, status)
        VALUES ($1, $2, CURRENT_DATE, 'active')
        RETURNING id
      `, [person.id, admNum]) as { id: string }[];

      // 3. Create enrollment in class
      await sqlClient.query(`
        INSERT INTO student_enrollments (student_id, session_id, class_id, enrollment_date, status, context)
        VALUES ($1, $2, $3, CURRENT_DATE, 'active', 'Enrolled from admissions portal')
        ON CONFLICT (student_id, session_id) DO UPDATE SET class_id = $3, status = 'active'
      `, [student.id, sessionId, classId]);

      // 4. Create guardian if needed
      const [guardianPerson] = await sqlClient.query(`
        INSERT INTO people (first_name, last_name, phone, email, address, status)
        VALUES ($1, '', $2, $3, $4, 'active')
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [child.guardian_name, child.guardian_phone, child.guardian_email, child.guardian_address]) as { id: string }[];

      if (guardianPerson?.id) {
        const [guardian] = await sqlClient.query(`
          INSERT INTO guardians (person_id, status)
          VALUES ($1, 'active')
          ON CONFLICT DO NOTHING
          RETURNING id
        `, [guardianPerson.id]) as { id: string }[];

        if (guardian?.id) {
          await sqlClient.query(`
            INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary, is_emergency_contact, status)
            VALUES ($1, $2, 'Parent/Guardian', true, true, 'active')
            ON CONFLICT DO NOTHING
          `, [student.id, guardian.id]);
        }
      }

      // 5. Update child application status to 'enrolled'
      await sqlClient.query(`
        UPDATE application_children SET status = 'enrolled' WHERE id = $1
      `, [applicationChildId]);

      // 6. Add initial file entry
      await sqlClient.query(`
        INSERT INTO student_file_entries (student_id, entry_type, title, content, category, author_name)
        VALUES ($1, 'activity', 'Admitted and Enrolled to Academic Roster', 'Formal admission granted from admissions portal application into assigned class register.', 'academic', 'Admissions Directorate')
      `, [student.id]);

      return NextResponse.json({
        success: true,
        studentId: student.id,
        admissionNumber: admNum,
      });
    }

    // ACTION 2: Direct registration of an active student
    const {
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      admissionNumber,
      classId,
      passportUrl,
      avatarUrl,
      guardianName,
      guardianPhone,
      guardianEmail,
      address,
      previousSchool,
      medicalInfo,
    } = body;

    if (!firstName || !lastName || !classId) {
      return NextResponse.json(
        { message: "First name, last name, and class are required" },
        { status: 400 }
      );
    }

    const admNum = admissionNumber?.trim() || `SAL-2026-${Math.floor(100 + Math.random() * 900)}`;
    const photo = passportUrl || avatarUrl || (gender === "female"
      ? "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80");

    // Create student person (Do NOT set guardian email as student email!)
    const [person] = await sqlClient.query(`
      INSERT INTO people (first_name, middle_name, last_name, gender, date_of_birth, phone, email, address, avatar_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $8, 'active')
      RETURNING id
    `, [
      firstName,
      middleName || null,
      lastName,
      gender || "male",
      dateOfBirth || "2014-01-01",
      guardianPhone || null,
      address || "Abuja, FCT, Nigeria",
      photo,
    ]) as { id: string }[];

    // Create student record
    const [student] = await sqlClient.query(`
      INSERT INTO students (person_id, admission_number, admission_date, status)
      VALUES ($1, $2, CURRENT_DATE, 'active')
      RETURNING id
    `, [person.id, admNum]) as { id: string }[];

    // Create enrollment
    const studentContext = body.sourceContext || body.context || 'official_superadmin';
    await sqlClient.query(`
      INSERT INTO student_enrollments (student_id, session_id, class_id, enrollment_date, status, context)
      VALUES ($1, $2, $3, CURRENT_DATE, 'active', $4)
      ON CONFLICT (student_id, session_id) DO UPDATE SET class_id = $3, status = 'active', context = $4
    `, [student.id, sessionId, classId, studentContext]);

    // Create guardian record if provided
    if (guardianName) {
      const [guardianPerson] = await sqlClient.query(`
        INSERT INTO people (first_name, last_name, phone, email, address, status)
        VALUES ($1, '', $2, $3, $4, 'active')
        RETURNING id
      `, [guardianName, guardianPhone || null, guardianEmail || null, address || null]) as { id: string }[];

      if (guardianPerson?.id) {
        const [guardian] = await sqlClient.query(`
          INSERT INTO guardians (person_id, status)
          VALUES ($1, 'active')
          RETURNING id
        `, [guardianPerson.id]) as { id: string }[];

        if (guardian?.id) {
          await sqlClient.query(`
            INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary, is_emergency_contact, status)
            VALUES ($1, $2, 'Parent/Guardian', true, true, 'active')
            ON CONFLICT DO NOTHING
          `, [student.id, guardian.id]);
        }
      }
    }

    // Add initial file entry
    await sqlClient.query(`
      INSERT INTO student_file_entries (student_id, entry_type, title, content, category, author_name)
      VALUES ($1, 'activity', 'Student Profile Opened', $2, 'general', 'Classroom Registration')
    `, [student.id, previousSchool ? `Enrolled with prior school background: ${previousSchool}.` : 'Official student dossier created and enrolled into active register.']);

    if (medicalInfo) {
      await sqlClient.query(`
        INSERT INTO student_file_entries (student_id, entry_type, title, content, category, author_name)
        VALUES ($1, 'text', 'Medical Information & Health Advisory', $2, 'medical', 'Class Teacher')
      `, [student.id, medicalInfo]);
    }

    return NextResponse.json({
      success: true,
      studentId: student.id,
      admissionNumber: admNum,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error enrolling student" },
      { status: 500 }
    );
  }
}
