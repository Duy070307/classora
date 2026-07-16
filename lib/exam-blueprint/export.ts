"use client";

import ExcelJS from "exceljs";
import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, PageOrientation, Paragraph, SectionType, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import type { ExamBlueprint } from "@/lib/exam-source/types";
import type { BlueprintComparison } from "@/lib/exam-blueprint/workflow";

const levels = { recognition: "Nhận biết", comprehension: "Thông hiểu", application: "Vận dụng", advancedApplication: "Vận dụng cao" } as const;
const types = { multiple_choice: "Trắc nghiệm", true_false: "Đúng/Sai", short_answer: "Trả lời ngắn", essay: "Tự luận", mixed: "Kết hợp" } as const;
const statuses = { match: "Khớp", slight: "Lệch nhẹ", mismatch: "Không khớp", needs_confirmation: "Cần giáo viên xác nhận" } as const;
const safeName = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
const download = (blob: Blob, filename: string) => { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1200); };

function styleWorksheet(sheet: ExcelJS.Worksheet, widths: number[]) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  sheet.columns.forEach((column, index) => { column.width = widths[index] || 14; column.alignment = { vertical: "middle", wrapText: true }; });
  sheet.eachRow((row) => { row.eachCell((cell) => { cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } }; }); });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(1, sheet.columnCount) } };
}

export async function buildBlueprintXlsx(blueprint: ExamBlueprint, comparison?: BlueprintComparison) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = "SOẠN LAB"; workbook.created = new Date();
  const matrix = workbook.addWorksheet("Ma trận đề");
  matrix.addRow(["TT", "Chủ đề", "Đơn vị kiến thức", "Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao", "Số câu", "Số điểm", "Tỉ lệ"]);
  blueprint.topicDistribution.forEach((topic, index) => { const row = matrix.addRow([index + 1, topic.topic, topic.subtopic || topic.knowledgeContent || "", Number(topic.counts.recognition || 0), Number(topic.counts.comprehension || 0), Number(topic.counts.application || 0), Number(topic.counts.advancedApplication || 0), Number(topic.totalQuestions ?? Object.values(topic.counts).reduce<number>((sum, value) => sum + Number(value || 0), 0)), Number(topic.totalScore || 0), Number(topic.percentage || 0) / 100]); row.getCell(10).numFmt = "0.00%"; });
  const totalRow = matrix.addRow(["", "TỔNG", "", { formula: `SUM(D2:D${matrix.rowCount})` }, { formula: `SUM(E2:E${matrix.rowCount})` }, { formula: `SUM(F2:F${matrix.rowCount})` }, { formula: `SUM(G2:G${matrix.rowCount})` }, { formula: `SUM(H2:H${matrix.rowCount})` }, { formula: `SUM(I2:I${matrix.rowCount})` }, { formula: `SUM(J2:J${matrix.rowCount})` }]); totalRow.font = { bold: true }; totalRow.getCell(10).numFmt = "0.00%"; styleWorksheet(matrix, [6, 24, 24, 12, 12, 12, 15, 10, 10, 12]);

  const specification = workbook.addWorksheet("Bảng đặc tả");
  specification.addRow(["TT", "Chủ đề", "Đơn vị kiến thức", "Yêu cầu cần đạt", "Mức độ", "Dạng câu hỏi", "Số câu", "Số điểm", "Tỉ lệ", "Ghi chú"]);
  (blueprint.specificationRows || []).forEach((row, index) => { const sheetRow = specification.addRow([index + 1, row.topic, row.knowledgeUnit || "", row.learningOutcome, levels[row.cognitiveLevel], types[row.questionType], Number(row.questionCount), Number(row.score), Number(row.percentage) / 100, row.note || ""]); sheetRow.getCell(9).numFmt = "0.00%"; });
  styleWorksheet(specification, [6, 22, 24, 40, 18, 18, 10, 10, 12, 24]);

  const summary = workbook.addWorksheet("Tổng hợp"); summary.addRows([["Thông tin", "Giá trị"], ["Tên ma trận", blueprint.title || "Ma trận đề"], ["Môn học", blueprint.subject || ""], ["Khối lớp", blueprint.grade || ""], ["Bộ sách", blueprint.textbookSeries || ""], ["Loại kiểm tra", blueprint.examType || ""], ["Thời gian (phút)", Number(blueprint.durationMinutes || 0)], ["Tổng số câu", { formula: `'Ma trận đề'!H${matrix.rowCount}` }], ["Tổng điểm", Number(blueprint.totalScore || 0)], ["Tổng tỉ lệ", { formula: `'Ma trận đề'!J${matrix.rowCount}` }]]); summary.getCell("B10").numFmt = "0.00%"; styleWorksheet(summary, [28, 48]);

  if (comparison) { const compare = workbook.addWorksheet("Đối chiếu đề"); compare.addRow(["Tiêu chí", "Ma trận", "Đề thực tế", "Chênh lệch", "Trạng thái"]); comparison.rows.forEach((row) => compare.addRow([row.criterion, row.expected, row.actual, row.difference, statuses[row.status]])); styleWorksheet(compare, [24, 34, 34, 18, 20]); }
  const buffer = await workbook.xlsx.writeBuffer(); return new Blob([new Uint8Array(buffer as ArrayBuffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

const cell = (text: string | number, bold = false) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(text), bold, font: "Arial", size: 18 })] })], borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "777777" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "777777" }, left: { style: BorderStyle.SINGLE, size: 1, color: "777777" }, right: { style: BorderStyle.SINGLE, size: 1, color: "777777" } } });
const table = (rows: Array<Array<string | number>>) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map((row, index) => new TableRow({ tableHeader: index === 0, cantSplit: true, children: row.map((value) => cell(value, index === 0)) })) });

export async function buildBlueprintDocx(blueprint: ExamBlueprint, comparison?: BlueprintComparison) {
  const matrixRows: Array<Array<string | number>> = [["TT", "Chủ đề", "NB", "TH", "VD", "VDC", "Số câu", "Điểm", "Tỉ lệ"]];
  blueprint.topicDistribution.forEach((topic, index) => matrixRows.push([index + 1, topic.topic, topic.counts.recognition || 0, topic.counts.comprehension || 0, topic.counts.application || 0, topic.counts.advancedApplication || 0, topic.totalQuestions ?? 0, topic.totalScore || 0, `${topic.percentage || 0}%`]));
  const specificationRows: Array<Array<string | number>> = [["TT", "Chủ đề", "Đơn vị kiến thức", "Yêu cầu cần đạt", "Mức độ", "Dạng câu", "Số câu", "Điểm", "Tỉ lệ", "Ghi chú"]];
  (blueprint.specificationRows || []).forEach((row, index) => specificationRows.push([index + 1, row.topic, row.knowledgeUnit || "", row.learningOutcome, levels[row.cognitiveLevel], types[row.questionType], row.questionCount, row.score, `${row.percentage}%`, row.note || ""]));
  const info = [`Môn: ${blueprint.subject || ""} · Khối: ${blueprint.grade || ""}`, `Thời gian: ${blueprint.durationMinutes || 0} phút · Tổng điểm: ${blueprint.totalScore || 0}`];
  const sections = [{ properties: { type: SectionType.CONTINUOUS, page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 720, right: 540, bottom: 720, left: 540 } } }, children: [new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: (blueprint.title || "MA TRẬN ĐỀ").toUpperCase(), bold: true, font: "Arial" })] }), ...info.map((text) => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, font: "Arial", size: 22 })] })), new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "I. MA TRẬN ĐỀ", bold: true, font: "Arial" })] }), table(matrixRows), new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "II. BẢNG ĐẶC TẢ", bold: true, font: "Arial" })] }), table(specificationRows), ...(comparison ? [new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "III. ĐỐI CHIẾU ĐỀ", bold: true, font: "Arial" })] }), table([["Tiêu chí", "Ma trận", "Đề thực tế", "Chênh lệch", "Trạng thái"], ...comparison.rows.map((row) => [row.criterion, row.expected, row.actual, row.difference, statuses[row.status]])])] : []), new Paragraph({ spacing: { before: 480 }, children: [new TextRun({ text: "Người lập ma trận: ____________________        Tổ trưởng chuyên môn: ____________________", font: "Arial", size: 20 })] })] }];
  return Packer.toBlob(new Document({ sections }));
}

export async function downloadBlueprintXlsx(blueprint: ExamBlueprint, comparison?: BlueprintComparison) { download(await buildBlueprintXlsx(blueprint, comparison), `Ma_tran_${safeName(`${blueprint.subject || "Mon"}${blueprint.grade || ""}_${blueprint.examType || "Kiem_tra"}`)}.xlsx`); }
export async function downloadBlueprintDocx(blueprint: ExamBlueprint, comparison?: BlueprintComparison) { download(await buildBlueprintDocx(blueprint, comparison), `Ma_tran_va_bang_dac_ta_${safeName(`${blueprint.subject || "Mon"}${blueprint.grade || ""}`)}.docx`); }
