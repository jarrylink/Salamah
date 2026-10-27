import "server-only";
import { sqlClient } from "@/db";

export async function getSchoolTasksList() {
  const tasks = await sqlClient.query(`
    SELECT
      t.id,
      t.title,
      t.category,
      t.description,
      t.responsibility_document,
      t.assigned_user_id,
      t.frequency,
      t.status,
      t.created_at,
      u.email as assigned_email,
      p.first_name as assigned_first_name,
      p.last_name as assigned_last_name,
      (SELECT count(*)::int FROM school_task_logs tl WHERE tl.task_id = t.id) as log_count,
      (SELECT tl.log_date FROM school_task_logs tl WHERE tl.task_id = t.id ORDER BY tl.log_date DESC LIMIT 1) as last_log_date
    FROM school_tasks t
    LEFT JOIN users u ON u.id = t.assigned_user_id
    LEFT JOIN people p ON p.id = u.person_id
    ORDER BY t.category, t.title
  `);
  return tasks;
}

export async function getTasksAssignedToUser(userId: string) {
  const tasks = await sqlClient.query(`
    SELECT
      t.id,
      t.title,
      t.category,
      t.description,
      t.responsibility_document,
      t.assigned_user_id,
      t.frequency,
      t.status,
      t.created_at,
      (SELECT count(*)::int FROM school_task_logs tl WHERE tl.task_id = t.id) as log_count
    FROM school_tasks t
    WHERE t.assigned_user_id = $1 AND t.status = 'active'
    ORDER BY t.category, t.title
  `, [userId]);
  return tasks;
}

export async function createOrUpdateSchoolTask(input: {
  id?: string;
  title: string;
  category: string;
  description?: string;
  responsibilityDocument: string;
  assignedUserId?: string;
  frequency?: string;
  status?: string;
}) {
  if (input.id) {
    const [updated] = await sqlClient.query(
      `UPDATE school_tasks
       SET title = $1, category = $2, description = $3, responsibility_document = $4,
           assigned_user_id = $5, frequency = COALESCE($6, frequency), status = COALESCE($7, status), updated_at = now()
       WHERE id = $8 RETURNING id`,
      [
        input.title,
        input.category,
        input.description || null,
        input.responsibilityDocument,
        input.assignedUserId || null,
        input.frequency || null,
        input.status || null,
        input.id,
      ]
    );
    return updated;
  } else {
    const [created] = await sqlClient.query(
      `INSERT INTO school_tasks (title, category, description, responsibility_document, assigned_user_id, frequency, status)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'daily'), COALESCE($7, 'active')) RETURNING id`,
      [
        input.title,
        input.category,
        input.description || null,
        input.responsibilityDocument,
        input.assignedUserId || null,
        input.frequency || null,
        input.status || null,
      ]
    );
    return created;
  }
}

export async function getTaskLogs(taskId: string) {
  const logs = await sqlClient.query(`
    SELECT
      tl.id,
      tl.task_id,
      tl.staff_user_id,
      tl.log_date,
      tl.report,
      tl.status,
      tl.notes,
      tl.created_at,
      p.first_name as staff_first_name,
      p.last_name as staff_last_name
    FROM school_task_logs tl
    JOIN users u ON u.id = tl.staff_user_id
    JOIN people p ON p.id = u.person_id
    WHERE tl.task_id = $1
    ORDER BY tl.log_date DESC, tl.created_at DESC
  `, [taskId]);
  return logs;
}

export async function submitTaskLog(input: {
  taskId: string;
  staffUserId: string;
  logDate?: string;
  report: string;
  status?: string;
  notes?: string;
}) {
  const [log] = await sqlClient.query(
    `INSERT INTO school_task_logs (task_id, staff_user_id, log_date, report, status, notes)
     VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4, COALESCE($5, 'completed'), $6)
     RETURNING id, status`,
    [
      input.taskId,
      input.staffUserId,
      input.logDate || null,
      input.report,
      input.status || null,
      input.notes || null,
    ]
  );
  return log;
}
