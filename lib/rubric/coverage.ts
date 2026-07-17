import type { Rubric, RubricCoverageItem } from "@/lib/rubric/types";

export function rubricCoverage(rubric: Rubric): RubricCoverageItem[] {
  return rubric.objectives.map((objective) => {
    const criteria = rubric.criteria.filter((criterion) => criterion.objectiveIds.includes(objective.id));
    return { objectiveId: objective.id, objective: objective.text, criterionIds: criteria.map((item) => item.id), criterionTitles: criteria.map((item) => item.title), status: criteria.length ? "covered" : "missing" };
  });
}
