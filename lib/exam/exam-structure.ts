import type { ExamQuestion, ExamPartType, StructuredExam } from "@/lib/exam-types";
import type { ExamInput } from "@/lib/types";
import { balanceMultipleChoiceAnswers, balanceTrueFalsePatterns, normalizeExamQuestionMath, normalizeTeacherMathNotation, validateMultipleChoiceOptions, validateShortAnswerNumeric, validateTrueFalseQuality, validateVisualDependency } from "@/lib/exam/exam-quality";
import { compareExamQuestions, type DuplicateFinding } from "@/lib/exam/duplicate-detection";
import { ensureStableExamIdentity } from "@/lib/exam/identity";

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

function coreExpression(value: string) {
  const normalized = value.replace(/\s+/g, "").toLowerCase();
  return normalized.match(/(?:y|f\(x\))=[^,;.?!]+/)?.[0] || "";
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

export function normalizeExamScores(parts: StructuredExam["parts"], totalScore: number) {
  const questions = parts.flatMap((part) => part.questions);
  if (!questions.length || !Number.isFinite(totalScore) || totalScore <= 0) return parts;
  const counts = Object.fromEntries(parts.map((part) => [part.type, part.questions.length]));
  if (totalScore === 10 && counts.multiple_choice === 12 && counts.true_false === 4 && counts.short_answer === 6) {
    return parts.map((part) => ({ ...part, questions: part.questions.map((question) => ({ ...question, score: part.type === "multiple_choice" ? 0.25 : part.type === "true_false" ? 1 : 0.5 })) }));
  }
  const currentTotal = questions.reduce((sum, question) => sum + (Number.isFinite(question.score) && question.score > 0 ? question.score : 0), 0);
  if (Math.abs(currentTotal - totalScore) <= 0.001) return parts;
  const weights = questions.map((question) => currentTotal > 0 && question.score > 0 ? question.score / currentTotal : 1 / questions.length);
  const scores = weights.map((weight) => Number((weight * totalScore).toFixed(3)));
  scores[scores.length - 1] = Number((totalScore - scores.slice(0, -1).reduce((sum, score) => sum + score, 0)).toFixed(3));
  let cursor = 0;
  return parts.map((part) => ({ ...part, questions: part.questions.map((question) => ({ ...question, score: scores[cursor++] })) }));
}

export function sanitizeExamStructure(exam: StructuredExam, input: Partial<ExamInput> & Record<string, unknown>) {
  const request = calculateExamStructure(input);
  const limits: Record<ExamPartType, number> = { multiple_choice: request.sectionCounts.partI, true_false: request.sectionCounts.partII, short_answer: request.sectionCounts.partIII };
  const identified = ensureStableExamIdentity(exam);
  const acceptedQuestions: ExamQuestion[] = [];
  const similarityWarnings: DuplicateFinding[] = [];
  let duplicateRemovedCount = 0;
  let invalidRemovedCount = 0;
  const rejectionReasons: Record<string, number> = {};
  const thptStyle = /THPTQG|tốt nghiệp/i.test(String(input.examStyle || ""));
  const mergedParts = new Map<ExamPartType, StructuredExam["parts"][number]>();
  identified.parts.forEach((part) => {
    const current = mergedParts.get(part.type);
    if (current) current.questions.push(...part.questions);
    else mergedParts.set(part.type, { ...part, questions: [...part.questions] });
  });
  let parts = [...mergedParts.values()].map((part) => {
    let questions = part.questions.map(normalizeExamQuestionMath).filter((question) => {
      const invalidReason = questionInvalidReason(question, part.type, thptStyle);
      if (invalidReason) { invalidRemovedCount += 1; rejectionReasons[invalidReason] = (rejectionReasons[invalidReason] || 0) + 1; return false; }
      const duplicate = acceptedQuestions.map((existing) => compareExamQuestions(existing, question)).find(Boolean);
      if (duplicate?.confidence === "exact" || duplicate?.confidence === "high") { duplicateRemovedCount += 1; return false; }
      if (duplicate?.confidence === "possible") similarityWarnings.push(duplicate);
      const expression = coreExpression(question.stem);
      if (expression) {
        const sameExpression = acceptedQuestions.find((existing) => coreExpression(existing.stem) === expression);
        if (sameExpression) similarityWarnings.push({ firstQuestionId: sameExpression.id, secondQuestionId: question.id, confidence: "possible", reason: "same_reasoning", score: 0.65 });
      }
      acceptedQuestions.push(question);
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
  parts = normalizeExamScores(parts, request.totalScore);
  const scoringGuide = parts.flatMap((part) => part.questions.map((question) => `${part.title} - Câu ${question.number}: ${question.answer}${question.explanation ? ` — ${question.explanation}` : ""}`)).join("\n");
  const generated = {
    partI: parts.find((part) => part.type === "multiple_choice")?.questions.length || 0,
    partII: parts.find((part) => part.type === "true_false")?.questions.length || 0,
    partIII: parts.find((part) => part.type === "short_answer")?.questions.length || 0,
  };
  const missing = { partI: Math.max(0, request.sectionCounts.partI - generated.partI), partII: Math.max(0, request.sectionCounts.partII - generated.partII), partIII: Math.max(0, request.sectionCounts.partIII - generated.partIII) };
  const finalCount = generated.partI + generated.partII + generated.partIII;
  const countSummary = `Cấu trúc đã kiểm tra: PHẦN I ${generated.partI}/${request.sectionCounts.partI}; PHẦN II ${generated.partII}/${request.sectionCounts.partII}; PHẦN III ${generated.partIII}/${request.sectionCounts.partIII}; tổng ${finalCount}/${request.requestedQuestionCount}.`;
  const sanitized = ensureStableExamIdentity({ ...identified, metadata: { ...identified.metadata, totalScore: request.totalScore, requestedSectionCounts: request.sectionCounts }, parts, teacherOnly: { ...identified.teacherOnly, scoringGuide, matrix: [normalizeTeacherMathNotation(identified.teacherOnly.matrix), countSummary].filter(Boolean).join("\n"), specification: [normalizeTeacherMathNotation(identified.teacherOnly.specification), countSummary].filter(Boolean).join("\n"), notes: [normalizeTeacherMathNotation(identified.teacherOnly.notes), countSummary].filter(Boolean).join("\n") } });
  return { exam: sanitized, request, generated, missing, finalCount, complete: missing.partI + missing.partII + missing.partIII === 0, duplicateRemovedCount, invalidRemovedCount, rejectionReasons, similarityWarnings };
}
