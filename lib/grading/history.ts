import type { GeneratedDocument } from "@/lib/types";
import type { GradingJob } from "@/lib/grading/types";
import { classSummary, stripGradingAssets } from "@/lib/grading/engine";

export function gradingJobToDocument(job: GradingJob): GeneratedDocument {
  const clean = stripGradingAssets(job); const summary = classSummary(clean);
  return {
    id: clean.id,
    title: clean.title,
    type: "grading-assistant",
    folder: "Đề kiểm tra",
    createdAt: clean.metadata.createdAt,
    content: `# BỘ BÀI ĐÃ CHẤM\n\n- Số bài: ${summary.total}\n- Đã chấm: ${summary.graded}\n- Cần rà soát: ${summary.needsReview}\n- Điểm trung bình: ${summary.average}\n- Trạng thái: ${clean.status}`,
    gradingJob: clean,
  };
}
