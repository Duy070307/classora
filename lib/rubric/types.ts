export type RubricType = "analytic" | "holistic" | "checklist" | "point_based" | "weighted";
export type RubricInputMode = "manual" | "lesson_plan" | "worksheet" | "saved" | "import";
export type RubricAudience = "teacher" | "student" | "self" | "peer";
export type RubricValidationStatus = "ready" | "warning" | "blocked";

export type RubricLevel = {
  id: string;
  label: string;
  score: number;
  order: number;
};

export type RubricDescriptor = {
  id: string;
  levelId: string;
  text: string;
  teacherNote?: string;
  score?: number;
  scoreRange?: { minimum: number; maximum: number };
  feedbackSuggestion?: string;
};

export type RubricCriterion = {
  id: string;
  title: string;
  description?: string;
  weight: number;
  maxScore: number;
  objectiveIds: string[];
  evidence?: string;
  descriptors: RubricDescriptor[];
  order: number;
  teacherEdited?: boolean;
  required?: boolean;
  teacherNote?: string;
};

export type Rubric = {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
  assignmentType?: string;
  instructions?: string;
  rubricType: RubricType;
  inputMode: RubricInputMode;
  totalScore: number;
  objectives: Array<{ id: string; text: string }>;
  levels: RubricLevel[];
  criteria: RubricCriterion[];
  metadata: {
    sourceDocumentId?: string;
    sourceActivityId?: string;
    sourceTitle?: string;
    createdAt: string;
    updatedAt: string;
    version: "1.0";
    validationStatus?: RubricValidationStatus;
    templateId?: string;
  };
};

export type RubricValidationIssue = {
  code: string;
  severity: "warning" | "error";
  message: string;
  criterionId?: string;
  levelId?: string;
};

export type RubricValidation = {
  status: RubricValidationStatus;
  errors: RubricValidationIssue[];
  warnings: RubricValidationIssue[];
  scoreTotal: number;
  weightTotal: number;
};

export type RubricCriterionAssessment = {
  criterionId: string;
  levelId?: string;
  suggestedScore?: number;
  confirmedScore?: number;
  evidence?: string;
  feedback?: string;
  confidence?: "high" | "medium" | "low";
  teacherConfirmed: boolean;
};

export type RubricAssessment = {
  rubricId: string;
  submissionId: string;
  criteria: RubricCriterionAssessment[];
  totalScore: number;
  maximumScore: number;
  feedback?: string;
  teacherConfirmed: boolean;
  updatedAt: string;
};

export type RubricCoverageItem = {
  objectiveId: string;
  objective: string;
  criterionIds: string[];
  criterionTitles: string[];
  status: "covered" | "missing";
};
