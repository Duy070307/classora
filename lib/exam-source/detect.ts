import type { ExamSourceType } from "@/lib/exam-source/types";

const signals: Record<Exclude<ExamSourceType, "unknown">, Array<[RegExp, number]>> = {
  matrix: [
    [/nhận\s*biết/iu, 2], [/thông\s*hiểu/iu, 2], [/vận\s*dụng(?:\s*cao)?/iu, 2], [/tỉ\s*lệ|tỷ\s*lệ/iu, 1],
    [/số\s*câu/iu, 1], [/số\s*điểm/iu, 1], [/tnkq|tự\s*luận/iu, 1], [/chủ\s*đề/iu, 1],
  ],
  specification: [
    [/yêu\s*cầu\s*cần\s*đạt/iu, 3], [/đơn\s*vị\s*kiến\s*thức/iu, 2], [/mức\s*độ\s*đánh\s*giá/iu, 2],
    [/dạng\s*câu\s*hỏi/iu, 2], [/số\s*câu\s*hỏi/iu, 1], [/năng\s*lực/iu, 1], [/mô\s*tả/iu, 1],
  ],
  previous_exam: [
    [/phần\s*i(?:\b|\.)/iu, 2], [/phần\s*ii(?:\b|\.)/iu, 2], [/phần\s*iii(?:\b|\.)/iu, 2],
    [/câu\s*1\b/iu, 2], [/(?:^|\n)\s*a[.)]\s+/imu, 1], [/(?:^|\n)\s*b[.)]\s+/imu, 1],
    [/đáp\s*án/iu, 2], [/thời\s*gian\s*làm\s*bài/iu, 2],
  ],
  lesson_material: [
    [/bài\s*học/iu, 2], [/mục\s*tiêu/iu, 2], [/kiến\s*thức/iu, 1], [/ví\s*dụ/iu, 1],
    [/bài\s*tập/iu, 1], [/khái\s*niệm|định\s*nghĩa|công\s*thức/iu, 1],
  ],
};

export function detectExamSourceType(text: string) {
  const scores = { matrix: 0, specification: 0, previous_exam: 0, lesson_material: 0, unknown: 0 } satisfies Record<ExamSourceType, number>;
  for (const [type, rules] of Object.entries(signals) as [Exclude<ExamSourceType, "unknown">, Array<[RegExp, number]>][]) {
    scores[type] = rules.reduce((sum, [pattern, weight]) => sum + (pattern.test(text) ? weight : 0), 0);
  }
  const ranked = (Object.entries(scores) as [ExamSourceType, number][]).filter(([type]) => type !== "unknown").sort((a, b) => b[1] - a[1]);
  const [bestType, best] = ranked[0];
  const second = ranked[1]?.[1] || 0;
  const confidence = best <= 2 ? 0.25 : Math.min(0.98, 0.45 + best * 0.045 + Math.max(0, best - second) * 0.04);
  const sourceType: ExamSourceType = best < 4 || (best - second <= 1 && best < 8) ? "unknown" : bestType;
  return { sourceType, confidence: sourceType === "unknown" ? Math.min(confidence, 0.49) : confidence, scores };
}

