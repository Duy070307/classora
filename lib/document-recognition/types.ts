import type { StructuredExam } from "@/lib/exam-types";

export type RecognitionConfidence = "high" | "medium" | "low";
export type RecognitionPageType = "text_layer" | "scanned_image" | "mixed" | "empty" | "unreadable";
export type RecognitionBlockType =
  | "document_header" | "school_header" | "exam_title" | "metadata" | "instruction"
  | "section_heading" | "question" | "option" | "true_false_statement" | "short_answer_area"
  | "essay_question" | "answer_key" | "paragraph" | "formula" | "table" | "image"
  | "graph" | "geometric_figure" | "page_number" | "footer" | "watermark" | "unknown";

export type RecognitionBoundingBox = { x: number; y: number; width: number; height: number };

export type RecognitionBlock = {
  id: string;
  pageNumber: number;
  type: RecognitionBlockType;
  text: string;
  latex?: string;
  table?: { rows: string[][]; mergedCellHints?: string[] };
  boundingBox: RecognitionBoundingBox;
  confidence: RecognitionConfidence;
  readingOrder: number;
  parentBlockId?: string;
  questionId?: string;
  sourceCrop?: string;
  warnings: string[];
  reviewed: boolean;
  excluded: boolean;
};

export type RecognitionPage = {
  pageNumber: number;
  type: RecognitionPageType;
  textLength: number;
  imageCoverage: number;
  recognitionRequired: boolean;
  warnings: string[];
  blocks: RecognitionBlock[];
  sourceDataUrl?: string;
  adjustedDataUrl?: string;
  rotation: 0 | 90 | 180 | 270;
  status: "pending" | "processing" | "recognized" | "needs_review" | "failed" | "excluded";
  cacheKey?: string;
  extractedText?: string;
};

export type RecognitionDocument = {
  id: string;
  sourceType: "image" | "scanned_pdf" | "mixed_pdf" | "text_pdf";
  sourceFileName: string;
  pageCount: number;
  pages: RecognitionPage[];
  reviewStatus: "draft" | "needs_review" | "confirmed";
  documentHash: string;
  createdAt: string;
  updatedAt: string;
  structuredExamDraft?: StructuredExam;
};

export type PageClassificationInput = {
  pageNumber: number;
  extractedText: string;
  imageObjectCount: number;
  imageCoverage?: number;
  width?: number;
  height?: number;
  textObjectCount?: number;
};
