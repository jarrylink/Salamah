import "server-only";
import { sqlClient } from "@/db";

export type ChildApplicationInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  intendedClass: string;
  previousSchool?: string;
  medicalInfo?: string;
};

export type GuardianApplicationInput = {
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianAddress: string;
  guardianOccupation?: string;
  children: ChildApplicationInput[];
  paymentMethod?: string;
};

export async function submitEnrollmentApplication(input: GuardianApplicationInput) {
  if (!input.children || input.children.length === 0) {
    throw new Error("At least one child must be registered.");
  }

  // Get current application fee setting from DB
  let feePerChildKobo = 2500000; // default ₦25,000
  try {
    const [settingRow] = await sqlClient.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'admissions_configuration' LIMIT 1"
    );
    if (settingRow?.setting_value) {
      const val = typeof settingRow.setting_value === "string" ? JSON.parse(settingRow.setting_value) : settingRow.setting_value;
      if (typeof val.applicationFeeKobo === "number") {
        feePerChildKobo = val.applicationFeeKobo;
      }
    }
  } catch (err) {
    console.error("Could not read fee setting:", err);
  }

  const numberOfChildren = input.children.length;
  const totalFeeKobo = feePerChildKobo * numberOfChildren;
  const timestamp = Date.now().toString().slice(-4);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const applicationNumber = `APP-2026-${timestamp}${randomSuffix}`;
  const paymentReference = `PAY-REF-${Date.now()}-${randomSuffix}`;

  const [application] = await sqlClient.query(
    `INSERT INTO admission_applications (
      application_number, guardian_name, guardian_email, guardian_phone, guardian_address,
      guardian_occupation, number_of_children, fee_per_child_kobo, total_fee_kobo,
      payment_status, payment_reference, payment_method, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'paid', $10, $11, 'submitted')
    RETURNING id, application_number, total_fee_kobo, payment_reference`,
    [
      applicationNumber,
      input.guardianName.trim(),
      input.guardianEmail.trim().toLowerCase(),
      input.guardianPhone.trim(),
      input.guardianAddress.trim(),
      input.guardianOccupation?.trim() || null,
      numberOfChildren,
      feePerChildKobo,
      totalFeeKobo,
      paymentReference,
      input.paymentMethod || "online_card",
    ]
  );

  for (const child of input.children) {
    await sqlClient.query(
      `INSERT INTO application_children (
        application_id, first_name, middle_name, last_name, gender, date_of_birth,
        intended_class, previous_school, medical_info, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
      [
        application.id,
        child.firstName.trim(),
        child.middleName?.trim() || null,
        child.lastName.trim(),
        child.gender,
        child.dateOfBirth,
        child.intendedClass,
        child.previousSchool?.trim() || null,
        child.medicalInfo?.trim() || null,
      ]
    );
  }

  return {
    applicationId: application.id,
    applicationNumber: application.application_number,
    totalFeeKobo: application.total_fee_kobo,
    paymentReference: application.payment_reference,
    numberOfChildren,
  };
}

export async function getAdmissionApplications() {
  const applications = await sqlClient.query(`
    SELECT
      a.id, a.application_number, a.guardian_name, a.guardian_email, a.guardian_phone,
      a.guardian_address, a.guardian_occupation, a.number_of_children, a.fee_per_child_kobo,
      a.total_fee_kobo, a.payment_status, a.payment_reference, a.payment_method, a.status,
      a.created_at,
      json_agg(
        json_build_object(
          'id', c.id,
          'firstName', c.first_name,
          'middleName', c.middle_name,
          'lastName', c.last_name,
          'gender', c.gender,
          'dateOfBirth', c.date_of_birth,
          'intendedClass', c.intended_class,
          'previousSchool', c.previous_school,
          'medicalInfo', c.medical_info,
          'status', c.status
        ) ORDER BY c.created_at
      ) as children
    FROM admission_applications a
    LEFT JOIN application_children c ON c.application_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `);
  return applications;
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  const [updated] = await sqlClient.query(
    "UPDATE admission_applications SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, status",
    [status, applicationId]
  );
  return updated;
}

export async function admitApplicationToDatabase(applicationId: string) {
  // 1. Fetch application and children
  const [app] = await sqlClient.query(
    "SELECT * FROM admission_applications WHERE id = $1",
    [applicationId]
  );
  if (!app) throw new Error("Application not found.");

  const children = await sqlClient.query(
    "SELECT * FROM application_children WHERE application_id = $1",
    [applicationId]
  );

  // 2. Register guardian in people & guardians
  let guardianPerson = (await sqlClient.query("SELECT id FROM people WHERE email = $1", [app.guardian_email]))[0];
  if (!guardianPerson) {
    const names = app.guardian_name.trim().split(" ");
    const firstName = names[0] || "Guardian";
    const lastName = names.slice(1).join(" ") || "Parent";
    const res = await sqlClient.query(
      `INSERT INTO people (first_name, last_name, email, phone, address, status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id`,
      [firstName, lastName, app.guardian_email, app.guardian_phone, app.guardian_address]
    );
    guardianPerson = res[0];
  }

  let guardianRecord = (await sqlClient.query("SELECT id FROM guardians WHERE person_id = $1", [guardianPerson.id]))[0];
  if (!guardianRecord) {
    const res = await sqlClient.query(
      "INSERT INTO guardians (person_id, status) VALUES ($1, 'active') RETURNING id",
      [guardianPerson.id]
    );
    guardianRecord = res[0];
  }

  // Active academic session
  const [activeSession] = await sqlClient.query(
    "SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1"
  );
  const sessionId = activeSession?.id;

  // 3. Register each child
  for (const child of children) {
    const childEmail = `student.${child.first_name.toLowerCase()}.${Date.now().toString().slice(-4)}@salamah.edu.ng`;
    const [personRes] = await sqlClient.query(
      `INSERT INTO people (first_name, middle_name, last_name, gender, date_of_birth, email, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING id`,
      [child.first_name, child.middle_name, child.last_name, child.gender, child.date_of_birth, childEmail]
    );
    const personId = personRes.id;

    const admissionNumber = `SAL-2026-${Math.floor(100 + Math.random() * 900)}`;
    const [studentRes] = await sqlClient.query(
      `INSERT INTO students (person_id, admission_number, admission_date, status)
       VALUES ($1, $2, CURRENT_DATE, 'active') RETURNING id`,
      [personId, admissionNumber]
    );
    const studentId = studentRes.id;

    // Link student to guardian
    await sqlClient.query(
      `INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary, is_emergency_contact, status)
       VALUES ($1, $2, 'Parent/Guardian', true, true, 'active')
       ON CONFLICT (student_id, guardian_id) DO NOTHING`,
      [studentId, guardianRecord.id]
    );

    // Link to class if session and class found
    if (sessionId) {
      const [classRow] = await sqlClient.query(
        "SELECT id FROM classes WHERE name ILIKE $1 LIMIT 1",
        [`%${child.intended_class}%`]
      );
      if (classRow) {
        await sqlClient.query(
          `INSERT INTO student_enrollments (student_id, session_id, class_id, enrollment_date, status)
           VALUES ($1, $2, $3, CURRENT_DATE, 'active')
           ON CONFLICT (student_id, session_id) DO NOTHING`,
          [studentId, sessionId, classRow.id]
        );
      }
    }

    // Update child record status
    await sqlClient.query(
      "UPDATE application_children SET status = 'admitted' WHERE id = $1",
      [child.id]
    );
  }

  // Mark application as admitted
  await sqlClient.query(
    "UPDATE admission_applications SET status = 'admitted', updated_at = now() WHERE id = $1",
    [applicationId]
  );

  return { success: true, guardianId: guardianRecord.id, childrenCount: children.length };
}
