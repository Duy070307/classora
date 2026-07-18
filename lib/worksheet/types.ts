import type { RubricItem } from "@/lib/answer-solutions/types";

export type WorksheetPurpose = "warm_up" | "exploration" | "knowledge" | "practice" | "application" | "review" | "solution" | "homework" | "group_activity" | "quick_check";
export type WorksheetWorkMode = "individual" | "pair" | "group" | "whole_class" | "mixed";
export type WorksheetDifferentiation = "single" | "basic_advanced" | "three_levels";
export type WorksheetLevel = "basic" | "standard" | "advanced";
export type WorksheetSourceType = "manual" | "lesson_plan" | "document" | "slides" | "exam" | "solution" | "question_bank" | "previous_worksheet";
export type WorksheetActivityType = "multiple_choice" | "true_false" | "short_answer" | "fill_blank" | "matching" | "classification" | "ordering" | "table_completion" | "diagram_labeling" | "worked_example" | "problem_solving" | "discussion" | "group_task" | "experiment" | "reflection" | "exit_ticket";
export type WorksheetAnswerSpace = "none" | "one_line" | "three_lines" | "half_page" | "full_page" | "table" | "calculation" | "drawing";

export type WorksheetOption = { id: string; label: string; text: string };
export type WorksheetItem = {
  id: string;
  prompt: string;
  options?: WorksheetOption[];
  answer?: string;
  acceptedAnswers?: string[];
  explanation?: string;
  unit?: string;
  left?: string;
  right?: string;
  categoryId?: string;
  order?: number;
  isCorrect?: boolean;
};

export type WorksheetBlock =
  | { id: string; type: "text" | "formula" | "tikz"; content: string; alt?: string; teacherOnly?: boolean }
  | { id: string; type: "table"; headers: string[]; rows: string[][]; expectedCells?: Record<string, string>; alt?: string; teacherOnly?: boolean }
  | { id: string; type: "image"; assetId: string; alt: string; dataUrl?: string; teacherOnly?: boolean };

export type WorksheetActivity = {
  id: string;
  sourceSectionId?: string;
  order: number;
  title?: string;
  type: WorksheetActivityType;
  level: WorksheetLevel;
  purpose?: WorksheetPurpose;
  prompt: string;
  instructions?: string;
  expectedOutput?: string;
  estimatedMinutes?: number;
  items?: WorksheetItem[];
  blocks?: WorksheetBlock[];
  answerSpace?: WorksheetAnswerSpace;
  score?: number;
  learningOutcome?: string;
  answer?: string;
  explanation?: string;
  acceptedAlternatives?: string[];
  hint?: string;
  commonMistake?: string;
  teacherNote?: string;
  rubric?: RubricItem[];
  rubricId?: string;
  generationStatus?: "outline" | "pending" | "generating" | "ready" | "failed";
  generationError?: string;
  teacherEdited?: boolean;
};

export type WorksheetAnswerKey = { entries: Array<{ activityId: string; answer: string; explanation?: string; acceptedAlternatives?: string[]; commonMistake?: string }> };
export type TeacherGuide = { introduction?: string; organization?: string; prompts?: string[]; hintTiming?: string; reviewMethod?: string };

export type Worksheet = {
  id?: string;
  ownerId?: string;
  title: string;
  subtitle?: string;
  subject?: string;
  grade?: string;
  topic?: string;
  textbookSeries?: string;
  purpose: WorksheetPurpose;
  durationMinutes?: number;
  workMode: WorksheetWorkMode;
  differentiation: WorksheetDifferentiation;
  differentiationLayout?: "combined" | "separate" | "basic_plus_advanced";
  instructions?: string[];
  objectives?: string[];
  keyKnowledge?: string[];
  activities: WorksheetActivity[];
  diagramAssets?: import("@/lib/tikz/types").ConfirmedDiagramAsset[];
  answerKey?: WorksheetAnswerKey;
  teacherGuide?: TeacherGuide;
  settings: {
    includeAnswers: boolean;
    includeTeacherGuide: boolean;
    includeScoring: boolean;
    includeAnswerSpace: boolean;
    includeSelfAssessment: boolean;
    sourceOnly: boolean;
    questionBankMode: "new_only" | "prefer_bank" | "combine" | "bank_only";
    totalScore?: number;
    activityCount: number;
  };
  metadata: {
    sourceType: WorksheetSourceType;
    sourceDocumentId?: string;
    sourceTitle?: string;
    sourceHash?: string;
    createdAt: string;
    updatedAt: string;
    version?: string;
    exportStatus?: "ready" | "warning" | "blocked";
  };
};

export type WorksheetInputMode = "topic" | "lesson_plan" | "document" | "saved";
export type WorksheetSourcePreview = { title: string; sourceType: WorksheetSourceType; sourceDocumentId?: string; subject?: string; grade?: string; topic?: string; objectives: string[]; stages: string[]; keyKnowledge: string[]; text: string; confirmed: boolean; warnings: string[] };
export type WorksheetValidation = { valid: boolean; errors: string[]; warnings: string[]; totalScore: number; activityCount: number };
