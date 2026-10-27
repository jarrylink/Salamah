import { sqlClient } from "@/db";
import { SectionHeadsClient } from "@/features/dashboard/components/section-heads-client";

export default async function ManagersPage() {
  const sectionHeads = await sqlClient.query(`
    SELECT 
      sh.*,
      s.name as section_name,
      s.code as section_canonical_code
    FROM school_section_heads sh
    LEFT JOIN sections s ON s.id = sh.section_id
    ORDER BY 
      CASE 
        WHEN sh.section_code = 'NURSERY' THEN 1
        WHEN sh.section_code = 'PRIMARY' THEN 2
        WHEN sh.section_code = 'SECONDARY' THEN 3
        ELSE 4
      END
  `);

  return (
    <div className="space-y-6 salamah-enter">
      <SectionHeadsClient initialSectionHeads={sectionHeads as any} />
    </div>
  );
}
