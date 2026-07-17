"use client";

import type { GeneratedDocument } from "@/lib/types";

export const EXAM_BLUEPRINT_WORKFLOW_SESSION = "soanlab-exam-blueprint-workflow-source";

export type BlueprintSessionPayload = { mode: "from_exam" | "compare" | "edit" | "question_bank"; document?: GeneratedDocument; blueprintDocument?: GeneratedDocument; selectedQuestionIds?: string[] };

export function openExamBlueprint(payload: BlueprintSessionPayload) {
  sessionStorage.setItem(EXAM_BLUEPRINT_WORKFLOW_SESSION, JSON.stringify(payload));
  window.location.assign(`/tools/exam-blueprint?mode=${payload.mode}`);
}

export function readExamBlueprintSession() {
  try {
    const raw = sessionStorage.getItem(EXAM_BLUEPRINT_WORKFLOW_SESSION);
    sessionStorage.removeItem(EXAM_BLUEPRINT_WORKFLOW_SESSION);
    return raw ? JSON.parse(raw) as BlueprintSessionPayload : null;
  } catch { return null; }
}
