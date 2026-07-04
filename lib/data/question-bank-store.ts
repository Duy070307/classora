"use client";

import type { QuestionItem } from "@/lib/types";
import { getCloudClientForUser } from "@/lib/data/storage-mode";

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
    createdAt: row.created_at
  } as QuestionItem));
}

export async function saveQuestionsToCloud(items: QuestionItem[]) {
  const cloud = await getCloudClientForUser();
  if (!cloud) return false;
  for (const item of items) {
    const { error } = await cloud.supabase.from("question_bank").upsert({
      id: item.id,
      user_id: cloud.user.id,
      subject: item.subject,
      grade: item.grade,
      topic: item.topic,
      question_type: item.type,
      difficulty: item.difficulty,
      content: item.question,
      answer: item.answer,
      explanation: item.explanation,
      updated_at: new Date().toISOString()
    });
    if (error) return false;
  }
  return true;
}
