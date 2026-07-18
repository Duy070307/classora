"use client";

import { AlignmentType, BorderStyle, Document, HeadingLevel, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { getDocumentSettings } from "@/lib/document-settings";
import { getDocumentHeaderLines } from "@/lib/document-header";
import type { GeneratedDocument } from "@/lib/types";
import { exportOfficialExamDocx } from "@/lib/export-exam-docx";
import { parseDocumentContent } from "@/lib/documents/document-content";
import { normalizeGeneratedDocument } from "@/lib/content/generated-content";
import { containsMathLikeText } from "@/lib/content/math-symbol-normalize";

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

function pngBytes(dataUrl?: string) { if (!dataUrl?.startsWith("data:image/png;base64,")) return null; const raw = atob(dataUrl.slice(dataUrl.indexOf(",") + 1)); return Uint8Array.from(raw, (character) => character.charCodeAt(0)); }

function diagramParagraphs(document: GeneratedDocument) {
  return (document.diagramAssets || []).flatMap((asset) => { const data = pngBytes(asset.pngDataUrl); if (!data) return []; const maxWidth = 560; const ratio = asset.width / Math.max(1, asset.height); const width = ratio >= 1 ? maxWidth : Math.round(360 * ratio); const height = Math.round(width / Math.max(0.2, ratio)); return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 60 }, children: [new ImageRun({ data, type: "png", transformation: { width, height }, altText: { title: asset.altText, description: asset.altText, name: asset.altText } })] }), ...(asset.caption ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: asset.caption, italics: true })] })] : [])]; });
}

export async function exportDocx(document: GeneratedDocument) {
  const cleanDocument = normalizeGeneratedDocument(document);
  if (cleanDocument.type === "exam") {
    await exportOfficialExamDocx(cleanDocument);
    return;
  }
  const blob = await buildGenericDocxBlob(cleanDocument);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(cleanDocument.title) || "soan-lab"}.docx`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function buildGenericDocxBlob(document: GeneratedDocument) {
  const cleanDocument = normalizeGeneratedDocument(document);
  if (cleanDocument.type === "exam") throw new Error("generic_docx_does_not_export_student_exam");
  const settings = getDocumentSettings();
  const fontSize = Number(settings.fontSize) * 2;
  const textRun = (text: string, options: { bold?: boolean; size?: number } = {}) => new TextRun({
    text,
    bold: options.bold,
    font: containsMathLikeText(text) ? "Cambria Math" : settings.fontFamily,
    size: options.size ?? fontSize,
  });
  const contentBlocks = parseDocumentContent(cleanDocument.content).map((block) => {
    if (block.type === "heading") {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 100 },
        children: [textRun(block.text, { bold: true, size: fontSize + 2 })]
      });
    }
    if (block.type === "bullet") {
      return new Paragraph({
        spacing: { after: 70 },
        bullet: { level: 0 },
        children: [textRun(block.text)]
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
          tableHeader: rowIndex === 0,
          cantSplit: true,
          children: row.map((cell) => new TableCell({
            children: [new Paragraph({ children: [textRun(cell, { bold: rowIndex === 0, size: Math.max(fontSize - 2, 18) })] })]
          }))
        }))
      });
    }
    return new Paragraph({
      spacing: { after: 90 },
      children: [textRun(block.text)]
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
            children: [textRun(cleanDocument.title, { bold: true, size: fontSize + 8 })]
          }),
          ...contentBlocks,
          ...diagramParagraphs(cleanDocument)
        ]
      }
    ]
  });

  return Packer.toBlob(doc);
}
