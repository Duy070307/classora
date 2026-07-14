"use client";

import type { SavedExamBlueprint } from "@/lib/exam-blueprints";
import { getCloudClientForUser } from "@/lib/data/storage-mode";

export async function saveExamBlueprintToCloud(item: SavedExamBlueprint) {
  const cloud = await getCloudClientForUser();
  if (!cloud) return false;
  const { error } = await cloud.supabase.from("exam_blueprints").upsert({
    id: item.id,
    user_id: cloud.user.id,
    name: item.name,
    description: item.description || null,
    subject: item.subject || null,
    grade: item.grade || null,
    source_type: item.sourceType,
    blueprint: item.blueprint,
    updated_at: item.updatedAt,
  });
  return !error;
}

export async function listCloudExamBlueprints() {
  const cloud = await getCloudClientForUser();
  if (!cloud) return null;
  const { data, error } = await cloud.supabase.from("exam_blueprints").select("id,name,description,subject,grade,source_type,blueprint,created_at,updated_at").order("updated_at", { ascending: false });
  if (error) return null;
  return data.map((row) => ({ id: row.id, name: row.name, description: row.description || "", subject: row.subject || "", grade: row.grade || "", sourceType: row.source_type, blueprint: row.blueprint, createdAt: row.created_at, updatedAt: row.updated_at })) as SavedExamBlueprint[];
}

