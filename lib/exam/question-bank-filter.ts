import type { QuestionItem } from "@/lib/types";

export type ExamBankSource = "system" | "user" | "both";

export type BankFilter = {
  subject: string;
  grade: string;
  topic: string;
  source: ExamBankSource;
  difficulty?: string;
};

export function normalizeBankText(value: string) {
  return value.normalize("NFC").trim().toLocaleLowerCase("vi-VN").replace(/\s+/g, " ");
}

export function canonicalSubject(value: string) {
  const normalized = normalizeBankText(value);
  if (normalized === "vật lý" || normalized === "vật lí") return "vật lí";
  return normalized;
}

export function bankQuestionScope(item: QuestionItem): "system" | "user" {
  return item.bankScope === "system" || item.metadata?.generatedBy === "Soạn Lab seed" ? "system" : "user";
}

export function isSafeTopicMatch(itemTopic: string, selectedTopic: string) {
  const item = normalizeBankText(itemTopic);
  const selected = normalizeBankText(selectedTopic);
  if (!item || !selected) return false;
  return item === selected || item.includes(selected) || selected.includes(item);
}

export function isStrictBankMatch(item: QuestionItem, filter: BankFilter) {
  const scope = bankQuestionScope(item);
  return canonicalSubject(item.subject) === canonicalSubject(filter.subject)
    && normalizeBankText(item.grade) === normalizeBankText(filter.grade)
    && isSafeTopicMatch(item.topic, filter.topic)
    && (filter.source === "both" || scope === filter.source)
    && (!filter.difficulty || item.difficulty === filter.difficulty);
}

export function filterStrictBankQuestions(items: QuestionItem[], filter: BankFilter) {
  return items.filter((item) => isStrictBankMatch(item, filter));
}
