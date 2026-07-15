import { stableHash } from "@/lib/answer-solutions/hash";
import type { RecognitionBlock, RecognitionBlockType, RecognitionConfidence } from "@/lib/document-recognition/types";

function detectType(line: string): RecognitionBlockType {
  if (/^\s*(PHẦN|PART)\s+[IVX]+/iu.test(line)) return "section_heading";
  if (/^\s*(?:Câu|Question)\s*\d+\s*[.:)]/iu.test(line) || /^\s*\d+\s*[.)]\s+/.test(line)) return "question";
  if (/^\s*[A-D]\s*[.)]\s+/u.test(line)) return "option";
  if (/^\s*(?:[a-d]\s*[.)]|\([a-d]\))\s+/iu.test(line)) return "true_false_statement";
  if (/^(?:ĐÁP ÁN|ANSWER KEY)/iu.test(line)) return "answer_key";
  if (/^(?:SỞ|TRƯỜNG|PHÒNG GIÁO DỤC)/iu.test(line)) return "school_header";
  if (/(?:ĐỀ (?:KIỂM TRA|THI)|BÀI KIỂM TRA)/iu.test(line)) return "exam_title";
  if (/^(?:Môn|Lớp|Thời gian|Mã đề)\s*:/iu.test(line)) return "metadata";
  if (/\\(?:frac|sqrt|int|sum|lim)|\$[^$]+\$/.test(line)) return "formula";
  if (/\|.+\|/.test(line)) return "table";
  if (/^(?:Trang\s+)?\d+\s*\/\s*\d+$/iu.test(line)) return "page_number";
  return "paragraph";
}

function confidenceFor(line: string, type: RecognitionBlockType): RecognitionConfidence {
  if (/[�]/.test(line) || line.trim().length < 2) return "low";
  if (type === "unknown" || type === "formula" && /[{}]/.test(line)) return "medium";
  return "high";
}

export function textToRecognitionBlocks(text: string, pageNumber: number) {
  const lines = text.replace(/\u0000/g, "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 500);
  let currentQuestionId = "";
  return lines.map((line, index): RecognitionBlock => {
    const type = detectType(line);
    const id = `p${pageNumber}-${stableHash(`${index}:${line}`)}`;
    if (type === "question") currentQuestionId = id;
    const confidence = confidenceFor(line, type);
    return {
      id, pageNumber, type, text: line,
      latex: type === "formula" ? line.replace(/^\$|\$$/g, "") : undefined,
      boundingBox: { x: 0.06, y: Math.min(0.94, index / Math.max(lines.length, 1)), width: 0.88, height: Math.min(0.08, 1 / Math.max(lines.length, 1)) },
      confidence, readingOrder: index,
      parentBlockId: ["option", "true_false_statement"].includes(type) ? currentQuestionId || undefined : undefined,
      questionId: ["option", "true_false_statement"].includes(type) ? currentQuestionId || undefined : type === "question" ? id : undefined,
      warnings: confidence === "low" ? ["SOẠN LAB chưa đọc chắc chắn phần này."] : [], reviewed: confidence === "high", excluded: false,
    };
  });
}

export function sortRecognitionBlocks(blocks: RecognitionBlock[]) {
  return [...blocks].sort((left, right) => left.readingOrder - right.readingOrder || left.boundingBox.y - right.boundingBox.y || left.boundingBox.x - right.boundingBox.x);
}

export function rebuildBlockRelations(blocks: RecognitionBlock[]) {
  let questionId = "";
  return sortRecognitionBlocks(blocks).map((block) => {
    if (["question", "essay_question"].includes(block.type)) questionId = block.id;
    if (["option", "true_false_statement", "short_answer_area", "formula", "table", "image", "graph", "geometric_figure"].includes(block.type) && !block.questionId) return { ...block, questionId: questionId || undefined, parentBlockId: block.parentBlockId || questionId || undefined };
    return block;
  });
}

