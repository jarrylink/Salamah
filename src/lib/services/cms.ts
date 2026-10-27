import "server-only";
import { sqlClient } from "@/db";

export type CmsSection = {
  id: string;
  sectionKey: string;
  title: string;
  subtitle: string | null;
  content: Record<string, unknown>;
  isActive: boolean;
  updatedAt: string;
};

export async function getCmsSections(): Promise<Record<string, CmsSection>> {
  try {
    const rows = await sqlClient.query(
      "SELECT id, section_key, title, subtitle, content, is_active, updated_at FROM cms_sections WHERE is_active = true"
    );
    const sections: Record<string, CmsSection> = {};
    for (const row of rows) {
      sections[row.section_key] = {
        id: row.id,
        sectionKey: row.section_key,
        title: row.title,
        subtitle: row.subtitle,
        content: typeof row.content === "string" ? JSON.parse(row.content) : row.content ?? {},
        isActive: row.is_active,
        updatedAt: row.updated_at,
      };
    }
    return sections;
  } catch (error) {
    console.error("Failed to fetch CMS sections from DB:", error);
    return {};
  }
}

export async function updateCmsSection(
  sectionKey: string,
  title: string,
  subtitle: string | null,
  content: Record<string, unknown>
) {
  const [updated] = await sqlClient.query(
    `INSERT INTO cms_sections (section_key, title, subtitle, content, is_active, updated_at)
     VALUES ($1, $2, $3, $4, true, now())
     ON CONFLICT (section_key) DO UPDATE
     SET title = excluded.title, subtitle = excluded.subtitle, content = excluded.content, updated_at = now()
     RETURNING id, section_key, title, subtitle, content`,
    [sectionKey, title, subtitle, JSON.stringify(content)]
  );
  return updated;
}
