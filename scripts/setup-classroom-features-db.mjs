import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function withRetry(fn, retries = 5, delayMs = 1500) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      console.warn(`⚠️ Attempt ${attempt} failed: ${err.message}. Retrying in ${delayMs}ms...`);
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function run() {
  console.log('🚀 Running database schema update for Classroom, Report Cards & Subject Workspaces...');
  const sql = neon(process.env.DATABASE_URL);

  await withRetry(async () => {
    // 1. Create student_terminal_reports table
    await sql`
      CREATE TABLE IF NOT EXISTS student_terminal_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
        term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        teacher_comment TEXT,
        principal_comment TEXT,
        affective_domain JSONB NOT NULL DEFAULT '{}'::jsonb,
        psychomotor_domain JSONB NOT NULL DEFAULT '{}'::jsonb,
        days_school_opened INTEGER DEFAULT 60,
        days_present INTEGER,
        days_absent INTEGER,
        next_term_resumption TEXT,
        height TEXT,
        weight TEXT,
        recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS student_terminal_reports_period_idx 
      ON student_terminal_reports (session_id, term_id, class_id, student_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS student_terminal_reports_class_idx 
      ON student_terminal_reports (class_id);
    `;
    console.log('✅ student_terminal_reports table and indexes verified.');
  });

  await withRetry(async () => {
    // 2. Create subject_schemes_of_work table
    await sql`
      CREATE TABLE IF NOT EXISTS subject_schemes_of_work (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
        term_id UUID REFERENCES academic_terms(id) ON DELETE CASCADE,
        teacher_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        weeks_data JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    console.log('✅ subject_schemes_of_work table verified.');
  });

  await withRetry(async () => {
    // 3. Create subject_lesson_notes table
    await sql`
      CREATE TABLE IF NOT EXISTS subject_lesson_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
        term_id UUID REFERENCES academic_terms(id) ON DELETE CASCADE,
        teacher_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        week_number INTEGER NOT NULL,
        topic TEXT NOT NULL,
        subtopics TEXT,
        content TEXT NOT NULL,
        learning_materials TEXT,
        homework TEXT,
        status TEXT NOT NULL DEFAULT 'approved',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    console.log('✅ subject_lesson_notes table verified.');
  });

  await withRetry(async () => {
    // 4. Create subject_lesson_plans table
    await sql`
      CREATE TABLE IF NOT EXISTS subject_lesson_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
        term_id UUID REFERENCES academic_terms(id) ON DELETE CASCADE,
        teacher_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        week_number INTEGER NOT NULL,
        topic TEXT NOT NULL,
        duration_minutes INTEGER DEFAULT 40,
        behavioral_objectives TEXT,
        instructional_materials TEXT,
        previous_knowledge TEXT,
        steps JSONB NOT NULL DEFAULT '[]'::jsonb,
        evaluation TEXT,
        conclusion TEXT,
        status TEXT NOT NULL DEFAULT 'ready',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    console.log('✅ subject_lesson_plans table verified.');
  });

  await withRetry(async () => {
    // 5. Seed trait_definitions if empty
    const traitsCount = await sql`SELECT count(*)::int as count FROM trait_definitions`;
    if (traitsCount[0]?.count === 0) {
      const traits = [
        { category: 'affective', name: 'Punctuality & Regularity', sort_order: 1 },
        { category: 'affective', name: 'Neatness & Personal Hygiene', sort_order: 2 },
        { category: 'affective', name: 'Politeness & Courtesy', sort_order: 3 },
        { category: 'affective', name: 'Honesty & Trustworthiness', sort_order: 4 },
        { category: 'affective', name: 'Leadership & Initiative', sort_order: 5 },
        { category: 'affective', name: 'Attentiveness in Class', sort_order: 6 },
        { category: 'affective', name: 'Relationship with Peers', sort_order: 7 },
        { category: 'psychomotor', name: 'Handwriting & Penmanship', sort_order: 1 },
        { category: 'psychomotor', name: 'Sports, Games & Athletics', sort_order: 2 },
        { category: 'psychomotor', name: 'Verbal Fluency & Oratory', sort_order: 3 },
        { category: 'psychomotor', name: 'Arts & Crafts / Drawing', sort_order: 4 },
        { category: 'psychomotor', name: 'Handling of Tools & Lab Materials', sort_order: 5 },
      ];
      for (const t of traits) {
        await sql`
          INSERT INTO trait_definitions (category, name, sort_order, status, created_at, updated_at)
          VALUES (${t.category}, ${t.name}, ${t.sort_order}, 'active', now(), now())
        `;
      }
      console.log(`✅ Seeded ${traits.length} trait definitions (affective & psychomotor).`);
    }
  });

  await withRetry(async () => {
    // 6. Ensure staff1@salamah.edu.ng has a teacher record and class/subject assignment
    const [staffRow] = await sql`
      SELECT s.id as staff_id, u.id as user_id, p.first_name, p.last_name
      FROM staff s
      JOIN users u ON u.person_id = s.person_id
      JOIN people p ON p.id = s.person_id
      WHERE u.email = 'staff1@salamah.edu.ng'
      LIMIT 1
    `;
    if (staffRow) {
      let [teacherRow] = await sql`SELECT id FROM teachers WHERE staff_id = ${staffRow.staff_id} LIMIT 1`;
      if (!teacherRow) {
        [teacherRow] = await sql`
          INSERT INTO teachers (staff_id, status, created_at, updated_at)
          VALUES (${staffRow.staff_id}, 'active', now(), now())
          RETURNING id
        `;
        console.log('✅ Created teacher record for staff1:', teacherRow.id);
      }

      const [currSession] = await sql`SELECT id FROM academic_sessions WHERE is_current = true LIMIT 1`;
      const [currTerm] = await sql`SELECT id FROM academic_terms WHERE is_current = true LIMIT 1`;
      const sessionId = currSession?.id || (await sql`SELECT id FROM academic_sessions LIMIT 1`)[0]?.id;
      const termId = currTerm?.id || (await sql`SELECT id FROM academic_terms LIMIT 1`)[0]?.id;

      // Assign as Class Teacher to JSS 1
      const [jss1Class] = await sql`SELECT id, name FROM classes WHERE name = 'JSS 1' LIMIT 1`;
      if (jss1Class && teacherRow) {
        const existingClassAssign = await sql`
          SELECT id FROM teacher_class_assignments
          WHERE teacher_id = ${teacherRow.id} AND class_id = ${jss1Class.id}
        `;
        if (!existingClassAssign.length) {
          await sql`
            INSERT INTO teacher_class_assignments (session_id, teacher_id, class_id, assignment_type, status, created_at, updated_at)
            VALUES (${sessionId}, ${teacherRow.id}, ${jss1Class.id}, 'class_teacher', 'active', now(), now())
          `;
          console.log(`✅ Assigned staff1 as Class Teacher for ${jss1Class.name}`);
        }
      }

      // Assign English Language and Mathematics to staff1 for JSS 1
      const [englishSub] = await sql`SELECT id, name FROM subjects WHERE name ILIKE '%English%' LIMIT 1`;
      const [mathSub] = await sql`SELECT id, name FROM subjects WHERE name ILIKE '%Mathematics%' LIMIT 1`;

      if (englishSub && jss1Class && teacherRow) {
        const existingSubAssign = await sql`
          SELECT id FROM teacher_subject_assignments
          WHERE teacher_id = ${teacherRow.id} AND subject_id = ${englishSub.id} AND class_id = ${jss1Class.id}
        `;
        if (!existingSubAssign.length) {
          await sql`
            INSERT INTO teacher_subject_assignments (session_id, term_id, teacher_id, class_id, subject_id, status, created_at, updated_at)
            VALUES (${sessionId}, ${termId}, ${teacherRow.id}, ${jss1Class.id}, ${englishSub.id}, 'active', now(), now())
          `;
          console.log(`✅ Assigned staff1 to teach ${englishSub.name} for ${jss1Class.name}`);
        }
      }

      if (mathSub && jss1Class && teacherRow) {
        const existingMathAssign = await sql`
          SELECT id FROM teacher_subject_assignments
          WHERE teacher_id = ${teacherRow.id} AND subject_id = ${mathSub.id} AND class_id = ${jss1Class.id}
        `;
        if (!existingMathAssign.length) {
          await sql`
            INSERT INTO teacher_subject_assignments (session_id, term_id, teacher_id, class_id, subject_id, status, created_at, updated_at)
            VALUES (${sessionId}, ${termId}, ${teacherRow.id}, ${jss1Class.id}, ${mathSub.id}, 'active', now(), now())
          `;
          console.log(`✅ Assigned staff1 to teach ${mathSub.name} for ${jss1Class.name}`);
        }
      }
    }
  });

  console.log('🎉 Database setup complete!');
}

run().catch((err) => {
  console.error('❌ Error during setup:', err);
  process.exit(1);
});
