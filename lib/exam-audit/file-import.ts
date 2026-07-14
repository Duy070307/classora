import "server-only";
import JSZip from "jszip";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { parseExamText } from "@/lib/exam-audit/normalize";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const supported = new Set([".txt", ".docx", ".pdf"]);

function extensionOf(name: string) {
  return name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
}

function decodeXml(value: string) {
  return value
    .replace(/<w:tab\s*\/>/g, "\t")
    .replace(/<w:br\s*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<\/w:tr>/g, "\n")
    .replace(/<\/w:tc>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractDocx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = zip.file("word/document.xml");
  if (!documentXml) throw new Error("docx_missing_document");
  const text = decodeXml(await documentXml.async("string"));
  const mediaCount = Object.keys(zip.files).filter((name) => /^word\/media\//i.test(name) && !zip.files[name].dir).length;
  return {
    text,
    warnings: mediaCount ? [`File Word có ${mediaCount} hình ảnh. SOẠN LAB đã giữ dấu hiệu có hình nhưng chưa thể gắn chắc chắn từng hình vào đúng câu.`] : [],
  };
}

async function extractPdf(buffer: Buffer) {
  const parsed = await pdfParse(buffer, { max: 0 });
  const text = String(parsed.text || "").trim();
  return {
    text,
    warnings: ["Nội dung PDF được đọc theo lớp văn bản. Hình, biểu đồ và bố cục nhiều cột có thể chưa được gắn đúng câu; vui lòng kiểm tra bản xem trước."],
  };
}

export async function importExamFile(file: File) {
  if (file.size > MAX_FILE_SIZE) throw new Error("file_too_large");
  const extension = extensionOf(file.name);
  if (!supported.has(extension)) throw new Error("unsupported_file");
  const buffer = Buffer.from(await file.arrayBuffer());
  let extracted: { text: string; warnings: string[] };
  if (extension === ".txt") extracted = { text: buffer.toString("utf8").replace(/^\uFEFF/, ""), warnings: [] };
  else if (extension === ".docx") extracted = await extractDocx(buffer);
  else extracted = await extractPdf(buffer);
  if (!extracted.text.trim()) throw new Error("empty_file_text");
  const parsed = parseExamText(extracted.text, { title: file.name.replace(/\.[^.]+$/, "") });
  parsed.exam.metadata.importWarnings = [...(parsed.exam.metadata.importWarnings || []), ...extracted.warnings];
  parsed.exam.teacherOnly.notes = parsed.exam.metadata.importWarnings.join("\n");
  return { ...parsed, warnings: parsed.exam.metadata.importWarnings, sourceText: extracted.text.slice(0, 120000) };
}

export function importErrorMessage(reason: unknown) {
  const code = reason instanceof Error ? reason.message : "unknown";
  if (code === "file_too_large") return "File quá lớn. Vui lòng dùng file tối đa 8MB.";
  if (code === "unsupported_file") return "Định dạng chưa được hỗ trợ. Vui lòng dùng .docx, .pdf hoặc .txt.";
  if (code === "docx_missing_document") return "File Word không có cấu trúc tài liệu hợp lệ.";
  if (code === "empty_file_text") return "Chưa đọc được nội dung văn bản trong file. Nếu đây là PDF scan, vui lòng dán nội dung hoặc dùng file có lớp văn bản.";
  return "Chưa thể đọc cấu trúc đề từ file. Vui lòng kiểm tra file và thử lại.";
}
