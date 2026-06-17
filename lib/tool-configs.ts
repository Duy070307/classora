import {
  checkExam,
  generateAnswerKey,
  generateClassActivity,
  generateDifferentiatedExercises,
  generateLessonPlan,
  generateMatrix,
  generateParentMessage,
  generateQuestionBank,
  generateQuestionVariants,
  generateRubric
} from "@/lib/mock-ai";
import type { GenericToolInput, ToolConfig } from "@/lib/types";

const text = (input: GenericToolInput, key: string, fallback = "") => String(input[key] ?? fallback);

export const expandedToolConfigs: ToolConfig[] = [
  {
    type: "lesson-plan",
    href: "/tools/lesson-plan-generator",
    title: "Tạo giáo án",
    description: "Soạn giáo án có mục tiêu, chuẩn bị, tiến trình dạy học và đánh giá cuối bài.",
    category: "Soạn bài & tài liệu",
    generate: generateLessonPlan,
    makeTitle: (input) => `Giáo án - ${text(input, "subject")} lớp ${text(input, "grade")} - ${text(input, "lessonName")}`,
    fields: [
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Toán" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "8" },
      { name: "lessonName", label: "Tên bài học", type: "text", defaultValue: "Phương trình bậc nhất" },
      { name: "duration", label: "Thời lượng", type: "text", defaultValue: "45 phút" },
      { name: "objectives", label: "Mục tiêu bài học", type: "textarea", defaultValue: "Học sinh hiểu khái niệm, biết giải bài tập cơ bản và trình bày lời giải rõ ràng." },
      { name: "methods", label: "Phương pháp dạy học", type: "textarea", defaultValue: "Gợi mở, thảo luận nhóm, luyện tập cá nhân" },
      { name: "materials", label: "Thiết bị học liệu", type: "textarea", defaultValue: "Sách giáo khoa, bảng phụ, phiếu học tập" },
      { name: "extraRequirements", label: "Yêu cầu thêm", type: "textarea", defaultValue: "" }
    ]
  },
  {
    type: "matrix",
    href: "/tools/matrix-generator",
    title: "Tạo ma trận đề",
    description: "Tạo bảng ma trận, phân bổ câu hỏi và gợi ý thang điểm theo mức độ.",
    category: "Soạn đề & kiểm tra",
    generate: generateMatrix,
    makeTitle: (input) => `Ma trận đề - ${text(input, "subject")} lớp ${text(input, "grade")}`,
    fields: [
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Ngữ văn" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "6" },
      { name: "topic", label: "Chủ đề/chương", type: "text", defaultValue: "Truyện đồng thoại" },
      { name: "duration", label: "Thời gian kiểm tra", type: "text", defaultValue: "45 phút" },
      { name: "totalScore", label: "Tổng điểm", type: "number", defaultValue: 10 },
      { name: "questionCount", label: "Số câu", type: "number", defaultValue: 12 },
      { name: "recognitionRate", label: "Tỉ lệ nhận biết", type: "number", defaultValue: 30 },
      { name: "understandingRate", label: "Tỉ lệ thông hiểu", type: "number", defaultValue: 40 },
      { name: "applicationRate", label: "Tỉ lệ vận dụng", type: "number", defaultValue: 20 },
      { name: "advancedRate", label: "Tỉ lệ vận dụng cao", type: "number", defaultValue: 10 },
      { name: "notes", label: "Ghi chú", type: "textarea", defaultValue: "" }
    ]
  },
  {
    type: "answer-key",
    href: "/tools/answer-key-generator",
    title: "Tạo đáp án và thang điểm",
    description: "Tạo đáp án, lời giải, thang điểm và lưu ý khi chấm.",
    category: "Soạn đề & kiểm tra",
    generate: generateAnswerKey,
    makeTitle: (input) => `Đáp án và thang điểm - ${text(input, "subject")} lớp ${text(input, "grade")}`,
    fields: [
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Toán" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "8" },
      { name: "examContent", label: "Nội dung đề bài", type: "textarea", defaultValue: "Giải bài toán và trình bày lời giải đầy đủ." },
      { name: "totalScore", label: "Tổng điểm", type: "number", defaultValue: 10 },
      { name: "answerStyle", label: "Kiểu đáp án", type: "select", options: ["Ngắn gọn", "Chi tiết", "Có lời giải từng bước"], defaultValue: "Chi tiết" },
      { name: "extraRequirements", label: "Yêu cầu thêm", type: "textarea", defaultValue: "" }
    ]
  },
  {
    type: "rubric",
    href: "/tools/rubric-generator",
    title: "Tạo rubric chấm bài",
    description: "Tạo bảng rubric theo tiêu chí, mức đánh giá, điểm và gợi ý nhận xét.",
    category: "Soạn đề & kiểm tra",
    generate: generateRubric,
    makeTitle: (input) => `Rubric - ${text(input, "subject")} lớp ${text(input, "grade")}`,
    fields: [
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Ngữ văn" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "7" },
      { name: "assignmentType", label: "Loại bài", type: "select", options: ["Bài viết", "Thuyết trình", "Dự án nhóm", "Bài thực hành"], defaultValue: "Bài viết" },
      { name: "criteria", label: "Tiêu chí cần chấm", type: "textarea", defaultValue: "Nội dung, lập luận, trình bày, sáng tạo" },
      { name: "totalScore", label: "Tổng điểm", type: "number", defaultValue: 10 },
      { name: "levelCount", label: "Số mức đánh giá", type: "number", defaultValue: 4 },
      { name: "extraRequirements", label: "Yêu cầu thêm", type: "textarea", defaultValue: "" }
    ]
  },
  {
    type: "parent-message",
    href: "/tools/parent-message-generator",
    title: "Tạo tin nhắn gửi phụ huynh",
    description: "Soạn tin nhắn ngắn, trang trọng và thân thiện để trao đổi với phụ huynh.",
    category: "Chủ nhiệm & phụ huynh",
    generate: generateParentMessage,
    makeTitle: (input) => `Tin nhắn phụ huynh - ${text(input, "studentName", "học sinh")}`,
    fields: [
      { name: "studentName", label: "Tên học sinh", type: "text", defaultValue: "Nguyễn Minh An" },
      { name: "className", label: "Lớp", type: "text", defaultValue: "7A1" },
      { name: "situation", label: "Tình huống", type: "select", options: ["Nhắc học bài", "Báo tiến bộ", "Báo vi phạm", "Nhắc đóng phí", "Mời họp phụ huynh", "Khác"], defaultValue: "Báo tiến bộ" },
      { name: "mainContent", label: "Nội dung chính", type: "textarea", defaultValue: "em đã tích cực hơn trong giờ học nhưng cần chủ động ôn bài ở nhà" },
      { name: "tone", label: "Giọng văn", type: "select", options: ["Nhẹ nhàng", "Trang trọng", "Ngắn gọn", "Cứng rắn nhưng lịch sự"], defaultValue: "Nhẹ nhàng" }
    ]
  },
  {
    type: "question-bank",
    href: "/tools/question-bank-generator",
    title: "Tạo ngân hàng câu hỏi",
    description: "Sinh danh sách câu hỏi theo chủ đề, loại câu hỏi, mức độ và đáp án.",
    category: "Soạn đề & kiểm tra",
    generate: generateQuestionBank,
    makeTitle: (input) => `Ngân hàng câu hỏi - ${text(input, "subject")} lớp ${text(input, "grade")}`,
    fields: [
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Lịch sử" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "8" },
      { name: "topic", label: "Chủ đề", type: "text", defaultValue: "Cách mạng công nghiệp" },
      { name: "questionCount", label: "Số lượng câu hỏi", type: "number", defaultValue: 10 },
      { name: "questionType", label: "Loại câu hỏi", type: "select", options: ["Trắc nghiệm", "Tự luận", "Điền khuyết", "Đúng/Sai"], defaultValue: "Trắc nghiệm" },
      { name: "level", label: "Mức độ", type: "select", options: ["Dễ", "Trung bình", "Khó", "Trộn nhiều mức độ"], defaultValue: "Trộn nhiều mức độ" },
      { name: "includeAnswers", label: "Có đáp án không?", type: "checkbox", defaultValue: true }
    ]
  },
  {
    type: "question-variant",
    href: "/tools/question-variant-generator",
    title: "Tạo biến thể câu hỏi",
    description: "Tạo nhiều phiên bản câu hỏi từ câu gốc, kèm đáp án nếu cần.",
    category: "Soạn đề & kiểm tra",
    generate: generateQuestionVariants,
    makeTitle: (input) => `Biến thể câu hỏi - ${text(input, "subject")} lớp ${text(input, "grade")}`,
    fields: [
      { name: "originalQuestion", label: "Câu hỏi gốc", type: "textarea", defaultValue: "Tính giá trị biểu thức khi x = 2." },
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Toán" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "7" },
      { name: "variantCount", label: "Số biến thể muốn tạo", type: "number", defaultValue: 4 },
      { name: "changeLevel", label: "Mức thay đổi", type: "select", options: ["Chỉ đổi số liệu", "Đổi ngữ cảnh", "Tăng độ khó", "Giảm độ khó"], defaultValue: "Đổi ngữ cảnh" },
      { name: "includeAnswers", label: "Có đáp án không?", type: "checkbox", defaultValue: true }
    ]
  },
  {
    type: "exam-checker",
    href: "/tools/exam-checker",
    title: "Kiểm tra lỗi đề",
    description: "Rà soát lỗi chính tả, câu hỏi mơ hồ, đáp án trùng, tổng điểm, độ khó và ma trận.",
    category: "Soạn đề & kiểm tra",
    generate: checkExam,
    makeTitle: (input) => `Kiểm tra lỗi đề - ${text(input, "subject")} lớp ${text(input, "grade")}`,
    fields: [
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Toán" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "8" },
      { name: "examContent", label: "Nội dung đề kiểm tra", type: "textarea", defaultValue: "Dán đề kiểm tra cần rà soát tại đây." },
      { name: "checks", label: "Những thứ cần kiểm tra", type: "multicheckbox", options: ["Lỗi chính tả", "Câu hỏi mơ hồ", "Đáp án trùng", "Tổng điểm", "Độ khó", "Ma trận đề"], defaultValue: ["Lỗi chính tả", "Câu hỏi mơ hồ", "Tổng điểm"] }
    ]
  },
  {
    type: "activity",
    href: "/tools/activity-generator",
    title: "Tạo hoạt động lớp học",
    description: "Tạo hoạt động lớp học có mục tiêu, cách tổ chức, nhiệm vụ và đánh giá.",
    category: "Soạn bài & tài liệu",
    generate: generateClassActivity,
    makeTitle: (input) => `Hoạt động lớp học - ${text(input, "subject")} lớp ${text(input, "grade")}`,
    fields: [
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Khoa học" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "6" },
      { name: "topic", label: "Chủ đề bài học", type: "text", defaultValue: "Hệ sinh thái" },
      { name: "classSize", label: "Sĩ số lớp", type: "number", defaultValue: 40 },
      { name: "duration", label: "Thời lượng hoạt động", type: "text", defaultValue: "15 phút" },
      { name: "format", label: "Hình thức", type: "select", options: ["Cá nhân", "Cặp đôi", "Nhóm", "Trò chơi"], defaultValue: "Nhóm" },
      { name: "objective", label: "Mục tiêu hoạt động", type: "textarea", defaultValue: "Học sinh hợp tác để vận dụng kiến thức vào nhiệm vụ thực tế." }
    ]
  },
  {
    type: "differentiated-exercises",
    href: "/tools/differentiated-exercises",
    title: "Tạo bài tập phân hóa",
    description: "Tạo bài tập theo mức cơ bản, vừa, nâng cao và gợi ý giao bài theo nhóm học sinh.",
    category: "Soạn bài & tài liệu",
    generate: generateDifferentiatedExercises,
    makeTitle: (input) => `Bài tập phân hóa - ${text(input, "subject")} lớp ${text(input, "grade")}`,
    fields: [
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Toán" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "7" },
      { name: "topic", label: "Chủ đề", type: "text", defaultValue: "Tỉ lệ thức" },
      { name: "exerciseCount", label: "Số bài tập mỗi mức", type: "number", defaultValue: 2 },
      { name: "includeAnswers", label: "Có đáp án không?", type: "checkbox", defaultValue: true }
    ]
  }
];

export const existingToolLinks = [
  {
    category: "Soạn đề & kiểm tra",
    title: "Tạo đề kiểm tra",
    description: "Tạo đề có đáp án, thang điểm và ma trận.",
    href: "/tools/exam-generator"
  },
  {
    category: "Soạn bài & tài liệu",
    title: "Tạo phiếu học tập",
    description: "Chuẩn bị phiếu học tập có bài tập và đáp án.",
    href: "/tools/worksheet-generator"
  },
  {
    category: "Chủ nhiệm & phụ huynh",
    title: "Tạo nhận xét học sinh",
    description: "Viết nhận xét phù hợp nhiều mục đích.",
    href: "/tools/student-comments"
  }
];

export const allToolLinks = [
  ...existingToolLinks,
  ...expandedToolConfigs.map((tool) => ({
    category: tool.category,
    title: tool.title,
    description: tool.description,
    href: tool.href
  }))
];

export const toolCategories = ["Soạn đề & kiểm tra", "Soạn bài & tài liệu", "Chủ nhiệm & phụ huynh"] as const;

export function getToolConfig(href: string) {
  return expandedToolConfigs.find((tool) => tool.href === href);
}
