import type { ExamQuestion, ExamPartType, StructuredExam } from "@/lib/exam-types";
import type { ExamInput } from "@/lib/types";
import { balanceMultipleChoiceAnswers, balanceTrueFalsePatterns, normalizeExamQuestionMath, normalizeTeacherMathNotation, validateMultipleChoiceOptions, validateShortAnswerNumeric, validateTrueFalseQuality, validateVisualDependency } from "@/lib/exam/exam-quality";

export type ExamStructureRequest = {
  sectionCounts: { partI: number; partII: number; partIII: number };
  requestedQuestionCount: number;
  totalScore: number;
  difficultyDistribution: { recognition: number; comprehension: number; application: number; highApplication: number };
  warnings?: string[];
};

export function calculateExamStructure(input: Partial<ExamInput> & Record<string, unknown>): ExamStructureRequest {
  const warnings: string[] = [];
  const safeNumber = (value: unknown, fallback: number, field: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) { warnings.push(`${field} không hợp lệ, đã dùng giá trị an toàn ${fallback}.`); return fallback; }
    return parsed;
  };
  const partI = safeNumber(input.multipleChoiceCount ?? input.partICount ?? 0, 0, "Số câu PHẦN I");
  const partII = safeNumber(input.trueFalseCount ?? input.partIICount ?? 0, 0, "Số câu PHẦN II");
  const partIII = safeNumber(input.shortAnswerCount ?? input.partIIICount ?? 0, 0, "Số câu PHẦN III");
  return {
    sectionCounts: { partI, partII, partIII },
    requestedQuestionCount: partI + partII + partIII,
    totalScore: safeNumber(input.totalScore ?? 10, 10, "Tổng điểm"),
    difficultyDistribution: {
      recognition: safeNumber(input.recognitionRate ?? 30, 30, "Tỉ lệ nhận biết"),
      comprehension: safeNumber(input.understandingRate ?? 40, 40, "Tỉ lệ thông hiểu"),
      application: safeNumber(input.applicationRate ?? 20, 20, "Tỉ lệ vận dụng"),
      highApplication: safeNumber(input.advancedRate ?? 10, 10, "Tỉ lệ vận dụng cao"),
    },
    ...(warnings.length ? { warnings } : {}),
  };
}

function normalizedStem(value: string) {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9=+\-*/^() ]/g, "").trim();
}

function coreExpression(value: string) {
  const normalized = value.replace(/\s+/g, "").toLowerCase();
  return normalized.match(/(?:y|f\(x\))=[^,;.?!]+/)?.[0] || "";
}

function nearDuplicate(left: string, right: string) {
  const a = new Set(left.split(" ").filter((token) => token.length > 2));
  const b = new Set(right.split(" ").filter((token) => token.length > 2));
  if (!a.size || !b.size) return false;
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / Math.max(a.size, b.size) >= 0.9;
}

function questionInvalidReason(question: ExamQuestion, type: ExamPartType, thptStyle: boolean) {
  if (!question.stem.trim() || !question.answer.trim() || !question.explanation.trim()) return "missing_required_content";
  const visual = validateVisualDependency(question);
  if (!visual.valid) return visual.reason;
  if (type === "multiple_choice") {
    const options = validateMultipleChoiceOptions(question);
    return options.valid ? "" : options.reason;
  }
  if (type === "true_false") {
    if (!(question.trueFalseItems?.length === 4 && question.trueFalseItems.every((item) => item.text.trim() && typeof item.answer === "boolean"))) return "invalid_true_false_items";
    if (thptStyle) {
      const quality = validateTrueFalseQuality(question);
      return quality.valid ? "" : quality.reason;
    }
  }
  if (thptStyle && type === "short_answer") {
    const numeric = validateShortAnswerNumeric(question);
    return numeric.valid ? "" : numeric.reason;
  }
  return "";
}

export function sanitizeExamStructure(exam: StructuredExam, input: Partial<ExamInput> & Record<string, unknown>) {
  const request = calculateExamStructure(input);
  const limits: Record<ExamPartType, number> = { multiple_choice: request.sectionCounts.partI, true_false: request.sectionCounts.partII, short_answer: request.sectionCounts.partIII };
  const seen: string[] = [];
  const expressions = new Map<string, number>();
  const trueFalseSignatures = new Set<string>();
  let duplicateRemovedCount = 0;
  let invalidRemovedCount = 0;
  const rejectionReasons: Record<string, number> = {};
  const thptStyle = /THPTQG|tốt nghiệp/i.test(String(input.examStyle || ""));
  const parts = exam.parts.map((part) => {
    let questions = part.questions.map(normalizeExamQuestionMath).filter((question) => {
      const invalidReason = questionInvalidReason(question, part.type, thptStyle);
      if (invalidReason) { invalidRemovedCount += 1; rejectionReasons[invalidReason] = (rejectionReasons[invalidReason] || 0) + 1; return false; }
      const stem = normalizedStem(question.stem);
      const expression = coreExpression(question.stem);
      const statementSignature = part.type === "true_false" ? question.trueFalseItems?.map((item) => normalizedStem(item.text)).join("|") || "" : "";
      if (statementSignature && trueFalseSignatures.has(statementSignature)) { duplicateRemovedCount += 1; return false; }
      if (seen.some((existing) => existing === stem || nearDuplicate(existing, stem)) || (expression && (expressions.get(expression) || 0) >= 1)) { duplicateRemovedCount += 1; return false; }
      seen.push(stem);
      if (statementSignature) trueFalseSignatures.add(statementSignature);
      if (expression) expressions.set(expression, (expressions.get(expression) || 0) + 1);
      return true;
    }).slice(0, limits[part.type]).map((question, index) => ({ ...question, number: index + 1 }));
    if (part.type === "multiple_choice") questions = balanceMultipleChoiceAnswers(questions);
    if (part.type === "true_false" && thptStyle) questions = balanceTrueFalsePatterns(questions);
    return { ...part, questions };
  }).filter((part) => part.questions.length || limits[part.type] > 0);
  for (const type of ["multiple_choice", "true_false", "short_answer"] as ExamPartType[]) {
    if (limits[type] > 0 && !parts.some((part) => part.type === type)) parts.push({ type, title: type === "multiple_choice" ? "PHẦN I" : type === "true_false" ? "PHẦN II" : "PHẦN III", instruction: "", questions: [] });
  }
  if (thptStyle) {
    for (const part of parts) {
      const count = limits[part.type];
      if (part.type === "multiple_choice") {
        part.title = `PHẦN I. THÍ SINH TRẢ LỜI TỪ CÂU 1 ĐẾN CÂU ${count}. MỖI CÂU HỎI THÍ SINH CHỈ CHỌN MỘT PHƯƠNG ÁN.`;
        part.instruction = "Chọn một phương án đúng trong mỗi câu.";
      } else if (part.type === "true_false") {
        part.title = `PHẦN II. THÍ SINH TRẢ LỜI TỪ CÂU 1 ĐẾN CÂU ${count}. TRONG MỖI Ý A), B), C), D), THÍ SINH CHỌN ĐÚNG HOẶC SAI.`;
        part.instruction = "Chọn Đúng hoặc Sai cho từng ý a), b), c), d).";
      } else {
        part.title = `PHẦN III. THÍ SINH TRẢ LỜI TỪ CÂU 1 ĐẾN CÂU ${count}. CÂU TRẢ LỜI NGẮN.`;
        part.instruction = "Ghi đáp án ngắn gọn theo yêu cầu của từng câu.";
      }
    }
  }
  const scoringGuide = parts.flatMap((part) => part.questions.map((question) => `${part.title} - Câu ${question.number}: ${question.answer}${question.explanation ? ` — ${question.explanation}` : ""}`)).join("\n");
  const generated = {
    partI: parts.find((part) => part.type === "multiple_choice")?.questions.length || 0,
    partII: parts.find((part) => part.type === "true_false")?.questions.length || 0,
    partIII: parts.find((part) => part.type === "short_answer")?.questions.length || 0,
  };
  const missing = { partI: Math.max(0, request.sectionCounts.partI - generated.partI), partII: Math.max(0, request.sectionCounts.partII - generated.partII), partIII: Math.max(0, request.sectionCounts.partIII - generated.partIII) };
  const finalCount = generated.partI + generated.partII + generated.partIII;
  const countSummary = `Cấu trúc đã kiểm tra: PHẦN I ${generated.partI}/${request.sectionCounts.partI}; PHẦN II ${generated.partII}/${request.sectionCounts.partII}; PHẦN III ${generated.partIII}/${request.sectionCounts.partIII}; tổng ${finalCount}/${request.requestedQuestionCount}.`;
  const sanitized = { ...exam, parts, teacherOnly: { ...exam.teacherOnly, scoringGuide, matrix: [normalizeTeacherMathNotation(exam.teacherOnly.matrix), countSummary].filter(Boolean).join("\n"), specification: [normalizeTeacherMathNotation(exam.teacherOnly.specification), countSummary].filter(Boolean).join("\n"), notes: [normalizeTeacherMathNotation(exam.teacherOnly.notes), countSummary].filter(Boolean).join("\n") } };
  return { exam: sanitized, request, generated, missing, finalCount, complete: missing.partI + missing.partII + missing.partIII === 0, duplicateRemovedCount, invalidRemovedCount, rejectionReasons };
}
