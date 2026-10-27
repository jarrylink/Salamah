import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { randomBytes, scryptSync } from 'crypto';

dotenv.config({ path: '.env.local' });

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
}

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  console.log('--- Setting up Access Control Schema & Seeding Clean Data ---');

  // 1. Create user_documents table
  await sql`
    CREATE TABLE IF NOT EXISTS user_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_name TEXT,
      file_size TEXT,
      category TEXT DEFAULT 'general',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS user_documents_user_idx ON user_documents(user_id)`;
  console.log('✓ user_documents table verified');

  // 2. Add columns to users if missing
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS designation TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_url TEXT`;
  console.log('✓ users columns verified (designation, passport_url)');

  // 3. Fetch active academic session and term
  const [activeSession] = await sql`SELECT id, name FROM academic_sessions WHERE is_current = true LIMIT 1`;
  if (!activeSession) throw new Error('No active academic session found!');
  const sessionId = activeSession.id;

  const [activeTerm] = await sql`SELECT id, name FROM academic_terms WHERE session_id = ${sessionId} AND is_current = true LIMIT 1`;
  const termId = activeTerm ? activeTerm.id : ((await sql`SELECT id FROM academic_terms WHERE session_id = ${sessionId} LIMIT 1`)[0]?.id);
  console.log(`Active Academic Period: ${activeSession.name} (${sessionId}) / Term: ${termId}`);

  // 4. Clear old academic structures: classes, subjects, enrollments, assessments, combinations
  console.log('Cleaning classes, subjects, combinations, and assignments...');
  await sql`DELETE FROM assessment_scores`;
  await sql`DELETE FROM assessments`;
  await sql`DELETE FROM student_terminal_reports`;
  await sql`DELETE FROM student_classroom_comments`;
  await sql`DELETE FROM student_promotions`;
  await sql`DELETE FROM teacher_subject_assignments`;
  await sql`DELETE FROM teacher_class_assignments`;
  await sql`DELETE FROM class_subject_combinations`;
  await sql`DELETE FROM class_subjects`;
  await sql`DELETE FROM subject_combination_subjects`;
  await sql`DELETE FROM subject_combinations`;
  await sql`DELETE FROM subject_schemes_of_work`;
  await sql`DELETE FROM subject_lesson_notes`;
  await sql`DELETE FROM subject_lesson_plans`;
  await sql`DELETE FROM student_enrollments`;
  await sql`DELETE FROM student_file_entries`;
  await sql`DELETE FROM student_guardians`;
  await sql`DELETE FROM attendance_records`;
  await sql`DELETE FROM classes`;
  await sql`DELETE FROM subjects`;
  await sql`DELETE FROM grade_sections`;
  await sql`DELETE FROM grades`;
  console.log('✓ Cleaned existing classes, subjects, and assignments.');

  // 5. Verify / Upsert 3 Sections: Nursery, Primary, Secondary
  console.log('Ensuring sections: Nursery, Primary, Secondary...');
  const sectionDefs = [
    { code: 'NURSERY', name: 'Nursery Section', sort: 1 },
    { code: 'PRIMARY', name: 'Primary Section', sort: 2 },
    { code: 'SECONDARY', name: 'Secondary Section', sort: 3 }
  ];

  const sectionMap = {};
  for (const s of sectionDefs) {
    const [row] = await sql`
      INSERT INTO sections (code, name, sort_order, status)
      VALUES (${s.code}, ${s.name}, ${s.sort}, 'active')
      ON CONFLICT (code) DO UPDATE SET name = ${s.name}, sort_order = ${s.sort}
      RETURNING id, code
    `;
    sectionMap[s.code] = row.id;
  }
  console.log('✓ Sections configured:', sectionMap);

  // 6. Create Grades & Classes (3 for each section)
  // Nursery: Nursery 1, Nursery 2, Nursery 3
  // Primary: Primary 1, Primary 2, Primary 3
  // Secondary: JSS 1, JSS 2, JSS 3
  console.log('Creating 9 classes (3 per section)...');
  const classDefs = [
    // Nursery
    { sectionCode: 'NURSERY', gradeName: 'Nursery 1', gradeCode: 'NUR_1', sort: 1, className: 'Nursery 1', classCode: 'NURSERY_1' },
    { sectionCode: 'NURSERY', gradeName: 'Nursery 2', gradeCode: 'NUR_2', sort: 2, className: 'Nursery 2', classCode: 'NURSERY_2' },
    { sectionCode: 'NURSERY', gradeName: 'Nursery 3', gradeCode: 'NUR_3', sort: 3, className: 'Nursery 3', classCode: 'NURSERY_3' },
    // Primary
    { sectionCode: 'PRIMARY', gradeName: 'Primary 1', gradeCode: 'PRI_1', sort: 4, className: 'Primary 1', classCode: 'PRIMARY_1' },
    { sectionCode: 'PRIMARY', gradeName: 'Primary 2', gradeCode: 'PRI_2', sort: 5, className: 'Primary 2', classCode: 'PRIMARY_2' },
    { sectionCode: 'PRIMARY', gradeName: 'Primary 3', gradeCode: 'PRI_3', sort: 6, className: 'Primary 3', classCode: 'PRIMARY_3' },
    // Secondary
    { sectionCode: 'SECONDARY', gradeName: 'JSS 1', gradeCode: 'JSS_1', sort: 7, className: 'JSS 1', classCode: 'JSS_1' },
    { sectionCode: 'SECONDARY', gradeName: 'JSS 2', gradeCode: 'JSS_2', sort: 8, className: 'JSS 2', classCode: 'JSS_2' },
    { sectionCode: 'SECONDARY', gradeName: 'JSS 3', gradeCode: 'JSS_3', sort: 9, className: 'JSS 3', classCode: 'JSS_3' }
  ];

  const classMap = {};
  for (const c of classDefs) {
    const [grade] = await sql`
      INSERT INTO grades (name, code, sort_order, status)
      VALUES (${c.gradeName}, ${c.gradeCode}, ${c.sort}, 'active')
      ON CONFLICT (code) DO UPDATE SET name = ${c.gradeName}, sort_order = ${c.sort}
      RETURNING id
    `;

    // Map grade to section
    await sql`
      INSERT INTO grade_sections (grade_id, section_id)
      VALUES (${grade.id}, ${sectionMap[c.sectionCode]})
      ON CONFLICT (grade_id, section_id) DO NOTHING
    `;

    const [cls] = await sql`
      INSERT INTO classes (grade_id, name, code, status)
      VALUES (${grade.id}, ${c.className}, ${c.classCode}, 'active')
      ON CONFLICT (code) DO UPDATE SET name = ${c.className}, grade_id = ${grade.id}
      RETURNING id, code, name
    `;
    classMap[c.classCode] = cls.id;
  }
  console.log('✓ 9 Classes created:', Object.keys(classMap));

  // 7. Create 15 Subjects (5 per section combination)
  console.log('Creating 15 subjects...');
  const subjectDefs = [
    // Nursery 5 Subjects
    { code: 'LIT_NUR', name: 'Literacy & Phonics', short: 'Literacy', desc: 'Alphabet phonetics, word formation, reading foundation' },
    { code: 'NUM_NUR', name: 'Numeracy & Shapes', short: 'Numeracy', desc: 'Number identification, counting, geometrical shapes' },
    { code: 'RHY_NUR', name: 'Rhymes & Islamic Songs', short: 'Rhymes', desc: 'Islamic nursery rhymes, nasheeds, vocal recitation' },
    { code: 'ART_NUR', name: 'Creative Arts & Coloring', short: 'Arts', desc: 'Color perception, basic drawing, creative expressions' },
    { code: 'HEA_NUR', name: 'Health & Physical Habits', short: 'Health', desc: 'Personal cleanliness, posture, motor coordination' },

    // Primary 5 Subjects
    { code: 'ENG_PRI', name: 'English Language', short: 'English', desc: 'Grammar, vocabulary, comprehension, composition writing' },
    { code: 'MTH_PRI', name: 'Mathematics', short: 'Maths', desc: 'Arithmetic, fractions, measurement, introductory geometry' },
    { code: 'SCI_PRI', name: 'Basic Science & Technology', short: 'Basic Science', desc: 'Natural phenomena, living things, technological tools' },
    { code: 'IRS_PRI', name: 'Islamic Religious Studies', short: 'IRS', desc: 'Quran memorization, Hadith, Fiqh, Islamic moral ethics' },
    { code: 'SOC_PRI', name: 'Social Studies & Civic Education', short: 'Social Studies', desc: 'Community structure, civic duties, peaceful co-existence' },

    // Secondary 5 Subjects
    { code: 'ENG_SEC', name: 'English Studies', short: 'English', desc: 'Literature in English, advanced grammar, formal speech' },
    { code: 'MTH_SEC', name: 'Mathematics (Secondary)', short: 'Maths', desc: 'Algebra, trigonometry, planar geometry, statistics' },
    { code: 'BSC_SEC', name: 'Basic Science', short: 'Basic Science', desc: 'Scientific inquiry, physics & chemistry fundamentals' },
    { code: 'BUS_SEC', name: 'Business Studies', short: 'Business', desc: 'Commerce, accounting basics, keyboarding, enterprise' },
    { code: 'ICT_SEC', name: 'Computer Studies / ICT', short: 'ICT', desc: 'Algorithms, productivity software, internet ethics' }
  ];

  const subjectMap = {};
  for (const s of subjectDefs) {
    const [sub] = await sql`
      INSERT INTO subjects (code, name, short_name, description, status)
      VALUES (${s.code}, ${s.name}, ${s.short}, ${s.desc}, 'active')
      ON CONFLICT (code) DO UPDATE SET name = ${s.name}, short_name = ${s.short}, description = ${s.desc}
      RETURNING id, code
    `;
    subjectMap[s.code] = sub.id;
  }
  console.log('✓ 15 Subjects created.');

  // 8. Create 3 Subject Combinations and Link to Classes
  console.log('Creating 3 subject combinations...');
  const combinationDefs = [
    {
      name: 'Nursery Early Years Curriculum',
      desc: 'Complete 5-subject foundational track for Nursery 1, 2, and 3',
      subjectCodes: ['LIT_NUR', 'NUM_NUR', 'RHY_NUR', 'ART_NUR', 'HEA_NUR'],
      classCodes: ['NURSERY_1', 'NURSERY_2', 'NURSERY_3']
    },
    {
      name: 'Primary Foundation Curriculum',
      desc: 'Standard 5-subject primary school curriculum for Primary 1, 2, and 3',
      subjectCodes: ['ENG_PRI', 'MTH_PRI', 'SCI_PRI', 'IRS_PRI', 'SOC_PRI'],
      classCodes: ['PRIMARY_1', 'PRIMARY_2', 'PRIMARY_3']
    },
    {
      name: 'Junior Secondary Academic Track',
      desc: 'Core 5-subject curriculum for JSS 1, 2, and 3',
      subjectCodes: ['ENG_SEC', 'MTH_SEC', 'BSC_SEC', 'BUS_SEC', 'ICT_SEC'],
      classCodes: ['JSS_1', 'JSS_2', 'JSS_3']
    }
  ];

  for (const comb of combinationDefs) {
    const [combRow] = await sql`
      INSERT INTO subject_combinations (name, description, status)
      VALUES (${comb.name}, ${comb.desc}, 'active')
      ON CONFLICT (name) DO UPDATE SET description = ${comb.desc}
      RETURNING id
    `;

    // Link subjects to combination
    let sort = 1;
    for (const subCode of comb.subjectCodes) {
      const subId = subjectMap[subCode];
      await sql`
        INSERT INTO subject_combination_subjects (combination_id, subject_id, sort_order)
        VALUES (${combRow.id}, ${subId}, ${sort++})
        ON CONFLICT (combination_id, subject_id) DO NOTHING
      `;
    }

    // Link combination and subjects to classes
    for (const classCode of comb.classCodes) {
      const clsId = classMap[classCode];
      await sql`
        INSERT INTO class_subject_combinations (class_id, combination_id, session_id, status)
        VALUES (${clsId}, ${combRow.id}, ${sessionId}, 'active')
        ON CONFLICT (class_id, combination_id, session_id) DO NOTHING
      `;

      for (const subCode of comb.subjectCodes) {
        const subId = subjectMap[subCode];
        await sql`
          INSERT INTO class_subjects (class_id, subject_id, session_id, status)
          VALUES (${clsId}, ${subId}, ${sessionId}, 'active')
          ON CONFLICT (class_id, subject_id, session_id) DO NOTHING
        `;
      }
    }
  }
  console.log('✓ 3 Combinations created and attached to classes.');

  // 9. Clean and Seed Users:
  // superadmin, manager1, manager2, staff1 to staff5, student1 to student15 all with @salamah.ng and password 12345678
  console.log('Seeding standard user accounts with @salamah.ng and password 12345678...');
  const defaultPasswordHash = hashPassword('12345678');

  // Helper function to create or update user
  async function upsertUser({ email, role, designation, firstName, lastName, phone, gender, avatarUrl }) {
    let [person] = await sql`SELECT id FROM people WHERE email = ${email} LIMIT 1`;
    if (!person) {
      [person] = await sql`
        INSERT INTO people (first_name, last_name, email, phone, gender, avatar_url, address, status)
        VALUES (${firstName}, ${lastName}, ${email}, ${phone || '08012345678'}, ${gender || 'male'}, ${avatarUrl || null}, 'Katsina, Nigeria', 'active')
        RETURNING id
      `;
    } else {
      await sql`
        UPDATE people
        SET first_name = ${firstName}, last_name = ${lastName}, phone = ${phone || '08012345678'},
            gender = ${gender || 'male'}, avatar_url = ${avatarUrl || null}, address = 'Katsina, Nigeria', updated_at = now()
        WHERE id = ${person.id}
      `;
    }

    let [user] = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (!user) {
      [user] = await sql`
        INSERT INTO users (person_id, email, password_hash, role, status, designation, passport_url)
        VALUES (${person.id}, ${email}, ${defaultPasswordHash}, ${role}, 'active', ${designation}, ${avatarUrl || null})
        RETURNING id
      `;
    } else {
      await sql`
        UPDATE users
        SET person_id = ${person.id}, password_hash = ${defaultPasswordHash}, role = ${role}, status = 'active',
            designation = ${designation}, passport_url = ${avatarUrl || null}, updated_at = now()
        WHERE id = ${user.id}
      `;
    }
    return { userId: user.id, personId: person.id };
  }

  // 9a. Super Admin
  const superadmin = await upsertUser({
    email: 'superadmin@salamah.ng',
    role: 'superadmin',
    designation: 'superadmin',
    firstName: 'Ibrahim',
    lastName: 'Bello',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'
  });
  console.log('✓ Superadmin seeded: superadmin@salamah.ng');

  // 9b. Managers (2 Managers)
  const manager1 = await upsertUser({
    email: 'manager1@salamah.ng',
    role: 'manager',
    designation: 'manager',
    firstName: 'Dr. Aminu',
    lastName: 'Katsina',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'
  });

  const manager2 = await upsertUser({
    email: 'manager2@salamah.ng',
    role: 'manager',
    designation: 'manager',
    firstName: 'Hajiya Fatima',
    lastName: 'Dikko',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face'
  });
  console.log('✓ Managers seeded: manager1@salamah.ng, manager2@salamah.ng');

  // 9c. Staff 1 to 5 (3 designated as teachers, 2 other)
  const staffMembers = [
    { email: 'staff1@salamah.ng', designation: 'teaching staff', role: 'staff', first: 'Ustaz Abubakar', last: 'Umar', isTeacher: true, dept: 'Languages & Quran', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
    { email: 'staff2@salamah.ng', designation: 'teaching staff', role: 'staff', first: 'Mallam Sani', last: 'Lawal', isTeacher: true, dept: 'Sciences & STEM', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
    { email: 'staff3@salamah.ng', designation: 'teaching staff', role: 'staff', first: 'Maryam', last: 'Usman', isTeacher: true, dept: 'Early Childhood Education', gender: 'female', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face' },
    { email: 'staff4@salamah.ng', designation: 'academic staff', role: 'staff', first: 'Kabiru', last: 'Danjuma', isTeacher: false, dept: 'Examinations & Records', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face' },
    { email: 'staff5@salamah.ng', designation: 'non academic staff', role: 'staff', first: 'Zainab', last: 'Mohammed', isTeacher: false, dept: 'Bursary & Administration', gender: 'female', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face' }
  ];

  const teacherIds = [];
  for (let i = 0; i < staffMembers.length; i++) {
    const s = staffMembers[i];
    const u = await upsertUser({
      email: s.email,
      role: s.role,
      designation: s.designation,
      firstName: s.first,
      lastName: s.last,
      gender: s.gender || 'male',
      avatarUrl: s.avatar
    });

    const staffNum = `SIS-STF-00${i + 1}`;
    let [stf] = await sql`SELECT id FROM staff WHERE person_id = ${u.personId} LIMIT 1`;
    if (!stf) {
      [stf] = await sql`
        INSERT INTO staff (person_id, staff_number, employment_date, employment_type, department, status, metadata)
        VALUES (${u.personId}, ${staffNum}, '2024-09-01', 'full_time', ${s.dept}, 'active', '{"fileDocUrl": null}'::jsonb)
        RETURNING id
      `;
    }

    if (s.isTeacher) {
      let [tch] = await sql`SELECT id FROM teachers WHERE staff_id = ${stf.id} LIMIT 1`;
      if (!tch) {
        [tch] = await sql`
          INSERT INTO teachers (staff_id, teacher_number, qualification, specialization, status)
          VALUES (${stf.id}, ${`TCH-${staffNum}`}, 'B.Ed / NCE Accredited', ${s.dept}, 'active')
          RETURNING id
        `;
      }
      teacherIds.push({ staffId: stf.id, teacherId: tch.id, userId: u.userId, email: s.email, name: `${s.first} ${s.last}` });
    }

    // Seed default documents for staff:
    // 1. Employment Agreement Document
    // 2. Staff ID Card
    await sql`
      INSERT INTO user_documents (user_id, title, doc_type, file_url, file_name, file_size, category, notes)
      VALUES 
        (${u.userId}, 'Official Employment Agreement & Conditions of Service', 'employment_agreement', '/docs/employment-agreement-official.pdf', 'Salamah_Employment_Agreement.pdf', '245 KB', 'legal', 'Verified contract signed by School Directorate Katsina.'),
        (${u.userId}, 'Official Staff Security Identity Card', 'id_card', '/docs/staff-id-card.pdf', 'Staff_ID_Card.pdf', '110 KB', 'security', 'Active campus credential with Katsina security clearance.')
      ON CONFLICT DO NOTHING
    `;

    // Assign to Manager 1
    await sql`
      INSERT INTO manager_staff_assignments (manager_user_id, staff_user_id, status)
      VALUES (${manager1.userId}, ${u.userId}, 'active')
      ON CONFLICT DO NOTHING
    `;
  }
  console.log('✓ Staff 1 to 5 seeded with employment agreements & ID cards in dossier.');

  // 10. Assign Teachers to Classes and Subjects
  // Teacher 1 (staff1): Form Teacher for Primary 1. Teaches: English (PRI 1, 2) and Maths (PRI 1)
  // Teacher 2 (staff2): Form Teacher for JSS 1. Teaches: Maths (JSS 1, 2) and Basic Science (JSS 1)
  // Teacher 3 (staff3): Form Teacher for Nursery 1. Teaches: Literacy (NUR 1) and Numeracy (NUR 1)
  console.log('Assigning teachers to classes and subjects...');
  const t1 = teacherIds[0];
  const t2 = teacherIds[1];
  const t3 = teacherIds[2];

  if (t1) {
    // Primary 1 Class Teacher
    await sql`
      INSERT INTO teacher_class_assignments (teacher_id, class_id, session_id, term_id, assignment_type, status)
      VALUES (${t1.teacherId}, ${classMap['PRIMARY_1']}, ${sessionId}, ${termId}, 'class_teacher', 'active')
      ON CONFLICT DO NOTHING
    `;
    // English & Maths
    await sql`
      INSERT INTO teacher_subject_assignments (teacher_id, subject_id, class_id, session_id, term_id, status)
      VALUES 
        (${t1.teacherId}, ${subjectMap['ENG_PRI']}, ${classMap['PRIMARY_1']}, ${sessionId}, ${termId}, 'active'),
        (${t1.teacherId}, ${subjectMap['ENG_PRI']}, ${classMap['PRIMARY_2']}, ${sessionId}, ${termId}, 'active'),
        (${t1.teacherId}, ${subjectMap['MTH_PRI']}, ${classMap['PRIMARY_1']}, ${sessionId}, ${termId}, 'active')
      ON CONFLICT DO NOTHING
    `;
  }

  if (t2) {
    // JSS 1 Class Teacher
    await sql`
      INSERT INTO teacher_class_assignments (teacher_id, class_id, session_id, term_id, assignment_type, status)
      VALUES (${t2.teacherId}, ${classMap['JSS_1']}, ${sessionId}, ${termId}, 'class_teacher', 'active')
      ON CONFLICT DO NOTHING
    `;
    // Secondary Maths & Basic Science
    await sql`
      INSERT INTO teacher_subject_assignments (teacher_id, subject_id, class_id, session_id, term_id, status)
      VALUES 
        (${t2.teacherId}, ${subjectMap['MTH_SEC']}, ${classMap['JSS_1']}, ${sessionId}, ${termId}, 'active'),
        (${t2.teacherId}, ${subjectMap['MTH_SEC']}, ${classMap['JSS_2']}, ${sessionId}, ${termId}, 'active'),
        (${t2.teacherId}, ${subjectMap['BSC_SEC']}, ${classMap['JSS_1']}, ${sessionId}, ${termId}, 'active')
      ON CONFLICT DO NOTHING
    `;
  }

  if (t3) {
    // Nursery 1 Class Teacher
    await sql`
      INSERT INTO teacher_class_assignments (teacher_id, class_id, session_id, term_id, assignment_type, status)
      VALUES (${t3.teacherId}, ${classMap['NURSERY_1']}, ${sessionId}, ${termId}, 'class_teacher', 'active')
      ON CONFLICT DO NOTHING
    `;
    // Literacy & Numeracy
    await sql`
      INSERT INTO teacher_subject_assignments (teacher_id, subject_id, class_id, session_id, term_id, status)
      VALUES 
        (${t3.teacherId}, ${subjectMap['LIT_NUR']}, ${classMap['NURSERY_1']}, ${sessionId}, ${termId}, 'active'),
        (${t3.teacherId}, ${subjectMap['NUM_NUR']}, ${classMap['NURSERY_1']}, ${sessionId}, ${termId}, 'active')
      ON CONFLICT DO NOTHING
    `;
  }
  console.log('✓ Teacher assignments created.');

  // 11. Seed Student 1 to 15 (linked accounts with @salamah.ng, password 12345678)
  console.log('Seeding 15 students across classes...');
  const studentData = [
    // Nursery (5)
    { email: 'student1@salamah.ng', first: 'Zayd', last: 'Ahmad', gender: 'male', classCode: 'NURSERY_1', adm: 'SIS/2026/001', dob: '2021-04-12', avatar: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&h=150&fit=crop&crop=face' },
    { email: 'student2@salamah.ng', first: 'Aisha', last: 'Bello', gender: 'female', classCode: 'NURSERY_1', adm: 'SIS/2026/002', dob: '2021-08-20', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face' },
    { email: 'student3@salamah.ng', first: 'Umar', last: 'Faruk', gender: 'male', classCode: 'NURSERY_2', adm: 'SIS/2026/003', dob: '2020-03-15', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face' },
    { email: 'student4@salamah.ng', first: 'Khadijah', last: 'Sani', gender: 'female', classCode: 'NURSERY_2', adm: 'SIS/2026/004', dob: '2020-07-22', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face' },
    { email: 'student5@salamah.ng', first: 'Bilal', last: 'Kabir', gender: 'male', classCode: 'NURSERY_3', adm: 'SIS/2026/005', dob: '2019-05-18', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' },

    // Primary (5)
    { email: 'student6@salamah.ng', first: 'Maryam', last: 'Aliyu', gender: 'female', classCode: 'PRIMARY_1', adm: 'SIS/2026/006', dob: '2018-02-14', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' },
    { email: 'student7@salamah.ng', first: 'Yusuf', last: 'Ibrahim', gender: 'male', classCode: 'PRIMARY_1', adm: 'SIS/2026/007', dob: '2018-09-09', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
    { email: 'student8@salamah.ng', first: 'Fatima', last: 'Usman', gender: 'female', classCode: 'PRIMARY_2', adm: 'SIS/2026/008', dob: '2017-06-30', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' },
    { email: 'student9@salamah.ng', first: 'Mustapha', last: 'Lawal', gender: 'male', classCode: 'PRIMARY_2', adm: 'SIS/2026/009', dob: '2017-11-11', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
    { email: 'student10@salamah.ng', first: 'Zainab', last: 'Haruna', gender: 'female', classCode: 'PRIMARY_3', adm: 'SIS/2026/010', dob: '2016-01-25', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },

    // Secondary (5)
    { email: 'student11@salamah.ng', first: 'Abdullahi', last: 'Dikko', gender: 'male', classCode: 'JSS_1', adm: 'SIS/2026/011', dob: '2015-05-10', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face' },
    { email: 'student12@salamah.ng', first: 'Hafsat', last: 'Mamman', gender: 'female', classCode: 'JSS_1', adm: 'SIS/2026/012', dob: '2015-10-14', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face' },
    { email: 'student13@salamah.ng', first: 'Idris', last: 'Shehu', gender: 'male', classCode: 'JSS_2', adm: 'SIS/2026/013', dob: '2014-04-03', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
    { email: 'student14@salamah.ng', first: 'Ruqayyah', last: 'Garba', gender: 'female', classCode: 'JSS_2', adm: 'SIS/2026/014', dob: '2014-12-08', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
    { email: 'student15@salamah.ng', first: 'Hamza', last: 'Katsina', gender: 'male', classCode: 'JSS_3', adm: 'SIS/2026/015', dob: '2013-08-19', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' }
  ];

  for (const st of studentData) {
    const u = await upsertUser({
      email: st.email,
      role: 'student',
      designation: 'student',
      firstName: st.first,
      lastName: st.last,
      gender: st.gender,
      avatarUrl: st.avatar
    });

    let [studentRec] = await sql`SELECT id FROM students WHERE admission_number = ${st.adm} LIMIT 1`;
    if (!studentRec) {
      [studentRec] = await sql`
        INSERT INTO students (person_id, admission_number, admission_date, status)
        VALUES (${u.personId}, ${st.adm}, '2026-09-01', 'active')
        RETURNING id
      `;
    }

    const clsId = classMap[st.classCode];
    await sql`
      INSERT INTO student_enrollments (student_id, session_id, class_id, enrollment_date, status)
      VALUES (${studentRec.id}, ${sessionId}, ${clsId}, '2026-09-01', 'active')
      ON CONFLICT (student_id, session_id) DO UPDATE SET class_id = ${clsId}, status = 'active'
    `;

    // Seed student dossier files
    await sql`
      INSERT INTO user_documents (user_id, title, doc_type, file_url, file_name, file_size, category, notes)
      VALUES 
        (${u.userId}, 'Official Admission Clearance & Enrollment Certificate', 'certificate', '/docs/admission-slip.pdf', 'Admission_Clearance.pdf', '140 KB', 'academic', 'Verified enrollment for Salamah International School Katsina.')
      ON CONFLICT DO NOTHING
    `;
  }
  console.log('✓ 15 Students created and enrolled in classes.');

  // 12. Seed School Notices for Teacher / Staff Noticeboard
  console.log('Seeding school notices for Noticeboard...');
  const notices = [
    { title: 'Welcome to First Term 2026/2027 Session', content: 'The Directorate welcomes all distinguished educators, staff, and scholars to the academic year. Weekly schemes of work and lesson notes must be updated before the start of each week.', audience: 'everyone' },
    { title: 'Submission of Continuous Assessment Scores (CA 1 & 2)', content: 'Faculty members are reminded to record CA scores directly via the Subject Teaching Cockpit for their respective assigned classes.', audience: 'staff' },
    { title: 'Teacher Task Allocation & Weekly Assembly Duty', content: 'Please inspect the "My Tasks" section on your dashboard for updated classroom and institutional assignments.', audience: 'staff' }
  ];

  for (const n of notices) {
    await sql`
      INSERT INTO notices (title, content, audience, publish_date, status, created_by_user_id)
      VALUES (${n.title}, ${n.content}, ${n.audience}, CURRENT_DATE, 'active', ${superadmin.userId})
    `;
  }
  console.log('✓ School notices seeded.');

  // 13. Ensure School Tasks exist
  const sampleTasks = [
    { title: 'Supervise Morning Assembly & Student Lining', cat: 'Pastoral', desc: 'Ensure orderly assembly and proper uniform inspection.', doc: 'Assembly Protocol Guidelines v2' },
    { title: 'Weekly Curriculum & Lesson Plan Review', cat: 'Academic', desc: 'Submit completed 12-week scheme of work notes for validation.', doc: 'FME & Cambridge Standards Manual' },
    { title: 'Laboratory Instrument Safety & Stock Audit', cat: 'Facilities', desc: 'Inspect science laboratory equipment and update stock register.', doc: 'Science Lab Health & Safety Protocol' }
  ];

  for (let i = 0; i < sampleTasks.length; i++) {
    const t = sampleTasks[i];
    const assignedUser = teacherIds[i]?.userId || manager1.userId;
    await sql`
      INSERT INTO school_tasks (title, category, description, responsibility_document, assigned_user_id, frequency, status)
      VALUES (${t.title}, ${t.cat || t.category || 'Pastoral'}, ${t.desc}, ${t.doc}, ${assignedUser}, 'daily', 'active')
    `;
  }
  console.log('✓ School tasks created.');

  // 14. Update section heads location / info to Katsina
  await sql`
    UPDATE school_section_heads
    SET default_comment = 'Promoted with commendation. Continue sustaining this exemplary standard of scholarly excellence at Salamah International School Katsina.'
  `;
  console.log('✓ Section heads updated.');

  console.log('--- ALL ACCESS CONTROL SEEDING & STRUCTURE INITIALIZATION COMPLETE ---');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
