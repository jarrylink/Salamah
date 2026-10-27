import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Dropping unique constraint on people.email and adding passport fields...");

  // 1. Drop UNIQUE index people_email_idx and replace with regular index
  await sql`DROP INDEX IF EXISTS people_email_idx;`;
  await sql`CREATE INDEX IF NOT EXISTS people_email_idx ON people (email);`;
  console.log("people_email_idx converted to regular non-unique index.");

  // 2. Add avatar_url and passport_url to application_children
  await sql`ALTER TABLE application_children ADD COLUMN IF NOT EXISTS avatar_url TEXT;`;
  await sql`ALTER TABLE application_children ADD COLUMN IF NOT EXISTS passport_url TEXT;`;
  console.log("application_children updated with avatar_url and passport_url.");

  // 3. Ensure people has avatar_url
  await sql`ALTER TABLE people ADD COLUMN IF NOT EXISTS avatar_url TEXT;`;
  console.log("people table verified with avatar_url.");

  // 4. Update existing sample students with authentic dignified student avatars if null
  const sampleBoyAvatars = [
    "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  ];
  const sampleGirlAvatars = [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80"
  ];

  const studentPeople = await sql`
    SELECT p.id, p.gender, p.first_name, p.avatar_url
    FROM students s
    JOIN people p ON p.id = s.person_id
  `;

  for (let i = 0; i < studentPeople.length; i++) {
    const p = studentPeople[i];
    if (!p.avatar_url) {
      const avatarList = (p.gender || '').toLowerCase() === 'female' ? sampleGirlAvatars : sampleBoyAvatars;
      const avatar = avatarList[i % avatarList.length];
      await sql`UPDATE people SET avatar_url = ${avatar} WHERE id = ${p.id};`;
    }
  }

  // Update application_children with sample avatar if null
  const appChildren = await sql`SELECT id, gender FROM application_children WHERE avatar_url IS NULL`;
  for (let i = 0; i < appChildren.length; i++) {
    const ac = appChildren[i];
    const avatarList = (ac.gender || '').toLowerCase() === 'female' ? sampleGirlAvatars : sampleBoyAvatars;
    const avatar = avatarList[i % avatarList.length];
    await sql`UPDATE application_children SET avatar_url = ${avatar}, passport_url = ${avatar} WHERE id = ${ac.id};`;
  }

  console.log("Sample avatars seeded successfully!");
}

run().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});
