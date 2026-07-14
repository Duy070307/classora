import type { GeneratedDocument } from "@/lib/types";
import type { ExamAuditConfig, ExamAuditResult } from "@/lib/exam-audit/types";
import { EXAM_AUDIT_VERSION } from "@/lib/exam-audit/types";

export const EXAM_AUDIT_SESSION_INPUT = "soanlab-exam-audit-document";
export const EXAM_AUDIT_SESSION_RESULT = "soanlab-exam-audit-result";

export function auditConfigFromDocument(document: GeneratedDocument): ExamAuditConfig {
  const requested = document.generationMeta?.requestedSectionCounts || document.structuredExam?.metadata.requestedSectionCounts;
  return {
    expectedSectionCounts: requested,
    totalScore: document.generationMeta?.requestedTotalScore || document.structuredExam?.metadata.totalScore,
    numericShortAnswers: /THPTQG|tốt nghiệp/i.test(document.examMeta?.examStyle || document.structuredExam?.metadata.examStyle || ""),
    requireFourOptions: true,
    requestedCognitiveRates: document.generationMeta?.requestedCognitiveRates || document.structuredExam?.metadata.requestedCognitiveRates,
    acceptedWarningIds: document.auditMeta?.acceptedWarningIds || [],
  };
}

export function withAuditResult(document: GeneratedDocument, result: ExamAuditResult, acceptedWarningIds: string[] = []): GeneratedDocument {
  const unacceptedWarnings = result.issues.filter((issue) => issue.severity === "warning" && !acceptedWarningIds.includes(issue.id)).length;
  const status = result.summary.errorCount > 0 ? "needs_fix" : unacceptedWarnings > 0 ? "reviewed" : "ready";
  return {
    ...document,
    structuredExam: result.exam,
    auditMeta: {
      lastAuditedAt: result.auditedAt,
      auditStatus: status,
      errorCount: result.summary.errorCount,
      warningCount: unacceptedWarnings,
      acceptedWarningIds,
      auditVersion: EXAM_AUDIT_VERSION,
      contentHash: result.summary.contentHash,
    },
  };
}

export function auditStatusLabel(document: GeneratedDocument) {
  if (!document.auditMeta || document.auditMeta.auditStatus === "not_audited") return "Chưa kiểm tra";
  if (document.auditMeta.auditStatus === "needs_fix") return "Có lỗi cần sửa";
  if (document.auditMeta.auditStatus === "ready") return "Sẵn sàng xuất";
  return "Đã kiểm tra";
}

export function confirmExamExport(document: GeneratedDocument) {
  if (document.type !== "exam" || !document.auditMeta?.errorCount) return true;
  return window.confirm("Đề vẫn còn lỗi chưa được xử lý. Thầy cô vẫn muốn xuất file?");
}
