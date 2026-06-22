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
  { name: "Phiếu luyện tập cơ bản", data: { exerciseCount: 5, level: "Cơ bản", style: "Dễ hiểu", includeAnswers: true } },
  { name: "Phiếu ôn tập cuối bài", data: { exerciseCount: 8, level: "Vừa", style: "Ngắn gọn", includeAnswers: true } },
  { name: "Phiếu phân hóa 3 mức", data: { exerciseCount: 9, level: "Nâng cao", style: "Nhiều ví dụ", includeAnswers: true, extraRequirements: "Chia bài tập thành 3 mức: cơ bản, vận dụng và nâng cao." } }
];

export const studentCommentPresets = [
  { name: "Nhận xét học bạ", data: { purpose: "Nhận xét học bạ", tone: "Trang trọng" } },
  { name: "Tin nhắn phụ huynh", data: { purpose: "Tin nhắn phụ huynh", tone: "Nhẹ nhàng" } },
  { name: "Nhận xét cuối kỳ", data: { purpose: "Nhận xét cuối kỳ", tone: "Chi tiết" } }
];

export const genericPresets: Record<string, ToolPreset[]> = {
  "/tools/matrix-generator": [
    { name: "Ma trận 40-30-20-10", data: { recognitionRate: 40, understandingRate: 30, applicationRate: 20, advancedRate: 10 } },
    { name: "Ma trận cơ bản 50-30-20", data: { recognitionRate: 50, understandingRate: 30, applicationRate: 20, advancedRate: 0 } }
  ]
};
