import type { StructuredExam } from "@/lib/exam-types";
import type { ExamVariantSet } from "@/lib/exam-mixer/types";
import type { Rubric, RubricAssessment } from "@/lib/rubric/types";

export type GradingConfidence = "high" | "medium" | "low";
export type GradingMode = "objective_exam" | "mixed_exam" | "short_answer" | "essay_rubric" | "combined";
export type GradingStatus = "draft" | "recognizing" | "needs_review" | "grading" | "graded" | "confirmed" | "exported" | "failed";
export type SubmissionReviewStatus = "not_reviewed" | "needs_review" | "reviewed" | "confirmed";

export type BoundingBox = { x: number; y: number; width: number; height: number };

export type SubmissionAsset = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  pageCount: number;
  status: "pending" | "processing" | "recognized" | "failed";
  error?: string;
  /** Chỉ dùng trong phiên hiện tại, bị loại trước khi lưu lịch sử. */
  previewUrls?: string[];
};
export type RecognizedAnswer = {
  questionId?: string;
  questionNumber: number;
  rawValue?: string;
  normalizedValue?: string | number | boolean | boolean[] | string[];
  confidence: GradingConfidence;
  sourcePage?: number;
  sourceRegion?: BoundingBox;
  sourceCrop?: string;
  warnings?: string[];
  teacherConfirmed?: boolean;
};

export type TeacherOverride = {
  previousScore: number;
  newScore: number;
  reason?: string;
  updatedAt: string;
};

export type QuestionGradingResult = {
  questionId: string;
  questionNumber: number;
  sectionId: string;
  expectedAnswer?: unknown;
  studentAnswer?: unknown;
  status: "correct" | "incorrect" | "partial" | "blank" | "unresolved" | "needs_teacher_review";
  awardedScore: number;
  maximumScore: number;
  confidence: GradingConfidence;
  explanation?: string;
  feedback?: string;
  teacherOverride?: TeacherOverride;
  overrideHistory?: TeacherOverride[];
};

export type SubmissionGradingResult = {
  totalScore: number;
  maximumScore: number;
  percentage: number;
  objectiveScore: number;
  assistedScore: number;
  sectionScores: Record<string, number>;
  correctCount: number;
  incorrectCount: number;
  blankCount: number;
  unresolvedCount: number;
  questionResults: QuestionGradingResult[];
  overallFeedback?: string;
  confirmedByTeacher: boolean;
};

export type GradingSubmission = {
  id: string;
  student: {
    displayName?: string;
    studentCode?: string;
    className?: string;
    candidateNumber?: string;
  };
  teacherLabel?: string;
  examCode?: string;
  examCodeConfidence?: GradingConfidence;
  examCodeConfirmed?: boolean;
  sourceFiles: SubmissionAsset[];
  recognizedAnswers: RecognizedAnswer[];
  gradingResult?: SubmissionGradingResult;
  reviewStatus: SubmissionReviewStatus;
  warnings?: string[];
};

export type GradingSettings = {
  multipleChoice: "fixed" | "all_or_nothing";
  trueFalse: "per_statement" | "all_or_nothing" | "custom";
  trueFalseCustomScores?: number[];
  shortAnswerMode: "final_only" | "process" | "rubric";
  numericTolerance: "exact" | "absolute" | "percentage";
  toleranceValue: number;
  requireUnit: boolean;
  missingUnitFactor: number;
  multipleSelectionScore: number;
  rounding: "none" | "one_decimal" | "two_decimals" | "quarter" | "half";
  maximumScore: number;
  feedbackMode: "none" | "short" | "mistakes" | "detailed";
  revealAnswers: "none" | "correct_incorrect" | "answers" | "solutions";
  excludedQuestionIds: string[];
  acceptedAnswers: Record<string, string[]>;
};

export type GradingExamSource = {
  documentId?: string;
  title: string;
  exam?: StructuredExam;
  variantSet?: ExamVariantSet;
  rubricText?: string;
  rubric?: Rubric;
  verified: boolean;
  warnings: string[];
  blockingErrors: string[];
};

export type GradingJob = {
  id: string;
  ownerId?: string;
  examId?: string;
  variantSetId?: string;
  rubricId?: string;
  title: string;
  gradingMode: GradingMode;
  status: GradingStatus;
  source: GradingExamSource;
  submissions: GradingSubmission[];
  rubricAssessments?: Record<string, RubricAssessment>;
  settings: GradingSettings;
  metadata: {
    createdAt: string;
    updatedAt: string;
    examHash?: string;
    answerKeyHash?: string;
    gradingVersion?: string;
  };
};

export const DEFAULT_GRADING_SETTINGS: GradingSettings = {
  multipleChoice: "fixed",
  trueFalse: "per_statement",
  shortAnswerMode: "final_only",
  numericTolerance: "exact",
  toleranceValue: 0,
  requireUnit: false,
  missingUnitFactor: 1,
  multipleSelectionScore: 0,
  rounding: "one_decimal",
  maximumScore: 10,
  feedbackMode: "none",
  revealAnswers: "none",
  excludedQuestionIds: [],
  acceptedAnswers: {},
};
