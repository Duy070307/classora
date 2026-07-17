import type { Rubric, RubricAssessment, RubricCriterionAssessment } from "@/lib/rubric/types";

export function createRubricAssessment(rubric: Rubric, submissionId: string): RubricAssessment {
  return { rubricId: rubric.id, submissionId, criteria: rubric.criteria.map((criterion) => ({ criterionId: criterion.id, teacherConfirmed: false })), totalScore: 0, maximumScore: rubric.totalScore, teacherConfirmed: false, updatedAt: new Date().toISOString() };
}

export function updateCriterionAssessment(rubric: Rubric, assessment: RubricAssessment, criterionId: string, patch: Partial<RubricCriterionAssessment>): RubricAssessment {
  const criteria = assessment.criteria.map((item) => item.criterionId === criterionId ? { ...item, ...patch } : item);
  const weighted = criteria.reduce((sum, item) => {
    if (!item.teacherConfirmed || item.confirmedScore === undefined) return sum;
    const criterion = rubric.criteria.find((entry) => entry.id === item.criterionId);
    if (!criterion || criterion.maxScore <= 0) return sum;
    return sum + (Math.max(0, Math.min(item.confirmedScore, criterion.maxScore)) / criterion.maxScore) * (rubric.totalScore * criterion.weight / 100);
  }, 0);
  const confirmed = criteria.length > 0 && criteria.every((item) => item.teacherConfirmed && item.confirmedScore !== undefined);
  return { ...assessment, criteria, totalScore: Math.round(weighted * 100) / 100, teacherConfirmed: confirmed, feedback: confirmed ? buildConfirmedFeedback(rubric, criteria) : undefined, updatedAt: new Date().toISOString() };
}

export function buildConfirmedFeedback(rubric: Rubric, criteria: RubricCriterionAssessment[]) {
  if (!criteria.every((item) => item.teacherConfirmed && item.confirmedScore !== undefined)) return undefined;
  return criteria.map((item) => {
    const criterion = rubric.criteria.find((entry) => entry.id === item.criterionId);
    return `${criterion?.title || "Tiêu chí"}: ${item.feedback || item.evidence || "Đã được giáo viên xác nhận."}`;
  }).join("\n");
}
