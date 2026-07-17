import type { Rubric, RubricType } from "@/lib/rubric/types";
import { createRubricOutline } from "@/lib/rubric/workflow";

export type RubricTemplate = { id: string; title: string; assignmentType: string; rubricType: RubricType; criteria: string[]; objectives: string[] };

export const RUBRIC_TEMPLATES: RubricTemplate[] = [
  { id: "presentation", title: "Bài thuyết trình", assignmentType: "Bài thuyết trình", rubricType: "analytic", criteria: ["Nội dung", "Lập luận và minh chứng", "Kỹ năng trình bày", "Quản lý thời gian"], objectives: ["Trình bày chính xác nội dung", "Giao tiếp rõ ràng và có minh chứng"] },
  { id: "essay", title: "Bài viết", assignmentType: "Bài viết", rubricType: "analytic", criteria: ["Ý tưởng và nội dung", "Bố cục", "Lập luận", "Ngôn ngữ và chính tả"], objectives: ["Viết đúng yêu cầu", "Tổ chức và diễn đạt mạch lạc"] },
  { id: "project", title: "Dự án học tập", assignmentType: "Dự án", rubricType: "weighted", criteria: ["Xác định vấn đề", "Quy trình thực hiện", "Sản phẩm", "Báo cáo và phản biện"], objectives: ["Vận dụng kiến thức để giải quyết vấn đề", "Tạo sản phẩm và báo cáo kết quả"] },
  { id: "group", title: "Hoạt động nhóm", assignmentType: "Hoạt động nhóm", rubricType: "analytic", criteria: ["Tham gia", "Hợp tác", "Phân công", "Sản phẩm chung"], objectives: ["Hợp tác có trách nhiệm", "Hoàn thành nhiệm vụ chung"] },
  { id: "experiment", title: "Thực hành thí nghiệm", assignmentType: "Thí nghiệm", rubricType: "analytic", criteria: ["Chuẩn bị", "Thao tác", "An toàn", "Quan sát và kết luận"], objectives: ["Thực hiện đúng quy trình", "Thu thập và giải thích kết quả"] },
  { id: "math-solution", title: "Bài giải Toán", assignmentType: "Bài giải", rubricType: "point_based", criteria: ["Xác định dữ kiện", "Phương pháp", "Lập luận", "Kết quả và trình bày"], objectives: ["Lựa chọn phương pháp phù hợp", "Trình bày lời giải chính xác"] },
  { id: "reading", title: "Đọc hiểu", assignmentType: "Bài đọc hiểu", rubricType: "analytic", criteria: ["Nắm thông tin", "Suy luận", "Dẫn chứng", "Diễn đạt"], objectives: ["Đọc và hiểu văn bản", "Trả lời có dẫn chứng"] },
  { id: "creative-product", title: "Sản phẩm sáng tạo", assignmentType: "Sản phẩm sáng tạo", rubricType: "weighted", criteria: ["Đúng yêu cầu", "Tính sáng tạo", "Tính ứng dụng", "Hoàn thiện sản phẩm"], objectives: ["Tạo sản phẩm đáp ứng yêu cầu", "Thể hiện ý tưởng cá nhân"] },
  { id: "self-assessment", title: "Tự đánh giá học tập", assignmentType: "Tự đánh giá", rubricType: "checklist", criteria: ["Hoàn thành nhiệm vụ", "Hiểu nội dung", "Tự điều chỉnh", "Kế hoạch tiếp theo"], objectives: ["Nhận diện tiến bộ", "Đề xuất hành động tiếp theo"] },
  { id: "peer-review", title: "Đánh giá đồng đẳng", assignmentType: "Đánh giá đồng đẳng", rubricType: "checklist", criteria: ["Phản hồi cụ thể", "Phản hồi tôn trọng", "Có minh chứng", "Đề xuất cải thiện"], objectives: ["Đưa ra phản hồi xây dựng", "Sử dụng tiêu chí để đánh giá"] },
];

export function rubricFromTemplate(template: RubricTemplate): Rubric {
  const rubric = createRubricOutline({ title: `Rubric - ${template.title}`, assignmentType: template.assignmentType, rubricType: template.rubricType, criteriaText: template.criteria.join("\n"), objectives: template.objectives });
  return { ...rubric, metadata: { ...rubric.metadata, templateId: template.id } };
}
