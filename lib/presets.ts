import type { GenericToolInput } from "@/lib/types";

export type ToolPreset<T = GenericToolInput> = { name: string; data: Partial<T> };

export const examPresets = [
  { name: "Kiểm tra 15 phút", data: { examStyle: "Kiểm tra thường", duration: "15 phút", multipleChoiceCount: 6, trueFalseCount: 1, shortAnswerCount: 1, totalScore: 10, recognitionRate: 50, understandingRate: 30, applicationRate: 20, advancedRate: 0, includeAnswers: true, includeRubric: true, includeMatrix: false } },
  { name: "Kiểm tra 45 phút", data: { examStyle: "Kiểm tra thường", duration: "45 phút", multipleChoiceCount: 8, trueFalseCount: 2, shortAnswerCount: 3, totalScore: 10, recognitionRate: 30, understandingRate: 40, applicationRate: 20, advancedRate: 10, includeAnswers: true, includeRubric: true, includeMatrix: true } },
  { name: "Giữa kỳ", data: { examStyle: "Giữa kỳ", duration: "60 phút", multipleChoiceCount: 10, trueFalseCount: 3, shortAnswerCount: 4, totalScore: 10, recognitionRate: 30, understandingRate: 30, applicationRate: 30, advancedRate: 10, includeAnswers: true, includeRubric: true, includeMatrix: true } },
  { name: "Cuối kỳ", data: { examStyle: "Cuối kỳ", duration: "90 phút", multipleChoiceCount: 12, trueFalseCount: 4, shortAnswerCount: 5, totalScore: 10, recognitionRate: 20, understandingRate: 30, applicationRate: 30, advancedRate: 20, includeAnswers: true, includeRubric: true, includeMatrix: true } },
  { name: "Toán 12 THPTQG", data: { examStyle: "THPTQG / tốt nghiệp", subject: "Toán", grade: "12", topic: "Hàm số, mũ - logarit, tích phân, Oxyz và xác suất", duration: "90 phút", examCode: "0101", multipleChoiceCount: 12, trueFalseCount: 4, shortAnswerCount: 6, totalScore: 10, recognitionRate: 20, understandingRate: 30, applicationRate: 30, advancedRate: 20, includeAnswers: true, includeRubric: true, includeMatrix: true, includeSpecification: true } },
  { name: "Lịch sử 12 THPTQG", data: { examStyle: "THPTQG / tốt nghiệp", subject: "Lịch sử", grade: "12", topic: "Việt Nam từ 1919 đến công cuộc Đổi mới", duration: "50 phút", examCode: "0201", multipleChoiceCount: 12, trueFalseCount: 4, shortAnswerCount: 4, totalScore: 10, recognitionRate: 30, understandingRate: 30, applicationRate: 30, advancedRate: 10, includeAnswers: true, includeRubric: true, includeMatrix: true, includeSpecification: true } },
  { name: "Tiếng Anh 10 · 45 phút", data: { examStyle: "Kiểm tra thường", subject: "Tiếng Anh", grade: "10", topic: "Grammar, vocabulary and reading comprehension", duration: "45 phút", examCode: "0301", multipleChoiceCount: 10, trueFalseCount: 2, shortAnswerCount: 3, totalScore: 10, recognitionRate: 30, understandingRate: 40, applicationRate: 20, advancedRate: 10, includeAnswers: true, includeRubric: true, includeMatrix: true, includeSpecification: true } },
  { name: "Ngữ văn 9 · Đọc hiểu", data: { examStyle: "Kiểm tra thường", subject: "Ngữ văn", grade: "9", topic: "Đọc hiểu, nghị luận xã hội và nghị luận văn học", duration: "90 phút", examCode: "0401", multipleChoiceCount: 6, trueFalseCount: 2, shortAnswerCount: 4, totalScore: 10, recognitionRate: 20, understandingRate: 30, applicationRate: 30, advancedRate: 20, includeAnswers: true, includeRubric: true, includeMatrix: true, includeSpecification: true } },
  { name: "Vật lí 11 · Điện học", data: { examStyle: "Kiểm tra thường", subject: "Vật lí", grade: "11", topic: "Dòng điện, định luật Ohm và công suất điện", duration: "45 phút", examCode: "0501", multipleChoiceCount: 8, trueFalseCount: 2, shortAnswerCount: 3, totalScore: 10, recognitionRate: 30, understandingRate: 30, applicationRate: 30, advancedRate: 10, includeAnswers: true, includeRubric: true, includeMatrix: true, includeSpecification: true } },
  { name: "Hóa học 10 · Nguyên tử", data: { examStyle: "Kiểm tra thường", subject: "Hóa học", grade: "10", topic: "Cấu tạo nguyên tử và liên kết hóa học", duration: "45 phút", examCode: "0601", multipleChoiceCount: 8, trueFalseCount: 2, shortAnswerCount: 3, totalScore: 10, recognitionRate: 30, understandingRate: 40, applicationRate: 20, advancedRate: 10, includeAnswers: true, includeRubric: true, includeMatrix: true, includeSpecification: true } },
  { name: "Sinh học 12 · Di truyền", data: { examStyle: "THPTQG / tốt nghiệp", subject: "Sinh học", grade: "12", topic: "Cơ chế di truyền và quy luật Mendel", duration: "50 phút", examCode: "0701", multipleChoiceCount: 12, trueFalseCount: 4, shortAnswerCount: 4, totalScore: 10, recognitionRate: 30, understandingRate: 30, applicationRate: 30, advancedRate: 10, includeAnswers: true, includeRubric: true, includeMatrix: true, includeSpecification: true } },
  { name: "Địa lí 12 · Kinh tế Việt Nam", data: { examStyle: "THPTQG / tốt nghiệp", subject: "Địa lí", grade: "12", topic: "Chuyển dịch cơ cấu và các ngành kinh tế Việt Nam", duration: "50 phút", examCode: "0801", multipleChoiceCount: 12, trueFalseCount: 4, shortAnswerCount: 4, totalScore: 10, recognitionRate: 30, understandingRate: 30, applicationRate: 30, advancedRate: 10, includeAnswers: true, includeRubric: true, includeMatrix: true, includeSpecification: true } }
];

export const worksheetPresets = [
  { name: "Toán 8 · Phương trình bậc nhất", data: { subject: "Toán", grade: "8", topic: "Phương trình bậc nhất một ẩn", objective: "Giải được phương trình bậc nhất và vận dụng vào bài toán thực tế.", exerciseCount: 6, level: "Vừa", style: "Dễ hiểu", includeAnswers: true } },
  { name: "Tiếng Anh 10 · Hiện tại hoàn thành", data: { subject: "Tiếng Anh", grade: "10", topic: "Present perfect tense", objective: "Nhận biết cấu trúc, cách dùng và vận dụng thì hiện tại hoàn thành.", exerciseCount: 6, level: "Vừa", style: "Nhiều ví dụ", includeAnswers: true } },
  { name: "Sinh học 9 · Di truyền cơ bản", data: { subject: "Sinh học", grade: "9", topic: "Các khái niệm di truyền học cơ bản", objective: "Phân biệt gen, alen, kiểu gen, kiểu hình và vận dụng sơ đồ lai đơn giản.", exerciseCount: 6, level: "Vừa", style: "Dễ hiểu", includeAnswers: true } },
  { name: "Phiếu luyện tập cơ bản", data: { exerciseCount: 5, level: "Cơ bản", style: "Dễ hiểu", includeAnswers: true } },
  { name: "Phiếu ôn tập cuối bài", data: { exerciseCount: 8, level: "Vừa", style: "Ngắn gọn", includeAnswers: true } },
  { name: "Phiếu phân hóa 3 mức", data: { exerciseCount: 9, level: "Nâng cao", style: "Nhiều ví dụ", includeAnswers: true, extraRequirements: "Chia bài tập thành 3 mức: cơ bản, vận dụng và nâng cao." } }
];

export const studentCommentPresets = [
  { name: "Học sinh tiến bộ", data: { performance: "Khá", attitude: "có tiến bộ rõ rệt, chủ động hoàn thành nhiệm vụ", strengths: "biết tiếp thu góp ý và điều chỉnh cách học", limitations: "cần duy trì thói quen ôn bài đều đặn", tone: "Nhẹ nhàng" } },
  { name: "Học sinh cần cố gắng", data: { performance: "Cần cố gắng", attitude: "đã tham gia học tập nhưng chưa thật sự chủ động", strengths: "có tinh thần hợp tác khi được hướng dẫn", limitations: "cần tập trung hơn và hoàn thành bài tập đúng hạn", tone: "Nhẹ nhàng" } },
  { name: "Học sinh khá giỏi", data: { performance: "Tốt", attitude: "học tập nghiêm túc và tích cực trao đổi", strengths: "nắm kiến thức chắc, trình bày logic và có khả năng hỗ trợ bạn", limitations: "cần thử sức thêm với nhiệm vụ vận dụng cao", tone: "Chi tiết" } },
  { name: "Học sinh thiếu tập trung", data: { performance: "Trung bình", attitude: "đôi lúc còn mất tập trung trong giờ học", strengths: "tiếp thu được kiến thức khi chú ý", limitations: "cần chuẩn bị bài và tập trung theo từng nhiệm vụ ngắn", tone: "Nhẹ nhàng" } },
  { name: "Nhận xét học bạ", data: { purpose: "Nhận xét học bạ", tone: "Trang trọng" } },
  { name: "Tin nhắn phụ huynh", data: { purpose: "Tin nhắn phụ huynh", tone: "Nhẹ nhàng" } },
  { name: "Nhận xét cuối kỳ", data: { purpose: "Nhận xét cuối kỳ", tone: "Chi tiết" } }
];

export const genericPresets: Record<string, ToolPreset[]> = {
  "/tools/lesson-plan-generator": [
    { name: "Ngữ văn 9 · Nghị luận xã hội", data: { subject: "Ngữ văn", grade: "9", lessonName: "Viết đoạn văn nghị luận xã hội", duration: "90 phút", objectives: "Xác định vấn đề, xây dựng luận điểm và viết đoạn văn có dẫn chứng phù hợp." } },
    { name: "Toán 7 · Tỉ lệ thức", data: { subject: "Toán", grade: "7", lessonName: "Tỉ lệ thức và tính chất", duration: "45 phút", objectives: "Nhận biết tỉ lệ thức, vận dụng tính chất để tìm số chưa biết." } },
    { name: "Lịch sử 12 · Cách mạng tháng Tám", data: { subject: "Lịch sử", grade: "12", lessonName: "Cách mạng tháng Tám năm 1945", duration: "45 phút", objectives: "Phân tích thời cơ, diễn biến, kết quả và ý nghĩa lịch sử." } }
  ],
  "/tools/parent-message-generator": [
    { name: "Nhắc lịch kiểm tra", data: { situation: "Nhắc lịch kiểm tra", mainContent: "lớp sẽ kiểm tra vào tuần tới; đề nghị gia đình nhắc em ôn các nội dung trọng tâm và chuẩn bị đầy đủ dụng cụ" } },
    { name: "Thông báo tiến bộ", data: { situation: "Báo tiến bộ", mainContent: "em đã chủ động hơn trong giờ học, hoàn thành nhiệm vụ đều hơn và cần tiếp tục duy trì thói quen ôn bài" } },
    { name: "Mời họp phụ huynh", data: { situation: "Mời họp phụ huynh", mainContent: "kính mời phụ huynh tham dự buổi họp để trao đổi tình hình học tập và kế hoạch phối hợp trong thời gian tới" } }
  ],
  "/tools/matrix-generator": [
    { name: "Ma trận 40-30-20-10", data: { recognitionRate: 40, understandingRate: 30, applicationRate: 20, advancedRate: 10 } },
    { name: "Ma trận cơ bản 50-30-20", data: { recognitionRate: 50, understandingRate: 30, applicationRate: 20, advancedRate: 0 } }
  ]
};
