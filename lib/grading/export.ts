"use client";

import JSZip from "jszip";
import { buildGenericDocxBlob } from "@/lib/export-docx";
import { gradingJobToDocument } from "@/lib/grading/history";
import { classSummary } from "@/lib/grading/engine";
import type { GradingJob, GradingSubmission } from "@/lib/grading/types";
import type { GeneratedDocument } from "@/lib/types";

function safeName(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "soan-lab"; }
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1200); }
function csvCell(value: unknown) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }

export function gradingRows(job: GradingJob) {
  return job.submissions.map((submission, index) => ({
    STT: index + 1,
    "Họ và tên": submission.student.displayName || submission.teacherLabel || `Bài làm ${String(index + 1).padStart(2, "0")}`,
    "Mã học sinh": submission.student.studentCode || "",
    Lớp: submission.student.className || "",
    "Mã đề": submission.examCode || "",
    Điểm: submission.gradingResult?.totalScore ?? "",
    "Phần I": submission.gradingResult?.sectionScores.multiple_choice ?? "",
    "Phần II": submission.gradingResult?.sectionScores.true_false ?? "",
    "Phần III": submission.gradingResult?.sectionScores.short_answer ?? "",
    "Số câu đúng": submission.gradingResult?.correctCount ?? "",
    "Số câu sai": submission.gradingResult?.incorrectCount ?? "",
    "Số câu bỏ trống": submission.gradingResult?.blankCount ?? "",
    "Cần rà soát": submission.gradingResult?.unresolvedCount ?? "",
    "Nhận xét": submission.gradingResult?.overallFeedback || "",
  }));
}

export function buildGradingCsvBlob(job: GradingJob) {
  const rows = gradingRows(job); const headers = Object.keys(rows[0] || { STT: "" });
  const csv = `\uFEFF${headers.map(csvCell).join(",")}\r\n${rows.map((row) => headers.map((header) => csvCell((row as Record<string, unknown>)[header])).join(",")).join("\r\n")}`;
  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}

export function exportGradingCsv(job: GradingJob) {
  download(buildGradingCsvBlob(job), `${safeName(job.title)}.csv`);
}

function xml(value: unknown) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
export async function buildGradingXlsxBlob(job: GradingJob) {
  const rows = gradingRows(job); const headers = Object.keys(rows[0] || { STT: "" });
  const sheetRows = [headers, ...rows.map((row) => headers.map((header) => (row as Record<string, unknown>)[header]))].map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((cell, columnIndex) => { const ref = `${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`; return typeof cell === "number" ? `<c r="${ref}"><v>${cell}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${xml(cell)}</t></is></c>`; }).join("")}</row>`).join("");
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Bảng điểm" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`);
  zip.file("xl/worksheets/sheet1.xml", `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function exportGradingXlsx(job: GradingJob) {
  download(await buildGradingXlsxBlob(job), `${safeName(job.title)}.xlsx`);
}

export function gradingReportDocument(job: GradingJob): GeneratedDocument {
  const summary = classSummary(job);
  const table = gradingRows(job).map((row) => [row.STT, row["Họ và tên"], row["Mã đề"], row.Điểm, row["Cần rà soát"]]);
  return { ...gradingJobToDocument(job), id: `${job.id}-report`, type: "grading-report", title: `Báo cáo chấm bài · ${job.source.title}`, content: `# TỔNG HỢP\n\n- Tổng số bài: ${summary.total}\n- Đã chấm: ${summary.graded}\n- Cần rà soát: ${summary.needsReview}\n- Điểm trung bình: ${summary.average}\n- Điểm cao nhất: ${summary.highest}\n- Điểm thấp nhất: ${summary.lowest}\n\n| STT | Học sinh | Mã đề | Điểm | Cần rà soát |\n|---|---|---|---|---|\n${table.map((row) => `| ${row.join(" | ")} |`).join("\n")}\n\n# CÂU CẦN LƯU Ý\n\n${summary.questions.slice(0, 10).map((item) => `- Câu ${item.number}: ${item.correctPercentage}% trả lời đúng.`).join("\n") || "Chưa có dữ liệu."}` };
}

export function studentResultDocument(job: GradingJob, submission: GradingSubmission): GeneratedDocument {
  const name = submission.student.displayName || submission.teacherLabel || "Bài làm"; const result = submission.gradingResult;
  const details = result?.questionResults.map((item) => `| ${item.questionNumber} | ${item.status === "correct" ? "Đúng" : item.status === "incorrect" ? "Sai" : item.status === "blank" ? "Bỏ trống" : "Cần kiểm tra"} | ${item.awardedScore}/${item.maximumScore} |`).join("\n") || "";
  return { id: `${job.id}-${submission.id}`, title: `Phiếu kết quả · ${name}`, type: "grading-report", createdAt: new Date().toISOString(), folder: "Đề kiểm tra", content: `# PHIẾU KẾT QUẢ\n\n- Học sinh: ${name}\n- Lớp: ${submission.student.className || "—"}\n- Mã đề: ${submission.examCode || "—"}\n- Điểm: ${result?.totalScore ?? "Chưa xác nhận"}/${result?.maximumScore ?? job.settings.maximumScore}\n\n| Câu | Kết quả | Điểm |\n|---|---|---|\n${details}\n\n# NHẬN XÉT\n\n${result?.overallFeedback || "Giáo viên chưa thêm nhận xét."}` };
}

export async function exportGradingDocx(job: GradingJob) { download(await buildGenericDocxBlob(gradingReportDocument(job)), `${safeName(job.title)}.docx`); }
export async function exportStudentZip(job: GradingJob) { const zip = new JSZip(); for (const submission of job.submissions.filter((item) => item.gradingResult?.confirmedByTeacher)) { const doc = studentResultDocument(job, submission); zip.file(`${safeName(doc.title)}.docx`, await buildGenericDocxBlob(doc)); } download(await zip.generateAsync({ type: "blob" }), `${safeName(job.title)}-phieu-ket-qua.zip`); }
