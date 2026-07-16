import type { GradingConfidence, GradingSubmission, RecognizedAnswer } from "@/lib/grading/types";

function confidenceFor(value: string, multiple: boolean): GradingConfidence {
  if (!value.trim() || multiple) return "low";
  return value.length > 80 ? "medium" : "high";
}
function normalizeValue(value: string) {
  const clean = value.trim().replace(/[‐‑–−]/g, "-");
  const options = clean.toUpperCase().match(/\b[A-D]\b/g) || [];
  if (options.length > 1) return [...new Set(options)];
  if (options.length === 1 && clean.length <= 8) return options[0];
  const truth = clean.split(/[;,|/\s]+/).filter(Boolean);
  if (truth.length > 1 && truth.every((item) => /^(?:đ|d|s|true|false|0|1)$/i.test(item))) return truth.map((item) => /^(?:đ|d|true|1)$/i.test(item));
  return clean.replace(/,/g, ".");
}

export function recognizeAnswersFromText(text: string, pageNumber = 1) {
  const normalized = text.replace(/\r/g, "");
  const student = {
    displayName: normalized.match(/(?:họ\s*(?:và\s*)?tên|họ\s*tên)\s*[:.-]\s*([^\n]+)/iu)?.[1]?.trim(),
    studentCode: normalized.match(/(?:mã\s*học\s*sinh|mshs)\s*[:.-]\s*([^\s\n]+)/iu)?.[1]?.trim(),
    className: normalized.match(/(?:lớp)\s*[:.-]\s*([^\s\n]+)/iu)?.[1]?.trim(),
    candidateNumber: normalized.match(/(?:số\s*báo\s*danh|sbd)\s*[:.-]\s*([^\s\n]+)/iu)?.[1]?.trim(),
  };
  const examCode = normalized.match(/(?:mã\s*đề)\s*[:.-]?\s*(\d{2,6})/iu)?.[1];
  const answers: RecognizedAnswer[] = [];
  const pattern = /(?:^|\n)\s*(?:câu\s*)?(\d{1,3})\s*[).:\-]\s*([^\n]{1,500})/giu;
  for (const match of normalized.matchAll(pattern)) {
    const raw = match[2].trim();
    const value = normalizeValue(raw);
    const multiple = Array.isArray(value) && value.length > 1 && value.every((item) => typeof item === "string" && /^[A-D]$/.test(item));
    answers.push({ questionNumber: Number(match[1]), rawValue: raw, normalizedValue: value, confidence: confidenceFor(raw, multiple), sourcePage: pageNumber, warnings: multiple ? ["Phát hiện nhiều lựa chọn; cần giáo viên xác nhận."] : [], teacherConfirmed: false });
  }
  return { student, examCode, examCodeConfidence: examCode ? "high" as const : undefined, answers };
}

export function mergeRecognizedAnswers(current: RecognizedAnswer[], incoming: RecognizedAnswer[]) {
  const map = new Map(current.map((answer) => [`${answer.questionNumber}:${answer.sourcePage || 0}`, answer]));
  incoming.forEach((answer) => map.set(`${answer.questionNumber}:${answer.sourcePage || 0}`, answer));
  return [...map.values()].sort((a, b) => a.questionNumber - b.questionNumber || (a.sourcePage || 0) - (b.sourcePage || 0));
}

export function createSubmission(label: string, fileName?: string): GradingSubmission {
  return { id: crypto.randomUUID(), teacherLabel: label, student: {}, sourceFiles: fileName ? [{ id: crypto.randomUUID(), fileName, mimeType: "text/plain", size: 0, pageCount: 1, status: "pending" }] : [], recognizedAnswers: [], reviewStatus: "not_reviewed", warnings: [] };
}
