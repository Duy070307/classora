"use client";

import type { GeneratedDocument } from "@/lib/types";

export const ANSWER_SOLUTIONS_SESSION_KEY = "soanlab-answer-solutions-source";

export function openAnswerSolutions(document: GeneratedDocument) {
  sessionStorage.setItem(ANSWER_SOLUTIONS_SESSION_KEY, JSON.stringify(document));
  window.location.assign("/tools/answer-solutions");
}

