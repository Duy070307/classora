export type SlidePurpose = "new_lesson" | "review" | "practice" | "solution" | "summary" | "group_activity";
export type SlideSourceType = "manual" | "lesson_plan" | "document" | "saved_content" | "existing_presentation";
export type SlideType = "cover" | "objectives" | "warm_up" | "section" | "content" | "two_column" | "example" | "formula" | "figure" | "table" | "question" | "practice" | "activity" | "summary" | "homework" | "end";
export type SlideLayout = "title_only" | "title_content" | "two_columns" | "image_left" | "image_right" | "full_image" | "formula_focus" | "question_focus" | "table_focus" | "summary_cards";
export type SlideRegion = "title" | "subtitle" | "main" | "left" | "right" | "footer";
export type SlideAlignment = "left" | "center" | "right";

type BlockBase = {
  id: string;
  region: SlideRegion;
  alignment: SlideAlignment;
  style?: { emphasis?: boolean; color?: string; size?: "small" | "normal" | "large" };
  teacherOnly?: boolean;
};

export type TextBlock = BlockBase & { type: "text"; content: string };
export type BulletBlock = BlockBase & { type: "bullets"; content: string[] };
export type FormulaBlock = BlockBase & { type: "formula"; content: string; latex: string; renderedAssetId?: string };
export type ImageBlock = BlockBase & { type: "image"; content: string; assetId: string; alt: string };
export type TikzBlock = BlockBase & { type: "tikz"; content: string; tikz: string; renderedAssetId?: string };
export type TableBlock = BlockBase & { type: "table"; content: string; headers: string[]; rows: string[][] };
export type QuestionBlock = BlockBase & {
  type: "question";
  content: string;
  questionType: "multiple_choice" | "true_false" | "short_response" | "discussion" | "quick_check" | "exit_ticket";
  options?: string[];
  answer?: string;
  explanation?: string;
  answerMode: "teacher_notes" | "answer_slide" | "immediate" | "hidden";
};
export type CalloutBlock = BlockBase & { type: "callout"; content: string; label?: string };
export type ProcessBlock = BlockBase & { type: "process"; content: string; steps: string[] };

export type SlideBlock = TextBlock | BulletBlock | FormulaBlock | ImageBlock | TikzBlock | TableBlock | QuestionBlock | CalloutBlock | ProcessBlock;

export type SlideAsset = {
  id: string;
  kind: "image" | "formula" | "tikz" | "diagram";
  mimeType: string;
  dataUrl?: string;
  width?: number;
  height?: number;
  alt: string;
  sourceReference?: string;
  originalSource?: string;
};

export type Slide = {
  id: string;
  order: number;
  type: SlideType;
  layout: SlideLayout;
  title?: string;
  subtitle?: string;
  purpose?: string;
  expectedContent?: string;
  estimatedDensity?: "low" | "medium" | "high";
  blocks: SlideBlock[];
  teacherNotes?: string;
  hidden?: boolean;
  backgroundStyle?: string;
  transition?: string;
  teacherEdited?: boolean;
  generationStatus?: "outline" | "pending" | "generating" | "ready" | "failed";
  generationError?: string;
};

export type SlideDeck = {
  id?: string;
  ownerId?: string;
  title: string;
  subtitle?: string;
  subject?: string;
  grade?: string;
  topic?: string;
  textbookSeries?: string;
  purpose: SlidePurpose;
  aspectRatio: "16:9" | "4:3";
  themeId: string;
  slides: Slide[];
  assets: SlideAsset[];
  teacherNotesEnabled: boolean;
  metadata: {
    sourceType: SlideSourceType;
    sourceDocumentId?: string;
    sourceTitle?: string;
    sourceContentHash?: string;
    createdAt: string;
    updatedAt: string;
    generationVersion?: string;
    detailLevel?: "summary" | "standard" | "detailed";
    audience?: "primary" | "secondary" | "high_school" | "vocational" | "other";
    exportStatus?: "ready" | "warning" | "blocked";
  };
};

export type SlideGenerationSettings = {
  subject: string;
  grade: string;
  topic: string;
  textbookSeries: string;
  duration: string;
  slideCount: number;
  objectives: string;
  keyKnowledge: string;
  presentationStyle: string;
  additionalNotes: string;
  purpose: SlidePurpose;
  detailLevel: "summary" | "standard" | "detailed";
  audience: "primary" | "secondary" | "high_school" | "vocational" | "other";
  aspectRatio: "16:9" | "4:3";
  themeId: string;
  options: {
    objectives: boolean;
    warmUp: boolean;
    examples: boolean;
    interactiveQuestions: boolean;
    practice: boolean;
    summary: boolean;
    homework: boolean;
    teacherNotes: boolean;
  };
};

export type SlideSource = {
  type: SlideSourceType;
  title: string;
  text: string;
  sourceDocumentId?: string;
  confirmed?: boolean;
  contentHash?: string;
  warnings?: string[];
  extracted?: {
    objectives?: string[];
    stages?: string[];
    slideTitles?: string[];
    notes?: string[];
    tables?: string[][][];
    imageCount?: number;
  };
};

export type ExportIssue = { level: "warning" | "error"; slideId?: string; code: string; message: string };
export type DeckValidation = { status: "ready" | "warning" | "blocked"; issues: ExportIssue[] };
