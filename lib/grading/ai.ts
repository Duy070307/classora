import { extractJson } from "@/lib/ai/extract-json";
import type { GradingConfidence, RecognizedAnswer } from "@/lib/grading/types";

function text(value: unknown, max = 2000) { return typeof value === "string" ? value.replace(/\u0000/g, "").trim().slice(0, max) : ""; }
function confidence(value: unknown): GradingConfidence { return value === "high" || value === "medium" ? value : "low"; }
function box(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const item = value as Record<string, unknown>; const clamp = (v: unknown) => Math.max(0, Math.min(1, Number(v) || 0));
  return { x: clamp(item.x), y: clamp(item.y), width: clamp(item.width), height: clamp(item.height) };
}

export function parseSubmissionRecognition(raw: string, pageNumber: number) {
  const parsed = extractJson(raw); if (!parsed.ok || !parsed.value || typeof parsed.value !== "object") throw new Error("recognition_parse_failed");
  const root = parsed.value as Record<string, unknown>; const rows = Array.isArray(root.answers) ? root.answers : [];
  const answers = rows.flatMap((row): RecognizedAnswer[] => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>; const questionNumber = Number(item.questionNumber);
    if (!Number.isInteger(questionNumber) || questionNumber < 1 || questionNumber > 500) return [];
    const rawValue = text(item.rawValue, 800); const normalized = item.normalizedValue;
    const normalizedItems = Array.isArray(normalized) ? normalized.slice(0, 10) : null;
    const normalizedValue = normalizedItems ? normalizedItems.every((entry) => typeof entry === "boolean") ? normalizedItems as boolean[] : normalizedItems.map((entry) => text(entry, 100)) : typeof normalized === "boolean" || typeof normalized === "number" ? normalized : text(normalized, 800);
    const warnings = Array.isArray(item.warnings) ? item.warnings.map((warning) => text(warning, 240)).filter(Boolean).slice(0, 6) : [];
    return [{ questionId: text(item.questionId, 120) || undefined, questionNumber, rawValue, normalizedValue, confidence: confidence(item.confidence), sourcePage: pageNumber, sourceRegion: box(item.sourceRegion), warnings, teacherConfirmed: false }];
  });
  const studentRoot = root.student && typeof root.student === "object" ? root.student as Record<string, unknown> : {};
  return {
    student: { displayName: text(studentRoot.displayName, 160) || undefined, studentCode: text(studentRoot.studentCode, 80) || undefined, className: text(studentRoot.className, 80) || undefined, candidateNumber: text(studentRoot.candidateNumber, 80) || undefined },
    examCode: text(root.examCode, 20) || undefined,
    examCodeConfidence: root.examCode ? confidence(root.examCodeConfidence) : undefined,
    answers,
    warnings: Array.isArray(root.warnings) ? root.warnings.map((warning) => text(warning, 240)).filter(Boolean).slice(0, 8) : [],
  };
}

export function parseSemanticSuggestions(raw: string) {
  const parsed = extractJson(raw); if (!parsed.ok || !parsed.value || typeof parsed.value !== "object") throw new Error("grading_parse_failed");
  const rows = Array.isArray((parsed.value as Record<string, unknown>).suggestions) ? (parsed.value as Record<string, unknown>).suggestions as unknown[] : [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>; const questionId = text(item.questionId, 120); const suggestedScore = Number(item.suggestedScore); const maximumScore = Number(item.maximumScore);
    if (!questionId || !Number.isFinite(suggestedScore) || !Number.isFinite(maximumScore)) return [];
    return [{ questionId, suggestedScore: Math.max(0, Math.min(maximumScore, suggestedScore)), maximumScore, evidence: text(item.evidence, 1200), reason: text(item.reason, 1200), feedback: text(item.feedback, 600), confidence: confidence(item.confidence) }];
  });
}
