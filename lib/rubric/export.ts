"use client";
import ExcelJS from "exceljs";
import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, PageOrientation, Paragraph, SectionType, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { printGeneratedDocument } from "@/lib/print-document";
import type { Rubric, RubricAudience } from "@/lib/rubric/types";
import { rubricCoverage } from "@/lib/rubric/coverage";
import { rubricToDocument } from "@/lib/rubric/workflow";
import { wordTextChildren } from "@/lib/docx/math";

const safeName = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1200); }
const borders = { top: { style: BorderStyle.SINGLE, size: 1, color: "94A3B8" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "94A3B8" }, left: { style: BorderStyle.SINGLE, size: 1, color: "94A3B8" }, right: { style: BorderStyle.SINGLE, size: 1, color: "94A3B8" } };
function cell(text: string, bold = false) { return new TableCell({ children: [new Paragraph({ children: wordTextChildren(text, { bold, font: "Arial", size: 18 }) })], borders }); }

export async function buildRubricDocx(rubric: Rubric, audience: RubricAudience = "teacher") {
  const headers = ["Tiêu chí", "Trọng số", ...rubric.levels.map((level) => `${level.label} (${level.score})`)];
  const rows = rubric.criteria.map((criterion) => [criterion.title, `${Math.round(criterion.weight * 100) / 100}%`, ...rubric.levels.map((level) => criterion.descriptors.find((item) => item.levelId === level.id)?.text || "—")]);
  const table = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headers, ...rows].map((row, index) => new TableRow({ tableHeader: index === 0, cantSplit: true, children: row.map((value) => cell(value, index === 0)) })) });
  const teacherNotes = audience === "teacher" ? rubric.criteria.filter((item) => item.evidence).map((item) => new Paragraph({ children: wordTextChildren(`${item.title} — Minh chứng: ${item.evidence}`, { font: "Arial", size: 20 }) })) : [];
  return Packer.toBlob(new Document({ sections: [{ properties: { type: SectionType.CONTINUOUS, page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 600, right: 500, bottom: 600, left: 500 } } }, children: [
    new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: rubric.title.toUpperCase(), bold: true, font: "Arial" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Môn: ${rubric.subject || "—"} · Khối: ${rubric.grade || "—"} · Tổng điểm: ${rubric.totalScore}`, font: "Arial", size: 21 })] }),
    new Paragraph({ children: wordTextChildren(rubric.instructions || "", { font: "Arial", size: 20 }) }), table, ...teacherNotes,
    new Paragraph({ spacing: { before: 300 }, children: [new TextRun({ text: "Giáo viên cần rà soát tiêu chí và mô tả trước khi sử dụng chính thức.", italics: true, font: "Arial", size: 18 })] }),
  ] }] }));
}

function styleSheet(sheet: ExcelJS.Worksheet, widths: number[]) { sheet.views = [{ state: "frozen", ySplit: 1 }]; sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } }; sheet.columns.forEach((column, index) => { column.width = widths[index] || 18; column.alignment = { vertical: "middle", wrapText: true }; }); sheet.eachRow((row) => row.eachCell((item) => { item.border = { top: { style: "thin", color: { argb: "FFCBD5E1" } }, bottom: { style: "thin", color: { argb: "FFCBD5E1" } }, left: { style: "thin", color: { argb: "FFCBD5E1" } }, right: { style: "thin", color: { argb: "FFCBD5E1" } } }; })); }

export async function buildRubricXlsx(rubric: Rubric) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = "SOẠN LAB";
  const rubricSheet = workbook.addWorksheet("Rubric"); rubricSheet.addRow(["Tiêu chí", "Trọng số", "Điểm tối đa", ...rubric.levels.map((item) => `${item.label} (${item.score})`)]); rubric.criteria.forEach((criterion) => rubricSheet.addRow([criterion.title, criterion.weight / 100, criterion.maxScore, ...rubric.levels.map((level) => criterion.descriptors.find((item) => item.levelId === level.id)?.text || "")])); rubricSheet.getColumn(2).numFmt = "0.00%"; styleSheet(rubricSheet, [24, 12, 12, ...rubric.levels.map(() => 34)]);
  const scoring = workbook.addWorksheet("Chấm điểm"); scoring.addRow(["Tiêu chí", "Trọng số", "Mức chọn", "Điểm xác nhận", "Minh chứng", "Phản hồi"]); rubric.criteria.forEach((item) => scoring.addRow([item.title, item.weight / 100, "", "", "", ""])); scoring.getColumn(2).numFmt = "0.00%"; styleSheet(scoring, [26, 12, 18, 16, 34, 34]);
  const coverage = workbook.addWorksheet("Bao phủ mục tiêu"); coverage.addRow(["Mục tiêu", "Tiêu chí", "Trạng thái"]); rubricCoverage(rubric).forEach((item) => coverage.addRow([item.objective, item.criterionTitles.join("; "), item.status === "covered" ? "Đã bao phủ" : "Chưa bao phủ"])); styleSheet(coverage, [42, 42, 18]);
  const metadata = workbook.addWorksheet("Thông tin"); metadata.addRows([["Trường", "Giá trị"], ["Tiêu đề", rubric.title], ["Môn", rubric.subject || ""], ["Khối", rubric.grade || ""], ["Loại rubric", rubric.rubricType], ["Tổng điểm", rubric.totalScore], ["Phiên bản", rubric.metadata.version]]); styleSheet(metadata, [24, 48]);
  const buffer = await workbook.xlsx.writeBuffer(); return new Blob([new Uint8Array(buffer as ArrayBuffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function downloadRubricDocx(rubric: Rubric, audience: RubricAudience = "teacher") { download(await buildRubricDocx(rubric, audience), `${safeName(rubric.title)}_${audience}.docx`); }
export async function downloadRubricXlsx(rubric: Rubric) { download(await buildRubricXlsx(rubric), `${safeName(rubric.title)}.xlsx`); }
export function printRubricPdf(rubric: Rubric, audience: RubricAudience = "teacher") { printGeneratedDocument(rubricToDocument(rubric, audience)); }
