import ExcelJS from "exceljs";
import JSZip from "jszip";
import type { Rubric } from "@/lib/rubric/types";
import { createRubricOutline, normalizeRubric } from "@/lib/rubric/workflow";

export type RubricImportResult = { rubric?: Rubric; warnings: string[]; errors: string[]; sourceRows: number };

function decodeXml(value: string) { return value.replace(/<w:tab\/>/g, "\t").replace(/<w:br\/>/g, "\n").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim(); }
function fromRows(rows: string[][], title = "Rubric nhập từ file"): RubricImportResult {
  const clean = rows.map((row) => row.map((cell) => String(cell || "").trim())).filter((row) => row.some(Boolean));
  if (!clean.length) return { warnings: [], errors: ["Không tìm thấy dữ liệu rubric trong tệp."], sourceRows: 0 };
  const headerIndex = clean.findIndex((row) => row.some((cell) => /tiêu chí|criterion/i.test(cell)));
  const data = clean.slice(headerIndex >= 0 ? headerIndex + 1 : 0).filter((row) => row[0]);
  if (!data.length) return { warnings: [], errors: ["Không tìm thấy hàng tiêu chí hợp lệ."], sourceRows: clean.length };
  const rubric = createRubricOutline({ title, criteriaText: data.map((row) => row[0]).join("\n"), inputMode: "import" });
  const next = normalizeRubric({ ...rubric, criteria: rubric.criteria.map((criterion, criterionIndex) => ({ ...criterion, descriptors: criterion.descriptors.map((descriptor, levelIndex) => ({ ...descriptor, text: data[criterionIndex]?.[levelIndex + 2] || data[criterionIndex]?.[levelIndex + 1] || descriptor.text })) })) });
  return { rubric: next, warnings: ["Dữ liệu đã được chuẩn hóa. Giáo viên cần rà soát trọng số, điểm và mô tả mức độ trước khi lưu."], errors: [], sourceRows: clean.length };
}

export function importRubricText(text: string, title?: string) { const rows = text.split(/\r?\n/).map((line) => line.split(/\t|,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((cell) => cell.replace(/^\"|\"$/g, ""))); return fromRows(rows, title); }

export async function importRubricFile(file: File): Promise<RubricImportResult> {
  if (file.size > 5 * 1024 * 1024) return { warnings: [], errors: ["Tệp vượt quá giới hạn 5 MB."], sourceRows: 0 };
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith(".csv") || name.endsWith(".txt")) return importRubricText(await file.text(), file.name.replace(/\.[^.]+$/, ""));
    if (name.endsWith(".xlsx")) { const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await file.arrayBuffer()); const sheet = workbook.worksheets[0]; const rows: string[][] = []; sheet.eachRow((row) => rows.push(row.values instanceof Array ? row.values.slice(1).map((value) => String(value ?? "")) : [])); return fromRows(rows, file.name.replace(/\.[^.]+$/, "")); }
    if (name.endsWith(".docx")) { const zip = await JSZip.loadAsync(await file.arrayBuffer()); const xml = await zip.file("word/document.xml")?.async("text"); if (!xml) return { warnings: [], errors: ["Tệp Word không có nội dung có thể đọc."], sourceRows: 0 }; const tableRows = [...xml.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)].map((match) => [...match[0].matchAll(/<w:tc[\s\S]*?<\/w:tc>/g)].map((cell) => decodeXml(cell[0]))); return fromRows(tableRows.length ? tableRows : decodeXml(xml).split(/\n/).map((line) => [line]), file.name.replace(/\.[^.]+$/, "")); }
    return { warnings: [], errors: ["Chỉ hỗ trợ XLSX, CSV, DOCX hoặc văn bản dán."], sourceRows: 0 };
  } catch (error) { if (process.env.NODE_ENV === "development") console.error("rubric_import_failed", error); return { warnings: [], errors: ["Chưa thể đọc cấu trúc tệp. Vui lòng kiểm tra định dạng và thử lại."], sourceRows: 0 }; }
}
