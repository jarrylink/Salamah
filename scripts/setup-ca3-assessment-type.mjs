import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Ensuring Third CA exists in assessment_types...');
  
  const existing = await sql`
    SELECT * FROM assessment_types WHERE code = 'CA3' OR name ILIKE '%third%'
  `;
  
  if (existing.length === 0) {
    const inserted = await sql`
      INSERT INTO assessment_types (name, code, maximum_score, weight, sort_order, status)
      VALUES ('Third CA', 'CA3', 10, 10, 3, 'active')
      RETURNING *
    `;
    console.log('Inserted Third CA:', inserted);

    // Update First CA and Second CA to standard 10 marks and sort orders if needed
    await sql`UPDATE assessment_types SET sort_order = 1, maximum_score = 10, weight = 10 WHERE code = 'CA1'`;
    await sql`UPDATE assessment_types SET sort_order = 2, maximum_score = 10, weight = 10 WHERE code = 'CA2'`;
    await sql`UPDATE assessment_types SET sort_order = 4, maximum_score = 70, weight = 70 WHERE code = 'EXAM'`;
  } else {
    console.log('Third CA already exists:', existing);
  }

  const allTypes = await sql`SELECT * FROM assessment_types ORDER BY sort_order ASC, name ASC`;
  console.log('Current Assessment Types:', allTypes);
}

run().catch(console.error);
