import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import { examSolutionHash, questionSolutionHash, stableHash } from "@/lib/answer-solutions/hash";
import { extractDeterministicCalculation, numericEquivalent, numericValue } from "@/lib/answer-solutions/numeric";
import type { ExamSolutionSet, QuestionSolution, SolutionDetailLevel, SolutionSummary } from "@/lib/answer-solutions/types";

const visualReference = /(?:dựa vào|quan sát|theo)\s+(?:hình|đồ thị|bảng|sơ đồ)|hình\s+(?:vẽ|bên|dưới)|bảng\s+(?:số liệu|biến thiên)/iu;

function detail(explanation: string, detailLevel: SolutionDetailLevel, fallback: string) {
  if (detailLevel === "short") return explanation || fallback;
  if (detailLevel === "detailed") return explanation ? `${explanation}\n\nKết luận: ${fallback}` : `Phân tích dữ kiện và áp dụng quy tắc phù hợp.\n\nKết luận: ${fallback}`;
  return explanation || `Áp dụng dữ kiện của câu hỏi. ${fallback}`;
}

function missingVisual(question: ExamQuestion) { return visualReference.test(question.stem) && !question.visuals?.length; }

function numericExpected(question: ExamQuestion) {
  return extractDeterministicCalculation(question.stem);
}

function verifyQuestion(question: ExamQuestion, sectionId: string, detailLevel: SolutionDetailLevel): QuestionSolution {
  const hash = questionSolutionHash(question);
  if (missingVisual(question)) return { questionId: question.id, questionNumber: question.number, sectionId, questionType: question.part, currentAnswer: question.answer, answerStatus: "uncertain", confidence: "low", conciseAnswer: String(question.answer), detailedSolution: "Không thể tạo lời giải chắc chắn vì câu hỏi đang thiếu hình hoặc dữ liệu liên quan.", warnings: ["Thiếu hình hoặc dữ liệu được tham chiếu."], contentHash: hash };
  if (question.part === "true_false") {
    const statements = question.trueFalseItems || [];
    const concise = statements.map((item) => `${item.label}) ${item.answer ? "Đúng" : "Sai"}`).join("; ");
    const structuralMatch = statements.length === 4 && statements.every((item) => typeof item.answer === "boolean");
    return { questionId: question.id, questionNumber: question.number, sectionId, questionType: question.part, currentAnswer: question.answer, verifiedAnswer: structuralMatch ? concise : undefined, answerStatus: structuralMatch ? "not_verified" : "uncertain", confidence: structuralMatch ? "medium" : "low", conciseAnswer: concise || String(question.answer), detailedSolution: detail(question.explanation, detailLevel, "Giáo viên cần đối chiếu từng mệnh đề với dữ kiện."), statementExplanations: statements.map((item, index) => ({ statementId: `${question.id}:${stableHash(item.text)}`, statementIndex: index, value: item.answer, explanation: question.explanation || "Cần kiểm tra độc lập theo dữ kiện của mệnh đề.", confidence: question.explanation ? "medium" : "low" })), warnings: structuralMatch ? ["Chân trị hiện tại mới được kiểm tra tính nhất quán cấu trúc, chưa phải xác minh ngữ nghĩa độc lập."] : ["Cấu trúc mệnh đề Đúng/Sai chưa hợp lệ."], contentHash: hash };
  }
  const expected = numericExpected(question);
  if (question.part === "multiple_choice") {
    const current = question.answer.trim().toUpperCase();
    const currentText = question.options?.[current as "A" | "B" | "C" | "D"] || "";
    if (expected) {
      const matches = (["A", "B", "C", "D"] as const).filter((label) => numericEquivalent(question.options?.[label] || "", String(expected.result)));
      const verified = matches.length === 1 ? matches[0] : undefined;
      const status = matches.length > 1 ? "uncertain" : verified === current ? "matches" : verified ? "mismatch" : "uncertain";
      return { questionId: question.id, questionNumber: question.number, sectionId, questionType: question.part, currentAnswer: current, verifiedAnswer: verified, answerStatus: status, confidence: matches.length === 1 ? "high" : "low", conciseAnswer: verified ? `${verified}. ${question.options?.[verified]}` : currentText, detailedSolution: `Tính ${expected.expression} = ${expected.result}. ${verified ? `Phương án phù hợp là ${verified}.` : "Chưa có phương án duy nhất phù hợp."}`, steps: [{ order: 1, title: "Tính toán", content: `Thực hiện biểu thức ${expected.expression}.`, formula: expected.expression, result: String(expected.result) }], warnings: matches.length > 1 ? ["Câu hỏi có thể có nhiều hơn một đáp án đúng."] : matches.length ? [] : ["Không tìm thấy phương án số khớp kết quả tính."], contentHash: hash };
    }
    return { questionId: question.id, questionNumber: question.number, sectionId, questionType: question.part, currentAnswer: current, answerStatus: "not_verified", confidence: question.explanation ? "medium" : "low", conciseAnswer: `${current}. ${currentText}`, detailedSolution: detail(question.explanation, detailLevel, `Chọn phương án ${current}.`), warnings: ["Cần giáo viên xác nhận vì chưa có phép kiểm tra xác định phù hợp."], contentHash: hash };
  }
  const answerValue = numericValue(question.answer);
  if (expected && answerValue !== null) {
    const matches = numericEquivalent(question.answer, String(expected.result));
    const unitInStem = stemUnit(question.stem); const unitInAnswer = answerUnit(question.answer);
    return { questionId: question.id, questionNumber: question.number, sectionId, questionType: question.part, currentAnswer: question.answer, verifiedAnswer: String(expected.result).replace(".", ","), answerStatus: matches ? "matches" : "mismatch", confidence: "high", conciseAnswer: question.answer, detailedSolution: `Thực hiện ${expected.expression} = ${expected.result}.`, steps: [{ order: 1, title: "Thay số và tính", content: `Tính biểu thức ${expected.expression}.`, formula: expected.expression, result: String(expected.result) }], warnings: unitInStem && !unitInAnswer ? [`Đáp án có thể thiếu đơn vị ${unitInStem}.`] : [], contentHash: hash };
  }
  return { questionId: question.id, questionNumber: question.number, sectionId, questionType: question.part, currentAnswer: question.answer, answerStatus: "not_verified", confidence: question.explanation ? "medium" : "low", conciseAnswer: question.answer, detailedSolution: detail(question.explanation, detailLevel, `Đáp án: ${question.answer}.`), warnings: ["Cần giáo viên xác nhận vì chưa có phép kiểm tra xác định phù hợp."], contentHash: hash };
}

function stemUnit(value: string) { return value.match(/\b(cm|mm|km|kg|g|m|s|V|A|Ω|mol)\b/u)?.[1]; }
function answerUnit(value: string) { return value.match(/\b(cm|mm|km|kg|g|m|s|V|A|Ω|mol)\b/u)?.[1]; }

export function solutionSummary(questions: QuestionSolution[], cacheHitCount = 0): SolutionSummary {
  return { totalQuestions: questions.length, verifiedCount: questions.filter((item) => item.answerStatus === "matches" || item.teacherConfirmed).length, mismatchCount: questions.filter((item) => item.answerStatus === "mismatch").length, uncertainCount: questions.filter((item) => item.answerStatus === "uncertain" || item.answerStatus === "not_verified").length, missingSolutionCount: questions.filter((item) => !item.detailedSolution).length, deterministicVerifiedCount: questions.filter((item) => item.confidence === "high" && ["matches", "mismatch"].includes(item.answerStatus)).length, semanticReviewedCount: questions.filter((item) => item.assumptions?.includes("semantic-review")).length, cacheHitCount };
}

export function buildDeterministicSolutionSet(exam: StructuredExam, options: { examId?: string; detailLevel?: SolutionDetailLevel; previous?: ExamSolutionSet } = {}): ExamSolutionSet {
  const detailLevel = options.detailLevel || "standard"; let hits = 0;
  const previous = new Map(options.previous?.questions.map((item) => [item.questionId, item]) || []);
  const questions = exam.parts.flatMap((part) => part.questions.map((question) => {
    const cached = previous.get(question.id);
    if (cached?.contentHash === questionSolutionHash(question) && options.previous?.metadata.detailLevel === detailLevel) { hits += 1; return cached; }
    return verifyQuestion(question, part.type, detailLevel);
  }));
  const summary = solutionSummary(questions, hits);
  return { examId: options.examId, examHash: examSolutionHash(exam), generatedAt: new Date().toISOString(), verificationStatus: summary.mismatchCount ? "has_errors" : summary.uncertainCount ? "needs_review" : summary.verifiedCount === summary.totalQuestions ? "verified" : "not_checked", questions, summary, metadata: { detailLevel, solutionVersion: "1.0" } };
}

export function applyVerifiedAnswer(exam: StructuredExam, solution: QuestionSolution, confirmed = false) {
  if (solution.answerStatus !== "mismatch" || solution.verifiedAnswer === undefined) throw new Error("answer_not_replaceable");
  if (solution.confidence !== "high" && !confirmed) throw new Error("teacher_confirmation_required");
  const copy = JSON.parse(JSON.stringify(exam)) as StructuredExam;
  let updated = false;
  copy.parts.forEach((part) => part.questions.forEach((question) => { if (question.id === solution.questionId) { question.answer = String(solution.verifiedAnswer); updated = true; } }));
  if (!updated) throw new Error("question_not_found");
  return copy;
}

export function rubricTotalMatchesScore(solution: QuestionSolution, questionScore: number) {
  if (!solution.rubric?.length) return false;
  const total = solution.rubric.reduce((sum, item) => sum + Number(item.points || 0), 0);
  return Math.abs(total - questionScore) < 0.0001;
}
