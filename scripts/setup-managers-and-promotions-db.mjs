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
  console.log('🚀 Running database schema update for Section Heads (Managers) & Student Promotions...');
  const sql = neon(process.env.DATABASE_URL);

  // 1. Create school_section_heads table
  await withRetry(async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS school_section_heads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
        section_code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        full_name TEXT NOT NULL,
        qualification TEXT,
        avatar_url TEXT,
        signature_url TEXT,
        stamp_url TEXT,
        default_comment TEXT,
        phone TEXT,
        email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    console.log('✅ school_section_heads table verified.');
  });

  // Seed default section heads if not exist
  await withRetry(async () => {
    const nurserySec = await sql`SELECT id FROM sections WHERE code = 'NURSERY' LIMIT 1`;
    const primarySec = await sql`SELECT id FROM sections WHERE code = 'PRIMARY' LIMIT 1`;
    const secondarySec = await sql`SELECT id FROM sections WHERE code = 'SECONDARY' LIMIT 1`;

    await sql`
      INSERT INTO school_section_heads (
        section_id, section_code, title, full_name, qualification, 
        avatar_url, signature_url, default_comment, phone, email
      ) VALUES 
      (
        ${nurserySec[0]?.id || null},
        'NURSERY',
        'Head of Nursery',
        'Hajia Maryam Aminu-Kano',
        'B.Ed Early Childhood Education, TRCN',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=faces',
        'https://res.cloudinary.com/djkudkxmx/image/upload/v1781003815/signature_placeholder.png',
        'A joyful, inquisitive, and blossoming child who interacts warmly with peers and engages enthusiastically in foundational literacy and numeracy activities.',
        '+234 803 111 2233',
        'nursery.head@salamah.sch.ng'
      ),
      (
        ${primarySec[0]?.id || null},
        'PRIMARY',
        'Head Teacher',
        'Ustaz Ibrahim Gambo, M.Ed',
        'M.Ed Curriculum Studies & Primary Pedagogy, TRCN',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
        'https://res.cloudinary.com/djkudkxmx/image/upload/v1781003815/signature_placeholder.png',
        'Demonstrates commendable intellectual curiosity, disciplined deportment, and consistent academic diligence. Promoted in good standing.',
        '+234 803 222 3344',
        'headteacher@salamah.sch.ng'
      ),
      (
        ${secondarySec[0]?.id || null},
        'SECONDARY',
        'Principal',
        'Dr. Al-Mansur Bello, Ph.D',
        'Ph.D Educational Administration & Leadership, FAE, TRCN',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=faces',
        'https://res.cloudinary.com/djkudkxmx/image/upload/v1781003815/signature_placeholder.png',
        'An exemplary academic showing sterling character, critical analytical thinking, and virtuous citizenship. Promoted with distinction.',
        '+234 803 333 4455',
        'principal@salamah.sch.ng'
      )
      ON CONFLICT (section_code) DO NOTHING;
    `;
    console.log('✅ Default section heads seeded.');
  });

  // 2. Create student_promotions table
  await withRetry(async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS student_promotions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        from_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        to_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        from_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
        to_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
        from_term_id UUID REFERENCES academic_terms(id) ON DELETE SET NULL,
        promotion_status TEXT NOT NULL DEFAULT 'promoted',
        average_score NUMERIC(5,2),
        decision_reason TEXT,
        decided_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS student_promotions_student_idx ON student_promotions (student_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS student_promotions_session_idx ON student_promotions (from_session_id, to_session_id);
    `;
    console.log('✅ student_promotions table and indexes verified.');
  });

  console.log('🎉 Setup complete!');
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
