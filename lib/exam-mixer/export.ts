"use client";

import JSZip from "jszip";
import { AlignmentType, BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { buildOfficialExamDocxBlob } from "@/lib/export-exam-docx";
import { variantComparisonRows } from "@/lib/exam-mixer/engine";
import { variantToDocument } from "@/lib/exam-mixer/document";
import type { ExamVariant, ExamVariantSet } from "@/lib/exam-mixer/types";

const border = { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

export function safeExamFileName(value: string) {
  return value.replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "SoanLab";
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = safeExamFileName(name.replace(/\.[^.]+$/, "")) + (name.match(/\.[^.]+$/)?.[0] || "");
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function cell(text: string, header = false) {
  return new TableCell({ borders, shading: header ? { fill: "EFF6FF" } : undefined, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: header, font: "Times New Roman", size: 22 })] })] });
}

async function answerKeyBlob(set: ExamVariantSet, variants: ExamVariant[]) {
  const children: (Paragraph | Table)[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ĐÁP ÁN BỘ MÃ ĐỀ", bold: true, font: "Times New Roman", size: 30 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: set.sourceExamTitle, bold: true, font: "Times New Roman", size: 26 })] }),
  ];
  for (const variant of variants) {
    children.push(new Paragraph({ spacing: { before: 240, after: 100 }, children: [new TextRun({ text: `MÃ ĐỀ: ${variant.code}`, bold: true, font: "Times New Roman", size: 26 })] }));
    for (const part of variant.exam.parts) {
      children.push(new Paragraph({ spacing: { before: 100, after: 60 }, children: [new TextRun({ text: part.title, bold: true, font: "Times New Roman", size: 23 })] }));
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders, rows: [
        new TableRow({ children: part.questions.map((question) => cell(String(question.number), true)) }),
        new TableRow({ children: part.questions.map((question) => cell(question.answer)) }),
      ] }));
    }
  }
  return Packer.toBlob(new Document({ sections: [{ children }] }));
}

async function comparisonBlob(set: ExamVariantSet) {
  const rows = variantComparisonRows(set);
  return Packer.toBlob(new Document({ sections: [{ children: [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BẢNG ĐỐI CHIẾU MÃ ĐỀ", bold: true, font: "Times New Roman", size: 30 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: set.sourceExamTitle, font: "Times New Roman", size: 24 })] }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders, rows: [
      new TableRow({ children: [cell("Câu gốc", true), ...set.variants.map((variant) => cell(`Mã ${variant.code}`, true))] }),
      ...rows.map((row) => new TableRow({ children: [cell(row.original), ...set.variants.map((variant) => cell(String(row.variants[variant.code] || "-")))] })),
    ] }),
  ] }] }));
}

export async function exportVariantWord(set: ExamVariantSet, variant: ExamVariant) {
  const blob = await buildOfficialExamDocxBlob(variantToDocument(set, variant), { includeTeacher: false, preserveExamCode: true });
  downloadBlob(blob, `De_${variant.exam.metadata.subject}_${variant.exam.metadata.grade}_Ma${variant.code}.docx`);
}

export async function exportVariantAnswerKey(set: ExamVariantSet, variant: ExamVariant) {
  downloadBlob(await answerKeyBlob(set, [variant]), `Dap_an_Ma${variant.code}.docx`);
}

export async function exportCombinedAnswerKey(set: ExamVariantSet) {
  downloadBlob(await answerKeyBlob(set, set.variants), "Dap_an_Tong_hop.docx");
}

export async function exportComparison(set: ExamVariantSet) {
  downloadBlob(await comparisonBlob(set), "Bang_doi_chieu_ma_de.docx");
}

export async function buildVariantSetZip(set: ExamVariantSet) {
  const zip = new JSZip();
  for (const variant of set.variants) {
    zip.file(`De_Ma${variant.code}.docx`, await (await buildOfficialExamDocxBlob(variantToDocument(set, variant), { includeTeacher: false, preserveExamCode: true })).arrayBuffer());
    zip.file(`Dap_an_Ma${variant.code}.docx`, await (await answerKeyBlob(set, [variant])).arrayBuffer());
  }
  zip.file("Dap_an_Tong_hop.docx", await (await answerKeyBlob(set, set.variants)).arrayBuffer());
  zip.file("Bang_doi_chieu_ma_de.docx", await (await comparisonBlob(set)).arrayBuffer());
  zip.file("Thong_tin_bo_ma.txt", `SOẠN LAB\nĐề gốc: ${set.sourceExamTitle}\nCác mã: ${set.variants.map((variant) => variant.code).join(", ")}\nHạt trộn: ${set.seed}\nThời điểm tạo: ${set.createdAt}\n`);
  return zip.generateAsync({ type: "blob" });
}

export async function exportVariantSetZip(set: ExamVariantSet) {
  downloadBlob(await buildVariantSetZip(set), `SoanLab_${set.sourceExamTitle}_${set.variantCount}Ma.zip`);
}
