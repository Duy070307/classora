"use client";

import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { getDocumentSettings } from "@/lib/document-settings";
import { getDocumentHeaderLines } from "@/lib/document-header";
import type { GeneratedDocument } from "@/lib/types";
import { exportOfficialExamDocx } from "@/lib/export-exam-docx";

function safeFileName(value: string) {
  return value
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function exportDocx(document: GeneratedDocument) {
  if (document.type === "exam") {
    await exportOfficialExamDocx(document);
    return;
  }
  const settings = getDocumentSettings();
  const fontSize = Number(settings.fontSize) * 2;
  const headingPattern = /^(#{1,3}\s+|HEADER|ĐỀ KIỂM TRA|PHIẾU HỌC TẬP|NHẬN XÉT|I\.|II\.|III\.|IV\.|V\.|VI\.|PHẦN|ĐÁP ÁN|THANG ĐIỂM|MA TRẬN|MỤC TIÊU|KIẾN THỨC|BÀI TẬP|LƯU Ý|KẾ HOẠCH|BIÊN BẢN|TRỘN MÃ ĐỀ|DÀN Ý|TÓM TẮT|SƠ ĐỒ)/i;
  const paragraphs = document.content.split("\n").map((line) => {
    const text = line.trim().replace(/^#{1,3}\s+/, "");
    if (!text) return new Paragraph({ text: "" });
    if (headingPattern.test(text)) {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 100 },
        children: [new TextRun({ text, bold: true, font: settings.fontFamily, size: fontSize + 2 })]
      });
    }
    if (/^[-*•]\s+/.test(text)) {
      return new Paragraph({
        spacing: { after: 70 },
        children: [new TextRun({ text: `• ${text.replace(/^[-*•]\s+/, "")}`, font: settings.fontFamily, size: fontSize })]
      });
    }
    return new Paragraph({
      spacing: { after: 90 },
      children: [new TextRun({ text, font: settings.fontFamily, size: fontSize })]
    });
  });
  const headerLines = getDocumentHeaderLines(settings);

  const doc = new Document({
    sections: [
      {
        children: [
          ...headerLines.map((line) => new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: line, font: settings.fontFamily, size: fontSize })]
          })),
          ...(headerLines.length ? [new Paragraph({ text: "" })] : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: document.title, bold: true, size: fontSize + 8, font: settings.fontFamily })]
          }),
          ...paragraphs
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(document.title) || "soan-lab"}.docx`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
