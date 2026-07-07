"use client";

import { getDocumentSettings } from "@/lib/document-settings";
import { getDocumentHeaderLines } from "@/lib/document-header";
import type { GeneratedDocument } from "@/lib/types";
import { normalizeGeneratedDocument } from "@/lib/content/generated-content";

const warning = "Nội dung được tạo tự động và cần giáo viên kiểm tra, chỉnh sửa trước khi sử dụng chính thức.";

export function cleanFileName(title: string) {
  return title.replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "").toLowerCase() || "soan-lab-document";
}

function header(document: GeneratedDocument) {
  const settings = getDocumentSettings();
  return [
    ...getDocumentHeaderLines(settings),
    document.title,
    `Ngày tạo: ${new Date(document.createdAt).toLocaleString("vi-VN")}`
  ].filter(Boolean);
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type }));
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadMarkdown(document: GeneratedDocument) {
  const cleanDocument = normalizeGeneratedDocument(document);
  const lines = header(cleanDocument);
  const titleIndex = lines.indexOf(cleanDocument.title);
  const content = [
    ...lines.map((line, index) => index === titleIndex ? `# ${line}` : line),
    "",
    cleanDocument.content || "(Tài liệu chưa có nội dung.)",
    "",
    "---",
    warning
  ].join("\n");
  download(`${cleanFileName(cleanDocument.title)}.md`, content, "text/markdown;charset=utf-8");
}

export function downloadTxt(document: GeneratedDocument) {
  const cleanDocument = normalizeGeneratedDocument(document);
  const content = [...header(cleanDocument), "", cleanDocument.content || "(Tài liệu chưa có nội dung.)", "", warning].join("\n");
  download(`${cleanFileName(cleanDocument.title)}.txt`, content, "text/plain;charset=utf-8");
}
