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
  | "exam-audit"
  | "activity"
  | "differentiated-exercises"
  | "exam-shuffler"
  | "slide-outline"
  | "lesson-summary"
  | "mindmap-outline"
  | "homeroom-plan"
  | "parent-meeting-minutes"
  | "latex-converter"
  | "image-to-latex"
  | "image-to-tikz"
  | "3d-animation"
  | "document-recognition"
  | "bulk-student-comments";

export type GeneratedDocument = {
  id: string;
  title: string;
  type: ToolType;
  content: string;
  createdAt: string;
  folder?: DocumentFolder;
  examMeta?: {
    schoolName?: string;
    teacherName?: string;
    subject?: string;
    grade?: string;
    duration?: string;
    topic?: string;
    examCode?: string;
    examStyle?: string;
  };
  structuredExam?: import("@/lib/exam-types").StructuredExam;
  examVariantSet?: import("@/lib/exam-mixer/types").ExamVariantSet;
  examSolutionSet?: import("@/lib/answer-solutions/types").ExamSolutionSet;
  recognitionDraft?: import("@/lib/document-recognition/types").RecognitionDocument;
  auditMeta?: {
    lastAuditedAt?: string;
    auditStatus: "not_audited" | "needs_fix" | "reviewed" | "ready";
    errorCount: number;
    warningCount: number;
    acceptedWarningIds: string[];
    auditVersion: string;
    contentHash?: string;
  };
  generationMeta?: {
    provider?: string;
    providerRequested?: string;
    fallbackUsed?: boolean;
    fallbackReason?: string;
    retryCount?: number;
    mode?: string;
    model?: string;
    confidence?: "high" | "medium" | "low";
    warnings?: string[];
    hasStandaloneLatex?: boolean;
    standaloneLatex?: string;
    source?: string;
    bankSource?: string;
    subject?: string;
    grade?: string;
    topic?: string;
    questionCount?: number;
    bankQuestionCount?: number;
    aiQuestionCount?: number;
    systemBankCount?: number;
    personalBankCount?: number;
    requestedCount?: number;
    finalCount?: number;
    rejectedCount?: number;
    isPartial?: boolean;
    bankQuestionIds?: string[];
    requestedSectionCounts?: { partI: number; partII: number; partIII: number };
    generatedSectionCounts?: { partI: number; partII: number; partIII: number };
    duplicateRemovedCount?: number;
    allowAiSupplement?: boolean;
    questionType?: string;
    requestContext?: import("@/lib/generation/request-context").GenerationRequestContext;
    requestedTotalScore?: number;
    requestedCognitiveRates?: {
      recognition: number;
      understanding: number;
      application: number;
      advanced: number;
    };
    creationMode?: "manual" | "matrix" | "specification" | "previous_exam" | "lesson_material";
    sourceFileName?: string;
    sourceType?: "matrix" | "specification" | "previous_exam" | "lesson_material" | "unknown";
    normalizedBlueprint?: import("@/lib/exam-source/types").ExamBlueprint;
    sourceContentHash?: string;
    generatedAt?: string;
    auditStatus?: "failed" | "review" | "ready";
    recognitionSourceType?: "image" | "scanned_pdf" | "mixed_pdf" | "text_pdf";
    recognitionPageCount?: number;
    recognizedPageCount?: number;
    recognitionReviewStatus?: "draft" | "needs_review" | "confirmed";
    lowConfidenceBlockCount?: number;
    recognizedQuestionCount?: number;
    recognitionDocumentHash?: string;
  };
};

export type DocumentFolder = "Đề kiểm tra" | "Giáo án" | "Phiếu học tập" | "Nhận xét học sinh" | "Khác";

export type QuestionType = "Trắc nghiệm" | "Tự luận" | "Điền khuyết" | "Trả lời ngắn" | "Đúng/Sai";
export type QuestionDifficulty = "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao";

export type QuestionItem = {
  id: string;
  subject: string;
  grade: string;
  topic: string;
  question: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  answer: string;
  explanation: string;
  createdAt: string;
  bankScope?: "system" | "user";
  userId?: string | null;
  options?: Record<string, string> | null;
  metadata?: {
    bookSeries?: string;
    sourceType?: string;
    contentType?: string;
    generatedBy?: string;
    needsReview?: boolean;
    [key: string]: unknown;
  };
};

export type ExamInput = {
  schoolName: string;
  teacherName: string;
  subject: string;
  grade: string;
  bookSeries: string;
  topic: string;
  duration: string;
  examType: "Trắc nghiệm" | "Tự luận" | "Kết hợp";
  examStyle: "Kiểm tra thường" | "THPTQG / tốt nghiệp" | "Giữa kỳ" | "Cuối kỳ";
  trueFalseCount: number;
  shortAnswerCount: number;
  examCode: string;
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
  bookSeries: string;
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
      helperText?: string;
      defaultValue: string | number;
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: string[];
      helperText?: string;
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
