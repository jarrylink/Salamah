import { randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const client = neon(process.env.DATABASE_URL);
const sql = (query, values = []) => client.query(query, values);

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
};

async function main() {
  console.log("Setting up Salamah full-stack database schema...");

  // 1. Alter user_role enum to add 'manager' if not present
  try {
    await sql(`DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'user_role' AND e.enumlabel = 'manager'
      ) THEN
        ALTER TYPE user_role ADD VALUE 'manager';
      END IF;
    END $$;`);
    console.log("✓ user_role enum updated with 'manager'");
  } catch (err) {
    console.log("Enum update note:", err.message);
  }

  // 2. Add manager role into roles table
  await sql(`
    INSERT INTO roles (id, code, name, description, is_system)
    VALUES (gen_random_uuid(), 'MANAGER', 'School Manager', 'Department & Operations Manager', true)
    ON CONFLICT (code) DO UPDATE SET name = excluded.name;
  `);

  // 3. Create manager_staff_assignments
  await sql(`
    CREATE TABLE IF NOT EXISTS manager_staff_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      manager_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      staff_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      notes TEXT,
      status account_status NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT manager_staff_unique UNIQUE (manager_user_id, staff_user_id)
    );
  `);
  console.log("✓ manager_staff_assignments table created");

  // 4. Create offices table
  await sql(`
    CREATE TABLE IF NOT EXISTS offices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      location TEXT,
      responsibilities TEXT NOT NULL,
      assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      status account_status NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("✓ offices table created");

  // 5. Create office_logs table
  await sql(`
    CREATE TABLE IF NOT EXISTS office_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
      author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      log_date DATE NOT NULL DEFAULT CURRENT_DATE,
      week_summary TEXT NOT NULL,
      daily_tasks_carried_out TEXT NOT NULL,
      challenges TEXT,
      next_week_plan TEXT,
      status TEXT NOT NULL DEFAULT 'submitted',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("✓ office_logs table created");

  // 6. Create school_tasks table
  await sql(`
    CREATE TABLE IF NOT EXISTS school_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      responsibility_document TEXT NOT NULL,
      assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      frequency TEXT NOT NULL DEFAULT 'daily',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("✓ school_tasks table created");

  // 7. Create school_task_logs table
  await sql(`
    CREATE TABLE IF NOT EXISTS school_task_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID NOT NULL REFERENCES school_tasks(id) ON DELETE CASCADE,
      staff_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      log_date DATE NOT NULL DEFAULT CURRENT_DATE,
      report TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("✓ school_task_logs table created");

  // 8. Create elearning_resources table
  await sql(`
    CREATE TABLE IF NOT EXISTS elearning_resources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
      class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
      resource_type TEXT NOT NULL DEFAULT 'url',
      content TEXT NOT NULL,
      file_name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("✓ elearning_resources table created");

  // 9. Create cms_sections table
  await sql(`
    CREATE TABLE IF NOT EXISTS cms_sections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT,
      content JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("✓ cms_sections table created");

  // 10. Create admission_applications table
  await sql(`
    CREATE TABLE IF NOT EXISTS admission_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_number TEXT NOT NULL UNIQUE,
      guardian_name TEXT NOT NULL,
      guardian_email TEXT NOT NULL,
      guardian_phone TEXT NOT NULL,
      guardian_address TEXT NOT NULL,
      guardian_occupation TEXT,
      number_of_children INTEGER NOT NULL DEFAULT 1,
      fee_per_child_kobo INTEGER NOT NULL DEFAULT 2500000,
      total_fee_kobo INTEGER NOT NULL DEFAULT 2500000,
      payment_status TEXT NOT NULL DEFAULT 'paid',
      payment_reference TEXT NOT NULL UNIQUE,
      payment_method TEXT NOT NULL DEFAULT 'online_card',
      status TEXT NOT NULL DEFAULT 'submitted',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("✓ admission_applications table created");

  // 11. Create application_children table
  await sql(`
    CREATE TABLE IF NOT EXISTS application_children (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL REFERENCES admission_applications(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      middle_name TEXT,
      last_name TEXT NOT NULL,
      gender TEXT NOT NULL,
      date_of_birth DATE NOT NULL,
      intended_class TEXT NOT NULL,
      previous_school TEXT,
      medical_info TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("✓ application_children table created");

  // 12. Create letterhead_documents table
  await sql(`
    CREATE TABLE IF NOT EXISTS letterhead_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reference_number TEXT NOT NULL,
      sender_title TEXT NOT NULL,
      sender_office TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_address TEXT,
      salutation TEXT NOT NULL,
      heading TEXT NOT NULL,
      content TEXT NOT NULL,
      closure TEXT NOT NULL,
      signatory_name TEXT NOT NULL,
      signatory_role TEXT NOT NULL,
      signature_url TEXT,
      letter_date DATE NOT NULL DEFAULT CURRENT_DATE,
      author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("✓ letterhead_documents table created");

  // 13. Create system_settings table
  await sql(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      setting_key TEXT NOT NULL UNIQUE,
      setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("✓ system_settings table created");

  // 14. Seed or update required user accounts:
  // superadmin@salamah.edu.ng -> 12345678
  // manager1@salamah.edu.ng -> 12345678
  // staff1@salamah.edu.ng -> 12345678
  // student1@salamah.edu.ng -> 12345678
  const defaultPassword = "12345678";
  const passwordHash = hashPassword(defaultPassword);

  async function upsertPerson(firstName, lastName, email, phone = null) {
    const existing = (await sql("SELECT id FROM people WHERE email = $1", [email]))[0];
    if (existing) return existing.id;
    const res = await sql(
      "INSERT INTO people (first_name, last_name, email, phone, status) VALUES ($1, $2, $3, $4, 'active') RETURNING id",
      [firstName, lastName, email, phone]
    );
    return res[0].id;
  }

  async function upsertUser(email, firstName, lastName, role) {
    const personId = await upsertPerson(firstName, lastName, email);
    const existing = (await sql("SELECT id FROM users WHERE email = $1", [email]))[0];
    let userId;
    if (existing) {
      userId = existing.id;
      await sql(
        "UPDATE users SET password_hash = $1, role = $2, status = 'active', updated_at = now() WHERE id = $3",
        [passwordHash, role, userId]
      );
    } else {
      const res = await sql(
        "INSERT INTO users (person_id, email, password_hash, role, status) VALUES ($1, $2, $3, $4, 'active') RETURNING id",
        [personId, email, passwordHash, role]
      );
      userId = res[0].id;
    }
    return { userId, personId };
  }

  // Super Admin
  const superadmin = await upsertUser("superadmin@salamah.edu.ng", "Ibrahim", "Suleiman", "superadmin");
  console.log("✓ superadmin@salamah.edu.ng configured (pass: 12345678)");

  // Manager
  const manager = await upsertUser("manager1@salamah.edu.ng", "Dr. Kabiru", "Muhammad", "manager");
  // ensure staff record exists
  const existingManagerStaff = (await sql("SELECT id FROM staff WHERE person_id = $1", [manager.personId]))[0];
  if (!existingManagerStaff) {
    await sql(
      "INSERT INTO staff (person_id, staff_number, employment_date, employment_type, department, status) VALUES ($1, 'MGR-001', '2024-01-15', 'full_time', 'School Administration', 'active')",
      [manager.personId]
    );
  }
  console.log("✓ manager1@salamah.edu.ng configured (pass: 12345678)");

  // Staff
  const staffUser = await upsertUser("staff1@salamah.edu.ng", "Aliyu", "Bello", "staff");
  const existingStaffRecord = (await sql("SELECT id FROM staff WHERE person_id = $1", [staffUser.personId]))[0];
  let staffRecordId;
  if (!existingStaffRecord) {
    const res = await sql(
      "INSERT INTO staff (person_id, staff_number, employment_date, employment_type, department, status, metadata) VALUES ($1, 'STF-010', '2024-03-01', 'full_time', 'Academic Operations & Facilities', 'active', $2) RETURNING id",
      [staffUser.personId, JSON.stringify({ pictureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300", resumeFile: "https://salamah.edu.ng/docs/staff-aliyu-bello-cv.pdf" })]
    );
    staffRecordId = res[0].id;
  } else {
    staffRecordId = existingStaffRecord.id;
  }
  console.log("✓ staff1@salamah.edu.ng configured (pass: 12345678)");

  // Assign staff1 to manager1
  await sql(`
    INSERT INTO manager_staff_assignments (manager_user_id, staff_user_id, assigned_by_user_id, notes, status)
    VALUES ($1, $2, $3, 'Senior operations & administrative staff supervision', 'active')
    ON CONFLICT (manager_user_id, staff_user_id) DO UPDATE SET status = 'active', updated_at = now();
  `, [manager.userId, staffUser.userId, superadmin.userId]);
  console.log("✓ manager1 assigned to supervise staff1");

  // Student 1
  const studentUser = await upsertUser("student1@salamah.edu.ng", "Farouk", "Ibrahim", "student");
  const existingStudentRecord = (await sql("SELECT id FROM students WHERE person_id = $1", [studentUser.personId]))[0];
  let studentId;
  if (!existingStudentRecord) {
    const res = await sql(
      "INSERT INTO students (person_id, admission_number, admission_date, status) VALUES ($1, 'SAL-2026-101', '2026-09-01', 'active') RETURNING id",
      [studentUser.personId]
    );
    studentId = res[0].id;
  } else {
    studentId = existingStudentRecord.id;
  }

  // Enroll student1 into JSS 1 in active session
  const activeSession = (await sql("SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1"))[0] || (await sql("SELECT id FROM academic_sessions ORDER BY start_date DESC LIMIT 1"))[0];
  const jss1Class = (await sql("SELECT id FROM classes WHERE name = 'JSS 1' LIMIT 1"))[0];
  if (activeSession && jss1Class) {
    await sql(`
      INSERT INTO student_enrollments (student_id, session_id, class_id, enrollment_date, status)
      VALUES ($1, $2, $3, '2026-09-01', 'active')
      ON CONFLICT (student_id, session_id) DO UPDATE SET class_id = excluded.class_id;
    `, [studentId, activeSession.id, jss1Class.id]);
    console.log("✓ student1 enrolled into JSS 1");
  }

  // 15. Seed Sample Offices
  const officesData = [
    {
      name: "Office of the Vice Principal (Academic)",
      code: "VP-ACAD",
      location: "Admin Block, Floor 2, Room 204",
      responsibilities: "Overviews secondary school curriculum delivery, timetable compliance, assessment moderation, continuous assessment audits, and teacher performance appraisals.",
      assigned_user_id: manager.userId
    },
    {
      name: "Office of Student Affairs & Pastoral Care",
      code: "STU-AFFAIRS",
      location: "Student Centre, Block B, Suite 101",
      responsibilities: "Coordinates student discipline, hostel prefects, clubs and societies, extracurricular activities, mentorship programs, and daily morning devotion attendance.",
      assigned_user_id: staffUser.userId
    },
    {
      name: "Bursary & Accounts Directorate",
      code: "BURSARY",
      location: "Bursary Complex, Room G-02",
      responsibilities: "Manages student billing, school fees reconciliation, payroll processing, supplier ledger audits, petty cash administration, and termly financial reporting.",
      assigned_user_id: manager.userId
    },
    {
      name: "ICT Systems & Educational Technology Office",
      code: "ICT-EDUTECH",
      location: "Technology Hub, Room 108",
      responsibilities: "Maintains fiber optic network infrastructure, smart interactive classroom whiteboards, student computer labs, e-learning content management, and online exam portals.",
      assigned_user_id: staffUser.userId
    }
  ];

  for (const off of officesData) {
    const existing = (await sql("SELECT id FROM offices WHERE code = $1", [off.code]))[0];
    let officeId;
    if (existing) {
      officeId = existing.id;
      await sql("UPDATE offices SET assigned_user_id = $1, responsibilities = $2, location = $3, updated_at = now() WHERE id = $4", [off.assigned_user_id, off.responsibilities, off.location, officeId]);
    } else {
      const res = await sql(
        "INSERT INTO offices (name, code, location, responsibilities, assigned_user_id, status) VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id",
        [off.name, off.code, off.location, off.responsibilities, off.assigned_user_id]
      );
      officeId = res[0].id;
    }

    // Insert weekly log sample if none
    const existingLogs = await sql("SELECT id FROM office_logs WHERE office_id = $1 LIMIT 1", [officeId]);
    if (existingLogs.length === 0) {
      await sql(`
        INSERT INTO office_logs (office_id, author_user_id, log_date, week_summary, daily_tasks_carried_out, challenges, next_week_plan, status)
        VALUES ($1, $2, CURRENT_DATE, 'Term 1 Week 4 Academic Coordination & Inspection',
        '1. Monday: Conducted morning inspection of JSS & SS lesson plans.\n2. Tuesday: Monitored laboratory practicals in Chemistry and Physics.\n3. Wednesday: Held briefing with class teachers regarding midterm assessments.\n4. Thursday: Audited continuous assessment logbooks for 45 subjects.\n5. Friday: Reviewed student attendance and dispatched pastoral letters.',
        'Minor delay in submission of three JSS 2 social studies scores due to internet upgrade.',
        'Finalize midterm examination timetable and supervise printing of test question papers.',
        'submitted')
      `, [officeId, off.assigned_user_id]);
    }
  }
  console.log("✓ Sample offices & weekly logs initialized");

  // 16. Seed Sample Tasks
  const tasksData = [
    {
      title: "Campus Landscaping & Botanical Garden Maintenance",
      category: "Gardening & Horticulture",
      description: "Daily lawn mowing, hedge trimming, watering the botanical orchard, and ornamental plant care.",
      responsibility_document: `# Standard Operating Procedure: School Landscaping
1. Daily 6:30 AM lawn irrigation across the central quadrangle and sports pavilion.
2. Weekly Wednesday hedging of perimeter bougainvillea fences.
3. Friday waste composting and leaf clearing across academic wings.
4. Quarterly fertilizer enrichment for citrus and mango orchards.`,
      assigned_user_id: staffUser.userId,
      frequency: "daily"
    },
    {
      title: "24/7 Gatehouse Security & Visitor Escort Protocol",
      category: "Security & Safety",
      description: "Manning main gates, student pick-up verification with biometric parent tags, and campus perimeter patrols.",
      responsibility_document: `# Security Operations Directive
1. Ensure all entry gates remain locked during lecture hours (8:00 AM - 2:30 PM).
2. Issue visitor badges only upon government-issued photo ID verification.
3. Verify Guardian Identity Pass before allowing any student exit.
4. Execute hourly armed patrol sync with Abuja Police Command liaison.`,
      assigned_user_id: staffUser.userId,
      frequency: "daily"
    },
    {
      title: "Central Power Generating Plant & Diesel Refueling",
      category: "Engineering & Utilities",
      description: "Operation of the 500kVA Perkins dual generators, daily oil level audits, and fueling logs.",
      responsibility_document: `# Power Plant Standard Operating Protocol
1. Daily oil pressure and coolant check at 06:00 and 18:00.
2. Log generator operating hours and diesel fuel consumption per kWh.
3. Execute switchover from Abuja DISCO national grid within 45 seconds of outage.
4. Monthly filter replacement and scheduled servicing.`,
      assigned_user_id: staffUser.userId,
      frequency: "daily"
    },
    {
      title: "Hostel Sanitation & Water Treatment Plant Supervision",
      category: "Sanitation & Facilities",
      description: "Supervising deep cleaning of male and female boarding facilities and chlorination of central borehole water.",
      responsibility_document: `# Hostel Sanitation Directive
1. Daily inspection of dormitories at 08:30 AM following morning roll-call.
2. Water treatment testing: ensure pH 7.2 and free chlorine level at 0.5 ppm.
3. Bi-weekly fumigation of drainage corridors and refuse chambers.
4. Immediate reporting of plumbing defects to maintenance team.`,
      assigned_user_id: staffUser.userId,
      frequency: "daily"
    }
  ];

  for (const t of tasksData) {
    const existing = (await sql("SELECT id FROM school_tasks WHERE title = $1", [t.title]))[0];
    let taskId;
    if (existing) {
      taskId = existing.id;
      await sql("UPDATE school_tasks SET assigned_user_id = $1, responsibility_document = $2, updated_at = now() WHERE id = $3", [t.assigned_user_id, t.responsibility_document, taskId]);
    } else {
      const res = await sql(
        "INSERT INTO school_tasks (title, category, description, responsibility_document, assigned_user_id, frequency, status) VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING id",
        [t.title, t.category, t.description, t.responsibility_document, t.assigned_user_id, t.frequency]
      );
      taskId = res[0].id;
    }

    const existingLogs = await sql("SELECT id FROM school_task_logs WHERE task_id = $1 LIMIT 1", [taskId]);
    if (existingLogs.length === 0) {
      await sql(`
        INSERT INTO school_task_logs (task_id, staff_user_id, log_date, report, status, notes)
        VALUES ($1, $2, CURRENT_DATE, 'Daily inspection successfully completed. All assigned protocols executed according to standard operating manual.', 'completed', 'Clean operation without incidents.')
      `, [taskId, t.assigned_user_id]);
    }
  }
  console.log("✓ Sample school tasks & duty documents initialized");

  // 17. Seed E-Learning Resources
  const mathSubject = (await sql("SELECT id FROM subjects WHERE name ILIKE '%Mathematics%' LIMIT 1"))[0];
  const englishSubject = (await sql("SELECT id FROM subjects WHERE name ILIKE '%English%' LIMIT 1"))[0];
  const physicsSubject = (await sql("SELECT id FROM subjects WHERE name ILIKE '%Physics%' LIMIT 1"))[0];

  const elearningData = [
    {
      title: "Algebraic Expressions & Quadratic Equations Masterclass",
      description: "Comprehensive study notes covering factorization of quadratic polynomials, completing the square, and graphical solutions.",
      subject_id: mathSubject?.id,
      class_id: jss1Class?.id,
      resource_type: "url",
      content: "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratic-functions-equations",
      file_name: "Quadratic_Equations_Syllabus.pdf"
    },
    {
      title: "English Grammar: Concord, Syntax and Oral Phonology",
      description: "Interactive pronunciation drills, vowels and diphthongs practice audio, and rules of subject-verb agreement.",
      subject_id: englishSubject?.id,
      class_id: jss1Class?.id,
      resource_type: "text",
      content: `# English Studies: Subject-Verb Agreement Rules
1. A singular subject takes a singular verb: "The scholar studies diligently."
2. Compound subjects joined by 'and' take a plural verb: "Musa and Aisha are prefects."
3. Expressions like 'together with', 'as well as' do not affect the grammatical subject: "The Principal, accompanied by staff, has arrived."
4. Indefinite pronouns like 'each', 'everyone' take singular verbs: "Everyone is present."`,
      file_name: "Concord_Rules_Study_Guide.txt"
    },
    {
      title: "Introduction to Mechanics, Vector Quantities & Newton's Laws",
      description: "Senior secondary physics simulation package with worked examination examples and WAEC past questions.",
      subject_id: physicsSubject?.id,
      class_id: jss1Class?.id,
      resource_type: "file",
      content: "https://salamah.edu.ng/learning-hub/physics-mechanics-unit1.pdf",
      file_name: "Physics_Mechanics_Unit1.pdf"
    }
  ];

  for (const item of elearningData) {
    const existing = (await sql("SELECT id FROM elearning_resources WHERE title = $1", [item.title]))[0];
    if (!existing) {
      await sql(`
        INSERT INTO elearning_resources (title, description, subject_id, class_id, resource_type, content, file_name, status, author_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)
      `, [item.title, item.description, item.subject_id, item.class_id, item.resource_type, item.content, item.file_name, superadmin.userId]);
    }
  }
  console.log("✓ E-Learning resource library initialized");

  // 18. Seed CMS Sections for Nigerian Elite Secondary School
  const cmsDefaults = [
    {
      section_key: "hero",
      title: "Nurturing World-Class Scholars with Academic Mastery & Islamic Moral Integrity",
      subtitle: "Welcome to Salamah International School, Nigeria's premier private academy delivering Cambridge International & Nigerian curricula across a state-of-the-art 45-acre campus in Maitama, Abuja.",
      content: {
        badge: "Admissions Open for 2026/2027 Academic Session",
        ctaPrimaryText: "Enrol Your Child Now",
        ctaSecondaryText: "Download Prospectus",
        heroImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1470&auto=format&fit=crop",
        highlights: [
          { value: "100%", label: "WAEC & Cambridge IGCSE Pass Rate" },
          { value: "12:1", label: "Student to Educator Ratio" },
          { value: "₦500M+", label: "STEM & Robotics Innovation Labs" },
          { value: "Top 1%", label: "National Olympiad & Ivy League Placements" }
        ]
      }
    },
    {
      section_key: "about",
      title: "Our Heritage of Scholarly Rigour & Ethical Distinction",
      subtitle: "Established to produce visionary thinkers, innovators, and moral anchors for Nigeria and the global community.",
      content: {
        mission: "To inspire an unquenchable thirst for knowledge, critical inquiry, leadership, and unwavering Islamic character in every child.",
        vision: "To be recognized globally as the foremost African centre of holistic secondary education and ethical leadership.",
        values: ["Excellence (Ihsan)", "Integrity (Amanah)", "Intellectual Inquiry (Hikmah)", "Discipline & Empathy"],
        historyText: "Founded in the diplomatic enclave of Abuja, Salamah blends the timeless tradition of Islamic scholarship with the rigor of modern Cambridge STEM, coding, robotics, and creative arts.",
        principalQuote: "At Salamah, education is not merely preparation for exams; it is the deliberate cultivation of leaders who will shape humanity with wisdom, humility, and excellence.",
        principalName: "Dr. Kabiru Muhammad, Ph.D. (Cantab)",
        principalTitle: "Executive Principal & Director of Studies"
      }
    },
    {
      section_key: "curriculum",
      title: "Dual Academic Excellence: Nigerian National & Cambridge British Curriculum",
      subtitle: "A balanced, future-forward pedagogical pathway designed for seamless entry into world-class universities in Nigeria, the UK, the US, and Canada.",
      content: {
        wings: [
          {
            name: "Nursery & Early Childhood Wing",
            ages: "Ages 2 - 5",
            description: "Montessori-infused foundational literacy, numeracy, Quranic phonetics, sensory motor skills, and creative inquiry in safe, nurturing environments."
          },
          {
            name: "Primary Academy",
            ages: "Ages 6 - 11",
            description: "Rigorous literacy, Cambridge Primary Science, Singapore Mathematics, Civic Leadership, ICT coding, and conversational Arabic & French."
          },
          {
            name: "Junior Secondary (JSS 1 - 3)",
            ages: "Ages 11 - 14",
            description: "BECE preparation, basic technology, STEM robotics, foundational economics, social habits, and classical Quranic recitation."
          },
          {
            name: "Senior Secondary (SS 1 - 3 & Cambridge IGCSE)",
            ages: "Ages 14 - 17",
            description: "Specialized tracks in Pure Science & Medicine, Engineering & Tech, Business & Economics, and Humanities, integrated with SAT/IELTS prep."
          }
        ]
      }
    },
    {
      section_key: "facilities",
      title: "World-Class Campus Amenities",
      subtitle: "Purpose-built infrastructure designed to foster intellectual, athletic, and spiritual growth.",
      content: {
        items: [
          { title: "Ultra-Modern STEM & AI Robotics Hub", desc: "Equipped with 3D printers, IoT microcontrollers, drone testing cages, and dual physics/chemistry research laboratories." },
          { title: "Olympic-Standard Aquatic & Sports Complex", desc: "Fitted with a 50-meter heated swimming pool, FIFA-grade turf pitch, basketball courts, and equestrian club facilities." },
          { title: "Executive Boarding Halls of Residence", desc: "Air-conditioned twin-share suites with 24/7 power backup, CCTV surveillance, qualified medical clinic, and residential tutors." },
          { title: "Grand Islamic Centre & Central Mosque", desc: "A magnificent 1,500-capacity auditorium for daily prayers, Friday Khutbahs, Hifz Quranic memorization, and moral discourse." },
          { title: "Smart Digital Classrooms", desc: "Interactive 86-inch 4K Promethean panels, dedicated student iPads, and gigabit fiber-optic campus network." },
          { title: "Nutritional Dining & Gourmet Cafeteria", desc: "Managed by certified clinical nutritionists serving balanced, halal Nigerian and continental cuisines." }
        ]
      }
    },
    {
      section_key: "fees",
      title: "Transparent Investment in Your Child's Destiny",
      subtitle: "Providing unparalleled value, world-class faculty, premium boarding, and lifetime mentorship.",
      content: {
        applicationFeeNaira: 25000,
        currencySymbol: "₦",
        tuitionSummary: "Tuition packages include all Cambridge learning modules, textbooks, laboratory consumables, smart device software access, and standard extracurriculars.",
        tiers: [
          { title: "Day Scholar (JSS 1 - SS 3)", price: "₦1,850,000 / term", features: ["Full academic curriculum", "Lunch & afternoon tea", "All sports clubs & lab supplies", "Cambridge examination prep"] },
          { title: "Full Boarding Scholar", price: "₦3,250,000 / term", features: ["Executive en-suite boarding room", "5 nutritious meals & snacks daily", "Evening prep & weekend mentorship", "Laundry, clinic & recreational access"] },
          { title: "Presidential Merit Scholar", price: "Up to 50% Tuition Waiver", features: ["Awarded to top 3% Olympiad candidates", "Comprehensive scholarship covering tuition", "Exclusive research mentorship", "National representation sponsorship"] }
        ]
      }
    },
    {
      section_key: "testimonials",
      title: "Voices of Our Distinguished Community",
      subtitle: "What esteemed parents and high-achieving alumni say about their Salamah experience.",
      content: {
        quotes: [
          {
            quote: "Salamah transformed my daughter not just into a straight-A Cambridge scholar, but gave her profound humility, Islamic character, and eloquence. She has now been admitted to Imperial College London with distinction.",
            author: "Hajiya Maryam Al-Hassan",
            designation: "Executive Director, Federal Ministry of Finance & Parent"
          },
          {
            quote: "The personalized attention from the faculty, the robotics lab, and the disciplined hostel environment are second to none in West Africa. It is the best investment we made for our sons.",
            author: "Engr. Farouk Bello, FNSE",
            designation: "Managing Director, Kaduna Refining & Petrochemicals"
          },
          {
            quote: "Salamah taught me that true intellect is grounded in service and moral responsibility. The mentorship from our Principal guided my successful admission to MIT.",
            author: "Mustapha Sani",
            designation: "Salamah Alumnus (Class of 2024), MIT Freshman"
          }
        ]
      }
    },
    {
      section_key: "contact",
      title: "Begin Your Child's Journey at Salamah",
      subtitle: "Our Admissions Directorate is delighted to schedule your private campus tour.",
      content: {
        address: "Plot 1042 Diplomatic Zone, Maitama Extension, Abuja, FCT, Nigeria",
        phone1: "+234 (0) 9 461 8000",
        phone2: "+234 (0) 803 123 4567",
        email: "admissions@salamah.edu.ng",
        officeHours: "Monday – Friday: 07:30 AM – 04:30 PM | Saturday: 09:00 AM – 01:00 PM (By Appointment)",
        accreditations: ["Cambridge International School (NG482)", "Federal Ministry of Education Accredited", "WAEC & NECO Examination Centre"]
      }
    }
  ];

  for (const c of cmsDefaults) {
    await sql(`
      INSERT INTO cms_sections (section_key, title, subtitle, content, is_active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (section_key) DO UPDATE
      SET title = excluded.title, subtitle = excluded.subtitle, content = excluded.content, updated_at = now();
    `, [c.section_key, c.title, c.subtitle, JSON.stringify(c.content)]);
  }
  console.log("✓ CMS landing page database records initialized");

  // 19. Seed System Settings
  const settingsData = [
    {
      key: "school_profile",
      value: {
        name: "Salamah International School",
        motto: "Knowledge, Character & Leadership in Service of Humanity",
        address: "Plot 1042 Diplomatic Zone, Maitama Extension, Abuja, Nigeria",
        email: "info@salamah.edu.ng",
        phone: "+234 9 461 8000",
        website: "https://www.salamah.edu.ng",
        currency: "NGN",
        currencySymbol: "₦",
        establishedYear: 2012,
        rcNumber: "RC-1849204"
      },
      desc: "Official school identification and legal registration parameters"
    },
    {
      key: "admissions_configuration",
      value: {
        applicationFeeKobo: 2500000,
        applicationFeeFormatted: "₦25,000",
        isOpen: true,
        currentApplicationSession: "2026/2027",
        entranceExamDates: ["Saturday 15th November 2026", "Saturday 13th December 2026"],
        notificationEmail: "admissions@salamah.edu.ng"
      },
      desc: "Controls entrance application form pricing, active intake cycle and notifications"
    },
    {
      key: "academic_signatories",
      value: {
        principal: { name: "Dr. Kabiru Muhammad", title: "Executive Principal", signatureText: "Dr. K. Muhammad (Ph.D)" },
        vicePrincipal: { name: "Mrs. Zainab Abdullahi", title: "Vice Principal (Academics)", signatureText: "Z. Abdullahi (M.Ed)" },
        registrar: { name: "Mallam Musa Sani", title: "Academic Registrar", signatureText: "M. Sani (B.Sc, MPA)" }
      },
      desc: "Authorized signatories for report cards, transcripts and official letterheads"
    }
  ];

  for (const s of settingsData) {
    await sql(`
      INSERT INTO system_settings (setting_key, setting_value, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (setting_key) DO UPDATE
      SET setting_value = excluded.setting_value, description = excluded.description, updated_at = now();
    `, [s.key, JSON.stringify(s.value), s.desc]);
  }
  console.log("✓ System settings initialized in Neon DB");

  // 20. Seed Sample Letterhead Document
  const sampleLetter = {
    reference_number: "SIS/ADM/2026/0412",
    sender_title: "Office of the Executive Principal",
    sender_office: "Directorate of Academic Admissions & Student Affairs",
    recipient_name: "Mallam Farouk & Hajiya Maryam Bello",
    recipient_address: "Plot 42, Aso Drive, Asokoro, Abuja, Nigeria",
    salutation: "Respected Parents / Guardians,",
    heading: "PROVISIONAL ADMISSION OFFER & ENROLMENT INTO 2026/2027 ACADEMIC SESSION",
    content: `Following your child's commendable performance in our competitive entrance assessment and subsequent family interview, the Admissions Committee has recommended, and the Board of Governors has approved, the offer of provisional admission into Salamah International School for the 2026/2027 Academic Session.

At Salamah, we consider the education of every young scholar as a sacred trust. Our rigorous Cambridge British and Nigerian curriculum, world-class science laboratories, Olympic sports pavilion, and deeply grounded moral guidance are designed to help your child realize their highest potential.

Kindly note the following key milestones:
1. Acceptance confirmation and payment of acceptance deposit must be finalized within fourteen (14) days.
2. Orientation for new scholars and boarding induction will commence on Sunday, 31st August 2026.
3. Complete boarding kits, uniform fittings, and health clearances are to be submitted to the School Matron during registration.

We congratulate your family and warmly welcome you to our distinguished school community.`,
    closure: "Yours faithfully,",
    signatory_name: "Dr. Kabiru Muhammad",
    signatory_role: "Executive Principal & Director of Studies",
    signature_url: ""
  };

  const existingLetter = (await sql("SELECT id FROM letterhead_documents WHERE reference_number = $1", [sampleLetter.reference_number]))[0];
  if (!existingLetter) {
    await sql(`
      INSERT INTO letterhead_documents (
        reference_number, sender_title, sender_office, recipient_name, recipient_address,
        salutation, heading, content, closure, signatory_name, signatory_role, signature_url,
        letter_date, author_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_DATE, $13);
    `, [
      sampleLetter.reference_number, sampleLetter.sender_title, sampleLetter.sender_office,
      sampleLetter.recipient_name, sampleLetter.recipient_address, sampleLetter.salutation,
      sampleLetter.heading, sampleLetter.content, sampleLetter.closure, sampleLetter.signatory_name,
      sampleLetter.signatory_role, sampleLetter.signature_url, superadmin.userId
    ]);
  }
  console.log("✓ Sample school letterhead document stored in DB");

  // 21. Seed a sample admission application with children
  const existingApp = (await sql("SELECT id FROM admission_applications WHERE application_number = 'APP-2026-0001'"))[0];
  if (!existingApp) {
    const appRes = await sql(`
      INSERT INTO admission_applications (
        application_number, guardian_name, guardian_email, guardian_phone, guardian_address,
        guardian_occupation, number_of_children, fee_per_child_kobo, total_fee_kobo,
        payment_status, payment_reference, payment_method, status
      ) VALUES (
        'APP-2026-0001', 'Alhaji Mansur Danbatta', 'danbatta.mansur@sample.ng', '+2348023456789',
        'No 15 Gana Street, Maitama, Abuja', 'Managing Director & Investor', 2, 2500000, 5000000,
        'paid', 'REF-PAY-2026-0089', 'online_card', 'under_review'
      ) RETURNING id;
    `);
    const appId = appRes[0].id;
    await sql(`
      INSERT INTO application_children (
        application_id, first_name, middle_name, last_name, gender, date_of_birth,
        intended_class, previous_school, medical_info, status
      ) VALUES
      ($1, 'Khadijah', 'Mansur', 'Danbatta', 'female', '2014-04-12', 'JSS 1', 'Capital Science Academy', 'No allergies. Excellent health.', 'pending'),
      ($1, 'Ahmad', 'Mansur', 'Danbatta', 'male', '2016-08-25', 'Primary 5', 'British Oasis School Abuja', 'Mild asthma under control.', 'pending');
    `, [appId]);
    console.log("✓ Sample admission application with 2 children initialized");
  }

  // 22. Seed sample assessment scores for student1 so results display with Term 1, 2, 3 and Exam
  const terms = await sql("SELECT id, term_number, name FROM academic_terms WHERE session_id = $1 ORDER BY term_number", [activeSession.id]);
  const sampleSubjects = await sql("SELECT id, name FROM subjects LIMIT 4");
  const ca1Type = (await sql("SELECT id, maximum_score FROM assessment_types WHERE code = 'CA1' LIMIT 1"))[0];
  const ca2Type = (await sql("SELECT id, maximum_score FROM assessment_types WHERE code = 'CA2' LIMIT 1"))[0];
  const examType = (await sql("SELECT id, maximum_score FROM assessment_types WHERE code = 'EXAM' LIMIT 1"))[0];

  if (activeSession && jss1Class && terms.length > 0 && sampleSubjects.length > 0) {
    for (const term of terms) {
      for (const subj of sampleSubjects) {
        for (const [type, score] of [[ca1Type, 9], [ca2Type, 9], [examType, 72]]) {
          if (!type) continue;
          let assess = (await sql(`
            SELECT id FROM assessments
            WHERE session_id = $1 AND term_id = $2 AND class_id = $3 AND subject_id = $4 AND assessment_type_id = $5
          `, [activeSession.id, term.id, jss1Class.id, subj.id, type.id]))[0];

          if (!assess) {
            const res = await sql(`
              INSERT INTO assessments (session_id, term_id, class_id, subject_id, assessment_type_id, name, maximum_score, status)
              VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
              ON CONFLICT (session_id, term_id, class_id, subject_id, assessment_type_id) DO UPDATE SET status = 'open'
              RETURNING id;
            `, [activeSession.id, term.id, jss1Class.id, subj.id, type.id, `Assessment - ${subj.name}`, type.maximum_score]);
            assess = res[0];
          }

          if (assess && studentId) {
            await sql(`
              INSERT INTO assessment_scores (assessment_id, student_id, score, entered_by_user_id)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (assessment_id, student_id) DO UPDATE SET score = excluded.score, updated_at = now();
            `, [assess.id, studentId, score, superadmin.userId]);
          }
        }
      }
    }
    console.log("✓ Complete Term 1, Term 2, Term 3 & Exam sample scores seeded for student1");
  }

  console.log("\n========================================================");
  console.log("Salamah database setup and seeding successfully completed!");
  console.log("Accounts ready with password '12345678':");
  console.log("  Super Admin: superadmin@salamah.edu.ng");
  console.log("  Manager:     manager1@salamah.edu.ng");
  console.log("  Staff:       staff1@salamah.edu.ng");
  console.log("  Student:     student1@salamah.edu.ng");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("Setup error:", err);
  process.exit(1);
});
