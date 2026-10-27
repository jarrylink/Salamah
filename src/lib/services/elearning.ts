import "server-only";
import { sqlClient } from "@/db";

export type ElearningResourceItem = {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  subject_name?: string | null;
  class_id: string | null;
  class_name?: string | null;
  resource_type: "text" | "file" | "url";
  content: string;
  file_name: string | null;
  status: string;
  created_at: string;
  author_first_name?: string | null;
  author_last_name?: string | null;
};

export async function getElearningResources(options?: { classId?: string; subjectId?: string }) {
  let query = `
    SELECT
      r.id,
      r.title,
      r.description,
      r.subject_id,
      r.class_id,
      r.resource_type,
      r.content,
      r.file_name,
      r.status,
      r.created_at,
      s.name as subject_name,
      c.name as class_name,
      p.first_name as author_first_name,
      p.last_name as author_last_name
    FROM elearning_resources r
    LEFT JOIN subjects s ON s.id = r.subject_id
    LEFT JOIN classes c ON c.id = r.class_id
    LEFT JOIN users u ON u.id = r.author_user_id
    LEFT JOIN people p ON p.id = u.person_id
    WHERE r.status = 'active'
  `;
  const params: unknown[] = [];
  if (options?.classId) {
    params.push(options.classId);
    query += ` AND (r.class_id = $${params.length} OR r.class_id IS NULL)`;
  }
  if (options?.subjectId) {
    params.push(options.subjectId);
    query += ` AND r.subject_id = $${params.length}`;
  }
  query += " ORDER BY r.created_at DESC";

  const rows = await sqlClient.query(query, params);
  return rows as ElearningResourceItem[];
}

export async function createOrUpdateElearningResource(input: {
  id?: string;
  title: string;
  description?: string;
  subjectId?: string;
  classId?: string;
  resourceType: "text" | "file" | "url";
  content: string;
  fileName?: string;
  authorUserId?: string;
  status?: string;
}) {
  if (input.id) {
    const [updated] = await sqlClient.query(
      `UPDATE elearning_resources
       SET title = $1, description = $2, subject_id = $3, class_id = $4,
           resource_type = $5, content = $6, file_name = $7, status = COALESCE($8, status), updated_at = now()
       WHERE id = $9 RETURNING id`,
      [
        input.title,
        input.description || null,
        input.subjectId || null,
        input.classId || null,
        input.resourceType,
        input.content,
        input.fileName || null,
        input.status || null,
        input.id,
      ]
    );
    return updated;
  } else {
    const [created] = await sqlClient.query(
      `INSERT INTO elearning_resources (
        title, description, subject_id, class_id, resource_type, content, file_name, status, author_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'active'), $9) RETURNING id`,
      [
        input.title,
        input.description || null,
        input.subjectId || null,
        input.classId || null,
        input.resourceType,
        input.content,
        input.fileName || null,
        input.status || null,
        input.authorUserId || null,
      ]
    );
    return created;
  }
}

export async function deleteElearningResource(id: string) {
  await sqlClient.query("DELETE FROM elearning_resources WHERE id = $1", [id]);
  return { success: true };
}
