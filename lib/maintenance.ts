import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SafeUser } from "@/lib/auth/user";
import { DEFAULT_MAINTENANCE_MESSAGE, type MaintenanceSettings } from "@/lib/maintenance-shared";

function envSettings(): MaintenanceSettings {
  return {
    enabled: /^(?:1|true|on)$/i.test(process.env.MAINTENANCE_MODE || ""),
    message: process.env.MAINTENANCE_MESSAGE?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
  };
}

function normalizeRow(row: Record<string, unknown> | null): MaintenanceSettings | null {
  if (!row || !row.value || typeof row.value !== "object" || Array.isArray(row.value)) return null;
  const value = row.value as Record<string, unknown>;
  return {
    enabled: value.enabled === true,
    message: typeof value.message === "string" && value.message.trim() ? value.message.trim() : DEFAULT_MAINTENANCE_MESSAGE,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
    updatedBy: typeof row.updated_by === "string" ? row.updated_by : undefined,
  };
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  const admin = createSupabaseAdminClient();
  if (!admin) return envSettings();
  const { data, error } = await admin.from("system_settings").select("value, updated_at, updated_by").eq("key", "maintenance").maybeSingle();
  if (error || !data) return envSettings();
  return normalizeRow(data as Record<string, unknown>) || envSettings();
}

export async function setMaintenanceSettings(input: { enabled: boolean; message: string }, adminUser: SafeUser): Promise<MaintenanceSettings> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("maintenance_storage_unavailable");
  const updatedAt = new Date().toISOString();
  const { data, error } = await admin.from("system_settings").upsert({
    key: "maintenance",
    value: { enabled: input.enabled, message: input.message },
    updated_at: updatedAt,
    updated_by: adminUser.id,
  }, { onConflict: "key" }).select("value, updated_at, updated_by").single();
  if (error || !data) throw new Error("maintenance_update_failed");
  return normalizeRow(data as Record<string, unknown>) || { enabled: input.enabled, message: input.message, updatedAt, updatedBy: adminUser.id };
}
