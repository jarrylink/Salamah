import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  console.log("Setting up Duty Roster, School AC, Weekly Themes, and System Settings...");

  // 1. Create duty_rosters table
  await sql`
    CREATE TABLE IF NOT EXISTS duty_rosters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
      term_id UUID REFERENCES academic_terms(id) ON DELETE CASCADE,
      total_weeks INT NOT NULL DEFAULT 12,
      start_date DATE,
      end_date DATE,
      duties_list JSONB NOT NULL DEFAULT '[]'::jsonb,
      weeks_data JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS duty_rosters_session_term_idx ON duty_rosters (session_id, term_id, is_active);`;

  // 2. Create school_academic_calendars table
  await sql`
    CREATE TABLE IF NOT EXISTS school_academic_calendars (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
      term_id UUID REFERENCES academic_terms(id) ON DELETE CASCADE,
      term_name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_weeks INT NOT NULL DEFAULT 12,
      current_week INT NOT NULL DEFAULT 1,
      manual_override_week INT,
      weeks_config JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS school_academic_calendars_active_idx ON school_academic_calendars (is_active);`;

  // 3. Create weekly_themes table
  await sql`
    CREATE TABLE IF NOT EXISTS weekly_themes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
      term_id UUID REFERENCES academic_terms(id) ON DELETE CASCADE,
      week_number INT NOT NULL,
      theme_title TEXT NOT NULL,
      scripture_reference TEXT,
      quote_or_hadith TEXT,
      assembly_focus TEXT,
      core_values TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS weekly_themes_week_idx ON weekly_themes (week_number);`;

  // 4. Ensure system_settings has quick_enrollment_enabled
  await sql`
    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES (
      'quick_enrollment_enabled',
      '{"enabled": true}'::jsonb,
      'Allows teachers with assigned classes to quick-enroll students from the Classroom Management Cockpit'
    )
    ON CONFLICT (setting_key) DO NOTHING;
  `;

  // 5. Fetch current session and term
  const sessions = await sql`SELECT id, name FROM academic_sessions WHERE is_current = true LIMIT 1`;
  const currentSession = sessions[0] || (await sql`SELECT id, name FROM academic_sessions LIMIT 1`)[0];
  
  let currentTerm = null;
  if (currentSession) {
    const terms = await sql`SELECT id, name, term_number FROM academic_terms WHERE session_id = ${currentSession.id} AND is_current = true LIMIT 1`;
    currentTerm = terms[0] || (await sql`SELECT id, name, term_number FROM academic_terms WHERE session_id = ${currentSession.id} LIMIT 1`)[0];
  }

  // 6. Fetch available teachers and staff
  const staffList = await sql`
    SELECT
      s.id as staff_id,
      p.id as person_id,
      p.first_name || ' ' || p.last_name as full_name,
      s.staff_number,
      s.department,
      COALESCE(t.qualification, 'Faculty') as qualification
    FROM staff s
    JOIN people p ON p.id = s.person_id
    LEFT JOIN teachers t ON t.staff_id = s.id
    ORDER BY p.last_name, p.first_name
  `;

  console.log(`Found ${staffList.length} staff members.`);

  // 7. Seed Academic Calendar if none exists
  const existingCal = await sql`SELECT id FROM school_academic_calendars LIMIT 1`;
  if (existingCal.length === 0 && currentSession && currentTerm) {
    console.log("Seeding initial School Academic Calendar...");
    const termStartDate = new Date("2026-09-14");
    const termWeeks = 12;
    const weeksConfig = [];

    const weekTitles = [
      "Scholastic Resumption & Student Orientation",
      "Diagnostic Assessment & Baseline Reviews",
      "Cambridge Progression & STEM Immersion",
      "Inter-Wing Literacy & Quranic Recitation",
      "Continuous Assessment Phase I (CA 1)",
      "Mid-Term Reflection & Pastoral Reviews",
      "Mid-Term Break & Faculty Retreat",
      "STEM Innovation & Robotic Design Week",
      "Continuous Assessment Phase II (CA 2)",
      "Term Revision & Subject Masterclasses",
      "Terminal Examinations & Unified Papers",
      "Grading Collation, Valedictory & Closure"
    ];

    for (let w = 1; w <= termWeeks; w++) {
      const wStart = new Date(termStartDate);
      wStart.setDate(wStart.getDate() + (w - 1) * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 4); // Friday

      weeksConfig.push({
        weekNumber: w,
        startDate: wStart.toISOString().split("T")[0],
        endDate: wEnd.toISOString().split("T")[0],
        title: weekTitles[w - 1] || `Scholastic Week ${w}`,
        isCurrent: w === 4 // Currently Week 4
      });
    }

    const termEndDate = new Date(termStartDate);
    termEndDate.setDate(termEndDate.getDate() + termWeeks * 7);

    await sql`
      INSERT INTO school_academic_calendars (
        session_id, term_id, term_name, start_date, end_date, total_weeks, current_week, manual_override_week, weeks_config, is_active
      ) VALUES (
        ${currentSession.id},
        ${currentTerm.id},
        ${currentTerm.name || "1st Term 2026/2027"},
        ${termStartDate.toISOString().split("T")[0]},
        ${termEndDate.toISOString().split("T")[0]},
        ${termWeeks},
        4,
        4,
        ${JSON.stringify(weeksConfig)}::jsonb,
        true
      );
    `;
    console.log("Academic calendar seeded.");
  }

  // 8. Seed Weekly Themes
  const existingThemes = await sql`SELECT count(*)::int as cnt FROM weekly_themes`;
  if (existingThemes[0].cnt === 0 && currentSession && currentTerm) {
    console.log("Seeding Weekly Themes for all 12 weeks...");
    const themeRecords = [
      {
        week: 1,
        title: "Discipline, Orderliness & Scholastic Ambition",
        scripture: "Surah Al-Alaq (96:1-5) · Proverbs 1:7",
        quote: "Read! In the name of your Lord who created. He taught man by the pen that which he knew not.",
        focus: "Arrival punctuality, clean uniform dress code, and classroom etiquette.",
        values: "Reverence, Self-Discipline, Focus"
      },
      {
        week: 2,
        title: "Diligence, Honesty & Academic Integrity",
        scripture: "Surah Al-Baqarah (2:42) · Colossians 3:23",
        quote: "Truthfulness leads to righteousness, and righteousness leads to Paradise.",
        focus: "Honest independent scholastic work, zero homework delegation, and mutual trust.",
        values: "Integrity, Truthfulness, Accountability"
      },
      {
        week: 3,
        title: "Respect for Authority, Elders & Fellow Scholars",
        scripture: "Surah Al-Isra (17:23) · Ephesians 6:1-2",
        quote: "He is not of us who does not show mercy to our young and respect to our elders.",
        focus: "Courteous greetings in corridors, bowing to counsel, peer solidarity.",
        values: "Honor, Humility, Respect"
      },
      {
        week: 4,
        title: "Peaceful Co-existence & Inter-Cultural Brotherhood",
        scripture: "Surah Al-Hujurat (49:13) · Romans 12:18",
        quote: "Learning for Peaceful Co-existence: Unity in Diversity through knowledge and moral grace.",
        focus: "Zero bullying tolerance, conflict resolution through dialogue, and empathetic teamwork.",
        values: "Peace, Tolerance, Brotherhood, Kindness"
      },
      {
        week: 5,
        title: "Perseverance, Resilience & Mastery in Examination",
        scripture: "Surah Ash-Sharh (94:5-6) · Galatians 6:9",
        quote: "Verily, with hardship comes ease. Let us not grow weary in well-doing.",
        focus: "Exam preparation calmness, systematic study timetable, and perseverance under pressure.",
        values: "Resilience, Tenacity, Grit"
      },
      {
        week: 6,
        title: "Cleanliness, Environmental Custody & Health",
        scripture: "Surah At-Tawbah (9:108) · 1 Corinthians 6:19-20",
        quote: "Purity and cleanliness are half of faith. Safeguard the school sanctuary.",
        focus: "Litter-free campus grounds, sanitization before meals, green playground preservation.",
        values: "Cleanliness, Stewardship, Responsibility"
      },
      {
        week: 7,
        title: "Reflection, Gratitude & Parental Honor",
        scripture: "Surah Luqman (31:14) · Psalm 100:4",
        quote: "Be grateful to Me and to your parents; unto Me is the final destination.",
        focus: "Appreciation letters to guardians, recognizing teachers' pastoral devotion.",
        values: "Gratitude, Reflection, Filial Piety"
      },
      {
        week: 8,
        title: "Creativity, STEM Innovation & Problem Solving",
        scripture: "Surah Yunus (10:101) · Proverbs 18:15",
        quote: "Observe what is in the heavens and earth. An intelligent heart acquires knowledge.",
        focus: "Scientific curiosity, inventive inquiry in laboratories, Cambridge project presentations.",
        values: "Innovation, Curiosity, Excellence"
      },
      {
        week: 9,
        title: "Loyalty, Patriotism & Civic Responsibility",
        scripture: "Surah An-Nisa (4:59) · Jeremiah 29:7",
        quote: "Love of one's homeland and righteous contribution to the Commonwealth is a noble virtue.",
        focus: "National anthem reverence, respect for public property, leadership in school community.",
        values: "Patriotism, Civic Duty, Leadership"
      },
      {
        week: 10,
        title: "Patience, Self-Restraint & Emotional Intelligence",
        scripture: "Surah Al-Imran (3:200) · James 1:19",
        quote: "The strong person is not the one who throws people down, but the one who controls anger.",
        focus: "Anger management, mindful communication, empathy on the sports field.",
        values: "Patience, Temperance, Emotional Mastery"
      },
      {
        week: 11,
        title: "Excellence, Thoroughness & Valedictory Honor",
        scripture: "Surah Al-Mulk (67:2) · Ecclesiastes 9:10",
        quote: "Allah loves that when one of you undertakes any work, you perform it with utmost perfection.",
        focus: "Meticulous exam scripts, punctuality at exam halls, scholastic distinction.",
        values: "Excellence (Ihsan), Diligence, Perfection"
      },
      {
        week: 12,
        title: "Closing Thanksgiving, Unity & Celebration of Growth",
        scripture: "Surah Ibrahim (14:7) · Philippians 4:6",
        quote: "If you are grateful, I will surely increase you in favor.",
        focus: "Holiday safety advisory, continuous reading culture at home, communal prayer.",
        values: "Thanksgiving, Joy, Continuous Learning"
      }
    ];

    for (const t of themeRecords) {
      await sql`
        INSERT INTO weekly_themes (
          session_id, term_id, week_number, theme_title, scripture_reference, quote_or_hadith, assembly_focus, core_values
        ) VALUES (
          ${currentSession.id},
          ${currentTerm.id},
          ${t.week},
          ${t.title},
          ${t.scripture},
          ${t.quote},
          ${t.focus},
          ${t.values}
        );
      `;
    }
    console.log("Weekly themes seeded.");
  }

  // 9. Seed Duty Roster
  const existingRosters = await sql`SELECT count(*)::int as cnt FROM duty_rosters`;
  if (existingRosters[0].cnt === 0 && staffList.length > 0 && currentSession && currentTerm) {
    console.log("Generating initial 12-week School Duty Roster...");
    const standardDuties = [
      "Assembly & Main Gate Supervision",
      "Break Time & Playground Oversight",
      "Dining Hall & Cafeteria Orderliness",
      "Dismissal, Bus Boarding & Evening Security"
    ];

    const weeksData = [];
    const termStartDate = new Date("2026-09-14");

    for (let w = 1; w <= 12; w++) {
      const wStart = new Date(termStartDate);
      wStart.setDate(wStart.getDate() + (w - 1) * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 4);

      // Distribute staff across the 4 duties
      const dutyAssignments = standardDuties.map((dutyName, dIdx) => {
        // Pick 2 staff members per duty slot cyclically
        const staffIdx1 = ((w - 1) * 8 + dIdx * 2) % staffList.length;
        const staffIdx2 = ((w - 1) * 8 + dIdx * 2 + 1) % staffList.length;
        const s1 = staffList[staffIdx1];
        const s2 = staffList[staffIdx2];

        return {
          dutyName,
          staff: [
            { staffId: s1.staff_id, name: s1.full_name, qualification: s1.qualification },
            { staffId: s2.staff_id, name: s2.full_name, qualification: s2.qualification }
          ]
        };
      });

      weeksData.push({
        weekNumber: w,
        startDate: wStart.toISOString().split("T")[0],
        endDate: wEnd.toISOString().split("T")[0],
        duties: dutyAssignments
      });
    }

    await sql`
      INSERT INTO duty_rosters (
        title, session_id, term_id, total_weeks, start_date, end_date, duties_list, weeks_data, is_active
      ) VALUES (
        '1st Term 2026/2027 Official Faculty Weekly Duty Roster',
        ${currentSession.id},
        ${currentTerm.id},
        12,
        '2026-09-14',
        '2026-12-04',
        ${JSON.stringify(standardDuties)}::jsonb,
        ${JSON.stringify(weeksData)}::jsonb,
        true
      );
    `;
    console.log("Active Duty Roster generated and seeded.");
  }

  console.log("Setup complete!");
}

setup().catch((e) => {
  console.error("Setup failed:", e);
  process.exit(1);
});
