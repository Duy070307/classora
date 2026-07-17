"use client";

import { createDocument, getHistory, saveDocument } from "@/lib/history";
import type { QuestionCollection } from "@/lib/question-bank-core/types";

export function localQuestionCollections() {
  return getHistory().map((document) => document.questionCollection).filter((item): item is QuestionCollection => Boolean(item));
}

export function createQuestionCollection(title: string, questionIds: string[] = []): QuestionCollection {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), title: title.trim() || "Bộ câu hỏi mới", description: "", questionIds: [...new Set(questionIds)], createdAt: now, updatedAt: now };
}

export function saveQuestionCollection(collection: QuestionCollection) {
  const document = createDocument(collection.title, "question-bank", `BỘ CÂU HỎI\n${collection.description}\n\nSố câu: ${collection.questionIds.length}`);
  document.id = collection.id;
  document.questionCollection = { ...collection, questionIds: [...new Set(collection.questionIds)], updatedAt: new Date().toISOString() };
  saveDocument(document);
  return document.questionCollection;
}
