import { parseExamText } from "@/lib/exam-audit/normalize";
import { rebuildBlockRelations, sortRecognitionBlocks } from "@/lib/document-recognition/layout";
import type { RecognitionBlock, RecognitionDocument } from "@/lib/document-recognition/types";
import { finalizationIssues, recognitionSummary } from "@/lib/document-recognition/validation";
import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { QuestionDifficulty, QuestionItem, QuestionType } from "@/lib/types";

function blockText(block: RecognitionBlock) {
  if (block.type === "formula" && block.latex) return `$${block.latex}$`;
  if (block.type === "table" && block.table) return block.table.rows.map((row) => row.join(" | ")).join("\n");
  return block.text;
}

export function recognitionText(document: RecognitionDocument) {
  return document.pages.filter((page) => page.status !== "excluded").flatMap((page) => sortRecognitionBlocks(page.blocks).filter((block) => !block.excluded).map(blockText)).join("\n");
}

function nearestQuestion(exam: StructuredExam, block: RecognitionBlock) {
  const questions = exam.parts.flatMap((part) => part.questions);
  if (block.questionId) {
    const normalizedNumber = Number(block.questionId.match(/\d+/)?.[0] || 0);
    const same = questions.find((question) => question.number === normalizedNumber);
    if (same) return same;
  }
  return questions[Math.max(0, Math.min(questions.length - 1, block.readingOrder))];
}

function attachVisuals(exam: StructuredExam, document: RecognitionDocument) {
  const visualTypes = new Set(["image", "graph", "geometric_figure", "table"]);
  for (const page of document.pages) for (const block of page.blocks) {
    if (block.excluded || !visualTypes.has(block.type)) continue;
    const question = nearestQuestion(exam, block);
    if (!question) continue;
    const type = block.type === "table" ? "table" : block.type === "graph" ? "chart" : block.type === "geometric_figure" ? "figure" : "image";
    const content = block.sourceCrop || (page.adjustedDataUrl && page.adjustedDataUrl.length <= 600_000 ? page.adjustedDataUrl : undefined);
    question.visuals = [...(question.visuals || []), { type, content, alt: block.text || `Hình nhận dạng từ trang ${page.pageNumber}` }];
    question.sourceMetadata = { ...(question.sourceMetadata || {}), recognitionPage: page.pageNumber, recognitionBlockId: block.id };
  }
}

export function normalizeRecognitionDocument(document: RecognitionDocument) {
  const text = recognitionText(document);
  const parsed = parseExamText(text, { title: document.sourceFileName.replace(/\.[^.]+$/, "") });
  attachVisuals(parsed.exam, document);
  parsed.exam.metadata.importWarnings = [...(parsed.exam.metadata.importWarnings || []), ...document.pages.flatMap((page) => page.warnings)];
  return { exam: parsed.exam, warnings: parsed.warnings, sourceText: text };
}

export function validateRecognitionForFinalization(document: RecognitionDocument) {
  const issues = finalizationIssues(document);
  const normalized = normalizeRecognitionDocument(document);
  const questions = normalized.exam.parts.flatMap((part) => part.questions);
  for (const part of normalized.exam.parts) {
    const numbers = part.questions.map((question) => question.number);
    if (new Set(numbers).size !== numbers.length) issues.push(`${part.title} có số câu bị trùng.`);
  }
  if (!questions.length) issues.push("Đề chưa có câu hỏi hợp lệ.");
  const score = questions.reduce((sum, question) => sum + Number(question.score || 0), 0);
  if (!Number.isFinite(score) || score < 0 || score > 100) issues.push("Tổng điểm nhận dạng chưa hợp lệ.");
  return { valid: issues.length === 0, issues: [...new Set(issues)], ...normalized };
}

function questionType(question: ExamQuestion): QuestionType {
  if (question.part === "multiple_choice") return "Trắc nghiệm";
  if (question.part === "true_false") return "Đúng/Sai";
  return "Trả lời ngắn";
}

function difficulty(question: ExamQuestion): QuestionDifficulty {
  return question.cognitiveLevel || question.difficulty || "Thông hiểu";
}

export function examQuestionsToBankItems(exam: StructuredExam, selectedIds: string[]): Omit<QuestionItem, "id" | "createdAt">[] {
  return exam.parts.flatMap((part) => part.questions).filter((question) => selectedIds.includes(question.id)).map((question) => ({
    subject: exam.metadata.subject || "Chưa xác định",
    grade: exam.metadata.grade || "Chưa xác định",
    topic: question.topic || "Nhận dạng từ tài liệu",
    question: question.stem,
    type: questionType(question), difficulty: difficulty(question), answer: question.answer, explanation: question.explanation || "",
    bankScope: "user", options: question.options || null,
    metadata: { sourceType: "document_recognition", needsReview: true, recognitionVisuals: question.visuals },
  }));
}

export function filterDuplicateBankItems<T extends Pick<QuestionItem, "question">>(items: T[], existing: Pick<QuestionItem, "question">[]) {
  const known = new Set(existing.map((item) => item.question.trim().toLocaleLowerCase("vi")));
  const accepted: T[] = []; const duplicates: T[] = [];
  for (const item of items) {
    const key = item.question.trim().toLocaleLowerCase("vi");
    if (!key || known.has(key)) duplicates.push(item);
    else { known.add(key); accepted.push(item); }
  }
  return { accepted, duplicates };
}

export function mergeRecognitionBlocks(blocks: RecognitionBlock[], ids: string[]) {
  const selected = sortRecognitionBlocks(blocks.filter((block) => ids.includes(block.id)));
  if (selected.length < 2) return blocks;
  const first = selected[0];
  const merged: RecognitionBlock = { ...first, id: `${first.id}-merged`, text: selected.map((block) => block.text).join("\n"), boundingBox: { x: Math.min(...selected.map((block) => block.boundingBox.x)), y: Math.min(...selected.map((block) => block.boundingBox.y)), width: Math.max(...selected.map((block) => block.boundingBox.x + block.boundingBox.width)) - Math.min(...selected.map((block) => block.boundingBox.x)), height: Math.max(...selected.map((block) => block.boundingBox.y + block.boundingBox.height)) - Math.min(...selected.map((block) => block.boundingBox.y)) }, confidence: selected.some((block) => block.confidence === "low") ? "low" : "medium", reviewed: false, warnings: [...new Set(selected.flatMap((block) => block.warnings))] };
  return rebuildBlockRelations([...blocks.filter((block) => !ids.includes(block.id)), merged]);
}

export function splitRecognitionBlock(block: RecognitionBlock) {
  const lines = block.text.split(/\n|(?=\s+[A-Da-d][.)]\s+)/u).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [block];
  return lines.map((line, index) => ({ ...block, id: `${block.id}-${index + 1}`, text: line, readingOrder: block.readingOrder + index / 100, boundingBox: { ...block.boundingBox, y: block.boundingBox.y + block.boundingBox.height * index / lines.length, height: block.boundingBox.height / lines.length }, reviewed: false }));
}

export function recognitionSummaryMetadata(document: RecognitionDocument) {
  const summary = recognitionSummary(document);
  return { sourceType: document.sourceType, sourceFileName: document.sourceFileName, pageCount: document.pageCount, recognizedPageCount: summary.recognizedPages, reviewStatus: document.reviewStatus, lowConfidenceBlockCount: summary.lowConfidenceBlockCount, recognizedQuestionCount: summary.questionCount, documentHash: document.documentHash, updatedAt: document.updatedAt };
}
