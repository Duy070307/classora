import { createHash } from "node:crypto";
import JSZip from "jszip";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { detectExamSourceType } from "@/lib/exam-source/detect";
import { parseExamText } from "@/lib/exam-audit/normalize";
import type { ExamSourceType, ExtractedTable, ParsedExamSource } from "@/lib/exam-source/types";

export const EXAM_SOURCE_MAX_FILE_SIZE = 8 * 1024 * 1024;
export const EXAM_SOURCE_MAX_TEXT = 160_000;
export const EXAM_SOURCE_MAX_TABLE_ROWS = 2_000;
const supported = new Set([".xlsx", ".csv", ".docx", ".pdf", ".txt"]);
const extractionCache = new Map<string, ParsedExamSource>();

function extensionOf(name: string) {
  return name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
}

function decodeXml(value: string) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripXml(value: string) {
  return decodeXml(value.replace(/<w:tab\s*\/>/g, "\t").replace(/<w:br[^>]*\/>/g, "\n").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function columnNumber(reference: string) {
  const letters = reference.match(/[A-Z]+/i)?.[0]?.toUpperCase() || "A";
  return [...letters].reduce((result, letter) => result * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function cellReference(reference: string) {
  return { column: columnNumber(reference), row: Math.max(0, Number(reference.match(/\d+/)?.[0] || 1) - 1) };
}

function trimTable(rows: string[][]) {
  const nonEmpty = rows.filter((row) => row.some((cell) => cell.trim())).slice(0, EXAM_SOURCE_MAX_TABLE_ROWS);
  const max = nonEmpty.reduce((value, row) => Math.max(value, row.reduce((last, cell, index) => cell.trim() ? index + 1 : last, 0)), 0);
  return nonEmpty.map((row) => Array.from({ length: max }, (_, index) => String(row[index] || "").trim()));
}

function tableText(tables: ExtractedTable[]) {
  return tables.map((table) => [`[${table.name}]`, ...table.rows.map((row) => row.join(" | "))].join("\n")).join("\n\n").slice(0, EXAM_SOURCE_MAX_TEXT);
}

function scoreTable(table: ExtractedTable) {
  const text = table.rows.slice(0, 15).flat().join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return ["chu de", "noi dung", "nhan biet", "thong hieu", "van dung", "so cau", "so diem", "yeu cau can dat"].filter((signal) => text.includes(signal)).length;
}

function parseDelimited(text: string, name: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const candidates = [";", "\t", ","];
  const delimiter = candidates.map((value) => ({ value, score: lines.slice(0, 8).reduce((sum, line) => sum + line.split(value).length - 1, 0) })).sort((a, b) => b.score - a.score)[0]?.value || ",";
  const rows = lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"' && quoted) { current += '"'; index += 1; }
      else if (character === '"') quoted = !quoted;
      else if (character === delimiter && !quoted) { cells.push(current.trim()); current = ""; }
      else current += character;
    }
    cells.push(current.trim());
    return cells;
  });
  return [{ name, rows: trimTable(rows) } satisfies ExtractedTable];
}

async function parseXlsx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const stylesXml = await zip.file("xl/styles.xml")?.async("string");
  const customFormats = new Map<number, string>(stylesXml ? Array.from(stylesXml.matchAll(/<numFmt\b([^>]+)\/?>(?:<\/numFmt>)?/g)).map((match) => [Number(match[1].match(/numFmtId="(\d+)"/)?.[1] || 0), decodeXml(match[1].match(/formatCode="([^"]+)"/)?.[1] || "")] as const) : []);
  const percentStyleIndexes = new Set<number>();
  if (stylesXml) {
    const cellXfs = stylesXml.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1] || "";
    Array.from(cellXfs.matchAll(/<xf\b([^>]+)\/?>(?:<\/xf>)?/g)).forEach((match, index) => {
      const formatId = Number(match[1].match(/numFmtId="(\d+)"/)?.[1] || 0);
      if ([9, 10].includes(formatId) || /%/.test(customFormats.get(formatId) || "")) percentStyleIndexes.add(index);
    });
  }
  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  const shared = sharedXml ? Array.from(sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)).map((match) => decodeXml(Array.from(match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)).map((part) => part[1]).join(""))) : [];
  const workbook = await zip.file("xl/workbook.xml")?.async("string");
  const relationships = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  if (!workbook || !relationships) throw new Error("xlsx_invalid_structure");
  const targets = new Map(Array.from(relationships.matchAll(/<Relationship\b([^>]+)\/?>(?:<\/Relationship>)?/g)).map((match) => {
    const id = match[1].match(/Id="([^"]+)"/)?.[1] || "";
    const target = match[1].match(/Target="([^"]+)"/)?.[1] || "";
    return [id, target] as const;
  }));
  const sheetDefs = Array.from(workbook.matchAll(/<sheet\b([^>]+)\/?>(?:<\/sheet>)?/g)).map((match, index) => ({
    name: decodeXml(match[1].match(/name="([^"]+)"/)?.[1] || `Sheet ${index + 1}`),
    id: match[1].match(/r:id="([^"]+)"/)?.[1] || "",
  }));
  const tables: ExtractedTable[] = [];
  for (const sheet of sheetDefs) {
    const target = targets.get(sheet.id)?.replace(/^\//, "").replace(/^xl\//, "") || "";
    const path = `xl/${target}`.replace(/\\/g, "/");
    const xml = await zip.file(path)?.async("string");
    if (!xml) continue;
    const rows: string[][] = [];
    for (const match of xml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const reference = match[1].match(/\br="([^"]+)"/)?.[1];
      if (!reference) continue;
      const { row, column } = cellReference(reference);
      if (row >= EXAM_SOURCE_MAX_TABLE_ROWS) continue;
      const type = match[1].match(/\bt="([^"]+)"/)?.[1] || "";
      const styleIndex = Number(match[1].match(/\bs="(\d+)"/)?.[1] || -1);
      const raw = match[2].match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? Array.from(match[2].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)).map((part) => part[1]).join("");
      let value = decodeXml(raw || "");
      if (type === "s") value = shared[Number(value)] || "";
      if (type === "b") value = value === "1" ? "TRUE" : "FALSE";
      if (!type && percentStyleIndexes.has(styleIndex) && Number.isFinite(Number(value))) value = `${Number((Number(value) * 100).toFixed(6))}%`;
      rows[row] ||= [];
      rows[row][column] = value;
    }
    const mergedRanges = Array.from(xml.matchAll(/<mergeCell\b[^>]*ref="([^"]+)"/g)).map((match) => match[1]);
    for (const range of mergedRanges) {
      const [start, end] = range.split(":").map(cellReference);
      const value = rows[start.row]?.[start.column] || "";
      for (let row = start.row; row <= end.row; row += 1) for (let column = start.column; column <= end.column; column += 1) { rows[row] ||= []; rows[row][column] ||= value; }
    }
    const cleanRows = trimTable(rows);
    if (cleanRows.length) tables.push({ name: sheet.name, rows: cleanRows, mergedRanges });
  }
  if (!tables.length) throw new Error("xlsx_empty");
  const selected = [...tables].sort((left, right) => scoreTable(right) - scoreTable(left))[0];
  return { text: tableText(tables), tables, metadata: { sheetNames: tables.map((table) => table.name), selectedSheet: selected.name } };
}

async function parseDocx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("docx_missing_document");
  const tables = Array.from(xml.matchAll(/<w:tbl\b[\s\S]*?<\/w:tbl>/g)).map((table, index) => ({
    name: `Bảng ${index + 1}`,
    rows: trimTable(Array.from(table[0].matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)).map((row) => Array.from(row[0].matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)).map((cell) => stripXml(cell[0])))),
  })).filter((table) => table.rows.length);
  const paragraphs = Array.from(xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)).map((paragraph) => stripXml(paragraph[0])).filter(Boolean);
  const imageCount = Object.keys(zip.files).filter((path) => /^word\/media\//i.test(path) && !zip.files[path].dir).length;
  const text = `${paragraphs.join("\n")}\n\n${tableText(tables)}`.trim().slice(0, EXAM_SOURCE_MAX_TEXT);
  return { text, tables, metadata: { imageCount }, warnings: imageCount ? [`File Word có ${imageCount} hình ảnh. SOẠN LAB chỉ ghi nhận số lượng hình; thầy cô cần kiểm tra vị trí hình trong bản xem trước.`] : [] };
}

async function parsePdf(buffer: Buffer) {
  const parsed = await pdfParse(buffer, { max: 0 });
  const text = String(parsed.text || "").replace(/\u0000/g, "").trim().slice(0, EXAM_SOURCE_MAX_TEXT);
  const tooShort = text.replace(/\s/g, "").length < 30;
  return {
    text,
    tables: [] as ExtractedTable[],
    metadata: { pageCount: Number(parsed.numpages || 0) },
    warnings: tooShort ? ["File PDF có thể là bản quét hình ảnh. Vui lòng dùng file Word, Excel hoặc dán văn bản."] : ["Nội dung PDF được đọc theo lớp văn bản. Bố cục nhiều cột, bảng và hình có thể cần thầy cô kiểm tra lại."],
    imageOnly: tooShort,
  };
}

export async function parseExamSourceBuffer(input: { name: string; buffer: Buffer; sourceType?: ExamSourceType }): Promise<ParsedExamSource> {
  if (input.buffer.byteLength > EXAM_SOURCE_MAX_FILE_SIZE) throw new Error("file_too_large");
  const extension = extensionOf(input.name);
  if (!supported.has(extension)) throw new Error("unsupported_file");
  const contentHash = createHash("sha256").update(input.buffer).digest("hex");
  const cacheKey = `${contentHash}:${input.sourceType || "unknown"}`;
  const cached = extractionCache.get(cacheKey);
  if (cached) return { ...cached, fileName: input.name.replace(/[\\/]/g, "_").slice(0, 180) };
  let extracted: { text: string; tables: ExtractedTable[]; warnings?: string[]; metadata?: ParsedExamSource["metadata"]; imageOnly?: boolean };
  if (extension === ".xlsx") extracted = { ...(await parseXlsx(input.buffer)), warnings: [] };
  else if (extension === ".csv") { const text = input.buffer.toString("utf8"); const tables = parseDelimited(text, input.name); extracted = { text: tableText(tables), tables, warnings: [] }; }
  else if (extension === ".docx") extracted = await parseDocx(input.buffer);
  else if (extension === ".pdf") extracted = await parsePdf(input.buffer);
  else extracted = { text: input.buffer.toString("utf8").replace(/^\uFEFF/, "").slice(0, EXAM_SOURCE_MAX_TEXT), tables: [], warnings: [] };
  if (!extracted.text.trim() && !extracted.imageOnly) throw new Error("empty_file");
  const detection = detectExamSourceType(extracted.text);
  const sourceType = input.sourceType && input.sourceType !== "unknown" ? input.sourceType : detection.sourceType;
  const previousExam = sourceType === "previous_exam" ? parseExamText(extracted.text, { title: input.name.replace(/\.[^.]+$/, "") }).exam : undefined;
  const result: ParsedExamSource = {
    fileName: input.name.replace(/[\\/]/g, "_").slice(0, 180), extension, text: extracted.text, tables: extracted.tables,
    sourceType, detectionConfidence: input.sourceType && input.sourceType !== "unknown" ? Math.max(0.75, detection.confidence) : detection.confidence,
    detectionScores: detection.scores, warnings: extracted.warnings || [], contentHash, metadata: extracted.metadata, previousExam,
  };
  extractionCache.set(cacheKey, result);
  if (extractionCache.size > 24) extractionCache.delete(extractionCache.keys().next().value || "");
  return result;
}

export async function parseExamSourceFile(file: File, sourceType?: ExamSourceType) {
  return parseExamSourceBuffer({ name: file.name, buffer: Buffer.from(await file.arrayBuffer()), sourceType });
}

export async function parsePastedExamSource(text: string, sourceType?: ExamSourceType) {
  const content = text.trim().slice(0, EXAM_SOURCE_MAX_TEXT);
  if (!content) throw new Error("empty_file");
  return parseExamSourceBuffer({ name: "Nội dung đã dán.txt", buffer: Buffer.from(content, "utf8"), sourceType });
}

export function examSourceErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "unknown";
  if (code === "file_too_large") return "File quá lớn. Vui lòng chọn file tối đa 8MB.";
  if (code === "unsupported_file") return "Định dạng file này chưa được hỗ trợ.";
  if (code === "empty_file" || code === "xlsx_empty") return "SOẠN LAB không đọc được nội dung trong file.";
  if (code === "xlsx_invalid_structure") return "File Excel không có cấu trúc bảng tính hợp lệ.";
  if (code === "docx_missing_document") return "File Word không có cấu trúc tài liệu hợp lệ.";
  return "Chưa thể đọc cấu trúc từ file. Vui lòng kiểm tra file và thử lại.";
}
