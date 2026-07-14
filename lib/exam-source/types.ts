import type { StructuredExam } from "@/lib/exam-types";

export type ExamSourceType = "matrix" | "specification" | "previous_exam" | "lesson_material" | "unknown";

export type BlueprintQuestionType = "multiple_choice" | "true_false" | "short_answer" | "essay" | "mixed";

export type BlueprintSection = {
  id: string;
  title: string;
  questionType: BlueprintQuestionType;
  questionCount: number;
  score: number;
  statementsPerQuestion?: number;
};

export type BlueprintTopic = {
  topic: string;
  subtopic?: string;
  counts: {
    recognition?: number;
    comprehension?: number;
    application?: number;
    advancedApplication?: number;
  };
  totalQuestions?: number;
  totalScore?: number;
  percentage?: number;
  questionTypes?: string[];
  learningOutcomes?: string[];
};

export type CognitiveDistribution = {
  recognition?: number;
  comprehension?: number;
  application?: number;
  advancedApplication?: number;
};

export type BlueprintWarning = {
  code: string;
  message: string;
  field?: string;
  severity: "warning" | "error";
  suggestion?: string;
};

export type ExamBlueprint = {
  sourceType: ExamSourceType;
  sourceName?: string;
  sourceContentHash?: string;
  subject?: string;
  grade?: string;
  textbookSeries?: string;
  examType?: string;
  durationMinutes?: number;
  totalScore?: number;
  sections: BlueprintSection[];
  topicDistribution: BlueprintTopic[];
  cognitiveDistribution: CognitiveDistribution;
  instructions?: string[];
  constraints?: string[];
  confidence: {
    overall: number;
    fields: Record<string, number>;
  };
  warnings: BlueprintWarning[];
};

export type ExtractedTable = {
  name: string;
  rows: string[][];
  mergedRanges?: string[];
};

export type ParsedExamSource = {
  fileName: string;
  extension: string;
  text: string;
  tables: ExtractedTable[];
  sourceType: ExamSourceType;
  detectionConfidence: number;
  detectionScores: Record<ExamSourceType, number>;
  warnings: string[];
  contentHash: string;
  metadata?: { pageCount?: number; imageCount?: number; sheetNames?: string[]; selectedSheet?: string };
  previousExam?: StructuredExam;
};

export type BlueprintValidation = {
  valid: boolean;
  errors: BlueprintWarning[];
  warnings: BlueprintWarning[];
  totals: { sectionQuestions: number; topicQuestions: number; sectionScore: number; topicPercentage: number };
};

export type PreviousExamMode = "same_structure_new_questions" | "equivalent_difficulty" | "topics_and_types" | "reference_only";
export type BlueprintBankMode = "ai_new" | "prefer_bank" | "combine" | "bank_only";

