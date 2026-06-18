"use client";

import type { QuestionDifficulty, QuestionItem, QuestionType } from "@/lib/types";
import { readJson, writeJson } from "@/lib/safe-storage";

const QUESTION_BANK_KEY = "classora_question_bank";

const types: QuestionType[] = ["Trắc nghiệm", "Tự luận", "Điền khuyết", "Đúng/Sai"];
const difficulties: QuestionDifficulty[] = ["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"];

export function getQuestions(): QuestionItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = readJson<unknown>(QUESTION_BANK_KEY, []);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is QuestionItem => {
      if (!item || typeof item !== "object") return false;
      const value = item as Partial<QuestionItem>;
      return Boolean(
        typeof value.id === "string" &&
        typeof value.subject === "string" &&
        typeof value.grade === "string" &&
        typeof value.topic === "string" &&
        typeof value.question === "string" &&
        types.includes(value.type as QuestionType) &&
        difficulties.includes(value.difficulty as QuestionDifficulty)
      );
    });
  } catch {
    return [];
  }
}

export function saveQuestions(items: QuestionItem[]) {
  writeJson(QUESTION_BANK_KEY, items);
}

export function addQuestions(items: QuestionItem[]) {
  const existing = getQuestions();
  saveQuestions([...items, ...existing.filter((old) => !items.some((item) => item.id === old.id))]);
}

export function createQuestion(input: Omit<QuestionItem, "id" | "createdAt">): QuestionItem {
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
}

export function questionsToDocument(items: QuestionItem[]) {
  const header = items[0];
  const questions = items.map((item, index) =>
    `Câu ${index + 1}. ${item.question}\nLoại: ${item.type} | Mức độ: ${item.difficulty}\nĐáp án: ${item.answer || "Chưa có"}${item.explanation ? `\nLời giải: ${item.explanation}` : ""}`
  );
  return `NGÂN HÀNG CÂU HỎI\nMôn học: ${header?.subject || "Nhiều môn"}\nLớp: ${header?.grade || "Nhiều lớp"}\nChủ đề: ${header?.topic || "Nhiều chủ đề"}\nSố câu: ${items.length}\n\n${questions.join("\n\n")}`;
}
