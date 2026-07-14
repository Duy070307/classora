import type { StructuredExam } from "@/lib/exam-types";

export type ExamMixingOptions = {
  shuffleMultipleChoiceQuestions: boolean;
  shuffleMultipleChoiceOptions: boolean;
  shuffleTrueFalseQuestions: boolean;
  shuffleTrueFalseStatements: boolean;
  shuffleShortAnswerQuestions: boolean;
  shuffleEssayQuestions: boolean;
  keepGroups: boolean;
  balanceAnswers: boolean;
};

export type VariantQuestionMap = {
  originalQuestionId: string;
  originalNumber: number;
  variantNumber: number;
  sectionId: string;
};

export type VariantAnswerKey = {
  questionId: string;
  sectionId: string;
  number: number;
  answer: string;
};

export type VariantAuditResult = {
  code: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  answerDistribution: Record<"A" | "B" | "C" | "D", number>;
  questionCount: number;
  totalScore: number;
  equivalence: "equivalent" | "warning" | "invalid";
};

export type ExamVariant = {
  code: string;
  variantSeed: string;
  exam: StructuredExam;
  questionMap: VariantQuestionMap[];
  answerKey: VariantAnswerKey[];
  auditResult: VariantAuditResult;
};

export type ExamVariantSet = {
  id: string;
  sourceExamId?: string;
  sourceExamTitle: string;
  sourceExamSnapshot: StructuredExam;
  seed: string;
  startingCode: number;
  variantCount: number;
  mixingOptions: ExamMixingOptions;
  createdAt: string;
  variants: ExamVariant[];
};

export type CreateExamVariantsInput = {
  exam: StructuredExam;
  sourceExamId?: string;
  sourceExamTitle?: string;
  variantCount: number;
  startingCode: number;
  seed: string;
  options: ExamMixingOptions;
};

export const defaultExamMixingOptions: ExamMixingOptions = {
  shuffleMultipleChoiceQuestions: true,
  shuffleMultipleChoiceOptions: true,
  shuffleTrueFalseQuestions: true,
  shuffleTrueFalseStatements: false,
  shuffleShortAnswerQuestions: true,
  shuffleEssayQuestions: false,
  keepGroups: true,
  balanceAnswers: true,
};

