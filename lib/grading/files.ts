"use client";

import JSZip from "jszip";
import { prepareRecognitionFile } from "@/lib/document-recognition/client";
import { sanitizeRecognitionFileName } from "@/lib/document-recognition/validation";
import { createSubmission, mergeRecognizedAnswers, recognizeAnswersFromText } from "@/lib/grading/recognition";
import type { GradingSubmission } from "@/lib/grading/types";

export const GRADING_MAX_SUBMISSIONS = 100;
export const GRADING_MAX_TOTAL_SIZE = 200 * 1024 * 1024;
const supportedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".pdf", ".docx", ".txt"]);

function extension(value: string) { return value.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || ""; }
function decodeXml(value: string) { return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'"); }

async function docxText(file: File) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer()); const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("corrupt_file");
  return decodeXml(xml.replace(/<w:tab\s*\/>/g, "\t").replace(/<w:br[^>]*\/>/g, "\n").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "")).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, 180_000);
}

export async function expandSubmissionFiles(files: File[]) {
  const output: File[] = [];
  for (const file of files) {
    if (extension(file.name) !== ".zip") { output.push(file); continue; }
    if (file.size > 200 * 1024 * 1024) throw new Error("job_too_large");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const normalized = path.replace(/\\/g, "/");
      if (normalized.startsWith("/") || normalized.split("/").includes("..")) throw new Error("unsafe_archive");
      if (!supportedExtensions.has(extension(normalized))) continue;
      const blob = await entry.async("blob"); output.push(new File([blob], sanitizeRecognitionFileName(normalized.split("/").pop() || "bai-lam"), { type: mimeFor(normalized) }));
      if (output.length > GRADING_MAX_SUBMISSIONS) throw new Error("too_many_submissions");
    }
  }
  if (!output.length) throw new Error("unsupported_file");
  if (output.length > GRADING_MAX_SUBMISSIONS) throw new Error("too_many_submissions");
  if (output.reduce((sum, file) => sum + file.size, 0) > GRADING_MAX_TOTAL_SIZE) throw new Error("job_too_large");
  return output;
}

function mimeFor(name: string) {
  const ext = extension(name); if (ext === ".pdf") return "application/pdf"; if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; if (ext === ".txt") return "text/plain"; if (ext === ".png") return "image/png"; if (ext === ".webp") return "image/webp"; return "image/jpeg";
}

export type PreparedSubmission = { submission: GradingSubmission; recognitionPages: Array<{ pageNumber: number; blob: Blob; previewUrl?: string; extractedText?: string }> };

export async function prepareSubmissionFile(file: File, index: number): Promise<PreparedSubmission> {
  const ext = extension(file.name); if (!supportedExtensions.has(ext)) throw new Error("unsupported_file");
  const submission = createSubmission(`Bài làm ${String(index + 1).padStart(2, "0")}`, file.name);
  const asset = { ...submission.sourceFiles[0], mimeType: file.type || mimeFor(file.name), size: file.size, status: "pending" as const };
  if (ext === ".txt" || ext === ".docx") {
    const text = ext === ".txt" ? (await file.text()).slice(0, 180_000) : await docxText(file); const recognized = recognizeAnswersFromText(text);
    return { submission: { ...submission, student: recognized.student, examCode: recognized.examCode, examCodeConfidence: recognized.examCodeConfidence, examCodeConfirmed: recognized.examCodeConfidence === "high", recognizedAnswers: recognized.answers, sourceFiles: [{ ...asset, status: "recognized", pageCount: 1 }], reviewStatus: recognized.answers.some((answer) => answer.confidence === "low") ? "needs_review" : "reviewed" }, recognitionPages: [] };
  }
  const prepared = await prepareRecognitionFile(file); const previewUrls = prepared.pages.map((page) => page.adjustedDataUrl || page.sourceDataUrl).filter((value): value is string => Boolean(value));
  let answers = submission.recognizedAnswers; let student = submission.student; let examCode: string | undefined; let examCodeConfidence: GradingSubmission["examCodeConfidence"];
  for (const page of prepared.pages) if (page.extractedText?.trim()) { const recognized = recognizeAnswersFromText(page.extractedText, page.pageNumber); answers = mergeRecognizedAnswers(answers, recognized.answers); student = { ...student, ...Object.fromEntries(Object.entries(recognized.student).filter(([, value]) => value)) }; examCode ||= recognized.examCode; examCodeConfidence ||= recognized.examCodeConfidence; }
  return { submission: { ...submission, student, examCode, examCodeConfidence, examCodeConfirmed: examCodeConfidence === "high", recognizedAnswers: answers, sourceFiles: [{ ...asset, pageCount: prepared.pages.length, previewUrls, status: prepared.pages.every((page) => !page.recognitionRequired) ? "recognized" : "pending" }], reviewStatus: answers.some((answer) => answer.confidence === "low") ? "needs_review" : "not_reviewed" }, recognitionPages: prepared.pages.flatMap((page) => page.imageBlob ? [{ pageNumber: page.pageNumber, blob: page.imageBlob, previewUrl: page.adjustedDataUrl || page.sourceDataUrl, extractedText: page.extractedText }] : []) };
}

export function gradingFileError(error: unknown) {
  const code = error instanceof Error ? error.message : "unknown";
  if (code === "unsupported_file") return "Định dạng bài làm này chưa được hỗ trợ.";
  if (code === "corrupt_file") return "SOẠN LAB không đọc được bài làm này.";
  if (code === "password_protected") return "File PDF đang được bảo vệ bằng mật khẩu.";
  if (code === "file_too_large" || code === "job_too_large") return "Bài làm vượt quá giới hạn dung lượng cho phép.";
  if (code === "too_many_pages") return "Bài làm vượt quá giới hạn 30 trang.";
  if (code === "too_many_submissions") return "Mỗi lần chấm hỗ trợ tối đa 100 bài làm.";
  if (code === "unsafe_archive") return "File ZIP chứa đường dẫn không an toàn.";
  return "SOẠN LAB không đọc được bài làm này.";
}
