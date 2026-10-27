import "server-only";
import { randomBytes, scryptSync } from "node:crypto";
import { sqlClient } from "@/db";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

export async function getAllAccessControlUsers() {
  const users = await sqlClient.query(`
    SELECT
      u.id as user_id,
      u.email,
      u.role,
      COALESCE(u.designation, u.role::text) as designation,
      u.status as account_status,
      u.passport_url,
      u.last_login_at,
      p.id as person_id,
      p.first_name,
      p.middle_name,
      p.last_name,
      p.phone,
      p.gender,
      COALESCE(u.passport_url, p.avatar_url) as avatar_url,
      s.id as staff_id,
      s.staff_number,
      s.department,
      s.employment_type,
      s.employment_date,
      std.id as student_id,
      std.admission_number,
      cls.name as current_class_name,
      cls.code as current_class_code,
      msa.manager_user_id,
      mgr_p.first_name as manager_first_name,
      mgr_p.last_name as manager_last_name,
      (SELECT count(*)::int FROM user_documents ud WHERE ud.user_id = u.id) as document_count
    FROM users u
    LEFT JOIN people p ON p.id = u.person_id
    LEFT JOIN staff s ON s.person_id = p.id
    LEFT JOIN students std ON std.person_id = p.id
    LEFT JOIN student_enrollments se ON se.student_id = std.id AND se.status = 'active'
    LEFT JOIN classes cls ON cls.id = se.class_id
    LEFT JOIN manager_staff_assignments msa ON msa.staff_user_id = u.id AND msa.status = 'active'
    LEFT JOIN users mgr_u ON mgr_u.id = msa.manager_user_id
    LEFT JOIN people mgr_p ON mgr_p.id = mgr_u.person_id
    ORDER BY 
      CASE 
        WHEN u.role = 'superadmin' THEN 1
        WHEN u.role = 'manager' THEN 2
        WHEN u.role = 'staff' THEN 3
        WHEN u.role = 'student' THEN 4
        ELSE 5
      END,
      p.last_name, p.first_name
  `);
  return users;
}

export async function getAllStudentsForLink() {
  const students = await sqlClient.query(`
    SELECT
      s.id as student_id,
      s.admission_number,
      p.id as person_id,
      p.first_name,
      p.last_name,
      p.gender,
      p.avatar_url,
      c.id as class_id,
      c.name as class_name,
      c.code as class_code,
      u.id as linked_user_id,
      u.email as linked_email
    FROM students s
    JOIN people p ON p.id = s.person_id
    LEFT JOIN student_enrollments se ON se.student_id = s.id AND se.status = 'active'
    LEFT JOIN classes c ON c.id = se.class_id
    LEFT JOIN users u ON u.person_id = p.id
    ORDER BY p.last_name, p.first_name
  `);
  return students;
}

export async function getManagersList() {
  const managers = await sqlClient.query(`
    SELECT
      u.id as user_id,
      u.email,
      p.first_name,
      p.last_name,
      s.department
    FROM users u
    JOIN people p ON p.id = u.person_id
    LEFT JOIN staff s ON s.person_id = p.id
    WHERE u.role = 'manager' AND u.status = 'active'
    ORDER BY p.first_name, p.last_name
  `);
  return managers;
}

export async function getUserDocuments(userId: string) {
  const docs = await sqlClient.query(`
    SELECT
      id,
      user_id,
      title,
      doc_type,
      file_url,
      file_name,
      file_size,
      category,
      notes,
      created_at
    FROM user_documents
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [userId]);
  return docs;
}

export async function addUserDocument(input: {
  userId: string;
  title: string;
  docType: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: string;
  category?: string;
  notes?: string;
}) {
  const [created] = await sqlClient.query(`
    INSERT INTO user_documents (
      user_id, title, doc_type, file_url, file_name, file_size, category, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    input.userId,
    input.title,
    input.docType || "other",
    input.fileUrl,
    input.fileName || "document.pdf",
    input.fileSize || "150 KB",
    input.category || "general",
    input.notes || null,
  ]);
  return created;
}

export async function deleteUserDocument(documentId: string) {
  const [deleted] = await sqlClient.query(`
    DELETE FROM user_documents WHERE id = $1 RETURNING id
  `, [documentId]);
  return deleted;
}

export async function toggleUserStatus(userId: string, newStatus: "active" | "inactive") {
  const [updated] = await sqlClient.query(`
    UPDATE users
    SET status = $1, updated_at = now()
    WHERE id = $2
    RETURNING id, status
  `, [newStatus, userId]);
  return updated;
}

export async function createOrUpdateAccessAccount(input: {
  userId?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  gender?: string;
  role: "superadmin" | "manager" | "staff" | "student";
  designation?: string;
  status: "active" | "inactive";
  passportUrl?: string;
  staffNumber?: string;
  department?: string;
  employmentType?: string;
  managerUserId?: string;
  studentId?: string; // If linking an existing student
  actingUserId?: string;
}) {
  // Normalize email
  let normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    normalizedEmail = `${normalizedEmail}@salamah.ng`;
  }

  const designation = input.designation || (
    input.role === "student" ? "student" :
    input.role === "manager" ? "manager" :
    input.role === "superadmin" ? "superadmin" : "teaching staff"
  );

  const passport = input.passportUrl || null;

  if (input.userId) {
    // ----------------- UPDATE -----------------
    const [currentUser] = await sqlClient.query("SELECT person_id, role FROM users WHERE id = $1", [input.userId]);
    if (!currentUser) throw new Error("User not found.");

    // Update person
    if (currentUser.person_id) {
      await sqlClient.query(
        `UPDATE people
         SET first_name = $1, middle_name = $2, last_name = $3, phone = $4, gender = $5, avatar_url = COALESCE($6, avatar_url), updated_at = now()
         WHERE id = $7`,
        [input.firstName, input.middleName || null, input.lastName, input.phone || null, input.gender || null, passport, currentUser.person_id]
      );
    }

    // Update user
    if (input.password && input.password.trim()) {
      await sqlClient.query(
        `UPDATE users
         SET email = $1, role = $2, designation = $3, status = $4, passport_url = COALESCE($5, passport_url), password_hash = $6, updated_at = now()
         WHERE id = $7`,
        [normalizedEmail, input.role, designation, input.status, passport, hashPassword(input.password), input.userId]
      );
    } else {
      await sqlClient.query(
        `UPDATE users
         SET email = $1, role = $2, designation = $3, status = $4, passport_url = COALESCE($5, passport_url), updated_at = now()
         WHERE id = $6`,
        [normalizedEmail, input.role, designation, input.status, passport, input.userId]
      );
    }

    // If staff/manager, update staff details
    if (input.role === "staff" || input.role === "manager") {
      await sqlClient.query(
        `UPDATE staff
         SET staff_number = COALESCE($1, staff_number), department = $2, employment_type = COALESCE($3, employment_type), updated_at = now()
         WHERE person_id = $4`,
        [input.staffNumber || null, input.department || null, input.employmentType || null, currentUser.person_id]
      );

      // If designated as teaching staff, ensure teacher record exists
      if (designation === "teaching staff") {
        const [stf] = await sqlClient.query("SELECT id, staff_number FROM staff WHERE person_id = $1", [currentUser.person_id]);
        if (stf) {
          await sqlClient.query(
            `INSERT INTO teachers (staff_id, teacher_number, status)
             VALUES ($1, $2, 'active')
             ON CONFLICT (staff_id) DO NOTHING`,
            [stf.id, `TCH-${stf.staff_number}`]
          );
        }
      }

      // Update manager assignment if staff
      if (input.role === "staff" && input.managerUserId) {
        await sqlClient.query(
          `INSERT INTO manager_staff_assignments (manager_user_id, staff_user_id, assigned_by_user_id, status)
           VALUES ($1, $2, $3, 'active')
           ON CONFLICT (manager_user_id, staff_user_id) DO UPDATE SET status = 'active', updated_at = now()`,
          [input.managerUserId, input.userId, input.actingUserId || null]
        );
      }
    }

    return { success: true, userId: input.userId };
  } else {
    // ----------------- CREATE -----------------
    const existingUser = (await sqlClient.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]))[0];
    if (existingUser) throw new Error(`An account with email ${normalizedEmail} already exists.`);

    let personId: string;

    // If opening a student account linked to an existing student profile
    if (input.role === "student" && input.studentId) {
      const [existingStudent] = await sqlClient.query(
        "SELECT s.id, s.person_id FROM students s WHERE s.id = $1",
        [input.studentId]
      );
      if (!existingStudent) throw new Error("Selected student profile does not exist.");
      personId = existingStudent.person_id;

      // Update student person info
      await sqlClient.query(
        `UPDATE people
         SET first_name = $1, middle_name = $2, last_name = $3, phone = $4, gender = $5, avatar_url = COALESCE($6, avatar_url), updated_at = now()
         WHERE id = $7`,
        [input.firstName, input.middleName || null, input.lastName, input.phone || null, input.gender || null, passport, personId]
      );
    } else {
      // Create new person
      const [personRes] = await sqlClient.query(
        `INSERT INTO people (first_name, middle_name, last_name, email, phone, gender, avatar_url, address, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Katsina, Nigeria', 'active') RETURNING id`,
        [input.firstName, input.middleName || null, input.lastName, normalizedEmail, input.phone || null, input.gender || "male", passport]
      );
      personId = personRes.id;
    }

    const pwd = input.password && input.password.trim() ? input.password : "12345678";
    const [userRes] = await sqlClient.query(
      `INSERT INTO users (person_id, email, password_hash, role, designation, status, passport_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [personId, normalizedEmail, hashPassword(pwd), input.role, designation, input.status, passport]
    );
    const userId = userRes.id;

    // Role-specific initialization
    if (input.role === "staff" || input.role === "manager") {
      const staffNum = input.staffNumber || `SIS-STF-${Math.floor(100 + Math.random() * 900)}`;
      const [staffRes] = await sqlClient.query(
        `INSERT INTO staff (person_id, staff_number, employment_date, employment_type, department, status)
         VALUES ($1, $2, CURRENT_DATE, $3, $4, 'active')
         ON CONFLICT (person_id) DO UPDATE SET staff_number = EXCLUDED.staff_number
         RETURNING id`,
        [personId, staffNum, input.employmentType || "full_time", input.department || (input.role === "manager" ? "Executive Directorate" : "Academic Operations")]
      );

      if (designation === "teaching staff") {
        await sqlClient.query(
          `INSERT INTO teachers (staff_id, teacher_number, status)
           VALUES ($1, $2, 'active')
           ON CONFLICT (staff_id) DO NOTHING`,
          [staffRes.id, `TCH-${staffNum}`]
        );
      }

      if (input.role === "staff" && input.managerUserId) {
        await sqlClient.query(
          `INSERT INTO manager_staff_assignments (manager_user_id, staff_user_id, assigned_by_user_id, status)
           VALUES ($1, $2, $3, 'active')
           ON CONFLICT (manager_user_id, staff_user_id) DO UPDATE SET status = 'active', updated_at = now()`,
          [input.managerUserId, userId, input.actingUserId || null]
        );
      }

      // Seed default Employment Agreement and ID Card into user_documents
      await sqlClient.query(`
        INSERT INTO user_documents (user_id, title, doc_type, file_url, file_name, file_size, category, notes)
        VALUES 
          ($1, 'Official Employment Agreement & Conditions of Service', 'employment_agreement', '/docs/employment-agreement-official.pdf', 'Salamah_Employment_Agreement.pdf', '245 KB', 'legal', 'Verified contract signed by School Directorate Katsina.'),
          ($1, 'Official Staff Security Identity Card', 'id_card', '/docs/staff-id-card.pdf', 'Staff_ID_Card.pdf', '110 KB', 'security', 'Active campus credential with Katsina security clearance.')
        ON CONFLICT DO NOTHING
      `, [userId]);
    } else if (input.role === "student" && !input.studentId) {
      // Create student record if not linked
      const admNum = `SIS/2026/${Math.floor(100 + Math.random() * 900)}`;
      await sqlClient.query(
        `INSERT INTO students (person_id, admission_number, admission_date, status)
         VALUES ($1, $2, CURRENT_DATE, 'active')
         ON CONFLICT (person_id) DO NOTHING`,
        [personId, admNum]
      );

      // Seed student admission document
      await sqlClient.query(`
        INSERT INTO user_documents (user_id, title, doc_type, file_url, file_name, file_size, category, notes)
        VALUES 
          ($1, 'Official Admission Clearance & Enrollment Certificate', 'certificate', '/docs/admission-slip.pdf', 'Admission_Clearance.pdf', '140 KB', 'academic', 'Verified enrollment for Salamah International School Katsina.')
        ON CONFLICT DO NOTHING
      `, [userId]);
    }

    return { success: true, userId };
  }
}

export async function assignStaffToManager(managerUserId: string, staffUserId: string, actingUserId?: string) {
  await sqlClient.query(
    `INSERT INTO manager_staff_assignments (manager_user_id, staff_user_id, assigned_by_user_id, status)
     VALUES ($1, $2, $3, 'active')
     ON CONFLICT (manager_user_id, staff_user_id) DO UPDATE SET status = 'active', updated_at = now()`,
    [managerUserId, staffUserId, actingUserId || null]
  );
  return { success: true };
}

// Backward compatibility aliases
export const getManagersAndStaff = getAllAccessControlUsers;
export const createOrUpdateStaffAccount = createOrUpdateAccessAccount;
