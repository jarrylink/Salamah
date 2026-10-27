import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  const types = await sql`SELECT * FROM assessment_types ORDER BY name`;
  console.log('Assessment Types:', types);

  const assessments = await sql`SELECT a.id, a.name, a.maximum_score, c.name as class_name, s.name as subject_name FROM assessments a JOIN classes c ON c.id = a.class_id JOIN subjects s ON s.id = a.subject_id LIMIT 10`;
  console.log('Sample assessments:', assessments);
}
run();
