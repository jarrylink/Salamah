import "server-only";
import { sqlClient } from "@/db";

export async function getSystemSettings() {
  try {
    const rows = await sqlClient.query("SELECT setting_key, setting_value, description FROM system_settings");
    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      settings[row.setting_key] = typeof row.setting_value === "string" ? JSON.parse(row.setting_value) : row.setting_value;
    }
    return settings;
  } catch (error) {
    console.error("Failed to load system settings from DB:", error);
    return {};
  }
}

export async function updateSystemSetting(key: string, value: Record<string, unknown>, description?: string) {
  const [updated] = await sqlClient.query(
    `INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (setting_key) DO UPDATE
     SET setting_value = excluded.setting_value,
         description = COALESCE(excluded.description, system_settings.description),
         updated_at = now()
     RETURNING setting_key, setting_value`,
    [key, JSON.stringify(value), description || null]
  );
  return updated;
}
