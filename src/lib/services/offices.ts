import "server-only";
import { sqlClient } from "@/db";

export async function getOfficesList() {
  const offices = await sqlClient.query(`
    SELECT
      o.id,
      o.name,
      o.code,
      o.location,
      o.responsibilities,
      o.assigned_user_id,
      o.status,
      o.created_at,
      u.email as assigned_email,
      u.role as assigned_role,
      p.first_name as assigned_first_name,
      p.last_name as assigned_last_name,
      (SELECT count(*)::int FROM office_logs ol WHERE ol.office_id = o.id) as log_count,
      (SELECT ol.log_date FROM office_logs ol WHERE ol.office_id = o.id ORDER BY ol.log_date DESC LIMIT 1) as last_log_date
    FROM offices o
    LEFT JOIN users u ON u.id = o.assigned_user_id
    LEFT JOIN people p ON p.id = u.person_id
    ORDER BY o.name
  `);
  return offices;
}

export async function getOfficesAssignedToUser(userId: string) {
  const offices = await sqlClient.query(`
    SELECT
      o.id,
      o.name,
      o.code,
      o.location,
      o.responsibilities,
      o.assigned_user_id,
      o.status,
      o.created_at,
      (SELECT count(*)::int FROM office_logs ol WHERE ol.office_id = o.id) as log_count
    FROM offices o
    WHERE o.assigned_user_id = $1 AND o.status = 'active'
    ORDER BY o.name
  `, [userId]);
  return offices;
}

export async function createOrUpdateOffice(input: {
  id?: string;
  name: string;
  code: string;
  location?: string;
  responsibilities: string;
  assignedUserId?: string;
  status: "active" | "inactive";
}) {
  if (input.id) {
    const [updated] = await sqlClient.query(
      `UPDATE offices
       SET name = $1, code = $2, location = $3, responsibilities = $4, assigned_user_id = $5, status = $6, updated_at = now()
       WHERE id = $7 RETURNING id`,
      [input.name, input.code.toUpperCase(), input.location || null, input.responsibilities, input.assignedUserId || null, input.status, input.id]
    );
    return updated;
  } else {
    const [created] = await sqlClient.query(
      `INSERT INTO offices (name, code, location, responsibilities, assigned_user_id, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [input.name, input.code.toUpperCase(), input.location || null, input.responsibilities, input.assignedUserId || null, input.status]
    );
    return created;
  }
}

export async function getOfficeLogs(officeId: string) {
  const logs = await sqlClient.query(`
    SELECT
      ol.id,
      ol.office_id,
      ol.author_user_id,
      ol.log_date,
      ol.week_summary,
      ol.daily_tasks_carried_out,
      ol.challenges,
      ol.next_week_plan,
      ol.status,
      ol.created_at,
      p.first_name as author_first_name,
      p.last_name as author_last_name
    FROM office_logs ol
    JOIN users u ON u.id = ol.author_user_id
    JOIN people p ON p.id = u.person_id
    WHERE ol.office_id = $1
    ORDER BY ol.log_date DESC, ol.created_at DESC
  `, [officeId]);
  return logs;
}

export async function submitOfficeWeeklyLog(input: {
  officeId: string;
  authorUserId: string;
  logDate?: string;
  weekSummary: string;
  dailyTasksCarriedOut: string;
  challenges?: string;
  nextWeekPlan?: string;
}) {
  const [log] = await sqlClient.query(
    `INSERT INTO office_logs (
      office_id, author_user_id, log_date, week_summary, daily_tasks_carried_out, challenges, next_week_plan, status
    ) VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4, $5, $6, $7, 'submitted')
    RETURNING id, status`,
    [
      input.officeId,
      input.authorUserId,
      input.logDate || null,
      input.weekSummary,
      input.dailyTasksCarriedOut,
      input.challenges || null,
      input.nextWeekPlan || null,
    ]
  );
  return log;
}
