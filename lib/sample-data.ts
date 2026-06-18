"use client";

import type { ExamInput, GenericToolInput, QuestionItem, StudentCommentInput, WorksheetInput } from "@/lib/types";
import type { TemplateItem } from "@/lib/templates";
import type { DocumentSettings } from "@/lib/document-settings";
import { STORAGE_KEYS, clearClassoraStorage, writeJson } from "@/lib/storage";

export const sampleExamInput: ExamInput = {
  schoolName: "Trường THCS Soạn Lab",
  teacherName: "Nguyễn Thị Lan",
  subject: "Toán",
  grade: "8",
  topic: "Phương trình bậc nhất một ẩn",
  duration: "45 phút",
  examType: "Kết hợp",
  multipleChoiceCount: 8,
  essayCount: 3,
  totalScore: 10,
  level: "Trung bình",
  recognitionRate: 30,
  understandingRate: 40,
  applicationRate: 20,
  advancedRate: 10,
  includeAnswers: true,
  includeRubric: true,
  includeMatrix: true,
  includeSpecification: true,
  extraRequirements: "Có một câu vận dụng gắn với tình huống thực tế."
};

export const sampleWorksheetInput: WorksheetInput = {
  subject: "Ngữ văn",
  grade: "6",
  topic: "Truyện đồng thoại",
  objective: "Học sinh nhận biết nhân vật, chi tiết tiêu biểu và rút ra bài học từ văn bản.",
  exerciseCount: 5,
  level: "Vừa",
  includeAnswers: true,
  style: "Dễ hiểu",
  extraRequirements: "Có chỗ trống đủ để học sinh trình bày."
};

export const sampleStudentCommentInput: StudentCommentInput = {
  studentName: "Nguyễn Minh An",
  className: "7A1",
  role: "Giáo viên chủ nhiệm",
  performance: "Khá",
  attitude: "tích cực tham gia hoạt động và hợp tác với bạn",
  strengths: "có ý thức học tập, trình bày vở cẩn thận",
  limitations: "cần kiểm tra kỹ bài làm trước khi nộp",
  tone: "Nhẹ nhàng",
  purpose: "Nhận xét cuối kỳ"
};

export const sampleLessonPlanInput: GenericToolInput = {
  subject: "Toán",
  grade: "8",
  lessonName: "Phương trình bậc nhất một ẩn",
  duration: "45 phút",
  objectives: "Học sinh nhận biết phương trình bậc nhất, giải được bài tập cơ bản và vận dụng vào tình huống thực tế.",
  methods: "Gợi mở, thảo luận nhóm, luyện tập cá nhân",
  materials: "Sách giáo khoa, bảng phụ, phiếu học tập",
  extraRequirements: "Có hoạt động kiểm tra nhanh cuối bài."
};

export const sampleMatrixInput: GenericToolInput = {
  subject: "Ngữ văn",
  grade: "6",
  topic: "Truyện đồng thoại",
  duration: "45 phút",
  totalScore: 10,
  questionCount: 12,
  recognitionRate: 30,
  understandingRate: 40,
  applicationRate: 20,
  advancedRate: 10,
  notes: "Ưu tiên đọc hiểu và một câu vận dụng viết đoạn ngắn."
};

export const sampleAnswerKeyInput: GenericToolInput = {
  subject: "Toán",
  grade: "8",
  examContent: "Câu 1. Kết quả của 2x + 3 = 7 là?\nA. x = 1\nB. x = 2\nC. x = 3\nD. x = 4\nĐáp án: B\n\nCâu 2. Giải phương trình 3x - 6 = 0.",
  totalScore: 10,
  answerStyle: "Có lời giải từng bước",
  extraRequirements: "Thang điểm rõ từng ý."
};

export const sampleExamShufflerInput: GenericToolInput = {
  examName: "Đề kiểm tra 15 phút",
  subject: "Toán",
  grade: "8",
  codeCount: 4,
  questions: "Câu 1. Kết quả của 2 + 3 là?\nA. 4\nB. 5\nC. 6\nD. 7\nĐáp án: B\n\nCâu 2. Số nào là số chẵn?\nA. 3\nB. 5\nC. 8\nD. 9\nĐáp án: C",
  shuffleQuestions: true,
  shuffleAnswers: true,
  notes: "Tạo bốn mã đề để kiểm thử."
};

export const sampleImportQuestionsText = `Câu 1. Phương trình nào là phương trình bậc nhất một ẩn?
A. 2x + 3 = 0
B. x² + 1 = 0
C. 1/x = 2
D. 0x = 5
Đáp án: A

Câu 2. Giải phương trình 3x - 6 = 0.
Đáp án: x = 2`;

export const sampleBulkCommentsCsv = `Họ tên,Lớp,Mức học tập,Thái độ,Ưu điểm,Hạn chế,Mục đích
Nguyễn Minh An,7A1,Khá,Tích cực,Có ý thức học tập,Cần cẩn thận hơn khi làm bài,Tin nhắn phụ huynh
Trần Gia Bảo,7A1,Trung bình,Ít phát biểu,Có cố gắng,Cần chủ động học bài hơn,Nhận xét cuối kỳ`;

export const sampleQuestions: QuestionItem[] = [
  { id: "sample-q1", subject: "Toán", grade: "8", topic: "Phương trình", question: "Phương trình nào là phương trình bậc nhất một ẩn?\nA. 2x + 3 = 0\nB. x² + 1 = 0\nC. 1/x = 2\nD. 0x = 5", type: "Trắc nghiệm", difficulty: "Nhận biết", answer: "A", explanation: "Phương trình có dạng ax + b = 0 với a khác 0.", createdAt: new Date().toISOString() },
  { id: "sample-q2", subject: "Ngữ văn", grade: "6", topic: "Truyện đồng thoại", question: "Nêu hai đặc điểm của nhân vật trong truyện đồng thoại.", type: "Tự luận", difficulty: "Thông hiểu", answer: "Nhân vật thường là loài vật được nhân hóa và mang đặc điểm con người.", explanation: "Chấp nhận cách diễn đạt tương đương.", createdAt: new Date().toISOString() }
];

export const sampleTemplates: TemplateItem[] = [
  { id: "sample-template-exam", name: "Mẫu đề kiểm tra của trường", type: "Đề kiểm tra", content: "{{ten_truong}}\nTổ/Bộ môn: {{to_bo_mon}}\nGiáo viên: {{ten_giao_vien}}\nNăm học: {{nam_hoc}}\n\nĐỀ KIỂM TRA\nMôn: {{mon_hoc}} - Lớp: {{lop}}\nChủ đề: {{chu_de}}\nThời gian: {{thoi_gian}}\n\nHọ và tên: ....................................  Lớp: ............\n\n{{noi_dung}}", notes: "Mẫu demo có header trường, tổ bộ môn và dòng thông tin học sinh.", updatedAt: new Date().toISOString() },
  { id: "sample-template-worksheet", name: "Mẫu phiếu học tập", type: "Phiếu học tập", content: "{{ten_truong}}\nPHIẾU HỌC TẬP - {{mon_hoc}} {{lop}}\nChủ đề: {{chu_de}}\n\nHọ tên: .................................... Lớp: ............\n\nMục tiêu:\n{{ghi_chu}}\n\n{{noi_dung}}\n\nKhu vực trả lời:\n................................................................................", notes: "Dùng để kiểm thử placeholder phiếu học tập.", updatedAt: new Date().toISOString() },
  { id: "sample-template-comments", name: "Mẫu nhận xét học sinh", type: "Nhận xét học sinh", content: "{{ten_truong}}\nGiáo viên: {{ten_giao_vien}}\n\nNHẬN XÉT HỌC SINH\nHọc sinh/Lớp: {{lop}}\n\n{{noi_dung}}\n\nGợi ý hỗ trợ:\n{{ghi_chu}}", notes: "Mẫu nhận xét có thể dùng cho cá nhân hoặc nhận xét hàng loạt.", updatedAt: new Date().toISOString() }
];

export const sampleSettings: DocumentSettings = {
  schoolName: "Trường THCS Soạn Lab",
  teacherName: "Nguyễn Thị Lan",
  department: "Tổ Toán - Tin",
  schoolYear: "2026-2027",
  fontFamily: "Times New Roman",
  fontSize: "13"
};

export function loadSampleQuestionBank() { return writeJson(STORAGE_KEYS.questions, sampleQuestions); }
export function loadSampleTemplates() { return writeJson(STORAGE_KEYS.templates, sampleTemplates); }
export function loadSampleSettings() { return writeJson(STORAGE_KEYS.settings, sampleSettings); }
export function clearAllDemoData() { return clearClassoraStorage(); }
export function resetDemoData() {
  clearAllDemoData();
  return loadSampleQuestionBank() && loadSampleTemplates() && loadSampleSettings();
}
