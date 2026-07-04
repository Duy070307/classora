"use client";

import type { DocumentSettings } from "@/lib/document-settings";
import { getCloudClientForUser } from "@/lib/data/storage-mode";

export async function loadCloudSettings() {
  const cloud = await getCloudClientForUser();
  if (!cloud) return null;
  const { data, error } = await cloud.supabase.from("user_settings").select("settings").eq("user_id", cloud.user.id).maybeSingle();
  if (error || !data?.settings) return null;
  return data.settings as Partial<DocumentSettings>;
}

export async function saveSettingsToCloud(settings: DocumentSettings) {
  const cloud = await getCloudClientForUser();
  if (!cloud) return false;
  const { error } = await cloud.supabase.from("user_settings").upsert({
    user_id: cloud.user.id,
    settings,
    updated_at: new Date().toISOString()
  });
  return !error;
}
