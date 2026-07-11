import type { ExamQuestion, ExamPartType, StructuredExam } from "@/lib/exam-types";
import type { ExamInput } from "@/lib/types";

export type ExamStructureRequest = {
  sectionCounts: { partI: number; partII: number; partIII: number };
  requestedQuestionCount: number;
  totalScore: number;
  difficultyDistribution: { recognition: number; comprehension: number; application: number; highApplication: number };
};

export function calculateExamStructure(input: Partial<ExamInput> & Record<string, unknown>): ExamStructureRequest {
  const partI = Math.max(0, Number(input.multipleChoiceCount ?? input.partICount ?? 0));
  const partII = Math.max(0, Number(input.trueFalseCount ?? input.partIICount ?? 0));
  const partIII = Math.max(0, Number(input.shortAnswerCount ?? input.partIIICount ?? 0));
  return {
    sectionCounts: { partI, partII, partIII },
    requestedQuestionCount: partI + partII + partIII,
    totalScore: Number(input.totalScore ?? 10),
    difficultyDistribution: {
      recognition: Number(input.recognitionRate ?? 30),
      comprehension: Number(input.understandingRate ?? 40),
      application: Number(input.applicationRate ?? 20),
      highApplication: Number(input.advancedRate ?? 10),
    },
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

function validQuestion(question: ExamQuestion, type: ExamPartType) {
  if (!question.stem.trim() || !question.answer.trim() || !question.explanation.trim()) return false;
  if (type === "multiple_choice") return Boolean(question.options && ["A", "B", "C", "D"].every((key) => question.options?.[key as "A"]?.trim()) && ["A", "B", "C", "D"].includes(question.answer.trim().toUpperCase()));
  if (type === "true_false") return Boolean(question.trueFalseItems?.length === 4 && question.trueFalseItems.every((item) => item.text.trim() && typeof item.answer === "boolean"));
  return true;
}

export function sanitizeExamStructure(exam: StructuredExam, input: Partial<ExamInput> & Record<string, unknown>) {
  const request = calculateExamStructure(input);
  const limits: Record<ExamPartType, number> = { multiple_choice: request.sectionCounts.partI, true_false: request.sectionCounts.partII, short_answer: request.sectionCounts.partIII };
  const seen: string[] = [];
  const expressions = new Map<string, number>();
  let duplicateRemovedCount = 0;
  let invalidRemovedCount = 0;
  const parts = exam.parts.map((part) => {
    const questions = part.questions.filter((question) => {
      if (!validQuestion(question, part.type)) { invalidRemovedCount += 1; return false; }
      const stem = normalizedStem(question.stem);
      const expression = coreExpression(question.stem);
      if (seen.some((existing) => existing === stem || nearDuplicate(existing, stem)) || (expression && (expressions.get(expression) || 0) >= 1)) { duplicateRemovedCount += 1; return false; }
      seen.push(stem);
      if (expression) expressions.set(expression, (expressions.get(expression) || 0) + 1);
      return true;
    }).slice(0, limits[part.type]).map((question, index) => ({ ...question, number: index + 1 }));
    return { ...part, questions };
  }).filter((part) => part.questions.length || limits[part.type] > 0);
  for (const type of ["multiple_choice", "true_false", "short_answer"] as ExamPartType[]) {
    if (limits[type] > 0 && !parts.some((part) => part.type === type)) parts.push({ type, title: type === "multiple_choice" ? "PHẦN I" : type === "true_false" ? "PHẦN II" : "PHẦN III", instruction: "", questions: [] });
  }
  if (/THPTQG|tốt nghiệp/i.test(String(input.examStyle || ""))) {
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
  const sanitized = { ...exam, parts, teacherOnly: { ...exam.teacherOnly, scoringGuide, matrix: [exam.teacherOnly.matrix, countSummary].filter(Boolean).join("\n"), specification: [exam.teacherOnly.specification, countSummary].filter(Boolean).join("\n"), notes: [exam.teacherOnly.notes, countSummary].filter(Boolean).join("\n") } };
  return { exam: sanitized, request, generated, missing, finalCount, complete: missing.partI + missing.partII + missing.partIII === 0, duplicateRemovedCount, invalidRemovedCount };
}
