"use client";

import type { GeneratedDocument } from "@/lib/types";

export const PRINT_DOCUMENT_KEY = "classora_print_document";

export function printGeneratedDocument(document: GeneratedDocument) {
  try {
    sessionStorage.setItem(PRINT_DOCUMENT_KEY, JSON.stringify(document));
    window.location.assign("/print");
  } catch {
    window.alert("Không thể chuẩn bị tài liệu để in trên trình duyệt này.");
  }
}
