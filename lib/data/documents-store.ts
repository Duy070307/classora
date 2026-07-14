"use client";

import type { GeneratedDocument } from "@/lib/types";
import { getCloudClientForUser } from "@/lib/data/storage-mode";

type DocumentRow = {
  id: string;
  title: string;
  tool: GeneratedDocument["type"];
  content: string;
  metadata: Record<string, unknown> | null;
  structured_data: unknown;
  created_at: string;
};

function rowToDocument(row: DocumentRow): GeneratedDocument {
  const metadata = row.metadata ?? {};
  return {
    id: row.id,
    title: row.title,
    type: row.tool,
    content: row.content,
    createdAt: row.created_at,
    folder: typeof metadata.folder === "string" ? metadata.folder as GeneratedDocument["folder"] : undefined,
    examMeta: typeof metadata.examMeta === "object" && metadata.examMeta ? metadata.examMeta as GeneratedDocument["examMeta"] : undefined,
    generationMeta: typeof metadata.generationMeta === "object" && metadata.generationMeta ? metadata.generationMeta as GeneratedDocument["generationMeta"] : undefined,
    auditMeta: typeof metadata.auditMeta === "object" && metadata.auditMeta ? metadata.auditMeta as GeneratedDocument["auditMeta"] : undefined,
    examVariantSet: typeof metadata.examVariantSet === "object" && metadata.examVariantSet ? metadata.examVariantSet as GeneratedDocument["examVariantSet"] : undefined,
    examSolutionSet: typeof metadata.examSolutionSet === "object" && metadata.examSolutionSet ? metadata.examSolutionSet as GeneratedDocument["examSolutionSet"] : undefined,
    structuredExam: row.structured_data ? row.structured_data as GeneratedDocument["structuredExam"] : undefined
  };
}

export async function listCloudDocuments() {
  const cloud = await getCloudClientForUser();
  if (!cloud) return null;
  const { data, error } = await cloud.supabase
    .from("documents")
    .select("id,title,tool,content,metadata,structured_data,created_at")
    .order("created_at", { ascending: false });
  if (error) return null;
  return (data as DocumentRow[]).map(rowToDocument);
}

export async function getCloudDocument(id: string) {
  const cloud = await getCloudClientForUser();
  if (!cloud) return null;
  const { data, error } = await cloud.supabase
    .from("documents")
    .select("id,title,tool,content,metadata,structured_data,created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToDocument(data as DocumentRow);
}

export async function saveDocumentToCloud(document: GeneratedDocument) {
  const cloud = await getCloudClientForUser();
  if (!cloud) return false;
  const { error } = await cloud.supabase.from("documents").upsert({
    id: document.id,
    user_id: cloud.user.id,
    title: document.title,
    tool: document.type,
    content: document.content,
    metadata: {
      folder: document.folder,
      examMeta: document.examMeta,
      generationMeta: document.generationMeta,
      auditMeta: document.auditMeta,
      examVariantSet: document.examVariantSet,
      examSolutionSet: document.examSolutionSet
    },
    structured_data: document.structuredExam ?? null,
    updated_at: new Date().toISOString()
  });
  return !error;
}

export async function deleteCloudDocument(id: string) {
  const cloud = await getCloudClientForUser();
  if (!cloud) return false;
  const { error } = await cloud.supabase.from("documents").delete().eq("id", id);
  return !error;
}

export async function updateCloudDocumentFolder(id: string, folder: GeneratedDocument["folder"]) {
  const existing = await getCloudDocument(id);
  if (!existing) return false;
  return saveDocumentToCloud({ ...existing, folder });
}

export async function migrateDocumentsToCloud(documents: GeneratedDocument[]) {
  let count = 0;
  for (const document of documents) {
    if (await saveDocumentToCloud(document)) count += 1;
  }
  return count;
}
