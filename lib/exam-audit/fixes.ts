import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import { balanceMultipleChoiceAnswers, balanceTrueFalsePatterns } from "@/lib/exam/exam-quality";
import type { ExamAuditConfig, ExamAuditIssue, ExamAuditResult } from "@/lib/exam-audit/types";
import { auditStructuredExam } from "@/lib/exam-audit/audit";

function cloneExam(exam: StructuredExam): StructuredExam {
  return JSON.parse(JSON.stringify(exam)) as StructuredExam;
}

export function normalizeSafeNotation(value: string) {
  let result = String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\$\$\$+/g, "$$")
    .replace(/(^|[^<])<=/g, "$1\\le ")
    .replace(/>=/g, "\\ge ")
    .replace(/\binfinity\b/gi, "\\infty")
    .replace(/(^|[^\\\w])pi\b/gi, "$1\\pi");
  let previous = "";
  while (previous !== result) {
    previous = result;
    result = result.replace(/\bsqrt\s*\(([^()]*)\)/gi, "\\sqrt{$1}");
  }
  const dollars = (result.match(/\$/g) || []).length;
  if (dollars % 2 === 1) result = result.replace(/\$(?![\s\S]*\$)/, "");
  return result.trim();
}

function normalizeQuestion(question: ExamQuestion): ExamQuestion {
  return {
    ...question,
    stem: normalizeSafeNotation(question.stem),
    answer: normalizeSafeNotation(question.answer),
    explanation: normalizeSafeNotation(question.explanation),
    options: question.options ? {
      A: normalizeSafeNotation(question.options.A),
      B: normalizeSafeNotation(question.options.B),
      C: normalizeSafeNotation(question.options.C),
      D: normalizeSafeNotation(question.options.D),
    } : undefined,
    trueFalseItems: question.trueFalseItems?.map((item) => ({ ...item, text: normalizeSafeNotation(item.text) })),
  };
}

function rebalanceScores(exam: StructuredExam, totalScore: number) {
  const questions = exam.parts.flatMap((part) => part.questions);
  if (!questions.length || totalScore <= 0) return;
  const positiveTotal = questions.reduce((sum, question) => sum + Math.max(0, question.score || 0), 0);
  let assigned = 0;
  questions.forEach((question, index) => {
    if (index === questions.length - 1) question.score = Number((totalScore - assigned).toFixed(2));
    else {
      const raw = positiveTotal > 0 ? totalScore * Math.max(0, question.score || 0) / positiveTotal : totalScore / questions.length;
      question.score = Number(raw.toFixed(2));
      assigned += question.score;
    }
  });
}

function shouldApply(issue: ExamAuditIssue, selected: Set<string>) {
  return issue.canAutoFix && selected.has(issue.id);
}

export function applySafeFixes(exam: StructuredExam, issues: ExamAuditIssue[], selectedIssueIds: string[], config: ExamAuditConfig = {}) {
  const next = cloneExam(exam);
  const selected = new Set(selectedIssueIds);
  const selectedIssues = issues.filter((issue) => shouldApply(issue, selected));
  const kinds = new Set(selectedIssues.map((issue) => issue.fixKind).filter(Boolean));
  const questionIds = new Set(selectedIssues.map((issue) => issue.questionId).filter(Boolean));

  if (kinds.has("renumber")) {
    next.parts.forEach((part) => part.questions.forEach((question, index) => { question.number = index + 1; }));
  }
  if (kinds.has("normalize_notation")) {
    next.parts.forEach((part) => {
      part.questions = part.questions.map((question) => questionIds.size === 0 || questionIds.has(question.id) ? normalizeQuestion(question) : question);
    });
  }
  if (kinds.has("rebalance_options")) {
    next.parts.forEach((part) => {
      if (part.type === "multiple_choice") part.questions = balanceMultipleChoiceAnswers(part.questions);
    });
  }
  if (kinds.has("rebalance_true_false")) {
    next.parts.forEach((part) => {
      if (part.type === "true_false") part.questions = balanceTrueFalsePatterns(part.questions);
    });
  }
  if (kinds.has("round_scores")) {
    const total = config.totalScore ?? next.metadata.totalScore ?? 10;
    rebalanceScores(next, total);
    next.metadata.totalScore = total;
  }
  if (kinds.has("correct_answer")) {
    selectedIssues.filter((issue) => issue.fixKind === "correct_answer" && issue.questionId && issue.confidence === "high" && issue.proposedValue).forEach((issue) => {
      next.parts.forEach((part) => {
        part.questions = part.questions.map((question) => question.id === issue.questionId ? { ...question, answer: issue.proposedValue! } : question);
      });
    });
  }
  return next;
}

export function previewSafeFixes(exam: StructuredExam, issues: ExamAuditIssue[], selectedIssueIds: string[], config: ExamAuditConfig = {}) {
  const next = applySafeFixes(exam, issues, selectedIssueIds, config);
  const before = new Map(exam.parts.flatMap((part) => part.questions).map((question) => [question.id, question]));
  return next.parts.flatMap((part) => part.questions.flatMap((question) => {
    const current = before.get(question.id);
    if (!current || JSON.stringify(current) === JSON.stringify(question)) return [];
    return [{
      questionId: question.id,
      label: `${part.title} · Câu ${question.number}`,
      current: formatQuestion(current),
      proposed: formatQuestion(question),
    }];
  }));
}

function formatQuestion(question: ExamQuestion) {
  const lines = [`Câu ${question.number}. ${question.stem}`];
  if (question.options) for (const key of ["A", "B", "C", "D"] as const) lines.push(`${key}. ${question.options[key]}`);
  if (question.trueFalseItems) question.trueFalseItems.forEach((item) => lines.push(`${item.label}) ${item.text}`));
  lines.push(`Đáp án: ${question.answer || "(chưa có)"}`, `Điểm: ${question.score}`);
  return lines.join("\n");
}

export function allSafeFixIssueIds(result: ExamAuditResult) {
  return result.issues.filter((issue) => issue.canAutoFix).map((issue) => issue.id);
}

export function verifySafeFixMeaning(before: StructuredExam, after: StructuredExam) {
  const beforeStems = new Map(before.parts.flatMap((part) => part.questions).map((question) => [question.id, normalizeSafeNotation(question.stem)]));
  return after.parts.flatMap((part) => part.questions).every((question) => !beforeStems.has(question.id) || beforeStems.get(question.id) === normalizeSafeNotation(question.stem));
}

export function applyAndAuditSafeFixes(exam: StructuredExam, result: ExamAuditResult, selectedIssueIds: string[], config: ExamAuditConfig = {}) {
  const fixed = applySafeFixes(exam, result.issues, selectedIssueIds, config);
  return auditStructuredExam(fixed, config);
}
