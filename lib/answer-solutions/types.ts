import type { ExamPartType } from "@/lib/exam-types";

export type SolutionDetailLevel = "short" | "standard" | "detailed";
export type SolutionConfidence = "high" | "medium" | "low";
export type AnswerStatus = "matches" | "mismatch" | "uncertain" | "not_verified";

export type SolutionStep = { order: number; title?: string; content: string; formula?: string; result?: string };
export type StatementExplanation = { statementId: string; statementIndex: number; value: boolean; explanation: string; confidence: SolutionConfidence };
export type RubricItem = { criterion: string; points: number; expectedEvidence: string };

export type QuestionSolution = {
  questionId: string;
  questionNumber: number;
  sectionId: string;
  questionType: ExamPartType | "essay";
  currentAnswer: unknown;
  verifiedAnswer?: unknown;
  answerStatus: AnswerStatus;
  confidence: SolutionConfidence;
  conciseAnswer: string;
  detailedSolution?: string;
  steps?: SolutionStep[];
  statementExplanations?: StatementExplanation[];
  rubric?: RubricItem[];
  warnings?: string[];
  assumptions?: string[];
  contentHash: string;
  teacherConfirmed?: boolean;
};

export type SolutionSummary = {
  totalQuestions: number;
  verifiedCount: number;
  mismatchCount: number;
  uncertainCount: number;
  missingSolutionCount: number;
  deterministicVerifiedCount: number;
  semanticReviewedCount: number;
  cacheHitCount: number;
};

export type ExamSolutionSet = {
  examId?: string;
  examHash: string;
  generatedAt: string;
  verificationStatus: "not_checked" | "verified" | "needs_review" | "has_errors";
  questions: QuestionSolution[];
  summary: SolutionSummary;
  metadata: { detailLevel: SolutionDetailLevel; auditVersion?: string; sourceType?: string; solutionVersion: string };
};

export type SemanticSolutionPatch = Pick<QuestionSolution, "questionId" | "verifiedAnswer" | "answerStatus" | "confidence" | "conciseAnswer" | "detailedSolution" | "steps" | "statementExplanations" | "warnings" | "assumptions">;

