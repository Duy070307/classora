import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";

export type DuplicateConfidence = "exact" | "high" | "possible";
export type DuplicateFinding = {
  firstQuestionId: string;
  secondQuestionId: string;
  confidence: DuplicateConfidence;
  reason: "same_wording" | "same_options" | "number_variant" | "same_statements" | "near_wording" | "same_reasoning";
  score: number;
};

export function normalizeDuplicateText(value: string, stripNumbers = false) {
  let normalized = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();
  if (stripNumbers) normalized = normalized.replace(/\d+(?:[.,]\d+)?/g, "#");
  return normalized.replace(/\\(?:left|right|mathrm|text|displaystyle)/g, "").replace(/[^a-z0-9#+\-*/^=<>]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenSet(value: string) {
  return new Set(normalizeDuplicateText(value).split(" ").filter((token) => token.length > 1 && !["cho", "biet", "hay", "tinh", "cau"].includes(token)));
}

function jaccard(left: string, right: string) {
  const a = tokenSet(left); const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / (a.size + b.size - overlap);
}

function sortedOptions(question: ExamQuestion) {
  return Object.values(question.options || {}).map((item) => normalizeDuplicateText(item)).filter(Boolean).sort().join("|");
}

function sortedStatements(question: ExamQuestion) {
  return (question.trueFalseItems || []).map((item) => normalizeDuplicateText(item.text)).filter(Boolean).sort().join("|");
}

export function compareExamQuestions(first: ExamQuestion, second: ExamQuestion): DuplicateFinding | null {
  const left = normalizeDuplicateText(first.stem);
  const right = normalizeDuplicateText(second.stem);
  if (!left || !right) return null;
  const base = { firstQuestionId: first.id, secondQuestionId: second.id };
  if (left === right) return { ...base, confidence: "exact", reason: "same_wording", score: 1 };
  const statementsA = sortedStatements(first); const statementsB = sortedStatements(second);
  if (statementsA && statementsA === statementsB) return { ...base, confidence: "exact", reason: "same_statements", score: 1 };
  const withoutNumbersA = normalizeDuplicateText(first.stem, true);
  const withoutNumbersB = normalizeDuplicateText(second.stem, true);
  const mathStructure = /[=+*/^]|\\(?:frac|sqrt)|\b(?:tính|giá trị|phương trình|tọa độ)\b/iu.test(`${first.stem} ${second.stem}`);
  if (first.stem.length > 28 && withoutNumbersA === withoutNumbersB && mathStructure) return { ...base, confidence: "high", reason: "number_variant", score: 0.98 };
  if (first.stem.length > 28 && withoutNumbersA === withoutNumbersB) return { ...base, confidence: "possible", reason: "number_variant", score: 0.75 };
  const wordingScore = jaccard(first.stem, second.stem);
  const optionA = sortedOptions(first); const optionB = sortedOptions(second);
  if (optionA && optionA === optionB && wordingScore >= 0.88) return { ...base, confidence: "high", reason: "same_options", score: Math.max(0.9, wordingScore) };
  if (wordingScore >= 0.84) return { ...base, confidence: "high", reason: "near_wording", score: wordingScore };
  const reasoningScore = jaccard(first.explanation, second.explanation);
  if (wordingScore >= 0.62 || (wordingScore >= 0.5 && reasoningScore >= 0.82 && normalizeDuplicateText(first.answer) === normalizeDuplicateText(second.answer))) {
    return { ...base, confidence: "possible", reason: reasoningScore >= 0.82 ? "same_reasoning" : "near_wording", score: Math.max(wordingScore, reasoningScore * 0.8) };
  }
  return null;
}

export function findExamDuplicates(exam: StructuredExam) {
  const questions = exam.parts.flatMap((part) => part.questions);
  const findings: DuplicateFinding[] = [];
  for (let left = 0; left < questions.length; left += 1) for (let right = left + 1; right < questions.length; right += 1) {
    const finding = compareExamQuestions(questions[left], questions[right]);
    if (finding) findings.push(finding);
  }
  return findings;
}
