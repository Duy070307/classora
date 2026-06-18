"use client";

export type FormDraft<T = unknown> = {
  toolKey: string;
  updatedAt: string;
  data: T;
};

export const FORM_DRAFT_PREFIX = "classora_form_draft:";

function key(toolKey: string) {
  return `${FORM_DRAFT_PREFIX}${toolKey}`;
}

export function saveFormDraft(toolKey: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const draft: FormDraft = { toolKey, updatedAt: new Date().toISOString(), data };
    localStorage.setItem(key(toolKey), JSON.stringify(draft));
  } catch { /* localStorage có thể bị chặn hoặc đầy. */ }
}

export function loadFormDraft<T>(toolKey: string): FormDraft<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(toolKey));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<FormDraft<T>>;
    if (value.toolKey !== toolKey || typeof value.updatedAt !== "string" || !("data" in value)) return null;
    return value as FormDraft<T>;
  } catch {
    return null;
  }
}

export function clearFormDraft(toolKey: string): void {
  try { localStorage.removeItem(key(toolKey)); } catch { /* Không crash. */ }
}

export function getAllFormDrafts(): FormDraft[] {
  if (typeof window === "undefined") return [];
  const drafts: FormDraft[] = [];
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const storageKey = localStorage.key(index);
      if (!storageKey?.startsWith(FORM_DRAFT_PREFIX)) continue;
      const draft = loadFormDraft(storageKey.slice(FORM_DRAFT_PREFIX.length));
      if (draft) drafts.push(draft);
    }
  } catch { return []; }
  return drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function clearAllFormDrafts(): void {
  getAllFormDrafts().forEach((draft) => clearFormDraft(draft.toolKey));
}

export function getDraftUpdatedTime(toolKey: string): string | null {
  return loadFormDraft(toolKey)?.updatedAt ?? null;
}
