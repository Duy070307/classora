"use client";

import type { GeneratedDocument } from "@/lib/types";

const HISTORY_KEY = "classora_history";

export function getHistory(): GeneratedDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is GeneratedDocument => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<GeneratedDocument>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.content === "string" &&
        typeof candidate.createdAt === "string" &&
        [
          "exam",
          "worksheet",
          "student-comment",
          "lesson-plan",
          "matrix",
          "answer-key",
          "rubric",
          "parent-message",
          "question-bank",
          "question-variant",
          "exam-checker",
          "activity",
          "differentiated-exercises",
          "exam-shuffler",
          "slide-outline",
          "lesson-summary",
          "mindmap-outline",
          "homeroom-plan",
          "parent-meeting-minutes",
          "latex-converter",
          "bulk-student-comments"
        ].includes(candidate.type ?? "")
      );
    });
  } catch {
    return [];
  }
}

export function saveDocument(document: GeneratedDocument) {
  const next = [document, ...getHistory().filter((item) => item.id !== document.id)];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function deleteDocument(id: string) {
  const next = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function createDocument(title: string, type: GeneratedDocument["type"], content: string): GeneratedDocument {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    type,
    content,
    createdAt: new Date().toISOString()
  };
}
