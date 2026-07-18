import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import { stableHash } from "@/lib/answer-solutions/hash";
import type { ExamSolutionSet, QuestionSolution } from "@/lib/answer-solutions/types";
import type { ExamVariant, ExamVariantSet } from "@/lib/exam-mixer/types";
import type { GeneratedDocument } from "@/lib/types";

export type SolutionExportMode = "quick" | "detailed" | "scoring";

function answerLabel(value: unknown) {
  if (Array.isArray(value)) return value.join("; ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "—");
}

function questionById(exam: StructuredExam, id: string) {
  return exam.parts.flatMap((part) => part.questions).find((question) => question.id === id);
}

function sectionName(type: string) {
  if (type === "multiple_choice") return "PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN";
  if (type === "true_false") return "PHẦN II. TRẮC NGHIỆM ĐÚNG/SAI";
  if (type === "short_answer") return "PHẦN III. TRẢ LỜI NGẮN";
  return "TỰ LUẬN";
}

function summaryTables(exam: StructuredExam, set: ExamSolutionSet) {
  return exam.parts.flatMap((part) => {
    const rows = part.questions.map((question) => {
      const solution = set.questions.find((item) => item.questionId === question.id);
      return `| ${question.number} | ${answerLabel(solution?.verifiedAnswer ?? solution?.currentAnswer ?? question.answer)} | ${question.score} |`;
    });
    return [`## ${sectionName(part.type)}`, "| Câu | Đáp án | Điểm |", "|---|---|---|", ...rows, ""];
  });
}

function detailRows(exam: StructuredExam, set: ExamSolutionSet, mode: SolutionExportMode) {
  if (mode === "quick") return [];
  return exam.parts.flatMap((part) => [
    `## ${sectionName(part.type)}`,
    ...part.questions.flatMap((question) => {
      const solution = set.questions.find((item) => item.questionId === question.id);
      if (!solution) return [];
      const rows = [`### Câu ${question.number}`, question.stem, `Đáp án: ${answerLabel(solution.verifiedAnswer ?? solution.currentAnswer)}`];
      if (solution.statementExplanations?.length) rows.push(...solution.statementExplanations.map((item) => `${String.fromCharCode(97 + item.statementIndex)}) ${item.value ? "Đúng" : "Sai"}. ${item.explanation}`));
      if (solution.steps?.length) rows.push(...solution.steps.map((step) => `${step.order}. ${step.title ? `${step.title}: ` : ""}${step.content}${step.result ? ` Kết quả: ${step.result}.` : ""}`));
      if (solution.detailedSolution) rows.push(solution.detailedSolution);
      if (mode === "scoring" && solution.rubric?.length) {
        rows.push("| Tiêu chí | Minh chứng cần đạt | Điểm |", "|---|---|---|", ...solution.rubric.map((item) => `| ${item.criterion} | ${item.expectedEvidence} | ${item.points} |`));
      }
      if (solution.warnings?.length) rows.push(`Lưu ý: ${solution.warnings.join(" ")}`);
      return [...rows, ""];
    }),
  ]);
}

export function solutionSetToText(exam: StructuredExam, set: ExamSolutionSet, mode: SolutionExportMode) {
  const heading = mode === "quick" ? "ĐÁP ÁN NHANH" : mode === "scoring" ? "HƯỚNG DẪN CHẤM" : "LỜI GIẢI CHI TIẾT";
  return [
    `# ${heading}`,
    exam.metadata.title,
    `Môn: ${exam.metadata.subject} · Lớp: ${exam.metadata.grade} · Thời gian: ${exam.metadata.duration}`,
    exam.metadata.examCode ? `Mã đề: ${exam.metadata.examCode}` : "",
    "",
    ...summaryTables(exam, set),
    ...detailRows(exam, set, mode),
    "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức.",
  ].filter((line) => line !== "").join("\n");
}

export function solutionSetToDocument(source: GeneratedDocument, set: ExamSolutionSet, mode: SolutionExportMode): GeneratedDocument {
  if (!source.structuredExam) throw new Error("structured_exam_required");
  const label = mode === "quick" ? "Đáp án" : mode === "scoring" ? "Hướng dẫn chấm" : "Lời giải chi tiết";
  return {
    id: `${source.id}-solutions-${mode}`,
    title: `${label} - ${source.title}`,
    type: "answer-key",
    content: solutionSetToText(source.structuredExam, set, mode),
    createdAt: set.generatedAt,
    folder: "Đề kiểm tra",
    structuredExam: source.structuredExam,
    examSolutionSet: set,
    diagramAssets: set.diagramAssets,
    generationMeta: { mode: `teacher-solutions-${mode}` },
  };
}

function mapStatementExplanations(solution: QuestionSolution, question: ExamQuestion) {
  const source = new Map((solution.statementExplanations || []).map((item) => [item.statementId.split(":").at(-1), item]));
  return question.trueFalseItems?.map((item, index) => {
    const current = source.get(stableHash(item.text));
    return current ? { ...current, statementId: `${question.id}:${stableHash(item.text)}`, statementIndex: index } : { statementId: `${question.id}:${stableHash(item.text)}`, statementIndex: index, value: item.answer, explanation: "Cần giáo viên xác nhận.", confidence: "low" as const };
  });
}

export function mapSolutionSetToVariant(set: ExamSolutionSet, variant: ExamVariant): ExamSolutionSet {
  const questions = variant.questionMap.flatMap((map) => {
    const solution = set.questions.find((item) => item.questionId === map.originalQuestionId);
    const question = questionById(variant.exam, map.originalQuestionId);
    if (!solution || !question) return [];
    const optionMap = question.sourceMetadata?.optionMap as Record<string, string> | undefined;
    const verifiedAnswer = solution.verifiedAnswer === undefined ? undefined : question.part === "multiple_choice" ? optionMap?.[String(solution.verifiedAnswer)] ?? solution.verifiedAnswer : question.part === "true_false" ? mapStatementExplanations(solution, question)?.map((item) => item.value ? "Đúng" : "Sai").join(", ") : solution.verifiedAnswer;
    return [{ ...solution, questionNumber: map.variantNumber, currentAnswer: question.answer, verifiedAnswer, conciseAnswer: String(verifiedAnswer ?? question.answer), statementExplanations: mapStatementExplanations(solution, question) }];
  });
  return { ...set, examHash: stableHash({ source: set.examHash, code: variant.code }), questions, generatedAt: set.generatedAt };
}

export function variantSolutionDocuments(source: GeneratedDocument, set: ExamSolutionSet, variants: ExamVariantSet, mode: SolutionExportMode) {
  return variants.variants.map((variant) => solutionSetToDocument({ ...source, id: `${source.id}-${variant.code}`, title: `${source.title} - Mã ${variant.code}`, structuredExam: variant.exam }, mapSolutionSetToVariant(set, variant), mode));
}
