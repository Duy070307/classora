export type ToolCategory =
  | "exam-assessment"
  | "lesson-materials"
  | "homeroom-parent"
  | "formula-latex"
  | "personalization";

export type ToolMeta = {
  title: string;
  description: string;
  href: string;
  category: ToolCategory;
  badge?: string;
  popular?: boolean;
};

export const categoryLabels: Record<ToolCategory, string> = {
  "exam-assessment": "Soạn đề & kiểm tra",
  "lesson-materials": "Soạn bài & tài liệu",
  "homeroom-parent": "Chủ nhiệm & phụ huynh",
  "formula-latex": "Công thức & LaTeX",
  personalization: "Cá nhân hóa"
};

export const categoryOrder: ToolCategory[] = [
  "exam-assessment",
  "lesson-materials",
  "homeroom-parent",
  "formula-latex",
  "personalization"
];

export const toolRegistry: ToolMeta[] = [
  { title: "Ngân hàng câu hỏi", description: "Lưu, lọc, chỉnh sửa và tái sử dụng câu hỏi trên trình duyệt.", href: "/question-bank", category: "exam-assessment", popular: true, badge: "Mới" },
  { title: "Nhập câu hỏi từ văn bản/CSV", description: "Phân tích câu hỏi đã có và lưu vào ngân hàng cục bộ.", href: "/tools/import-questions", category: "exam-assessment", badge: "Import" },
  { title: "Tạo đề kiểm tra", description: "Tạo đề có đáp án, thang điểm và ma trận.", href: "/tools/exam-generator", category: "exam-assessment", popular: true },
  { title: "Tạo ma trận đề", description: "Tạo bảng ma trận, phân bổ câu hỏi và gợi ý thang điểm.", href: "/tools/matrix-generator", category: "exam-assessment", popular: true },
  { title: "Tạo đáp án và thang điểm", description: "Tạo đáp án, lời giải, thang điểm và lưu ý khi chấm.", href: "/tools/answer-key-generator", category: "exam-assessment" },
  { title: "Tạo rubric", description: "Tạo bảng rubric theo tiêu chí, mức đánh giá và điểm.", href: "/tools/rubric-generator", category: "exam-assessment" },
  { title: "Kiểm tra lỗi đề", description: "Rà soát lỗi chính tả, câu hỏi mơ hồ, tổng điểm và độ khó.", href: "/tools/exam-checker", category: "exam-assessment" },
  { title: "Tạo ngân hàng câu hỏi", description: "Sinh danh sách câu hỏi theo chủ đề, loại câu hỏi và mức độ.", href: "/tools/question-bank-generator", category: "exam-assessment" },
  { title: "Tạo biến thể câu hỏi", description: "Tạo nhiều phiên bản câu hỏi từ câu gốc.", href: "/tools/question-variant-generator", category: "exam-assessment" },
  { title: "Trộn mã đề", description: "Mô phỏng trộn câu hỏi, đáp án và tạo bảng đáp án theo mã đề.", href: "/tools/exam-shuffler", category: "exam-assessment", popular: true, badge: "Mới" },

  { title: "Tạo giáo án", description: "Soạn giáo án có mục tiêu, chuẩn bị và tiến trình dạy học.", href: "/tools/lesson-plan-generator", category: "lesson-materials", popular: true },
  { title: "Tạo phiếu học tập", description: "Chuẩn bị phiếu học tập có bài tập và đáp án.", href: "/tools/worksheet-generator", category: "lesson-materials" },
  { title: "Tạo hoạt động lớp học", description: "Tạo hoạt động có mục tiêu, cách tổ chức, nhiệm vụ và đánh giá.", href: "/tools/activity-generator", category: "lesson-materials" },
  { title: "Tạo bài tập phân hóa", description: "Tạo bài tập theo mức cơ bản, vừa và nâng cao.", href: "/tools/differentiated-exercises", category: "lesson-materials" },
  { title: "Tạo dàn ý slide bài giảng", description: "Tạo cấu trúc slide, bullet, minh họa và câu hỏi nhanh.", href: "/tools/slide-outline-generator", category: "lesson-materials" },
  { title: "Tóm tắt bài học", description: "Tóm tắt kiến thức trọng tâm, từ khóa, ví dụ và câu hỏi ôn tập.", href: "/tools/lesson-summary", category: "lesson-materials" },
  { title: "Tạo sơ đồ tư duy", description: "Tạo outline sơ đồ tư duy dạng text với nhánh chính và từ khóa.", href: "/tools/mindmap-outline", category: "lesson-materials" },

  { title: "Tạo nhận xét học sinh", description: "Viết nhận xét phù hợp nhiều mục đích.", href: "/tools/student-comments", category: "homeroom-parent" },
  { title: "Nhận xét học sinh hàng loạt", description: "Nhập CSV và tạo nhận xét cho nhiều học sinh cùng lúc.", href: "/tools/bulk-student-comments", category: "homeroom-parent", popular: true, badge: "CSV" },
  { title: "Tạo tin nhắn phụ huynh", description: "Soạn tin nhắn ngắn, trang trọng và thân thiện.", href: "/tools/parent-message-generator", category: "homeroom-parent" },
  { title: "Tạo kế hoạch chủ nhiệm", description: "Tạo kế hoạch chủ nhiệm tuần/tháng và phối hợp phụ huynh.", href: "/tools/homeroom-plan", category: "homeroom-parent" },
  { title: "Tạo biên bản họp phụ huynh", description: "Soạn biên bản họp có nội dung, ý kiến và kết luận.", href: "/tools/parent-meeting-minutes", category: "homeroom-parent" },

  { title: "Chuyển công thức sang LaTeX", description: "Chuyển công thức dạng text nhập tay sang LaTeX mô phỏng.", href: "/tools/latex-converter", category: "formula-latex" },
  { title: "Preview LaTeX", description: "Nhập LaTeX và xem preview công thức bằng KaTeX.", href: "/tools/latex-preview", category: "formula-latex" },

  { title: "Mẫu cá nhân", description: "Tạo, sửa, xóa và copy mẫu tài liệu cá nhân.", href: "/templates", category: "personalization" },
  { title: "Góp ý", description: "Gửi góp ý beta cho Soạn Lab.", href: "/feedback", category: "personalization" }
];
