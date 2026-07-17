import type { QuestionDifficulty } from "@/lib/types";

export type CanonicalQuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "essay"
  | "fill_blank"
  | "matching"
  | "ordering"
  | "table_completion";

export type QuestionQualityStatus = "valid" | "needs_review" | "invalid";
export type QuestionReviewStatus = "draft" | "teacher_confirmed" | "verified";
export type CognitiveLevel =
  "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao";

export type QuestionOption = { id: string; label: string; text: string };
export type TrueFalseStatement = {
  id: string;
  label: string;
  text: string;
  answer: boolean;
};
export type MatchingPair = { id: string; left: string; right: string };
export type TableAnswer = { row: number; column: number; value: string };
export type QuestionVisual = {
  id: string;
  type: "image" | "formula" | "table" | "tikz";
  content?: string;
  alt?: string;
};

export type QuestionBankItem = {
  schemaVersion: 2;
  id: string;
  ownerId?: string | null;
  scope: "system" | "user";
  type: CanonicalQuestionType;
  prompt: string;
  instructions: string;
  subject: string;
  grade: string;
  topic: string;
  subtopic: string;
  difficulty: QuestionDifficulty;
  cognitiveLevel: CognitiveLevel;
  learningOutcome: string;
  bookSeries: string;
  tags: string[];
  score: number;
  options: QuestionOption[];
  correctOptionIds: string[];
  trueFalseStatements: TrueFalseStatement[];
  answer: string;
  acceptedAnswers: string[];
  unit: string;
  tolerance?: number;
  essayRubric: Array<{
    id: string;
    criterion: string;
    maxScore: number;
    guidance: string;
  }>;
  matchingPairs: MatchingPair[];
  orderingItems: Array<{ id: string; text: string; order: number }>;
  tableAnswers: TableAnswer[];
  explanation: string;
  visuals: QuestionVisual[];
  source: {
    type: string;
    name?: string;
    referenceId?: string;
  };
  quality: {
    status: QuestionQualityStatus;
    reviewStatus: QuestionReviewStatus;
    issues: string[];
    ignoredIssueCodes: string[];
    checkedAt?: string;
  };
  usage: {
    count: number;
    lastUsedAt?: string;
    documentIds: string[];
    lastResultStatus?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type QuestionCollection = {
  id: string;
  title: string;
  description: string;
  questionIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type QuestionFilters = {
  query?: string;
  scope?: "all" | "system" | "user";
  subject?: string;
  grade?: string;
  topic?: string;
  subtopic?: string;
  type?: CanonicalQuestionType | "";
  difficulty?: QuestionDifficulty | "";
  cognitiveLevel?: CognitiveLevel | "";
  bookSeries?: string;
  quality?: QuestionQualityStatus | "";
  source?: string;
  usage?: "all" | "used" | "unused";
};

export type QuestionSort =
  | "newest"
  | "oldest"
  | "most_used"
  | "least_used"
  | "difficulty"
  | "topic"
  | "quality";

export type QuestionAuditIssue = {
  code: string;
  severity: "error" | "warning";
  message: string;
};

export type DuplicateMatch = {
  leftId: string;
  rightId: string;
  kind: "exact" | "reordered_options" | "near";
  similarity: number;
};

export type DuplicateCluster = {
  id: string;
  questionIds: string[];
  kind: DuplicateMatch["kind"];
  confidence: number;
  matches: DuplicateMatch[];
};

export type SmartSetConfig = {
  subject?: string;
  grade?: string;
  topics: string[];
  types: CanonicalQuestionType[];
  count: number;
  difficulties?: Partial<Record<QuestionDifficulty, number>>;
  cognitiveLevels?: Partial<Record<CognitiveLevel, number>>;
  includeTags?: string[];
  excludeTags?: string[];
  maximumUsage?: number;
  excludeRecentlyUsedDays?: number;
  seed: string;
};

export type SmartSetResult = {
  selected: QuestionBankItem[];
  available: number;
  requested: number;
  shortages: string[];
};

export const QUESTION_TYPE_LABELS: Record<CanonicalQuestionType, string> = {
  multiple_choice: "Trắc nghiệm nhiều lựa chọn",
  true_false: "Đúng/Sai theo mệnh đề",
  short_answer: "Trả lời ngắn / số",
  essay: "Tự luận",
  fill_blank: "Điền khuyết",
  matching: "Ghép đôi",
  ordering: "Sắp xếp",
  table_completion: "Hoàn thành bảng",
};

export const QUESTION_TYPES = Object.keys(
  QUESTION_TYPE_LABELS,
) as CanonicalQuestionType[];
