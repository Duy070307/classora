import type { StructuredExam } from "@/lib/exam-types";

export type AnswerSheetPageSize = "A4_PORTRAIT" | "A4_LANDSCAPE" | "A5" | "A4_TWO_UP";
export type AnswerSheetDensity = "comfortable" | "standard" | "compact";
export type AnswerSheetSourceType = "exam" | "variant" | "variant_set" | "manual";
export type BubbleOption = "A" | "B" | "C" | "D" | "E";

export type AnswerSheetStudentFields = {
  fullName: boolean;
  className: boolean;
  candidateNumber: boolean;
  studentCode: boolean;
  examDate: boolean;
};
export type MultipleChoiceAnswerSection = {
  id: string;
  type: "multiple_choice";
  title: string;
  options: BubbleOption[];
  questions: Array<{ questionId: string; questionNumber: number; originalQuestionId?: string }>;
};

export type TrueFalseAnswerSection = {
  id: string;
  type: "true_false";
  title: string;
  questions: Array<{
    questionId: string;
    questionNumber: number;
    originalQuestionId?: string;
    statements: Array<{ statementId: string; label: string; originalStatementId?: string }>;
  }>;
};

export type ShortAnswerMode = "free" | "structured_numeric" | "final_only";
export type ShortAnswerSection = {
  id: string;
  type: "short_answer";
  title: string;
  mode: ShortAnswerMode;
  questions: Array<{ questionId: string; questionNumber: number; originalQuestionId?: string }>;
  numeric?: { sign: boolean; integerDigits: number; decimalDigits: number; fraction: boolean; unit: boolean };
};

export type EssaySpace = "none" | "short_lines" | "half_page" | "full_page" | "separate_page";
export type EssayAnswerSection = {
  id: string;
  type: "essay";
  title: string;
  space: EssaySpace;
  questions: Array<{ questionId: string; questionNumber: number }>;
};

export type AnswerSheetSection = MultipleChoiceAnswerSection | TrueFalseAnswerSection | ShortAnswerSection | EssayAnswerSection;

export type AnswerSheetTemplate = {
  id?: string;
  ownerId?: string;
  examId?: string;
  variantSetId?: string;
  variantCode?: string;
  title: string;
  subject?: string;
  grade?: string;
  durationMinutes?: number;
  schoolName?: string;
  teacherName?: string;
  pageSize: AnswerSheetPageSize;
  density: AnswerSheetDensity;
  studentFields: AnswerSheetStudentFields;
  sections: AnswerSheetSection[];
  recognition: {
    templateVersion: string;
    templateId: string;
    checksum: string;
    qrEnabled: boolean;
    printedVariantCode: boolean;
    cornerAnchorsEnabled: boolean;
    pageNumbersEnabled: boolean;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    sourceType: AnswerSheetSourceType;
    sourceExam?: StructuredExam;
  };
};

export type BoundingBox = { x: number; y: number; width: number; height: number };
export type RecognitionRegionType = "anchor" | "qr" | "bubble" | "short_answer" | "essay" | "student_field" | "exam_code";

export type RecognitionRegion = {
  id: string;
  type: RecognitionRegionType;
  questionId?: string;
  questionNumber?: number;
  statementId?: string;
  optionValue?: string;
  expectedShape: "circle" | "square" | "rectangle" | "text";
  boundingBox: BoundingBox;
  copyIndex?: number;
};

export type LayoutPrimitive =
  | { kind: "text"; text: string; x: number; y: number; width?: number; size: number; bold?: boolean; align?: "left" | "center" | "right" }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; width?: number; dash?: boolean }
  | { kind: "rect"; x: number; y: number; width: number; height: number; lineWidth?: number; fill?: string; radius?: number }
  | { kind: "circle"; x: number; y: number; radius: number; lineWidth?: number; fill?: string };

export type AnswerSheetPageLayout = {
  pageNumber: number;
  width: number;
  height: number;
  primitives: LayoutPrimitive[];
  recognitionRegions: RecognitionRegion[];
  qrPayload?: string;
};

export type AnswerSheetLayout = {
  templateId: string;
  pages: AnswerSheetPageLayout[];
  warnings: string[];
};

export type BubbleState = "blank" | "selected" | "faint_selected" | "crossed_out" | "multiple_selected" | "unclear" | "damaged";
export type DetectedBubble = {
  regionId: string;
  questionId?: string;
  questionNumber?: number;
  statementId?: string;
  optionValue?: string;
  state: BubbleState;
  confidence: "high" | "medium" | "low";
  inkCoverage: number;
};

export type AnswerSheetScanResult = {
  templateId: string;
  variantCode?: string;
  pageNumber?: number;
  qrValid: boolean;
  alignment: "aligned" | "partial" | "failed";
  bubbles: DetectedBubble[];
  missingPages: number[];
  duplicatePages: number[];
  warnings: string[];
  genericOcrUsed: false;
};

export const DEFAULT_STUDENT_FIELDS: AnswerSheetStudentFields = {
  fullName: true,
  className: true,
  candidateNumber: true,
  studentCode: false,
  examDate: false,
};
