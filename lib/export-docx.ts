"use client";

import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { GeneratedDocument } from "@/lib/types";

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
  const headingPattern = /^(HEADER|ĐỀ KIỂM TRA|PHIẾU HỌC TẬP|NHẬN XÉT HỌC SINH|I\.|II\.|III\.|IV\.|V\.|VI\.|PHẦN|ĐÁP ÁN|THANG ĐIỂM|MA TRẬN|MỤC TIÊU|KIẾN THỨC|BÀI TẬP|LƯU Ý)/i;
  const paragraphs = document.content.split("\n").map((line) => {
    const text = line.trim();
    if (!text) return new Paragraph({ text: "" });
    if (headingPattern.test(text)) {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 100 },
        children: [new TextRun({ text, bold: true })]
      });
    }
    return new Paragraph({
      spacing: { after: 90 },
      children: [new TextRun({ text })]
    });
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: document.title, bold: true, size: 34 })]
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
  link.download = `${safeFileName(document.title) || "classora"}.docx`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
