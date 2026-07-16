"use client";

import type { GeneratedDocument } from "@/lib/types";

export const GRADING_SOURCE_SESSION_KEY = "soanlab_grading_source";

export function openGradingAssistant(document: GeneratedDocument) {
  sessionStorage.setItem(GRADING_SOURCE_SESSION_KEY, JSON.stringify(document));
  window.location.assign("/tools/grading-assistant");
}
export function readGradingSourceSession() {
  try {
    const value = sessionStorage.getItem(GRADING_SOURCE_SESSION_KEY);
    return value ? JSON.parse(value) as GeneratedDocument : null;
  } catch { return null; }
}
