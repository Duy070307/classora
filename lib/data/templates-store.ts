"use client";

import type { TemplateItem } from "@/lib/templates";
import { getCloudClientForUser } from "@/lib/data/storage-mode";

export async function listCloudTemplates() {
  const cloud = await getCloudClientForUser();
  if (!cloud) return null;
  const { data, error } = await cloud.supabase.from("templates").select("id,title,category,content,metadata,updated_at").order("updated_at", { ascending: false });
  if (error) return null;
  return data.map((row) => ({
    id: row.id,
    name: row.title,
    type: row.category || "",
    content: row.content,
    notes: typeof row.metadata?.notes === "string" ? row.metadata.notes : "",
    updatedAt: row.updated_at
  } satisfies TemplateItem));
}

export async function saveTemplatesToCloud(items: TemplateItem[]) {
  const cloud = await getCloudClientForUser();
  if (!cloud) return false;
  for (const item of items) {
    const { error } = await cloud.supabase.from("templates").upsert({
      id: item.id,
      user_id: cloud.user.id,
      title: item.name,
      category: item.type,
      content: item.content,
      metadata: { notes: item.notes },
      updated_at: item.updatedAt || new Date().toISOString()
    });
    if (error) return false;
  }
  return true;
}
