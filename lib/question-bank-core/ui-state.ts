import type { QuestionFilters } from "@/lib/question-bank-core/types";
import { QUESTION_TYPE_LABELS } from "@/lib/question-bank-core/types";

export type ActiveQuestionFilter = {
  key: keyof QuestionFilters;
  label: string;
  value: string;
};

const labels: Partial<Record<keyof QuestionFilters, string>> = {
  query: "Tìm kiếm",
  scope: "Nguồn",
  subject: "Môn",
  grade: "Lớp",
  topic: "Chủ đề",
  subtopic: "Chủ đề con",
  type: "Dạng câu",
  difficulty: "Độ khó",
  cognitiveLevel: "Mức độ nhận thức",
  bookSeries: "Bộ sách",
  quality: "Chất lượng",
  source: "Nguồn dữ liệu",
  usage: "Sử dụng",
};

const qualityLabels = {
  valid: "Hợp lệ",
  needs_review: "Cần rà soát",
  invalid: "Không hợp lệ",
};

export function activeQuestionFilters(filters: QuestionFilters) {
  return (
    Object.entries(filters) as Array<
      [keyof QuestionFilters, QuestionFilters[keyof QuestionFilters]]
    >
  ).flatMap(([key, rawValue]): ActiveQuestionFilter[] => {
    const value = String(rawValue || "").trim();
    if (!value || value === "all") return [];
    const displayValue =
      key === "type"
        ? QUESTION_TYPE_LABELS[value as keyof typeof QUESTION_TYPE_LABELS]
        : key === "quality"
          ? qualityLabels[value as keyof typeof qualityLabels]
          : value;
    return [{ key, label: labels[key] || key, value: displayValue || value }];
  });
}

export function clearQuestionFilter(
  filters: QuestionFilters,
  key: keyof QuestionFilters,
): QuestionFilters {
  const next = { ...filters };
  if (key === "scope" || key === "usage") next[key] = "all";
  else delete next[key];
  return next;
}

export function reconcileQuestionSelection(
  selectedIds: string[],
  existingIds: ReadonlySet<string>,
) {
  return selectedIds.filter((id) => existingIds.has(id));
}
