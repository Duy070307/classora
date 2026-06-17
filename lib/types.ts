export type ToolType = "exam" | "worksheet" | "student-comment";

export type GeneratedDocument = {
  id: string;
  title: string;
  type: ToolType;
  content: string;
  createdAt: string;
};

export type ExamInput = {
  subject: string;
  grade: string;
  topic: string;
  duration: string;
  examType: "Trắc nghiệm" | "Tự luận" | "Kết hợp";
  multipleChoiceCount: number;
  essayCount: number;
  totalScore: number;
  level: "Dễ" | "Trung bình" | "Khó";
  includeAnswers: boolean;
  includeRubric: boolean;
  includeMatrix: boolean;
  extraRequirements: string;
};

export type WorksheetInput = {
  subject: string;
  grade: string;
  topic: string;
  objective: string;
  exerciseCount: number;
  level: "Cơ bản" | "Vừa" | "Nâng cao";
  includeAnswers: boolean;
  style: "Ngắn gọn" | "Dễ hiểu" | "Nhiều ví dụ";
  extraRequirements: string;
};

export type StudentCommentInput = {
  studentName: string;
  className: string;
  role: "Giáo viên bộ môn" | "Giáo viên chủ nhiệm";
  performance: "Tốt" | "Khá" | "Trung bình" | "Cần cố gắng";
  attitude: string;
  strengths: string;
  limitations: string;
  tone: "Nhẹ nhàng" | "Trang trọng" | "Ngắn gọn" | "Chi tiết";
  purpose: "Nhận xét học bạ" | "Tin nhắn phụ huynh" | "Nhận xét cuối kỳ";
};
