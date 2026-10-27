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

    // 1. Resolve session
    const activeSessions = await sqlClient.query(
      "SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1"
    ) as { id: string }[];
    const sessionId = body.sessionId || activeSessions[0]?.id;

    // ==========================================
    // TOGGLE QUICK ENROLLMENT SETTING (ADMIN ONLY)
    // ==========================================
    if (action === "toggle-quick-enrollment") {
      if (session.role !== "superadmin" && session.role !== "admin") {
        return NextResponse.json({ message: "Admin privileges required to toggle intake settings" }, { status: 403 });
      }
      const { enabled } = body;
      await sqlClient.query(`
        INSERT INTO system_settings (setting_key, setting_value, description)
        VALUES ('quick_enrollment_enabled', $1, 'Allows teachers with assigned classes to quick-enroll students from the Classroom Management Cockpit')
        ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_at = NOW()
      `, [JSON.stringify({ enabled: Boolean(enabled) })]);

      return NextResponse.json({ success: true, enabled: Boolean(enabled) });
    }

    // ==========================================
    // PENDING STUDENTS (APPLICATION INTAKE) CRUD
    // ==========================================
    if (action === "create-pending") {
      const {
        firstName,
        middleName,
        lastName,
        gender,
        dateOfBirth,
        intendedClass,
        previousSchool,
        medicalInfo,
        passportUrl,
        avatarUrl,
        guardianName,
        guardianEmail,
        guardianPhone,
        guardianAddress,
      } = body;

      if (!firstName || !lastName || !intendedClass || !guardianName || !guardianPhone) {
        return NextResponse.json({ message: "Student names, intended class, and guardian contacts are required." }, { status: 400 });
      }

      const photo = passportUrl || avatarUrl || (gender === "female"
        ? "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80");

      const appNum = `APP-MANUAL-${Date.now().toString().slice(-6)}`;
      const [app] = await sqlClient.query(`
        INSERT INTO admission_applications (
          application_number, guardian_name, guardian_email, guardian_phone, guardian_address,
          number_of_children, fee_per_child_kobo, total_fee_kobo, payment_status, payment_reference, status
        ) VALUES (
          $1, $2, $3, $4, $5, 1, 1000000, 1000000, 'paid', $6, 'submitted'
        ) RETURNING id
      `, [
        appNum,
        guardianName,
        guardianEmail || `${appNum.toLowerCase()}@salamah.sch.ng`,
        guardianPhone,
        guardianAddress || "Abuja FCT",
        `REF-${appNum}`
      ]) as { id: string }[];

      const [child] = await sqlClient.query(`
        INSERT INTO application_children (
          application_id, first_name, middle_name, last_name, gender, date_of_birth,
          intended_class, previous_school, medical_info, passport_url, avatar_url, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, 'pending'
        ) RETURNING id
      `, [
        app.id,
        firstName,
        middleName || null,
        lastName,
        gender || "male",
        dateOfBirth || "2015-01-01",
        intendedClass,
        previousSchool || null,
        medicalInfo || null,
        photo
      ]) as { id: string }[];

      return NextResponse.json({ success: true, childId: child.id, applicationId: app.id });
    }

    if (action === "update-pending") {
      const {
        childId,
        firstName,
        middleName,
        lastName,
        gender,
        dateOfBirth,
        intendedClass,
        previousSchool,
        medicalInfo,
        passportUrl,
        avatarUrl,
        guardianName,
        guardianEmail,
        guardianPhone,
        guardianAddress,
      } = body;

      if (!childId) return NextResponse.json({ message: "childId is required" }, { status: 400 });

      const photo = passportUrl || avatarUrl || null;

      await sqlClient.query(`
        UPDATE application_children
        SET first_name = $1, middle_name = $2, last_name = $3, gender = $4,
            date_of_birth = $5, intended_class = $6, previous_school = $7, medical_info = $8,
            passport_url = COALESCE($9, passport_url),
            avatar_url = COALESCE($9, avatar_url)
        WHERE id = $10
      `, [
        firstName,
        middleName || null,
        lastName,
        gender,
        dateOfBirth,
        intendedClass,
        previousSchool || null,
        medicalInfo || null,
        photo,
        childId
      ]);

      if (guardianName || guardianPhone) {
        await sqlClient.query(`
          UPDATE admission_applications
          SET guardian_name = COALESCE($1, guardian_name),
              guardian_phone = COALESCE($2, guardian_phone),
              guardian_email = COALESCE($3, guardian_email),
              guardian_address = COALESCE($4, guardian_address)
          WHERE id = (SELECT application_id FROM application_children WHERE id = $5)
        `, [guardianName, guardianPhone, guardianEmail, guardianAddress, childId]);
      }

      return NextResponse.json({ success: true });
    }

    if (action === "delete-pending") {
      const { childId } = body;
      if (!childId) return NextResponse.json({ message: "childId is required" }, { status: 400 });
      await sqlClient.query("DELETE FROM application_children WHERE id = $1", [childId]);
      return NextResponse.json({ success: true });
    }

    // ==========================================
    // ACTIVE STUDENTS & QUICK LIST CRUD
    // ==========================================
    if (action === "create-student") {
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
        context = "official_superadmin",
      } = body;

      if (!firstName || !lastName || !classId) {
        return NextResponse.json({ message: "First name, last name, and class are required." }, { status: 400 });
      }

      const admNum = admissionNumber?.trim() || `SAL-2026-${Math.floor(100 + Math.random() * 900)}`;

      const photo = passportUrl || avatarUrl || (gender === "female"
        ? "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80");

      // 1. Person for Student (Do NOT set guardian email as student email!)
      const [person] = await sqlClient.query(`
        INSERT INTO people (first_name, middle_name, last_name, gender, date_of_birth, phone, email, address, avatar_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $8, 'active')
        RETURNING id
      `, [
        firstName,
        middleName || null,
        lastName,
        gender || "male",
        dateOfBirth || "2015-01-01",
        guardianPhone || null,
        address || "Abuja, Nigeria",
        photo,
      ]) as { id: string }[];

      // 2. Student
      const [student] = await sqlClient.query(`
        INSERT INTO students (person_id, admission_number, admission_date, status)
        VALUES ($1, $2, CURRENT_DATE, 'active')
        RETURNING id
      `, [person.id, admNum]) as { id: string }[];

      // 3. Enrollment
      await sqlClient.query(`
        INSERT INTO student_enrollments (student_id, session_id, class_id, enrollment_date, status, context)
        VALUES ($1, $2, $3, CURRENT_DATE, 'active', $4)
        ON CONFLICT (student_id, session_id) DO UPDATE SET class_id = $3, status = 'active', context = $4
      `, [student.id, sessionId, classId, context]);

      // 4. Guardian (Sets parent email on guardian person)
      if (guardianName) {
        const guardianMail = guardianEmail ? guardianEmail.trim() : null;
        const [guardianPerson] = await sqlClient.query(`
          INSERT INTO people (first_name, last_name, phone, email, address, status)
          VALUES ($1, '', $2, $3, $4, 'active')
          RETURNING id
        `, [guardianName, guardianPhone || null, guardianMail, address || null]) as { id: string }[];

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

      // 5. Initial Dossier file entry
      await sqlClient.query(`
        INSERT INTO student_file_entries (student_id, entry_type, title, content, category, author_name)
        VALUES ($1, 'activity', 'Scholastic Profile Created', $2, 'general', 'Admissions Desk')
      `, [student.id, context === 'teacher_quick' ? 'Provisional classroom intake enrolled by class teacher.' : 'Official student register established by Super Admin.']);

      return NextResponse.json({ success: true, studentId: student.id, admissionNumber: admNum, avatarUrl: photo });
    }

    if (action === "update-student") {
      const {
        studentId,
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
        address,
      } = body;

      if (!studentId) return NextResponse.json({ message: "studentId is required" }, { status: 400 });

      const photo = passportUrl || avatarUrl || null;

      // Update student table
      if (admissionNumber) {
        await sqlClient.query(
          "UPDATE students SET admission_number = $1 WHERE id = $2",
          [admissionNumber, studentId]
        );
      }

      // Update person
      await sqlClient.query(`
        UPDATE people
        SET first_name = COALESCE($1, first_name),
            middle_name = $2,
            last_name = COALESCE($3, last_name),
            gender = COALESCE($4, gender),
            date_of_birth = COALESCE($5, date_of_birth),
            address = COALESCE($6, address),
            avatar_url = COALESCE($7, avatar_url)
        WHERE id = (SELECT person_id FROM students WHERE id = $8)
      `, [firstName, middleName || null, lastName, gender, dateOfBirth, address, photo, studentId]);

      // Update enrollment class
      if (classId) {
        await sqlClient.query(`
          UPDATE student_enrollments
          SET class_id = $1
          WHERE student_id = $2 AND status = 'active'
        `, [classId, studentId]);
      }

      // Update guardian
      if (guardianName || guardianPhone) {
        await sqlClient.query(`
          UPDATE people
          SET first_name = COALESCE($1, first_name),
              phone = COALESCE($2, phone)
          WHERE id IN (
            SELECT g.person_id
            FROM student_guardians sg
            JOIN guardians g ON g.id = sg.guardian_id
            WHERE sg.student_id = $3
          )
        `, [guardianName, guardianPhone, studentId]);
      }

      return NextResponse.json({ success: true });
    }

    if (action === "promote-quick") {
      const { studentId } = body;
      if (!studentId) return NextResponse.json({ message: "studentId is required" }, { status: 400 });

      await sqlClient.query(`
        UPDATE student_enrollments
        SET context = 'official_superadmin'
        WHERE student_id = $1
      `, [studentId]);

      await sqlClient.query(`
        INSERT INTO student_file_entries (student_id, entry_type, title, content, category, author_name)
        VALUES ($1, 'activity', 'Promoted to Official Super Admin Register', 'Classroom quick intake validated and synchronized to the permanent institution registry.', 'academic', 'Super Admin')
      `, [studentId]);

      return NextResponse.json({ success: true });
    }

    if (action === "delete-student") {
      const { studentId } = body;
      if (!studentId) return NextResponse.json({ message: "studentId is required" }, { status: 400 });

      // Mark enrollment as withdrawn and student status as inactive
      await sqlClient.query("UPDATE student_enrollments SET status = 'withdrawn' WHERE student_id = $1", [studentId]);
      await sqlClient.query("UPDATE students SET status = 'inactive' WHERE id = $1", [studentId]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Students CRUD error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
