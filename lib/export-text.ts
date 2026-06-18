"use client";

import { getDocumentSettings } from "@/lib/document-settings";
import { getDocumentHeaderLines } from "@/lib/document-header";
import type { GeneratedDocument } from "@/lib/types";

const warning = "Nội dung hiện được tạo bằng AI mô phỏng trong bản demo. Giáo viên cần kiểm tra lại trước khi sử dụng.";

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
  const lines = header(document);
  const titleIndex = lines.indexOf(document.title);
  const content = [
    ...lines.map((line, index) => index === titleIndex ? `# ${line}` : line),
    "",
    document.content || "(Tài liệu chưa có nội dung.)",
    "",
    "---",
    warning
  ].join("\n");
  download(`${cleanFileName(document.title)}.md`, content, "text/markdown;charset=utf-8");
}

export function downloadTxt(document: GeneratedDocument) {
  const content = [...header(document), "", document.content || "(Tài liệu chưa có nội dung.)", "", warning].join("\n");
  download(`${cleanFileName(document.title)}.txt`, content, "text/plain;charset=utf-8");
}
