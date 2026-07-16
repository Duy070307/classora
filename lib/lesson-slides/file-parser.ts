import { createHash } from "node:crypto";
import JSZip from "jszip";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import type { SlideSource } from "@/lib/lesson-slides/types";

export const LESSON_SLIDES_MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TEXT = 180_000;
const supported = new Set([".docx", ".pdf", ".pptx", ".txt"]);

function extensionOf(name: string) {
  return name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
}

function decodeXml(value: string) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function xmlText(xml: string) {
  return decodeXml(Array.from(xml.matchAll(/<(?:a:t|w:t)\b[^>]*>([\s\S]*?)<\/(?:a:t|w:t)>/g)).map((match) => match[1]).join(" ")).replace(/\s+/g, " ").trim();
}

function safeName(value: string) {
  return value.replace(/[\\/]/g, "_").slice(0, 180);
}

async function parseDocx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("invalid_docx");
  const paragraphs = Array.from(xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)).map((match) => xmlText(match[0])).filter(Boolean);
  const tables = Array.from(xml.matchAll(/<w:tbl\b[\s\S]*?<\/w:tbl>/g)).map((table) => Array.from(table[0].matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)).map((row) => Array.from(row[0].matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)).map((cell) => xmlText(cell[0]))));
  const imageCount = Object.keys(zip.files).filter((path) => /^word\/media\//.test(path) && !zip.files[path].dir).length;
  return { text: paragraphs.join("\n").slice(0, MAX_TEXT), extracted: { tables, imageCount }, warnings: imageCount ? [`Đã phát hiện ${imageCount} ảnh trong Word. Vị trí ảnh cần được giáo viên kiểm tra lại trong dàn ý.`] : [] };
}

async function parsePdf(buffer: Buffer) {
  const parsed = await pdfParse(buffer, { max: 0 });
  const text = String(parsed.text || "").replace(/\u0000/g, "").trim().slice(0, MAX_TEXT);
  if (text.replace(/\s/g, "").length < 30) throw new Error("scan_only_pdf");
  return { text, extracted: {}, warnings: ["Nội dung PDF được đọc từ lớp văn bản; bảng, công thức và bố cục cần được rà soát trước khi tạo slide."] };
}

async function parsePptx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path)).sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
  if (!slidePaths.length) throw new Error("invalid_pptx");
  const slideTitles: string[] = [];
  const parts: string[] = [];
  const tables: string[][][] = [];
  for (const [index, path] of slidePaths.entries()) {
    const xml = await zip.file(path)?.async("string") || "";
    const paragraphs = Array.from(xml.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)).map((match) => xmlText(match[0])).filter(Boolean);
    const title = paragraphs[0] || `Slide ${index + 1}`;
    slideTitles.push(title);
    parts.push(`[Slide ${index + 1}] ${paragraphs.join("\n")}`);
    for (const table of xml.matchAll(/<a:tbl\b[\s\S]*?<\/a:tbl>/g)) {
      const rows = Array.from(table[0].matchAll(/<a:tr\b[\s\S]*?<\/a:tr>/g)).map((row) => Array.from(row[0].matchAll(/<a:tc\b[\s\S]*?<\/a:tc>/g)).map((cell) => xmlText(cell[0])));
      if (rows.length) tables.push(rows);
    }
  }
  const notes: string[] = [];
  const notePaths = Object.keys(zip.files).filter((path) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(path)).sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
  for (const path of notePaths) {
    const xml = await zip.file(path)?.async("string") || "";
    notes.push(xmlText(xml));
  }
  const imageCount = Object.keys(zip.files).filter((path) => /^ppt\/media\//.test(path) && !zip.files[path].dir).length;
  return { text: parts.join("\n\n").slice(0, MAX_TEXT), extracted: { slideTitles, notes, imageCount, tables }, warnings: [`Đã đọc ${slidePaths.length} slide${imageCount ? `, phát hiện ${imageCount} ảnh` : ""}${tables.length ? ` và ${tables.length} bảng` : ""}. Nội dung sẽ được tạo thành một bản thiết kế lại để giáo viên rà soát.`] };
}

export async function parseLessonSlideSource(input: { name: string; buffer: Buffer }): Promise<SlideSource> {
  if (input.buffer.byteLength > LESSON_SLIDES_MAX_FILE_SIZE) throw new Error("file_too_large");
  const extension = extensionOf(input.name);
  if (!supported.has(extension)) throw new Error("unsupported_file");
  const contentHash = createHash("sha256").update(input.buffer).digest("hex");
  const parsed = extension === ".docx" ? await parseDocx(input.buffer)
    : extension === ".pdf" ? await parsePdf(input.buffer)
      : extension === ".pptx" ? await parsePptx(input.buffer)
        : { text: input.buffer.toString("utf8").replace(/^\uFEFF/, "").slice(0, MAX_TEXT), extracted: {}, warnings: [] };
  if (!parsed.text.trim()) throw new Error("empty_file");
  return { type: extension === ".pptx" ? "existing_presentation" : "document", title: safeName(input.name).replace(/\.[^.]+$/, ""), text: parsed.text, contentHash, confirmed: true, warnings: parsed.warnings, extracted: parsed.extracted };
}

export function lessonSlideSourceError(error: unknown) {
  const code = error instanceof Error ? error.message : "unknown";
  if (code === "file_too_large") return "Tệp quá lớn. Vui lòng chọn tệp tối đa 10MB.";
  if (code === "unsupported_file") return "Chỉ hỗ trợ DOCX, PDF, PPTX và TXT.";
  if (code === "scan_only_pdf") return "PDF này có thể chỉ chứa ảnh quét. Vui lòng nhận dạng và xác nhận tài liệu trước khi tạo slide.";
  if (code === "invalid_docx" || code === "invalid_pptx") return "Cấu trúc tệp không hợp lệ hoặc tệp đã bị hỏng.";
  if (code === "empty_file") return "Không tìm thấy nội dung có thể dùng để tạo slide.";
  return "Chưa thể đọc tài liệu. Vui lòng kiểm tra tệp và thử lại.";
}
