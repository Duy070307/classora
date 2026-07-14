"use client";

import type { GeneratedDocument } from "@/lib/types";

export const EXAM_MIXER_SESSION_KEY = "soanlab-exam-mixer-source";

export function openExamMixer(document: GeneratedDocument) {
  sessionStorage.setItem(EXAM_MIXER_SESSION_KEY, JSON.stringify(document));
  window.location.assign("/tools/exam-mixer");
}

