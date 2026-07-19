import { normalizeMathSymbols } from "@/lib/content/math-symbol-normalize";
import { ensureStableExamIdentity } from "@/lib/exam/identity";
import { examContentHash } from "@/lib/exam-audit/audit";
import { examSolutionHash, questionSolutionHash } from "@/lib/answer-solutions/hash";
import { solutionSummary } from "@/lib/answer-solutions/verify";
import type { GeneratedDocument } from "@/lib/types";

export function stripMarkdownSyntax(value: string) {
  return value
    .replace(/```(?:\w+)?\s*([\s\S]*?)```/g, "$1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/^\s*[•]\s+/gm, "- ")
    .replace(/\r\n/g, "\n");
}

export function normalizeEducationalContent(value: string) {
  return stripMarkdownSyntax(normalizeMathSymbols(value))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function normalizeGeneratedDocument<T extends { content: string; title?: string }>(document: T): T {
  const normalized = {
    ...document,
    title: document.title ? normalizeMathSymbols(document.title) : document.title,
    content: normalizeEducationalContent(document.content),
  };
  const candidate = normalized as T & Partial<GeneratedDocument>;
  if (!candidate.structuredExam) return normalized;
  const structuredExam = ensureStableExamIdentity(candidate.structuredExam);
  const questions = new Map(structuredExam.parts.flatMap((part) => part.questions).map((question) => [question.id, question]));
  const currentSolutions = candidate.examSolutionSet?.questions.filter((solution) => {
    const question = questions.get(solution.questionId);
    return Boolean(question && solution.contentHash === questionSolutionHash(question));
  });
  const examSolutionSet = candidate.examSolutionSet && currentSolutions
    ? { ...candidate.examSolutionSet, examHash: examSolutionHash(structuredExam), questions: currentSolutions, summary: solutionSummary(currentSolutions), verificationStatus: currentSolutions.length === questions.size ? candidate.examSolutionSet.verificationStatus : "needs_review" as const }
    : undefined;
  const currentAuditHash = examContentHash(structuredExam);
  const auditMeta = candidate.auditMeta?.contentHash && candidate.auditMeta.contentHash !== currentAuditHash
    ? { ...candidate.auditMeta, auditStatus: "not_audited" as const, contentHash: undefined }
    : candidate.auditMeta;
  return { ...normalized, structuredExam, examSolutionSet, auditMeta } as T;
}
