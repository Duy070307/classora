"use client";

import JSZip from "jszip";
import QRCode from "qrcode";
import type { Content, ContentCanvas, ContentImage, ContentText, TDocumentDefinitions } from "pdfmake/interfaces";
import { buildAnswerSheetLayout } from "@/lib/answer-sheet/layout";
import type { AnswerSheetLayout, AnswerSheetTemplate, LayoutPrimitive } from "@/lib/answer-sheet/types";

function safeName(value: string) {
  return value.replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 90) || "Phieu_tra_loi";
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function primitiveContent(item: LayoutPrimitive): Content {
  if (item.kind === "text") return { text: item.text, absolutePosition: { x: item.x, y: item.y }, width: item.width, fontSize: item.size, bold: item.bold, alignment: item.align, color: "#111827", lineHeight: 1 } as ContentText;
  if (item.kind === "line") return { absolutePosition: { x: 0, y: 0 }, canvas: [{ type: "line", x1: item.x1, y1: item.y1, x2: item.x2, y2: item.y2, lineWidth: item.width || 0.7, dash: item.dash ? { length: 4, space: 3 } : undefined, lineColor: "#111827" }] } as ContentCanvas;
  if (item.kind === "circle") return { absolutePosition: { x: 0, y: 0 }, canvas: [{ type: "ellipse", x: item.x, y: item.y, r1: item.radius, r2: item.radius, lineWidth: item.lineWidth || 0.8, lineColor: "#111827", color: item.fill }] } as ContentCanvas;
  return { absolutePosition: { x: 0, y: 0 }, canvas: [{ type: "rect", x: item.x, y: item.y, w: item.width, h: item.height, r: item.radius, lineWidth: item.lineWidth ?? 0.7, lineColor: item.lineWidth === 0 ? item.fill : "#111827", color: item.fill }] } as ContentCanvas;
}

async function qrImages(layout: AnswerSheetLayout) {
  return Promise.all(layout.pages.map(async (page) => page.qrPayload ? QRCode.toDataURL(page.qrPayload, { errorCorrectionLevel: "M", margin: 0, width: 240, color: { dark: "#000000", light: "#ffffff" } }) : null));
}

async function documentDefinition(templates: AnswerSheetTemplate[]) {
  const layouts = templates.map(buildAnswerSheetLayout);
  const allPages = layouts.flatMap((layout, templateIndex) => layout.pages.map((page) => ({ page, template: templates[templateIndex], layout })));
  const qrSets = await Promise.all(layouts.map(qrImages));
  const content: Content[] = [];
  let globalPage = 0;
  layouts.forEach((layout, templateIndex) => {
    layout.pages.forEach((page, pageIndex) => {
      content.push({ text: "", pageBreak: globalPage ? "before" : undefined, margin: 0, fontSize: 1 } as ContentText);
      page.primitives.forEach((primitive) => content.push(primitiveContent(primitive)));
      const qr = qrSets[templateIndex][pageIndex];
      if (qr) {
        page.recognitionRegions.filter((region) => region.type === "qr").forEach((region) => content.push({ image: qr, absolutePosition: { x: region.boundingBox.x, y: region.boundingBox.y }, width: region.boundingBox.width, height: region.boundingBox.height } as ContentImage));
      }
      globalPage += 1;
    });
  });
  const first = allPages[0]?.page;
  if (!first) throw new Error("answer_sheet_empty");
  return {
    pageSize: { width: first.width, height: first.height },
    pageMargins: [0, 0, 0, 0],
    defaultStyle: { font: "Roboto", fontSize: 9 },
    info: { title: templates.length === 1 ? templates[0].title : "Bộ phiếu trả lời SOẠN LAB", author: "SOẠN LAB", subject: "Phiếu trả lời", keywords: "answer sheet" },
    content,
  } as TDocumentDefinitions;
}

async function pdfMakeClient() {
  const [pdfMakeModule, fontsModule] = await Promise.all([import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")]);
  const pdfMake = pdfMakeModule.default as typeof pdfMakeModule.default & { vfs: Record<string, string> };
  const fonts = fontsModule.default as unknown as Record<string, string> & { pdfMake?: { vfs?: Record<string, string> } };
  pdfMake.vfs = fonts.pdfMake?.vfs || fonts;
  return pdfMake;
}

export async function buildAnswerSheetPdfBlob(templates: AnswerSheetTemplate[]) {
  const pdfMake = await pdfMakeClient();
  const definition = await documentDefinition(templates);
  return pdfMake.createPdf(definition).getBlob();
}

export async function downloadAnswerSheetPdf(template: AnswerSheetTemplate) {
  const blob = await buildAnswerSheetPdfBlob([template]);
  download(blob, `${safeName(`Phieu_tra_loi_${template.subject || "Mon"}${template.grade || ""}${template.variantCode ? `_Ma${template.variantCode}` : ""}`)}.pdf`);
}

export async function downloadCombinedAnswerSheetPdf(templates: AnswerSheetTemplate[]) {
  download(await buildAnswerSheetPdfBlob(templates), `${safeName(`Bo_phieu_tra_loi_${templates[0]?.subject || "SoanLab"}`)}.pdf`);
}

export async function buildAnswerSheetZip(templates: AnswerSheetTemplate[]) {
  const zip = new JSZip();
  for (const template of templates) {
    const name = safeName(`Phieu_tra_loi_${template.subject || "Mon"}${template.grade || ""}${template.variantCode ? `_Ma${template.variantCode}` : ""}`);
    zip.file(`${name}.pdf`, await (await buildAnswerSheetPdfBlob([template])).arrayBuffer());
  }
  zip.file("Bo_phieu_tra_loi.pdf", await (await buildAnswerSheetPdfBlob(templates)).arrayBuffer());
  zip.file("HUONG_DAN.txt", "SOẠN LAB\n\nIn đúng tỉ lệ 100%, không chọn tùy chọn co giãn theo trang. Phiếu không chứa đáp án. Giáo viên cần rà soát các ô tô mờ, tô nhiều lựa chọn hoặc sửa đáp án.\n");
  return zip.generateAsync({ type: "blob" });
}

export async function downloadAnswerSheetZip(templates: AnswerSheetTemplate[]) {
  download(await buildAnswerSheetZip(templates), `${safeName(`Phieu_tra_loi_${templates.length}_ma_de`)}.zip`);
}
