"use client";

import type { GeneratedDocument } from "@/lib/types";

export const ANSWER_SHEET_SOURCE_SESSION_KEY = "soanlab_answer_sheet_source";

export function openAnswerSheet(document: GeneratedDocument, variantCode?: string) {
  sessionStorage.setItem(ANSWER_SHEET_SOURCE_SESSION_KEY, JSON.stringify({ document, variantCode }));
  window.location.assign("/tools/answer-sheet");
}
export function readAnswerSheetSourceSession() {
  try {
    const raw = sessionStorage.getItem(ANSWER_SHEET_SOURCE_SESSION_KEY);
    return raw ? JSON.parse(raw) as { document: GeneratedDocument; variantCode?: string } : null;
  } catch { return null; }
}
