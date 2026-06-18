"use client";

import { STORAGE_KEYS } from "@/lib/storage";

export type ClassoraBackup = {
  version: string;
  exportedAt: string;
  app: "Classora";
  data: {
    history?: unknown;
    templates?: unknown;
    settings?: unknown;
    questionBank?: unknown;
    usage?: unknown;
    demoData?: unknown;
    other?: Record<string, unknown>;
  };
};

export const CLASSORA_BACKUP_VERSION = "1.0";

function requireStorage() {
  if (typeof window === "undefined") throw new Error("localStorage không khả dụng.");
  return window.localStorage;
}

function readValue(key: string): unknown {
  try {
    const raw = requireStorage().getItem(key);
    if (raw === null) return undefined;
    try { return JSON.parse(raw); } catch { return raw; }
  } catch {
    return undefined;
  }
}

function writeValue(key: string, value: unknown) {
  if (value === undefined) return;
  const storage = requireStorage();
  storage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
}

export function getClassoraStorageKeys(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return Object.values(STORAGE_KEYS).filter((key) => localStorage.getItem(key) !== null);
  } catch {
    return [];
  }
}

export function exportAllLocalData(): ClassoraBackup {
  return {
    version: CLASSORA_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: "Classora",
    data: {
      history: readValue(STORAGE_KEYS.history),
      templates: readValue(STORAGE_KEYS.templates),
      settings: readValue(STORAGE_KEYS.settings),
      questionBank: readValue(STORAGE_KEYS.questions),
      usage: readValue(STORAGE_KEYS.usage),
      demoData: readValue(STORAGE_KEYS.plan),
      other: { recentTools: readValue(STORAGE_KEYS.recentTools) }
    }
  };
}

export function downloadLocalDataBackup(): void {
  const backup = exportAllLocalData();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `classora-backup-${backup.exportedAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function validateBackupJson(data: unknown): data is ClassoraBackup {
  if (!data || typeof data !== "object") return false;
  const backup = data as Partial<ClassoraBackup>;
  return (
    backup.app === "Classora" &&
    typeof backup.version === "string" &&
    typeof backup.exportedAt === "string" &&
    Boolean(backup.data && typeof backup.data === "object" && !Array.isArray(backup.data))
  );
}

export function importLocalDataBackup(backup: ClassoraBackup): void {
  if (!validateBackupJson(backup)) throw new Error("File không phải bản sao lưu Classora hợp lệ.");
  Object.values(STORAGE_KEYS).forEach(remove);
  writeValue(STORAGE_KEYS.history, backup.data.history);
  writeValue(STORAGE_KEYS.templates, backup.data.templates);
  writeValue(STORAGE_KEYS.settings, backup.data.settings);
  writeValue(STORAGE_KEYS.questions, backup.data.questionBank);
  writeValue(STORAGE_KEYS.usage, backup.data.usage);
  writeValue(STORAGE_KEYS.plan, backup.data.demoData);
  writeValue(STORAGE_KEYS.recentTools, backup.data.other?.recentTools);
  window.dispatchEvent(new Event("classora-usage-change"));
}

function remove(key: string) {
  try { requireStorage().removeItem(key); } catch { /* Không crash nếu storage bị chặn. */ }
}

export function clearHistory(): void { remove(STORAGE_KEYS.history); }
export function clearTemplates(): void { remove(STORAGE_KEYS.templates); }
export function clearQuestionBank(): void { remove(STORAGE_KEYS.questions); }
export function clearSettings(): void { remove(STORAGE_KEYS.settings); }
export function clearUsage(): void {
  remove(STORAGE_KEYS.usage);
  window.dispatchEvent(new Event("classora-usage-change"));
}
export function clearAllClassoraData(): void {
  Object.values(STORAGE_KEYS).forEach(remove);
  window.dispatchEvent(new Event("classora-usage-change"));
}
