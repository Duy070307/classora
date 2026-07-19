import { examSolutionHash, questionSolutionHash, stableHash } from "@/lib/answer-solutions/hash";
import { solutionSummary } from "@/lib/answer-solutions/verify";
import { createExamVariants } from "@/lib/exam-mixer/engine";
import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import { ensureStableStatementIds } from "@/lib/exam/identity";
import { normalizeExamQuestionMath } from "@/lib/exam/exam-quality";
import { structuredExamToText } from "@/lib/mock-exam-generator";
import type { ExamInput, GeneratedDocument } from "@/lib/types";

export type QuestionReplacementProposal = {
  proposalId: string;
  questionId: string;
  originalHash: string;
  original: ExamQuestion;
  replacement: ExamQuestion;
};

function findQuestion(exam: StructuredExam, questionId: string) {
  return exam.parts.flatMap((part) => part.questions).find((question) => question.id === questionId);
}

function inputFromDocument(document: GeneratedDocument, exam: StructuredExam): ExamInput {
  const counts = Object.fromEntries(exam.parts.map((part) => [part.type, part.questions.length]));
  return {
    schoolName: document.examMeta?.schoolName || exam.metadata.schoolName || "",
    teacherName: document.examMeta?.teacherName || "",
    subject: document.examMeta?.subject || exam.metadata.subject,
    grade: document.examMeta?.grade || exam.metadata.grade,
    bookSeries: "",
    topic: document.examMeta?.topic || exam.parts.flatMap((part) => part.questions.map((question) => question.topic)).filter(Boolean)[0] || "",
    duration: document.examMeta?.duration || exam.metadata.duration,
    examType: "Kết hợp",
    examStyle: /THPTQG|tốt nghiệp/i.test(exam.metadata.examStyle) ? "THPTQG / tốt nghiệp" : "Kiểm tra thường",
    multipleChoiceCount: counts.multiple_choice || 0,
    trueFalseCount: counts.true_false || 0,
    shortAnswerCount: counts.short_answer || 0,
    essayCount: 0,
    examCode: document.examMeta?.examCode || exam.metadata.examCode,
    totalScore: exam.metadata.totalScore || 10,
    level: "Trung bình",
    recognitionRate: exam.metadata.requestedCognitiveRates?.recognition ?? 30,
    understandingRate: exam.metadata.requestedCognitiveRates?.understanding ?? 40,
    applicationRate: exam.metadata.requestedCognitiveRates?.application ?? 20,
    advancedRate: exam.metadata.requestedCognitiveRates?.advanced ?? 10,
    includeAnswers: true,
    includeRubric: true,
    includeMatrix: true,
    includeSpecification: true,
    extraRequirements: "",
  };
}

function preserveStatementIdentity(original: ExamQuestion, replacement: ExamQuestion) {
  if (!replacement.trueFalseItems) return replacement;
  const byLabel = new Map((original.trueFalseItems || []).map((item) => [item.label, item.id]));
  return ensureStableStatementIds({ ...replacement, trueFalseItems: replacement.trueFalseItems.map((item) => ({ ...item, id: item.id || byLabel.get(item.label) })) });
}

export function proposeQuestionReplacement(exam: StructuredExam, questionId: string, candidate: ExamQuestion): QuestionReplacementProposal {
  const original = findQuestion(exam, questionId);
  if (!original) throw new Error("question_not_found");
  const replacement = preserveStatementIdentity(original, normalizeExamQuestionMath({
    ...candidate,
    id: original.id,
    part: original.part,
    number: original.number,
    score: original.score,
    topic: original.topic,
    cognitiveLevel: candidate.cognitiveLevel || original.cognitiveLevel,
    difficulty: candidate.difficulty || original.difficulty,
    visuals: candidate.visuals ?? original.visuals,
    sourceMetadata: { ...original.sourceMetadata, ...candidate.sourceMetadata, teacherConfirmed: false },
  }));
  return { proposalId: `proposal-${stableHash({ questionId, original: questionSolutionHash(original), replacement: questionSolutionHash(replacement) })}`, questionId, originalHash: questionSolutionHash(original), original, replacement };
}

function syncDocument(document: GeneratedDocument, exam: StructuredExam, changedQuestionId: string): GeneratedDocument {
  const examSolutionQuestions = document.examSolutionSet?.questions.filter((item) => item.questionId !== changedQuestionId);
  const examSolutionSet = document.examSolutionSet && examSolutionQuestions
    ? { ...document.examSolutionSet, examHash: examSolutionHash(exam), questions: examSolutionQuestions, summary: solutionSummary(examSolutionQuestions), verificationStatus: "needs_review" as const }
    : undefined;
  const next: GeneratedDocument = {
    ...document,
    structuredExam: exam,
    content: structuredExamToText(exam, inputFromDocument(document, exam)),
    examSolutionSet,
    auditMeta: document.auditMeta ? {
      ...document.auditMeta,
      auditStatus: "not_audited",
      contentHash: undefined,
      acceptedWarningIds: document.auditMeta.acceptedWarningIds.filter((id) => !id.includes(changedQuestionId)),
    } : undefined,
  };
  if (document.examVariantSet) {
    const current = document.examVariantSet;
    next.examVariantSet = createExamVariants({ exam, sourceExamId: current.sourceExamId, sourceExamTitle: current.sourceExamTitle, variantCount: current.variantCount, startingCode: current.startingCode, seed: current.seed, options: current.mixingOptions });
  }
  return next;
}

export function applyQuestionReplacement(document: GeneratedDocument, proposal: QuestionReplacementProposal) {
  if (!document.structuredExam) throw new Error("structured_exam_required");
  const current = findQuestion(document.structuredExam, proposal.questionId);
  if (!current) throw new Error("question_not_found");
  if (questionSolutionHash(current) !== proposal.originalHash) throw new Error("stale_question_proposal");
  const exam: StructuredExam = { ...document.structuredExam, parts: document.structuredExam.parts.map((part) => ({ ...part, questions: part.questions.map((question) => question.id === proposal.questionId ? proposal.replacement : question) })) };
  return syncDocument(document, exam, proposal.questionId);
}

export function editExamQuestion(document: GeneratedDocument, questionId: string, patch: Partial<Pick<ExamQuestion, "stem" | "options" | "trueFalseItems" | "answer" | "explanation" | "difficulty" | "cognitiveLevel" | "visuals" | "sourceMetadata">>) {
  if (!document.structuredExam) throw new Error("structured_exam_required");
  const original = findQuestion(document.structuredExam, questionId);
  if (!original) throw new Error("question_not_found");
  return applyQuestionReplacement(document, proposeQuestionReplacement(document.structuredExam, questionId, { ...original, ...patch }));
}

export function confirmExamQuestion(document: GeneratedDocument, questionId: string) {
  if (!document.structuredExam) throw new Error("structured_exam_required");
  const exam: StructuredExam = { ...document.structuredExam, parts: document.structuredExam.parts.map((part) => ({ ...part, questions: part.questions.map((question) => question.id === questionId ? { ...question, sourceMetadata: { ...question.sourceMetadata, teacherConfirmed: true } } : question) })) };
  if (!findQuestion(exam, questionId)) throw new Error("question_not_found");
  return { ...document, structuredExam: exam };
}
