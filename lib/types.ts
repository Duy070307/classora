export type ToolType =
  | "exam"
  | "worksheet"
  | "student-comment"
  | "lesson-plan"
  | "matrix"
  | "answer-key"
  | "rubric"
  | "parent-message"
  | "question-bank"
  | "question-variant"
  | "exam-checker"
  | "activity"
  | "differentiated-exercises"
  | "exam-shuffler"
  | "slide-outline"
  | "lesson-summary"
  | "mindmap-outline"
  | "homeroom-plan"
  | "parent-meeting-minutes"
  | "latex-converter"
  | "bulk-student-comments";

export type GeneratedDocument = {
  id: string;
  title: string;
  type: ToolType;
  content: string;
  createdAt: string;
};

export type ExamInput = {
  schoolName: string;
  teacherName: string;
  subject: string;
  grade: string;
  topic: string;
  duration: string;
  examType: "Trắc nghiệm" | "Tự luận" | "Kết hợp";
  multipleChoiceCount: number;
  essayCount: number;
  totalScore: number;
  level: "Dễ" | "Trung bình" | "Khó";
  recognitionRate: number;
  understandingRate: number;
  applicationRate: number;
  advancedRate: number;
  includeAnswers: boolean;
  includeRubric: boolean;
  includeMatrix: boolean;
  includeSpecification: boolean;
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

export type GenericToolInput = Record<string, string | number | boolean | string[]>;

export type ToolField =
  | {
      name: string;
      label: string;
      type: "text" | "number" | "textarea";
      placeholder?: string;
      defaultValue: string | number;
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: string[];
      defaultValue: string;
    }
  | {
      name: string;
      label: string;
      type: "checkbox";
      defaultValue: boolean;
    }
  | {
      name: string;
      label: string;
      type: "multicheckbox";
      options: string[];
      defaultValue: string[];
    };

export type ToolConfig = {
  type: ToolType;
  href: string;
  title: string;
  description: string;
  category: string;
  fields: ToolField[];
  generate: (input: GenericToolInput) => Promise<string>;
  makeTitle: (input: GenericToolInput) => string;
  sampleInput?: GenericToolInput;
};
