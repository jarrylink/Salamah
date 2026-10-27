import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function seed30Years() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('--- Seeding 30 Years of Academic Sessions (2026/2027 to 2055/2056) ---');

  const startYear = 2026;
  const totalYears = 30;

  // First, unset is_current for all existing sessions and terms
  await sql`UPDATE academic_sessions SET is_current = false`;
  await sql`UPDATE academic_terms SET is_current = false`;

  let currentSessionId = null;
  let currentSecondTermId = null;

  for (let i = 0; i < totalYears; i++) {
    const y1 = startYear + i;
    const y2 = y1 + 1;
    const sessionName = `${y1}/${y2}`;
    const isCurrentSession = (i === 0); // 2026/2027 is the active current session

    // Check if session exists
    const existing = await sql`SELECT id FROM academic_sessions WHERE name = ${sessionName}`;
    let sessionId;
    if (existing.length > 0) {
      sessionId = existing[0].id;
      await sql`
        UPDATE academic_sessions
        SET is_current = ${isCurrentSession},
            start_date = ${`${y1}-09-01`},
            end_date = ${`${y2}-07-31`}
        WHERE id = ${sessionId}
      `;
    } else {
      const inserted = await sql`
        INSERT INTO academic_sessions (name, is_current, start_date, end_date)
        VALUES (${sessionName}, ${isCurrentSession}, ${`${y1}-09-01`}, ${`${y2}-07-31`})
        RETURNING id
      `;
      sessionId = inserted[0].id;
    }

    if (isCurrentSession) {
      currentSessionId = sessionId;
    }

    // Ensure First Term (1), Second Term (2), Third Term (3) exist for each session
    const termConfigs = [
      { name: 'First Term', termNumber: 1, startDate: `${y1}-09-01`, endDate: `${y1}-12-18`, isCurrent: false },
      { name: 'Second Term', termNumber: 2, startDate: `${y2}-01-10`, endDate: `${y2}-04-10`, isCurrent: isCurrentSession },
      { name: 'Third Term', termNumber: 3, startDate: `${y2}-04-26`, endDate: `${y2}-07-25`, isCurrent: false },
    ];

    for (const tc of termConfigs) {
      const existingTerm = await sql`
        SELECT id FROM academic_terms WHERE session_id = ${sessionId} AND term_number = ${tc.termNumber}
      `;
      if (existingTerm.length > 0) {
        await sql`
          UPDATE academic_terms
          SET name = ${tc.name},
              is_current = ${tc.isCurrent},
              start_date = ${tc.startDate},
              end_date = ${tc.endDate}
          WHERE id = ${existingTerm[0].id}
        `;
        if (tc.isCurrent) {
          currentSecondTermId = existingTerm[0].id;
        }
      } else {
        const insertedTerm = await sql`
          INSERT INTO academic_terms (session_id, term_number, name, is_current, start_date, end_date)
          VALUES (${sessionId}, ${tc.termNumber}, ${tc.name}, ${tc.isCurrent}, ${tc.startDate}, ${tc.endDate})
          RETURNING id
        `;
        if (tc.isCurrent) {
          currentSecondTermId = insertedTerm[0].id;
        }
      }
    }
  }

  // Also migrate any student_terminal_reports that were accidentally attached to old dummy sessions
  // so that reports are visible in 2026/2027 Second Term!
  if (currentSessionId && currentSecondTermId) {
    const reportCount = await sql`
      UPDATE student_terminal_reports
      SET session_id = ${currentSessionId}, term_id = ${currentSecondTermId}
      WHERE session_id != ${currentSessionId}
      RETURNING id
    `;
    console.log(`Migrated ${reportCount.length} terminal reports to current session ${currentSessionId} (2026/2027 Second Term)`);
  }

  const allSessions = await sql`SELECT id, name, is_current FROM academic_sessions ORDER BY name ASC`;
  console.log(`Total Academic Sessions in DB: ${allSessions.length}`);
  console.log('First session:', allSessions[0]);
  console.log('30th session:', allSessions[29]);
  console.log('Current session:', allSessions.find(s => s.is_current));
}

seed30Years()
  .then(() => {
    console.log('30-year academic sessions seed completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error seeding academic sessions:', err);
    process.exit(1);
  });
