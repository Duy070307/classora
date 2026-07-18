import type { ExamSolutionSet } from "@/lib/answer-solutions/types";
import type { StructuredExam } from "@/lib/exam-types";
import type { WorksheetActivity, WorksheetDifferentiation } from "@/lib/worksheet/types";

export type ReviewPurpose = "lesson" | "chapter" | "midterm" | "final" | "exam_prep" | "remediation";
export type ReviewSourceType = "manual" | "document" | "lesson_plan" | "slides" | "worksheet" | "exam" | "question_bank" | "grading_result" | "saved_review";
export type ReviewInputMode = "topic" | "document" | "saved" | "grading_result";
export type ReviewDetailLevel = "concise" | "standard" | "detailed";
export type ReviewSectionType = "knowledge" | "formula" | "summary_table" | "exercise_types" | "worked_examples" | "basic_practice" | "application_practice" | "advanced_practice" | "quick_quiz" | "answers" | "solutions" | "teacher_notes";

export type KnowledgeSection = { id: string; title: string; summary: string; keyPoints: string[]; shortExample?: string; commonMistake?: string; teacherEdited?: boolean };
export type FormulaSection = { id: string; title: string; latex: string; symbols: Array<{ symbol: string; meaning: string; unit?: string }>; conditions?: string; example?: string; teacherEdited?: boolean };
export type ExerciseTypeSection = { id: string; title: string; recognitionSignal: string; method: string[]; commonMistakes: string[]; workedExampleIds: string[]; practiceActivityIds: string[]; teacherEdited?: boolean };
export type WorkedExample = { id: string; title: string; prompt: string; method: string; steps: string[]; finalAnswer: string; note?: string; formula?: string; teacherEdited?: boolean };

export type ReviewOutlineItem = {
  id: string;
  order: number;
  type: ReviewSectionType;
  title: string;
  purpose: string;
  estimatedLength: "short" | "medium" | "long";
  exerciseCount: number;
  level: "basic" | "standard" | "advanced" | "mixed";
  sourceCoverage: string[];
  generationStatus: "outline" | "ready" | "failed";
  teacherEdited?: boolean;
};

export type ReviewPackSettings = {
  includeKnowledge: boolean;
  includeFormulas: boolean;
  includeSummaryTable: boolean;
  includeExerciseTypes: boolean;
  includeWorkedExamples: boolean;
  includeBasicPractice: boolean;
  includeApplicationPractice: boolean;
  includeAdvancedPractice: boolean;
  includeQuickQuiz: boolean;
  includeAnswers: boolean;
  includeDetailedSolutions: boolean;
  includeTeacherNotes: boolean;
  sourceOnly: boolean;
  detailLevel: ReviewDetailLevel;
  differentiation: WorksheetDifferentiation;
  exerciseCount: number;
  quizCount: number;
  quizType: "multiple_choice" | "true_false" | "short_answer" | "mixed";
  questionBankMode: "new_only" | "prefer_bank" | "combine" | "bank_only";
};

export type ReviewPack = {
  id: string;
  ownerId?: string;
  title: string;
  subject?: string;
  grade?: string;
  topic?: string;
  textbookSeries?: string;
  purpose: ReviewPurpose;
  estimatedMinutes: number;
  notes?: string;
  outline: ReviewOutlineItem[];
  knowledgeSections: KnowledgeSection[];
  formulaSections: FormulaSection[];
  summaryRows: Array<{ id: string; concept: string; keyPoint: string; example?: string }>;
  exerciseTypes: ExerciseTypeSection[];
  workedExamples: WorkedExample[];
  practiceActivities: WorksheetActivity[];
  diagramAssets?: import("@/lib/tikz/types").ConfirmedDiagramAsset[];
  quickQuiz?: StructuredExam;
  solutions?: ExamSolutionSet;
  teacherNotes?: string[];
  settings: ReviewPackSettings;
  metadata: {
    sourceType: ReviewSourceType;
    sourceDocumentId?: string;
    sourceActivityIds?: string[];
    sourceHash?: string;
    createdAt: string;
    updatedAt: string;
    version: "1.0";
    validationStatus?: "ready" | "warning" | "blocked";
  };
};

export type ReviewSourcePreview = {
  title: string;
  sourceType: ReviewSourceType;
  sourceDocumentId?: string;
  subject?: string;
  grade?: string;
  topic?: string;
  text: string;
  objectives: string[];
  keyKnowledge: string[];
  confirmed: boolean;
  warnings: string[];
};

export type ReviewPackValidation = { valid: boolean; status: "ready" | "warning" | "blocked"; errors: string[]; warnings: string[]; sectionCount: number; exerciseCount: number; quizQuestionCount: number };
