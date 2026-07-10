import type { QuestionItem } from "@/lib/types";
import { canonicalizeGrade, canonicalizeSubject, canonicalizeTopic, comparisonText } from "@/lib/generation/request-context";
import { findTopicNode, isTopicAllowed } from "@/lib/generation/topic-taxonomy";

export type ExamBankSource = "system" | "user" | "both";

export type BankFilter = {
  subject: string;
  grade: string;
  topic: string;
  source: ExamBankSource;
  difficulty?: string;
  questionType?: string;
  allowRelatedTopics?: boolean;
  bookSeries?: string;
};

export function normalizeBankText(value: string) {
  return comparisonText(value);
}

export function canonicalSubject(value: string) {
  return canonicalizeSubject(value).toLocaleLowerCase("vi-VN");
}

export function bankQuestionScope(item: QuestionItem): "system" | "user" {
  return item.bankScope === "system" || item.metadata?.generatedBy === "Soạn Lab seed" ? "system" : "user";
}

export function isSafeTopicMatch(itemTopic: string, selectedTopic: string) {
  const item = canonicalizeTopic(itemTopic);
  const selected = canonicalizeTopic(selectedTopic);
  if (!item || !selected) return false;
  return item === selected || item.includes(selected) || selected.includes(item);
}

export function isStrictBankMatch(item: QuestionItem, filter: BankFilter) {
  const scope = bankQuestionScope(item);
  const node = findTopicNode(filter.subject, canonicalizeGrade(filter.grade), filter.topic);
  return canonicalSubject(item.subject) === canonicalSubject(filter.subject)
    && canonicalizeGrade(item.grade) === canonicalizeGrade(filter.grade)
    && isTopicAllowed(filter.topic, item.topic, node, filter.allowRelatedTopics)
    && (filter.source === "both" || scope === filter.source)
    && (!filter.questionType || item.type === filter.questionType)
    && (!filter.bookSeries || !item.metadata?.bookSeries || normalizeBankText(item.metadata.bookSeries) === normalizeBankText(filter.bookSeries))
    && (!filter.difficulty || item.difficulty === filter.difficulty);
}

export function filterStrictBankQuestions(items: QuestionItem[], filter: BankFilter) {
  return items.filter((item) => isStrictBankMatch(item, filter));
}
