import type { Rubric, RubricValidation, RubricValidationIssue } from "@/lib/rubric/types";

export function validateRubric(rubric: Rubric): RubricValidation {
  const errors: RubricValidationIssue[] = [];
  const warnings: RubricValidationIssue[] = [];
  const ids = new Set<string>();
  const add = (target: RubricValidationIssue[], issue: RubricValidationIssue) => target.push(issue);
  if (!rubric.title.trim()) add(errors, { code: "missing_title", severity: "error", message: "Rubric chưa có tiêu đề." });
  if (rubric.levels.length < 2) add(errors, { code: "few_levels", severity: "error", message: "Cần ít nhất 2 mức đánh giá." });
  if (!rubric.criteria.length) add(errors, { code: "no_criteria", severity: "error", message: "Cần ít nhất một tiêu chí." });
  for (const level of rubric.levels) {
    if (ids.has(level.id)) add(errors, { code: "duplicate_id", severity: "error", message: `Trùng ID mức ${level.label}.`, levelId: level.id });
    ids.add(level.id);
  }
  for (let index = 1; index < rubric.levels.length; index += 1) if (rubric.levels[index].score > rubric.levels[index - 1].score) add(errors, { code: "level_progression", severity: "error", message: `Mức “${rubric.levels[index - 1].label}” có điểm thấp hơn mức “${rubric.levels[index].label}”.`, levelId: rubric.levels[index].id });
  for (const criterion of rubric.criteria) {
    if (ids.has(criterion.id)) add(errors, { code: "duplicate_id", severity: "error", message: `Trùng ID tiêu chí ${criterion.title}.`, criterionId: criterion.id });
    ids.add(criterion.id);
    if (!criterion.title.trim()) add(errors, { code: "missing_criterion", severity: "error", message: "Có tiêu chí chưa có tên.", criterionId: criterion.id });
    if (criterion.weight < 0 || criterion.maxScore < 0) add(errors, { code: "negative_score", severity: "error", message: `${criterion.title} có điểm hoặc trọng số âm.`, criterionId: criterion.id });
    for (const item of criterion.descriptors) {
      if (!rubric.levels.some((level) => level.id === item.levelId)) add(errors, { code: "orphan_descriptor", severity: "error", message: `${criterion.title} có mô tả không thuộc mức đánh giá nào.`, criterionId: criterion.id, levelId: item.levelId });
      if (item.scoreRange && item.scoreRange.minimum > item.scoreRange.maximum) add(errors, { code: "reversed_range", severity: "error", message: `${criterion.title} có khoảng điểm bị đảo ngược.`, criterionId: criterion.id, levelId: item.levelId });
    }
    for (const level of rubric.levels) {
      const item = criterion.descriptors.find((entry) => entry.levelId === level.id);
      if (!item?.text.trim()) add(errors, { code: "missing_descriptor", severity: "error", message: `${criterion.title} thiếu mô tả ở mức ${level.label}.`, criterionId: criterion.id, levelId: level.id });
    }
    const normalized = criterion.descriptors.map((item) => item.text.trim().toLocaleLowerCase("vi")).filter(Boolean);
    if (new Set(normalized).size < normalized.length) add(warnings, { code: "duplicate_descriptor", severity: "warning", message: `${criterion.title} có mô tả mức độ bị trùng.`, criterionId: criterion.id });
  }
  const scoreTotal = rubric.criteria.reduce((sum, item) => sum + item.maxScore, 0);
  const weightTotal = rubric.criteria.reduce((sum, item) => sum + item.weight, 0);
  if (rubric.rubricType === "point_based" && Math.abs(scoreTotal - rubric.totalScore) > 0.001) add(errors, { code: "score_total", severity: "error", message: `Tổng điểm các tiêu chí là ${scoreTotal} nhưng tổng điểm rubric là ${rubric.totalScore}.` });
  const difference = Math.abs(weightTotal - 100);
  if (rubric.rubricType === "weighted" || rubric.rubricType === "analytic") {
    if (difference > 5) add(errors, { code: "weight_total", severity: "error", message: `Tổng trọng số là ${weightTotal.toFixed(2)}%, cần bằng 100%.` });
    else if (difference > 0.001) add(warnings, { code: "weight_rounding", severity: "warning", message: `Tổng trọng số là ${weightTotal.toFixed(2)}%; có thể cân chỉnh về 100%.` });
  }
  if (rubric.totalScore <= 0 || rubric.totalScore > 1000) add(errors, { code: "total_score", severity: "error", message: "Tổng điểm phải lớn hơn 0 và không vượt quá 1000." });
  return { status: errors.length ? "blocked" : warnings.length ? "warning" : "ready", errors, warnings, scoreTotal, weightTotal };
}
