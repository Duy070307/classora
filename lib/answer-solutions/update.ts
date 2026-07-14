import { createExamVariants } from "@/lib/exam-mixer/engine";
import type { GeneratedDocument } from "@/lib/types";
import type { QuestionSolution } from "@/lib/answer-solutions/types";
import { applyVerifiedAnswer } from "@/lib/answer-solutions/verify";

export function applySolutionAnswerToDocument(document: GeneratedDocument, solution: QuestionSolution, confirmed = false) {
  if (!document.structuredExam) throw new Error("structured_exam_required");
  const structuredExam = applyVerifiedAnswer(document.structuredExam, solution, confirmed);
  const examSolutionSet = document.examSolutionSet ? { ...document.examSolutionSet, questions: document.examSolutionSet.questions.filter((item) => item.questionId !== solution.questionId) } : undefined;
  const changed: GeneratedDocument = { ...document, structuredExam, examSolutionSet, auditMeta: document.auditMeta ? { ...document.auditMeta, auditStatus: "not_audited", contentHash: undefined } : undefined };
  if (document.examVariantSet) {
    const current = document.examVariantSet;
    changed.examVariantSet = createExamVariants({ exam: structuredExam, sourceExamId: current.sourceExamId, sourceExamTitle: current.sourceExamTitle, variantCount: current.variantCount, startingCode: current.startingCode, seed: current.seed, options: current.mixingOptions });
  }
  return changed;
}
