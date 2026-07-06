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
  personalization: "Cá nhân hóa",
};

export const categoryOrder: ToolCategory[] = [
  "exam-assessment",
  "lesson-materials",
  "homeroom-parent",
  "formula-latex",
  "personalization",
];

export const toolRegistry: ToolMeta[] = [
  { title: "Tạo đề kiểm tra", description: "Tạo đề có đáp án, thang điểm, ma trận và phần dành cho giáo viên.", href: "/tools/exam-generator", category: "exam-assessment", popular: true },
  { title: "Tạo ma trận đề", description: "Lập bảng ma trận, phân bổ câu hỏi và gợi ý thang điểm.", href: "/tools/matrix-generator", category: "exam-assessment", popular: true },
  { title: "Tạo đáp án và thang điểm", description: "Soạn đáp án, lời giải, thang điểm và lưu ý khi chấm.", href: "/tools/answer-key-generator", category: "exam-assessment" },
  { title: "Tạo rubric", description: "Tạo bảng tiêu chí đánh giá với các mức độ và điểm số.", href: "/tools/rubric-generator", category: "exam-assessment", popular: true },
  { title: "Kiểm tra lỗi đề", description: "Rà soát lỗi chính tả, câu hỏi mơ hồ, tổng điểm và độ khó.", href: "/tools/exam-checker", category: "exam-assessment" },
  { title: "Tạo ngân hàng câu hỏi", description: "Sinh danh sách câu hỏi theo chủ đề, loại câu hỏi và mức độ.", href: "/tools/question-bank-generator", category: "exam-assessment" },
  { title: "Ngân hàng câu hỏi", description: "Lưu, lọc, chỉnh sửa và tái sử dụng câu hỏi.", href: "/question-bank", category: "exam-assessment", popular: true },
  { title: "Nhập câu hỏi từ văn bản/CSV", description: "Phân tích câu hỏi đã có và lưu vào ngân hàng câu hỏi.", href: "/tools/import-questions", category: "exam-assessment", badge: "Import" },
  { title: "Tạo biến thể câu hỏi", description: "Tạo nhiều phiên bản câu hỏi từ câu gốc.", href: "/tools/question-variant-generator", category: "exam-assessment" },
  { title: "Trộn mã đề", description: "Trộn câu hỏi, đáp án và tạo bảng đáp án theo mã đề.", href: "/tools/exam-shuffler", category: "exam-assessment", popular: true, badge: "Mới" },

  { title: "Tạo giáo án", description: "Soạn kế hoạch bài dạy có mục tiêu, hoạt động và đánh giá.", href: "/tools/lesson-plan-generator", category: "lesson-materials", popular: true },
  { title: "Tạo phiếu học tập", description: "Chuẩn bị phiếu học tập có bài tập, nhiệm vụ và đáp án.", href: "/tools/worksheet-generator", category: "lesson-materials", popular: true },
  { title: "Tạo hoạt động lớp học", description: "Gợi ý hoạt động có mục tiêu, cách tổ chức và đánh giá.", href: "/tools/activity-generator", category: "lesson-materials" },
  { title: "Tạo bài tập phân hóa", description: "Tạo bài tập theo mức cơ bản, vừa và nâng cao.", href: "/tools/differentiated-exercises", category: "lesson-materials" },
  { title: "Tạo dàn ý slide bài giảng", description: "Tạo cấu trúc slide, bullet, minh họa và câu hỏi nhanh.", href: "/tools/slide-outline-generator", category: "lesson-materials" },
  { title: "Tóm tắt bài học", description: "Tóm tắt kiến thức trọng tâm, từ khóa và câu hỏi ôn tập.", href: "/tools/lesson-summary", category: "lesson-materials" },
  { title: "Tạo sơ đồ tư duy", description: "Tạo outline sơ đồ tư duy dạng text với nhánh chính và từ khóa.", href: "/tools/mindmap-outline", category: "lesson-materials" },

  { title: "Tạo nhận xét học sinh", description: "Viết nhận xét phù hợp nhiều mục đích, dễ chỉnh sửa.", href: "/tools/student-comments", category: "homeroom-parent", popular: true },
  { title: "Nhận xét học sinh hàng loạt", description: "Nhập danh sách và tạo nhận xét cho nhiều học sinh cùng lúc.", href: "/tools/bulk-student-comments", category: "homeroom-parent", popular: true, badge: "CSV" },
  { title: "Tạo tin nhắn phụ huynh", description: "Soạn tin nhắn ngắn, trang trọng và thân thiện.", href: "/tools/parent-message-generator", category: "homeroom-parent", popular: true },
  { title: "Tạo kế hoạch chủ nhiệm", description: "Tạo kế hoạch chủ nhiệm tuần/tháng và phối hợp phụ huynh.", href: "/tools/homeroom-plan", category: "homeroom-parent" },
  { title: "Tạo biên bản họp phụ huynh", description: "Soạn biên bản họp có nội dung, ý kiến và kết luận.", href: "/tools/parent-meeting-minutes", category: "homeroom-parent" },

  { title: "Chuyển công thức sang LaTeX", description: "Chuyển công thức dạng text nhập tay sang LaTeX.", href: "/tools/latex-converter", category: "formula-latex" },
  { title: "Ảnh công thức & hình học → LaTeX/TikZ", description: "Chuyển ảnh công thức thành LaTeX hoặc ảnh hình học thành mã TikZ.", href: "/tools/image-to-latex", category: "formula-latex", popular: true, badge: "Ảnh" },
  { title: "Preview LaTeX", description: "Nhập LaTeX và xem preview công thức bằng KaTeX.", href: "/tools/latex-preview", category: "formula-latex" },

  { title: "Mẫu cá nhân", description: "Tạo, sửa, xóa và copy mẫu tài liệu cá nhân.", href: "/templates", category: "personalization" },
];
