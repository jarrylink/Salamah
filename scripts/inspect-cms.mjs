import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const rows = await sql.query("SELECT section_key, title, subtitle, content FROM cms_sections ORDER BY section_key");
console.log(JSON.stringify(rows, null, 2));
