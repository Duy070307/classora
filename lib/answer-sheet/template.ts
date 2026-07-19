import { auditStructuredExam } from "@/lib/exam-audit/audit";
import type { ExamVariant, ExamVariantSet } from "@/lib/exam-mixer/types";
import type { StructuredExam } from "@/lib/exam-types";
import { withAnswerSheetChecksum } from "@/lib/answer-sheet/checksum";
import { DEFAULT_STUDENT_FIELDS, type AnswerSheetDensity, type AnswerSheetPageSize, type AnswerSheetSection, type AnswerSheetTemplate, type BubbleOption, type EssaySpace, type ShortAnswerMode } from "@/lib/answer-sheet/types";

export const ANSWER_SHEET_TEMPLATE_VERSION = "1.0";

export type AnswerSheetConfig = {
  title: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  variantCode: string;
  schoolName: string;
  teacherName: string;
  pageSize: AnswerSheetPageSize;
  density: AnswerSheetDensity;
  studentFields: AnswerSheetTemplate["studentFields"];
  multipleChoiceCount: number;
  multipleChoiceOptions: BubbleOption[];
  trueFalseCount: number;
  statementsPerTrueFalse: number;
  shortAnswerCount: number;
  shortAnswerMode: ShortAnswerMode;
  essayCount: number;
  essaySpace: EssaySpace;
  qrEnabled: boolean;
  printedVariantCode: boolean;
  cornerAnchorsEnabled: boolean;
  pageNumbersEnabled: boolean;
};

export function defaultAnswerSheetConfig(): AnswerSheetConfig {
  return { title: "Phiếu trả lời", subject: "", grade: "", durationMinutes: 45, variantCode: "", schoolName: "", teacherName: "", pageSize: "A4_PORTRAIT", density: "standard", studentFields: { ...DEFAULT_STUDENT_FIELDS }, multipleChoiceCount: 20, multipleChoiceOptions: ["A", "B", "C", "D"], trueFalseCount: 0, statementsPerTrueFalse: 4, shortAnswerCount: 0, shortAnswerMode: "free", essayCount: 0, essaySpace: "none", qrEnabled: true, printedVariantCode: true, cornerAnchorsEnabled: true, pageNumbersEnabled: true };
}
function durationNumber(value: string | undefined) {
  const match = value?.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function configFromExam(exam: StructuredExam): AnswerSheetConfig {
  const config = defaultAnswerSheetConfig();
  const counts = Object.fromEntries(exam.parts.map((part) => [part.type, part.questions.length]));
  const tfPart = exam.parts.find((part) => part.type === "true_false");
  return { ...config, title: exam.metadata.title || "Phiếu trả lời", subject: exam.metadata.subject || "", grade: exam.metadata.grade || "", durationMinutes: durationNumber(exam.metadata.duration), variantCode: exam.metadata.examCode || "", schoolName: exam.metadata.schoolName || "", multipleChoiceCount: counts.multiple_choice || 0, trueFalseCount: counts.true_false || 0, statementsPerTrueFalse: Math.max(1, ...((tfPart?.questions || []).map((question) => question.trueFalseItems?.length || 4))), shortAnswerCount: counts.short_answer || 0 };
}

function manualSections(config: AnswerSheetConfig): AnswerSheetSection[] {
  const sections: AnswerSheetSection[] = [];
  if (config.multipleChoiceCount) sections.push({ id: "mcq", type: "multiple_choice", title: "PHẦN TRẮC NGHIỆM", options: config.multipleChoiceOptions, questions: Array.from({ length: config.multipleChoiceCount }, (_, index) => ({ questionId: `manual-mcq-${index + 1}`, questionNumber: index + 1 })) });
  if (config.trueFalseCount) sections.push({ id: "tf", type: "true_false", title: "PHẦN ĐÚNG/SAI", questions: Array.from({ length: config.trueFalseCount }, (_, index) => ({ questionId: `manual-tf-${index + 1}`, questionNumber: index + 1, statements: Array.from({ length: config.statementsPerTrueFalse }, (__, statementIndex) => ({ statementId: `manual-tf-${index + 1}-${statementIndex}`, label: String.fromCharCode(97 + statementIndex) })) })) });
  if (config.shortAnswerCount) sections.push({ id: "short", type: "short_answer", title: "PHẦN TRẢ LỜI NGẮN", mode: config.shortAnswerMode, questions: Array.from({ length: config.shortAnswerCount }, (_, index) => ({ questionId: `manual-short-${index + 1}`, questionNumber: index + 1 })), numeric: config.shortAnswerMode === "structured_numeric" ? { sign: true, integerDigits: 4, decimalDigits: 2, fraction: true, unit: true } : undefined });
  if (config.essayCount && config.essaySpace !== "none") sections.push({ id: "essay", type: "essay", title: "PHẦN TỰ LUẬN", space: config.essaySpace, questions: Array.from({ length: config.essayCount }, (_, index) => ({ questionId: `manual-essay-${index + 1}`, questionNumber: index + 1 })) });
  return sections;
}

function sectionsFromExam(exam: StructuredExam, variant?: ExamVariant): AnswerSheetSection[] {
  return exam.parts.map((part): AnswerSheetSection => {
    if (part.type === "multiple_choice") return { id: `part-${part.type}`, type: "multiple_choice", title: part.title, options: ["A", "B", "C", "D"], questions: part.questions.map((question) => ({ questionId: question.id, questionNumber: question.number, originalQuestionId: variant?.questionMap.find((item) => item.variantNumber === question.number && item.sectionId === part.type)?.originalQuestionId })) };
    if (part.type === "true_false") return { id: `part-${part.type}`, type: "true_false", title: part.title, questions: part.questions.map((question) => ({ questionId: question.id, questionNumber: question.number, originalQuestionId: variant?.questionMap.find((item) => item.variantNumber === question.number && item.sectionId === part.type)?.originalQuestionId, statements: (question.trueFalseItems || ["a", "b", "c", "d"].map((label) => ({ id: undefined, label: label as "a" | "b" | "c" | "d", text: "", answer: false }))).map((statement, index) => ({ statementId: statement.id || `${question.id}:${statement.label}`, label: statement.label, originalStatementId: statement.id || `${question.id}:${index}` })) })) };
    return { id: `part-${part.type}`, type: "short_answer", title: part.title, mode: "free", questions: part.questions.map((question) => ({ questionId: question.id, questionNumber: question.number, originalQuestionId: variant?.questionMap.find((item) => item.variantNumber === question.number && item.sectionId === part.type)?.originalQuestionId })) };
  });
}

export function structuralErrorsForAnswerSheet(exam: StructuredExam) {
  const audit = auditStructuredExam(exam, { expectedSectionCounts: exam.metadata.requestedSectionCounts, totalScore: exam.metadata.totalScore, requireFourOptions: true });
  return audit.issues.filter((issue) => issue.severity === "error").map((issue) => issue.description);
}

export function createAnswerSheetTemplate(input: { config: AnswerSheetConfig; exam?: StructuredExam; examId?: string; variant?: ExamVariant; variantSet?: ExamVariantSet; ownerId?: string }): AnswerSheetTemplate {
  const now = new Date().toISOString();
  const templateId = crypto.randomUUID();
  const exam = input.variant?.exam || input.exam;
  const config = exam ? { ...input.config, ...configFromExam(exam), pageSize: input.config.pageSize, density: input.config.density, studentFields: input.config.studentFields, qrEnabled: input.config.qrEnabled, printedVariantCode: input.config.printedVariantCode, cornerAnchorsEnabled: input.config.cornerAnchorsEnabled, pageNumbersEnabled: input.config.pageNumbersEnabled, shortAnswerMode: input.config.shortAnswerMode, essayCount: input.config.essayCount, essaySpace: input.config.essaySpace } : input.config;
  const sourceType = input.variantSet ? input.variant ? "variant" : "variant_set" : exam ? "exam" : "manual";
  return withAnswerSheetChecksum({ id: templateId, ownerId: input.ownerId, examId: input.examId, variantSetId: input.variantSet?.id, variantCode: input.variant?.code || config.variantCode || undefined, title: config.title, subject: config.subject, grade: config.grade, durationMinutes: config.durationMinutes, schoolName: config.schoolName || undefined, teacherName: config.teacherName || undefined, pageSize: config.pageSize, density: config.density, studentFields: config.studentFields, sections: exam ? sectionsFromExam(exam, input.variant) : manualSections(config), recognition: { templateVersion: ANSWER_SHEET_TEMPLATE_VERSION, templateId, checksum: "", qrEnabled: config.qrEnabled, printedVariantCode: config.printedVariantCode, cornerAnchorsEnabled: config.cornerAnchorsEnabled, pageNumbersEnabled: config.pageNumbersEnabled }, metadata: { createdAt: now, updatedAt: now, sourceType, sourceExam: exam } });
}

export function templatesFromVariantSet(set: ExamVariantSet, config: AnswerSheetConfig) {
  return set.variants.map((variant) => createAnswerSheetTemplate({ config: { ...config, variantCode: variant.code }, variant, variantSet: set, examId: set.sourceExamId }));
}
