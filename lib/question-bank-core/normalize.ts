import type { QuestionDifficulty, QuestionItem, QuestionType } from "@/lib/types";
import type { CanonicalQuestionType, QuestionBankItem, QuestionOption } from "@/lib/question-bank-core/types";

const legacyType: Record<QuestionType, CanonicalQuestionType> = {
  "Trắc nghiệm": "multiple_choice",
  "Đúng/Sai": "true_false",
  "Trả lời ngắn": "short_answer",
  "Tự luận": "essay",
  "Điền khuyết": "fill_blank",
};

const canonicalType: Record<CanonicalQuestionType, QuestionType> = {
  multiple_choice: "Trắc nghiệm",
  true_false: "Đúng/Sai",
  short_answer: "Trả lời ngắn",
  essay: "Tự luận",
  fill_blank: "Điền khuyết",
  matching: "Tự luận",
  ordering: "Tự luận",
  table_completion: "Tự luận",
};

function id() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function optionsFromLegacy(options?: Record<string, string> | null): QuestionOption[] {
  return Object.entries(options || {}).filter(([, text]) => Boolean(text?.trim())).map(([label, text]) => ({ id: label.toUpperCase(), label: label.toUpperCase(), text }));
}

function safeDifficulty(value: unknown): QuestionDifficulty {
  return ["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"].includes(String(value)) ? value as QuestionDifficulty : "Thông hiểu";
}

export function createCanonicalQuestion(patch: Partial<QuestionBankItem> = {}): QuestionBankItem {
  const now = new Date().toISOString();
  return {
    schemaVersion: 2,
    id: patch.id || id(), ownerId: patch.ownerId ?? null, scope: patch.scope || "user",
    type: patch.type || "multiple_choice", prompt: patch.prompt || "", instructions: patch.instructions || "",
    subject: patch.subject || "", grade: patch.grade || "", topic: patch.topic || "", subtopic: patch.subtopic || "",
    difficulty: safeDifficulty(patch.difficulty), cognitiveLevel: patch.cognitiveLevel || safeDifficulty(patch.difficulty),
    learningOutcome: patch.learningOutcome || "", bookSeries: patch.bookSeries || "Khác", tags: patch.tags || [], score: Math.max(0, Number(patch.score || 0)),
    options: patch.options || [], correctOptionIds: patch.correctOptionIds || [], trueFalseStatements: patch.trueFalseStatements || [],
    answer: patch.answer || "", acceptedAnswers: patch.acceptedAnswers || [], unit: patch.unit || "", tolerance: patch.tolerance,
    essayRubric: patch.essayRubric || [], matchingPairs: patch.matchingPairs || [], orderingItems: patch.orderingItems || [], tableAnswers: patch.tableAnswers || [],
    explanation: patch.explanation || "", visuals: patch.visuals || [],
    source: patch.source || { type: "teacher_created" },
    quality: patch.quality || { status: "needs_review", reviewStatus: "draft", issues: [], ignoredIssueCodes: [] },
    usage: patch.usage || { count: 0, documentIds: [] },
    createdAt: patch.createdAt || now, updatedAt: patch.updatedAt || now,
  };
}

function isCanonical(value: unknown): value is QuestionBankItem {
  return Boolean(value && typeof value === "object" && (value as { schemaVersion?: unknown }).schemaVersion === 2);
}

export function fromLegacyQuestion(item: QuestionItem): QuestionBankItem {
  const stored = item.metadata?.canonical;
  if (isCanonical(stored)) {
    return createCanonicalQuestion({ ...stored, id: item.id, ownerId: item.userId ?? stored.ownerId, scope: item.bankScope === "system" ? "system" : stored.scope, createdAt: item.createdAt });
  }
  const options = optionsFromLegacy(item.options);
  const answer = item.answer?.trim() || "";
  const tfStatements = Array.isArray(item.metadata?.trueFalseStatements) ? item.metadata.trueFalseStatements as QuestionBankItem["trueFalseStatements"] : [];
  return createCanonicalQuestion({
    id: item.id, ownerId: item.userId, scope: item.bankScope === "system" ? "system" : "user", type: legacyType[item.type] || "essay",
    prompt: item.question, subject: item.subject, grade: item.grade, topic: item.topic, difficulty: item.difficulty,
    cognitiveLevel: item.difficulty, bookSeries: String(item.metadata?.bookSeries || "Khác"),
    options, correctOptionIds: legacyType[item.type] === "multiple_choice" && answer ? [answer.toUpperCase()] : [],
    trueFalseStatements: tfStatements, answer, explanation: item.explanation,
    tags: Array.isArray(item.metadata?.tags) ? item.metadata.tags.map(String) : [],
    source: { type: String(item.metadata?.sourceType || "legacy") },
    quality: { status: item.metadata?.needsReview === false ? "valid" : "needs_review", reviewStatus: item.metadata?.needsReview === false ? "teacher_confirmed" : "draft", issues: [], ignoredIssueCodes: [] },
    usage: typeof item.metadata?.usage === "object" && item.metadata.usage ? item.metadata.usage as QuestionBankItem["usage"] : { count: 0, documentIds: [] },
    createdAt: item.createdAt, updatedAt: String(item.metadata?.updatedAt || item.createdAt),
  });
}

export function toLegacyQuestion(item: QuestionBankItem): QuestionItem {
  const options = item.type === "multiple_choice" ? Object.fromEntries(item.options.map((option) => [option.label, option.text])) : null;
  const answer = item.type === "multiple_choice" ? item.correctOptionIds.join(",") : item.type === "true_false"
    ? item.trueFalseStatements.map((statement) => `${statement.label}:${statement.answer ? "Đúng" : "Sai"}`).join("; ") : item.answer;
  return {
    id: item.id, userId: item.ownerId, bankScope: item.scope, subject: item.subject, grade: item.grade, topic: item.topic,
    question: item.prompt, type: canonicalType[item.type], difficulty: item.difficulty, answer, explanation: item.explanation,
    createdAt: item.createdAt, options,
    metadata: {
      canonical: item, bookSeries: item.bookSeries, sourceType: item.source.type, needsReview: item.quality.status !== "valid",
      tags: item.tags, usage: item.usage, updatedAt: item.updatedAt,
    },
  };
}

export function normalizeQuestionItems(items: QuestionItem[]) {
  return items.map(fromLegacyQuestion);
}

export function cloneQuestion(item: QuestionBankItem) {
  const now = new Date().toISOString();
  return createCanonicalQuestion({ ...structuredClone(item), id: id(), scope: "user", ownerId: null, prompt: `${item.prompt} (bản sao)`, source: { type: "duplicated", referenceId: item.id }, quality: { ...item.quality, status: "needs_review", reviewStatus: "draft" }, createdAt: now, updatedAt: now });
}
