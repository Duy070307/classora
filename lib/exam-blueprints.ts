"use client";

import type { ExamBlueprint } from "@/lib/exam-source/types";
import { readJson, writeJson } from "@/lib/storage";

const KEY = "soanlab-exam-blueprints";

export type SavedExamBlueprint = {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  grade?: string;
  sourceType: ExamBlueprint["sourceType"];
  blueprint: ExamBlueprint;
  createdAt: string;
  updatedAt: string;
};

export function getExamBlueprints() {
  const items = readJson<unknown>(KEY, []);
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is SavedExamBlueprint => Boolean(item && typeof item === "object" && typeof (item as SavedExamBlueprint).id === "string" && (item as SavedExamBlueprint).blueprint));
}

export function saveExamBlueprint(item: SavedExamBlueprint) {
  writeJson(KEY, [item, ...getExamBlueprints().filter((current) => current.id !== item.id)]);
  import("@/lib/data/exam-blueprints-store").then(({ saveExamBlueprintToCloud }) => saveExamBlueprintToCloud(item)).catch(() => undefined);
}

export function createSavedExamBlueprint(name: string, blueprint: ExamBlueprint, description = ""): SavedExamBlueprint {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name, description, subject: blueprint.subject, grade: blueprint.grade, sourceType: blueprint.sourceType, blueprint, createdAt: now, updatedAt: now };
}

export const EXAM_BLUEPRINT_SESSION_KEY = "soanlab-exam-blueprint-prefill";

