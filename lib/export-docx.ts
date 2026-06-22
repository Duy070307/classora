"use client";

import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { getDocumentSettings } from "@/lib/document-settings";
import { getDocumentHeaderLines } from "@/lib/document-header";
import type { GeneratedDocument } from "@/lib/types";
import { exportOfficialExamDocx } from "@/lib/export-exam-docx";
import { parseDocumentContent } from "@/lib/documents/document-content";

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
  const contentBlocks = parseDocumentContent(document.content).map((block) => {
    if (block.type === "heading") {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 100 },
        children: [new TextRun({ text: block.text, bold: true, font: settings.fontFamily, size: fontSize + 2 })]
      });
    }
    if (block.type === "bullet") {
      return new Paragraph({
        spacing: { after: 70 },
        bullet: { level: 0 },
        children: [new TextRun({ text: block.text, font: settings.fontFamily, size: fontSize })]
      });
    }
    if (block.type === "table") {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "B0B0B0" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "B0B0B0" }
        },
        rows: block.rows.map((row, rowIndex) => new TableRow({
          children: row.map((cell) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: cell, bold: rowIndex === 0, font: settings.fontFamily, size: Math.max(fontSize - 2, 18) })] })]
          }))
        }))
      });
    }
    return new Paragraph({
      spacing: { after: 90 },
      children: [new TextRun({ text: block.text, font: settings.fontFamily, size: fontSize })]
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
          ...contentBlocks
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
