import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { GeneratedDocument, QuestionDifficulty } from "@/lib/types";

export const EXAM_AUDIT_VERSION = "1.0.0";

export type AuditSeverity = "error" | "warning" | "info";
export type AuditReadiness = "failed" | "review" | "ready";
export type AuditConfidence = "high" | "medium" | "low";
export type AuditFixKind =
  | "renumber"
  | "normalize_notation"
  | "rebalance_options"
  | "rebalance_true_false"
  | "round_scores"
  | "correct_answer";

export type ExamAuditIssue = {
  id: string;
  code: string;
  severity: AuditSeverity;
  questionId?: string;
  questionNumber?: number;
  section?: string;
  title: string;
  description: string;
  suggestedFix: string;
  canAutoFix: boolean;
  fixKind?: AuditFixKind;
  confidence?: AuditConfidence;
  aiAssisted?: boolean;
  currentValue?: string;
  proposedValue?: string;
};

export type ExamAuditConfig = {
  expectedSectionCounts?: { partI: number; partII: number; partIII: number };
  totalScore?: number;
  numericShortAnswers?: boolean;
  requireFourOptions?: boolean;
  requestedCognitiveRates?: {
    recognition: number;
    understanding: number;
    application: number;
    advanced: number;
  };
  acceptedWarningIds?: string[];
};

export type ExamAuditSummary = {
  totalQuestions: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  readiness: AuditReadiness;
  readinessLabel: "Chưa đạt" | "Cần rà soát" | "Sẵn sàng xuất";
  contentHash: string;
  durationMs: number;
  deterministicIssueCount: number;
  aiReviewedQuestionCount: number;
  cacheHit?: boolean;
};

export type ExamAuditResult = {
  exam: StructuredExam;
  issues: ExamAuditIssue[];
  summary: ExamAuditSummary;
  auditedAt: string;
  auditVersion: string;
};

export type ExamAuditPayload = {
  document: GeneratedDocument;
  config?: ExamAuditConfig;
  source?: "generator" | "history" | "upload" | "paste";
};

export type SemanticAuditFinding = {
  questionId: string;
  code: "possible_answer_mismatch" | "ambiguous_question" | "missing_data" | "cognitive_level_mismatch";
  severity: "warning" | "info";
  title: string;
  description: string;
  suggestedFix: string;
  confidence: AuditConfidence;
  detectedDifficulty?: QuestionDifficulty;
};

export function questionLabel(question: ExamQuestion) {
  return `Câu ${question.number}`;
}
