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
    recognitionDraft: typeof metadata.recognitionDraft === "object" && metadata.recognitionDraft ? metadata.recognitionDraft as GeneratedDocument["recognitionDraft"] : undefined,
    slideDeck: typeof metadata.slideDeck === "object" && metadata.slideDeck ? metadata.slideDeck as GeneratedDocument["slideDeck"] : undefined,
    gradingJob: typeof metadata.gradingJob === "object" && metadata.gradingJob ? metadata.gradingJob as GeneratedDocument["gradingJob"] : undefined,
    answerSheetTemplate: typeof metadata.answerSheetTemplate === "object" && metadata.answerSheetTemplate ? metadata.answerSheetTemplate as GeneratedDocument["answerSheetTemplate"] : undefined,
    answerSheetLayout: typeof metadata.answerSheetLayout === "object" && metadata.answerSheetLayout ? metadata.answerSheetLayout as GeneratedDocument["answerSheetLayout"] : undefined,
    examBlueprint: typeof metadata.examBlueprint === "object" && metadata.examBlueprint ? metadata.examBlueprint as GeneratedDocument["examBlueprint"] : undefined,
    worksheet: typeof metadata.worksheet === "object" && metadata.worksheet ? metadata.worksheet as GeneratedDocument["worksheet"] : undefined,
    lessonPlan: typeof metadata.lessonPlan === "object" && metadata.lessonPlan ? metadata.lessonPlan as GeneratedDocument["lessonPlan"] : undefined,
    questionCollection: typeof metadata.questionCollection === "object" && metadata.questionCollection ? metadata.questionCollection as GeneratedDocument["questionCollection"] : undefined,
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
      examSolutionSet: document.examSolutionSet,
      recognitionDraft: document.recognitionDraft,
      slideDeck: document.slideDeck,
      gradingJob: document.gradingJob,
      answerSheetTemplate: document.answerSheetTemplate,
      answerSheetLayout: document.answerSheetLayout,
      examBlueprint: document.examBlueprint,
      worksheet: document.worksheet,
      lessonPlan: document.lessonPlan,
      questionCollection: document.questionCollection
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
