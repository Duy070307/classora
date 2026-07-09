"use client";

import type { QuestionItem } from "@/lib/types";
import { getCloudClientForUser } from "@/lib/data/storage-mode";

function mergeQuestionMetadata(row: Record<string, unknown>) {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {};
  return {
    ...metadata,
    bookSeries: row.book_series || metadata.bookSeries,
    sourceType: row.source_type || metadata.sourceType,
    contentType: row.content_type || metadata.contentType,
    needsReview: typeof row.needs_review === "boolean" ? row.needs_review : metadata.needsReview,
  };
}

export async function listCloudQuestions() {
  const cloud = await getCloudClientForUser();
  if (!cloud) return null;
  const { data, error } = await cloud.supabase.from("question_bank").select("*").order("created_at", { ascending: false });
  if (error) return null;
  return data.map((row) => ({
    id: row.id,
    subject: row.subject || "",
    grade: row.grade || "",
    topic: row.topic || "",
    question: row.content,
    type: row.question_type || "Trắc nghiệm",
    difficulty: row.difficulty || "Thông hiểu",
    answer: row.answer || "",
    explanation: row.explanation || "",
    createdAt: row.created_at,
    bankScope: row.bank_scope === "system" ? "system" : "user",
    userId: row.user_id || null,
    options: row.options || null,
    metadata: mergeQuestionMetadata(row)
  } as QuestionItem));
}

export async function saveQuestionsToCloud(items: QuestionItem[]) {
  const cloud = await getCloudClientForUser();
  if (!cloud) return false;
  for (const item of items) {
    if (item.bankScope === "system" || item.metadata?.generatedBy === "Soạn Lab seed") continue;
    const { error } = await cloud.supabase.from("question_bank").upsert({
      id: item.id,
      user_id: cloud.user.id,
      bank_scope: "user",
      subject: item.subject,
      grade: item.grade,
      topic: item.topic,
      question_type: item.type,
      difficulty: item.difficulty,
      content: item.question,
      options: item.options || null,
      answer: item.answer,
      explanation: item.explanation,
      book_series: item.metadata?.bookSeries || null,
      source_type: item.metadata?.sourceType || "teacher_created",
      content_type: item.metadata?.contentType || null,
      needs_review: typeof item.metadata?.needsReview === "boolean" ? item.metadata.needsReview : true,
      metadata: {
        ...(item.metadata || {}),
        sourceType: item.metadata?.sourceType || "teacher_created",
        needsReview: true,
      },
      updated_at: new Date().toISOString()
    });
    if (error) return false;
  }
  return true;
}
