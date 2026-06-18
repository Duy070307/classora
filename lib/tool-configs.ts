import {
  checkExam,
  convertTextToLatex,
  generateAnswerKey,
  generateClassActivity,
  generateDifferentiatedExercises,
  generateHomeroomPlan,
  generateLessonPlan,
  generateLessonSummary,
  generateMindmapOutline,
  generateMatrix,
  generateParentMeetingMinutes,
  generateParentMessage,
  generateQuestionBank,
  generateQuestionVariants,
  generateRubric,
  generateSlideOutline,
  shuffleExam
} from "@/lib/mock-ai";
import type { GenericToolInput, ToolConfig } from "@/lib/types";
import { sampleAnswerKeyInput, sampleExamShufflerInput, sampleLessonPlanInput, sampleMatrixInput } from "@/lib/sample-data";

const text = (input: GenericToolInput, key: string, fallback = "") => String(input[key] ?? fallback);

export const expandedToolConfigs: ToolConfig[] = [
  {
    type: "lesson-plan",
    href: "/tools/lesson-plan-generator",
    title: "Tạo giáo án",
    description: "Soạn giáo án có mục tiêu, chuẩn bị, tiến trình dạy học và đánh giá cuối bài.",
    category: "Soạn bài & tài liệu",
    sampleInput: sampleLessonPlanInput,
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
    sampleInput: sampleMatrixInput,
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
    sampleInput: sampleAnswerKeyInput,
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

export const batch2ToolConfigs: ToolConfig[] = [
  {
    type: "exam-shuffler",
    href: "/tools/exam-shuffler",
    title: "Trộn mã đề",
    description: "Mô phỏng trộn thứ tự câu hỏi, đáp án và tạo bảng đáp án theo từng mã đề.",
    category: "Soạn đề & kiểm tra",
    generate: shuffleExam,
    makeTitle: (input) => `Trộn mã đề - ${text(input, "examName", "Đề kiểm tra")}`,
    sampleInput: sampleExamShufflerInput,
    fields: [
      { name: "examName", label: "Tên đề kiểm tra", type: "text", defaultValue: "Đề kiểm tra giữa kỳ" },
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Toán" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "8" },
      { name: "codeCount", label: "Số mã đề muốn tạo", type: "number", defaultValue: 4 },
      { name: "questions", label: "Nội dung câu hỏi trắc nghiệm", type: "textarea", defaultValue: "Câu 1. Kết quả của 2 + 3 là?\nA. 4\nB. 5\nC. 6\nD. 7\nĐáp án: B\n\nCâu 2. Số nào là số chẵn?\nA. 3\nB. 5\nC. 8\nD. 9\nĐáp án: C" },
      { name: "shuffleQuestions", label: "Có trộn thứ tự câu không?", type: "checkbox", defaultValue: true },
      { name: "shuffleAnswers", label: "Có trộn thứ tự đáp án A/B/C/D không?", type: "checkbox", defaultValue: true },
      { name: "notes", label: "Ghi chú", type: "textarea", defaultValue: "" }
    ]
  },
  {
    type: "slide-outline",
    href: "/tools/slide-outline-generator",
    title: "Tạo dàn ý slide bài giảng",
    description: "Tạo cấu trúc slide, bullet, gợi ý minh họa, tương tác và câu hỏi nhanh.",
    category: "Soạn bài & tài liệu",
    generate: generateSlideOutline,
    makeTitle: (input) => `Dàn ý slide - ${text(input, "subject")} lớp ${text(input, "grade")} - ${text(input, "lessonName")}`,
    fields: [
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Sinh học" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "7" },
      { name: "lessonName", label: "Tên bài học", type: "text", defaultValue: "Trao đổi chất ở sinh vật" },
      { name: "duration", label: "Thời lượng", type: "text", defaultValue: "45 phút" },
      { name: "slideCount", label: "Số slide mong muốn", type: "number", defaultValue: 8 },
      { name: "style", label: "Phong cách", type: "select", options: ["Ngắn gọn", "Sinh động", "Nhiều ví dụ", "Ôn tập kiểm tra"], defaultValue: "Sinh động" },
      { name: "mainContent", label: "Nội dung chính", type: "textarea", defaultValue: "Khái niệm, vai trò và ví dụ về trao đổi chất." },
      { name: "extraRequirements", label: "Yêu cầu thêm", type: "textarea", defaultValue: "" }
    ]
  },
  {
    type: "lesson-summary",
    href: "/tools/lesson-summary",
    title: "Tóm tắt bài học",
    description: "Tóm tắt kiến thức trọng tâm, từ khóa, ví dụ, câu hỏi ôn tập và cách học.",
    category: "Soạn bài & tài liệu",
    generate: generateLessonSummary,
    makeTitle: (input) => `Tóm tắt bài học - ${text(input, "subject")} lớp ${text(input, "grade")} - ${text(input, "topic")}`,
    fields: [
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Địa lí" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "6" },
      { name: "topic", label: "Tên bài/chủ đề", type: "text", defaultValue: "Khí hậu và thời tiết" },
      { name: "lessonContent", label: "Nội dung bài học", type: "textarea", defaultValue: "Nội dung chính của bài học gồm khái niệm, đặc điểm và ví dụ thực tế." },
      { name: "length", label: "Độ dài", type: "select", options: ["Rất ngắn", "Vừa", "Chi tiết"], defaultValue: "Vừa" },
      { name: "audience", label: "Đối tượng", type: "select", options: ["Học sinh yếu", "Học sinh trung bình", "Học sinh khá giỏi"], defaultValue: "Học sinh trung bình" },
      { name: "includeQuestions", label: "Có câu hỏi ôn tập không?", type: "checkbox", defaultValue: true }
    ]
  },
  {
    type: "mindmap-outline",
    href: "/tools/mindmap-outline",
    title: "Tạo sơ đồ tư duy",
    description: "Tạo outline sơ đồ tư duy dạng text với nhánh chính, nhánh phụ và từ khóa.",
    category: "Soạn bài & tài liệu",
    generate: generateMindmapOutline,
    makeTitle: (input) => `Sơ đồ tư duy - ${text(input, "centralTopic", "Chủ đề")}`,
    fields: [
      { name: "subject", label: "Môn học", type: "text", defaultValue: "Ngữ văn" },
      { name: "grade", label: "Lớp", type: "text", defaultValue: "6" },
      { name: "centralTopic", label: "Chủ đề trung tâm", type: "text", defaultValue: "Truyện truyền thuyết" },
      { name: "mainContent", label: "Nội dung chính", type: "textarea", defaultValue: "Khái niệm, đặc điểm, nhân vật, sự kiện, ý nghĩa." },
      { name: "branchCount", label: "Số nhánh chính", type: "number", defaultValue: 5 },
      { name: "style", label: "Phong cách", type: "select", options: ["Ngắn gọn", "Dễ nhớ", "Chi tiết"], defaultValue: "Dễ nhớ" },
      { name: "includeExamples", label: "Có thêm ví dụ không?", type: "checkbox", defaultValue: true }
    ]
  },
  {
    type: "homeroom-plan",
    href: "/tools/homeroom-plan",
    title: "Tạo kế hoạch chủ nhiệm",
    description: "Tạo kế hoạch chủ nhiệm tuần/tháng, biện pháp thực hiện và phối hợp phụ huynh.",
    category: "Chủ nhiệm & phụ huynh",
    generate: generateHomeroomPlan,
    makeTitle: (input) => `Kế hoạch chủ nhiệm - ${text(input, "className")} - ${text(input, "period")}`,
    fields: [
      { name: "className", label: "Lớp", type: "text", defaultValue: "7A1" },
      { name: "period", label: "Tuần/tháng", type: "text", defaultValue: "Tuần 12" },
      { name: "mainGoal", label: "Mục tiêu chính", type: "textarea", defaultValue: "Ổn định nề nếp, nâng cao ý thức học tập và theo dõi học sinh cần hỗ trợ." },
      { name: "classSituation", label: "Tình hình lớp", type: "textarea", defaultValue: "Lớp học tương đối ổn định, còn vài học sinh quên bài tập." },
      { name: "issues", label: "Vấn đề cần theo dõi", type: "textarea", defaultValue: "Chuyên cần, bài tập về nhà, nề nếp đầu giờ." },
      { name: "activities", label: "Hoạt động dự kiến", type: "textarea", defaultValue: "Sinh hoạt lớp, tuyên dương học sinh tiến bộ, nhắc nhở nhóm cần hỗ trợ." },
      { name: "notes", label: "Ghi chú", type: "textarea", defaultValue: "" }
    ]
  },
  {
    type: "parent-meeting-minutes",
    href: "/tools/parent-meeting-minutes",
    title: "Tạo biên bản họp phụ huynh",
    description: "Soạn biên bản họp phụ huynh có thành phần, nội dung, ý kiến và kết luận.",
    category: "Chủ nhiệm & phụ huynh",
    generate: generateParentMeetingMinutes,
    makeTitle: (input) => `Biên bản họp phụ huynh - ${text(input, "className")}`,
    fields: [
      { name: "className", label: "Tên lớp", type: "text", defaultValue: "7A1" },
      { name: "meetingTime", label: "Thời gian họp", type: "text", defaultValue: "19:30 ngày 20/06/2026" },
      { name: "location", label: "Địa điểm", type: "text", defaultValue: "Phòng học lớp 7A1" },
      { name: "homeroomTeacher", label: "Giáo viên chủ nhiệm", type: "text", defaultValue: "Nguyễn Thị Lan" },
      { name: "parentCount", label: "Số phụ huynh tham dự", type: "number", defaultValue: 38 },
      { name: "mainContent", label: "Nội dung chính", type: "textarea", defaultValue: "Thông báo tình hình học tập, rèn luyện và kế hoạch cuối kỳ." },
      { name: "agreements", label: "Các khoản cần thống nhất", type: "textarea", defaultValue: "Quỹ lớp, hoạt động trải nghiệm, phối hợp ôn tập." },
      { name: "parentOpinions", label: "Ý kiến phụ huynh", type: "textarea", defaultValue: "Phụ huynh thống nhất phối hợp nhắc học sinh tự học ở nhà." },
      { name: "conclusion", label: "Kết luận", type: "textarea", defaultValue: "Cuộc họp thống nhất các nội dung đã trao đổi." }
    ]
  },
  {
    type: "latex-converter",
    href: "/tools/latex-converter",
    title: "Chuyển công thức sang LaTeX",
    description: "Chuyển công thức dạng text nhập tay sang LaTeX inline/display mô phỏng.",
    category: "Công thức & LaTeX",
    generate: convertTextToLatex,
    makeTitle: () => "Công thức LaTeX",
    fields: [
      { name: "formulaText", label: "Nội dung công thức dạng text", type: "textarea", defaultValue: "sqrt(x) + a/b = pi" },
      { name: "subject", label: "Môn học", type: "select", options: ["Toán", "Lý", "Hóa", "Khác"], defaultValue: "Toán" },
      { name: "outputType", label: "Kiểu output", type: "select", options: ["Inline LaTeX", "Display LaTeX", "Cả hai"], defaultValue: "Cả hai" },
      { name: "extraRequirements", label: "Yêu cầu thêm", type: "textarea", defaultValue: "" }
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
  })),
  ...batch2ToolConfigs.map((tool) => ({
    category: tool.category,
    title: tool.title,
    description: tool.description,
    href: tool.href
  })),
  {
    category: "Công thức & LaTeX",
    title: "Preview LaTeX",
    description: "Nhập LaTeX và xem preview công thức bằng KaTeX nếu có thể.",
    href: "/tools/latex-preview"
  },
  {
    category: "Cá nhân hóa",
    title: "Mẫu cá nhân",
    description: "Tạo, sửa, xóa, copy các mẫu tài liệu cá nhân lưu bằng localStorage.",
    href: "/templates"
  },
  {
    category: "Cá nhân hóa",
    title: "Góp ý",
    description: "Gửi góp ý beta cho Soạn Lab bằng cách sao chép nội dung phản hồi.",
    href: "/feedback"
  }
];

export const toolCategories = ["Soạn đề & kiểm tra", "Soạn bài & tài liệu", "Chủ nhiệm & phụ huynh", "Công thức & LaTeX", "Cá nhân hóa"] as const;

export function getToolConfig(href: string) {
  return [...expandedToolConfigs, ...batch2ToolConfigs].find((tool) => tool.href === href);
}
