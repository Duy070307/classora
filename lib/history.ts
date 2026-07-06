"use client";

import type { DocumentFolder, GeneratedDocument } from "@/lib/types";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage";

const HISTORY_KEY = STORAGE_KEYS.history;

export function getHistory(): GeneratedDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = readJson<unknown>(HISTORY_KEY, []);
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
          "image-to-latex",
          "image-to-tikz",
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
  writeJson(HISTORY_KEY, next);
  if (typeof window !== "undefined") {
    import("@/lib/data/documents-store").then(({ saveDocumentToCloud }) => saveDocumentToCloud(document)).catch(() => undefined);
  }
}

export function deleteDocument(id: string) {
  const next = getHistory().filter((item) => item.id !== id);
  writeJson(HISTORY_KEY, next);
  if (typeof window !== "undefined") {
    import("@/lib/data/documents-store").then(({ deleteCloudDocument }) => deleteCloudDocument(id)).catch(() => undefined);
  }
}

export function updateDocumentFolder(id: string, folder: DocumentFolder) {
  const next = getHistory().map((item) => item.id === id ? { ...item, folder } : item);
  writeJson(HISTORY_KEY, next);
  if (typeof window !== "undefined") {
    import("@/lib/data/documents-store").then(({ updateCloudDocumentFolder }) => updateCloudDocumentFolder(id, folder)).catch(() => undefined);
  }
}

function defaultFolder(type: GeneratedDocument["type"]): DocumentFolder {
  if (["exam", "matrix", "answer-key", "exam-checker", "exam-shuffler", "question-bank", "question-variant"].includes(type)) return "Đề kiểm tra";
  if (type === "lesson-plan") return "Giáo án";
  if (type === "worksheet") return "Phiếu học tập";
  if (["student-comment", "bulk-student-comments"].includes(type)) return "Nhận xét học sinh";
  return "Khác";
}

export function createDocument(title: string, type: GeneratedDocument["type"], content: string): GeneratedDocument {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    type,
    content,
    createdAt: new Date().toISOString(),
    folder: defaultFolder(type)
  };
}
