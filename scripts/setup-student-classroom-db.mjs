import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  console.log("Setting up student dossier and classroom management tables...");

  // 1. Create student_file_entries table
  await sql`
    CREATE TABLE IF NOT EXISTS student_file_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      entry_type TEXT NOT NULL, -- 'document', 'text', 'url', 'activity'
      title TEXT NOT NULL,
      content TEXT,
      file_url TEXT,
      file_name TEXT,
      file_size TEXT,
      url_link TEXT,
      category TEXT NOT NULL DEFAULT 'general', -- 'document', 'academic', 'medical', 'discipline', 'pastoral', 'general'
      author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS student_file_entries_student_idx ON student_file_entries (student_id, entry_type);`;

  // 2. Create student_classroom_comments table
  await sql`
    CREATE TABLE IF NOT EXISTS student_classroom_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      category TEXT NOT NULL DEFAULT 'general', -- 'sickness', 'misbehavior', 'academic', 'praise', 'pastoral', 'general'
      comment TEXT NOT NULL,
      comment_date DATE NOT NULL,
      author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS student_classroom_comments_class_idx ON student_classroom_comments (class_id, student_id);`;

  console.log("Tables verified and indexed successfully.");

  // Fetch current session and term
  const [activeSession] = await sql`SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1`;
  const [activeTerm] = await sql`SELECT id FROM academic_terms WHERE is_current = true LIMIT 1`;
  const sessionId = activeSession?.id || (await sql`SELECT id FROM academic_sessions LIMIT 1`)[0]?.id;
  const termId = activeTerm?.id || (await sql`SELECT id FROM academic_terms LIMIT 1`)[0]?.id;

  // Fetch existing students
  const existingStudents = await sql`
    SELECT s.id, s.admission_number, p.first_name, p.last_name, se.class_id, c.name as class_name
    FROM students s
    JOIN people p ON p.id = s.person_id
    LEFT JOIN student_enrollments se ON se.student_id = s.id AND se.status = 'active'
    LEFT JOIN classes c ON c.id = se.class_id
  `;

  console.log(`Found ${existingStudents.length} active students.`);

  // Seed sample documents and activities for existing students
  for (const st of existingStudents) {
    const existingEntries = await sql`SELECT count(*)::int as count FROM student_file_entries WHERE student_id = ${st.id}`;
    if (existingEntries[0]?.count === 0) {
      await sql`
        INSERT INTO student_file_entries (student_id, entry_type, title, content, file_url, file_name, file_size, url_link, category, author_name)
        VALUES 
        (${st.id}, 'document', 'Birth Certificate & National Identity Verification', 'Official municipal birth certificate verified by admissions office.', 'https://res.cloudinary.com/djkudkxmx/image/upload/v1790626126/screen_2_fcf81s.jpg', 'Birth_Certificate.pdf', '1.4 MB', NULL, 'document', 'Registry Office'),
        (${st.id}, 'document', 'Immunization & Health Clearance Dossier', 'Comprehensive medical screening including blood group, genotype and allergy profile.', 'https://res.cloudinary.com/djkudkxmx/image/upload/v1790626126/screen_2_fcf81s.jpg', 'Medical_Clearance_Form.pdf', '890 KB', NULL, 'medical', 'Dr. Amina Sanusi (School Physician)'),
        (${st.id}, 'text', 'Form Tutor First-Quarter Behavioral Appraisal', 'Displays exemplary punctuality, courteous demeanor in morning assembly, and strong aptitude in STEM investigations.', NULL, NULL, NULL, NULL, 'academic', 'Ustaz Bello (Class Tutor)'),
        (${st.id}, 'url', 'Cambridge Learner Digital Portfolio', 'Interactive coursework portfolio containing laboratory experiment write-ups and Arabic calligraphy projects.', NULL, NULL, NULL, 'https://portfolio.salamah.sch.ng/students/' || ${st.admission_number}, 'academic', 'IT Department')
      `;
      console.log(`Seeded dossier entries for student ${st.first_name} ${st.last_name}`);
    }

    if (st.class_id) {
      const existingComments = await sql`SELECT count(*)::int as count FROM student_classroom_comments WHERE student_id = ${st.id}`;
      if (existingComments[0]?.count === 0) {
        await sql`
          INSERT INTO student_classroom_comments (student_id, class_id, category, comment, comment_date, author_name)
          VALUES
          (${st.id}, ${st.class_id}, 'academic', 'Demonstrated exceptional problem solving during double-period mathematics algebra workshop.', CURRENT_DATE - INTERVAL '3 days', 'Mr. Yusuf (Maths Teacher)'),
          (${st.id}, ${st.class_id}, 'sickness', 'Reported slight fever and headache after morning sports. Rested in infirmary for 45 mins; guardian notified.', CURRENT_DATE - INTERVAL '1 day', 'Nurse Fatima'),
          (${st.id}, ${st.class_id}, 'praise', 'Awarded star pupil badge for assisting peer in science laboratory apparatus arrangement.', CURRENT_DATE, 'Ustaz Bello')
        `;
        console.log(`Seeded classroom comments for student ${st.first_name} ${st.last_name}`);
      }
    }
  }

  // Ensure JSS 1 and other classes have a healthy roster of students so mastersheet and classroom cockpit look great
  const [jss1Class] = await sql`SELECT id FROM classes WHERE code = 'JSS1-A' OR code = 'JSS_1' LIMIT 1`;
  if (jss1Class && existingStudents.length < 8) {
    console.log("Seeding a few more students for diverse sections and classes...");
    const sampleAdditions = [
      { first: "Zainab", last: "Aliyu", gender: "female", dob: "2013-05-14", classCode: "JSS_1", adm: "SAL-2026-102" },
      { first: "Ibrahim", last: "Umar", gender: "male", dob: "2013-09-22", classCode: "JSS_1", adm: "SAL-2026-103" },
      { first: "Fatima", last: "Shehu", gender: "female", dob: "2014-02-18", classCode: "JSS_1", adm: "SAL-2026-104" },
      { first: "Usman", last: "Garba", gender: "male", dob: "2015-08-11", classCode: "PRIMARY_5", adm: "SAL-2026-201" },
      { first: "Aisha", last: "Balarabe", gender: "female", dob: "2016-04-03", classCode: "PRIMARY_4", adm: "SAL-2026-202" },
      { first: "Bilal", last: "Kabir", gender: "male", dob: "2019-11-20", classCode: "NURSERY_2", adm: "SAL-2026-301" },
    ];

    for (const item of sampleAdditions) {
      // Find class
      const [cls] = await sql`
        SELECT c.id FROM classes c
        JOIN grades g ON g.id = c.grade_id
        WHERE c.code = ${item.classCode} OR g.code = ${item.classCode}
        LIMIT 1
      `;
      const targetClassId = cls?.id || jss1Class.id;

      // Check if admission number exists
      const [exists] = await sql`SELECT id FROM students WHERE admission_number = ${item.adm}`;
      if (!exists) {
        const studentPhone = `+234803000${item.adm.slice(-3)}`;
        const studentEmail = `${item.first.toLowerCase()}.${item.last.toLowerCase()}@salamah.sch.ng`;

        const [person] = await sql`
          INSERT INTO people (first_name, last_name, gender, date_of_birth, address, phone, email, status)
          VALUES (${item.first}, ${item.last}, ${item.gender}, ${item.dob}, 'Plot 402 Cadastral Zone, Abuja', ${studentPhone}, ${studentEmail}, 'active')
          RETURNING id
        `;

        const [student] = await sql`
          INSERT INTO students (person_id, admission_number, admission_date, status)
          VALUES (${person.id}, ${item.adm}, CURRENT_DATE - INTERVAL '60 days', 'active')
          RETURNING id
        `;

        if (sessionId) {
          await sql`
            INSERT INTO student_enrollments (student_id, session_id, class_id, enrollment_date, status)
            VALUES (${student.id}, ${sessionId}, ${targetClassId}, CURRENT_DATE - INTERVAL '60 days', 'active')
            ON CONFLICT (student_id, session_id) DO NOTHING
          `;
        }

        // Add file entry
        await sql`
          INSERT INTO student_file_entries (student_id, entry_type, title, content, file_url, file_name, file_size, url_link, category, author_name)
          VALUES 
          (${student.id}, 'document', 'Birth Certificate & Attestation', 'Verified document on file.', 'https://res.cloudinary.com/djkudkxmx/image/upload/v1790626126/screen_2_fcf81s.jpg', 'Birth_Cert.pdf', '1.2 MB', NULL, 'document', 'Admissions Office'),
          (${student.id}, 'text', 'Enrollment & Academic Induction Note', 'Admitted in good standing. Placement test passed with distinction.', NULL, NULL, NULL, NULL, 'academic', 'Academic Registrar')
        `;

        // Add classroom comment
        await sql`
          INSERT INTO student_classroom_comments (student_id, class_id, category, comment, comment_date, author_name)
          VALUES (${student.id}, ${targetClassId}, 'academic', 'Active participation in class discussion and group laboratory work.', CURRENT_DATE - INTERVAL '2 days', 'Class Teacher')
        `;

        console.log(`Created student ${item.first} ${item.last} (${item.adm})`);
      }
    }
  }

  // Ensure attendance records exist for JSS 1 students for today
  const classStudents = await sql`
    SELECT s.id as student_id, se.class_id
    FROM student_enrollments se
    JOIN students s ON s.id = se.student_id
    WHERE se.status = 'active'
  `;

  for (const cs of classStudents) {
    if (sessionId && termId && cs.class_id) {
      await sql`
        INSERT INTO attendance_records (session_id, term_id, class_id, student_id, attendance_date, status, recorded_by_user_id, note)
        VALUES (
          ${sessionId},
          ${termId},
          ${cs.class_id},
          ${cs.student_id},
          CURRENT_DATE,
          'present',
          (SELECT id FROM users LIMIT 1),
          'Present and punctual in morning registration.'
        )
        ON CONFLICT (student_id, attendance_date) DO NOTHING
      `;
    }
  }

  console.log("Database setup and seeding completed successfully.");
}

setup().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
