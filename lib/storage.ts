"use client";

export const STORAGE_KEYS = {
  history: "classora_history",
  templates: "classora_templates",
  settings: "classora_document_settings",
  questions: "classora_question_bank",
  usage: "classora_usage",
  plan: "classora_mock_plan",
  recentTools: "classora_recent_tools",
  favoriteTools: "classora_favorite_tools"
} as const;

export { readJson, readText, removeStored, writeJson, writeText } from "@/lib/safe-storage";

export function isStorageAvailable() {
  if (typeof window === "undefined") return false;
  try {
    const key = "classora_storage_test";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function clearClassoraStorage() {
  if (typeof window === "undefined") return false;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    return true;
  } catch {
    return false;
  }
}
