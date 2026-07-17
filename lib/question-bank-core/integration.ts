"use client";

import { createDocument, saveDocument } from "@/lib/history";
import type { ExamPartType, ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { GeneratedDocument } from "@/lib/types";
import type { QuestionBankItem } from "@/lib/question-bank-core/types";
import { openWorksheetGenerator } from "@/lib/worksheet/session";
import { openLessonPlanGenerator } from "@/lib/lesson-plan/session";

function examPart(item: QuestionBankItem): ExamPartType | null {
  if (item.type === "multiple_choice") return "multiple_choice";
  if (item.type === "true_false") return "true_false";
  if (["short_answer", "fill_blank"].includes(item.type)) return "short_answer";
  return null;
}

function examQuestion(item: QuestionBankItem, number: number): ExamQuestion | null {
  const part = examPart(item); if (!part) return null;
  const options = item.type === "multiple_choice" ? Object.fromEntries(item.options.map((option) => [option.label, option.text])) as ExamQuestion["options"] : undefined;
  return { id: item.id, part, number, stem: item.prompt, options, trueFalseItems: item.type === "true_false" ? item.trueFalseStatements.map((statement) => ({ label: statement.label as "a" | "b" | "c" | "d", text: statement.text, answer: statement.answer })) : undefined, answer: item.type === "multiple_choice" ? item.correctOptionIds.join(",") : item.answer, explanation: item.explanation, score: item.score, difficulty: item.difficulty, cognitiveLevel: item.cognitiveLevel, topic: item.topic, visuals: item.visuals.map((visual) => ({ type: visual.type === "tikz" ? "tikz" : visual.type === "table" ? "table" : "image", content: visual.content, alt: visual.alt })), sourceMetadata: { questionBankId: item.id, scoringRules: { acceptedAnswers: item.acceptedAnswers, unit: item.unit, tolerance: item.tolerance, rubric: item.essayRubric } } };
}

export function questionBankToExam(items: QuestionBankItem[]) {
  const compatible = items.map((item, index) => examQuestion(item, index + 1)).filter((item): item is ExamQuestion => Boolean(item));
  const parts: StructuredExam["parts"] = (["multiple_choice", "true_false", "short_answer"] as ExamPartType[]).map((type) => ({ type, title: type === "multiple_choice" ? "PHẦN I. TRẮC NGHIỆM" : type === "true_false" ? "PHẦN II. ĐÚNG/SAI" : "PHẦN III. TRẢ LỜI NGẮN", instruction: "Thực hiện theo yêu cầu của từng câu.", questions: compatible.filter((question) => question.part === type).map((question, index) => ({ ...question, number: index + 1 })) })).filter((part) => part.questions.length);
  const first = items[0];
  const exam: StructuredExam = { metadata: { title: "Đề từ ngân hàng câu hỏi", examStyle: "Kiểm tra thường", subject: first?.subject || "", grade: first?.grade || "", duration: "45 phút", examCode: "0101", totalScore: items.reduce((sum, item) => sum + item.score, 0) || 10 }, parts, teacherOnly: { scoringGuide: "Dùng đáp án và quy tắc chấm gắn với từng câu hỏi.", matrix: "", specification: "", notes: "Giáo viên cần rà soát trước khi sử dụng." } };
  return { exam, compatibleCount: compatible.length, conflicts: items.filter((item) => !examPart(item)).map((item) => `${item.prompt.slice(0, 70)}: dạng ${item.type} chưa tương thích trực tiếp với cấu trúc đề hiện tại.`) };
}

export function saveExamFromQuestions(items: QuestionBankItem[]) {
  const result = questionBankToExam(items); const document = createDocument("Đề từ ngân hàng câu hỏi", "exam", items.map((item, index) => `Câu ${index + 1}. ${item.prompt}`).join("\n\n"));
  document.structuredExam = result.exam; document.generationMeta = { source: "question-bank", bankQuestionIds: items.map((item) => item.id), questionCount: result.compatibleCount };
  saveDocument(document); return { ...result, document };
}

export function openWorksheetFromQuestions(items: QuestionBankItem[], purpose: "homework" | "quick_check" = "homework") {
  const document = createDocument("Câu hỏi chọn từ ngân hàng", "question-bank", items.map((item, index) => `Câu ${index + 1}. ${item.prompt}\nĐáp án: ${item.answer || item.correctOptionIds.join(",")}`).join("\n\n"));
  document.generationMeta = { source: "question-bank", bankQuestionIds: items.map((item) => item.id), questionCount: items.length };
  openWorksheetGenerator(document, purpose);
}

export function openLessonPlanFromQuestions(items: QuestionBankItem[]) {
  const document: GeneratedDocument = createDocument("Đánh giá nhanh từ ngân hàng câu hỏi", "question-bank", `CÂU HỎI ĐÁNH GIÁ NHANH\n\n${items.map((item, index) => `${index + 1}. ${item.prompt}`).join("\n")}`);
  document.generationMeta = { source: "question-bank", bankQuestionIds: items.map((item) => item.id), questionCount: items.length };
  openLessonPlanGenerator(document);
}
