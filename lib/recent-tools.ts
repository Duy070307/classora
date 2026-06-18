"use client";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage";

const RECENT_TOOLS_KEY = STORAGE_KEYS.recentTools;

export type RecentTool = {
  title: string;
  href: string;
  usedAt: string;
  useCount: number;
};

export function getRecentTools(): RecentTool[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = readJson<unknown>(RECENT_TOOLS_KEY, []);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is RecentTool => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<RecentTool>;
      return typeof candidate.title === "string" && typeof candidate.href === "string" && typeof candidate.usedAt === "string";
    }).map((item) => ({ ...item, useCount: typeof item.useCount === "number" ? item.useCount : 1 }));
  } catch {
    return [];
  }
}

export function saveRecentTool(tool: { title: string; href: string }) {
  const current = getRecentTools();
  const existing = current.find((item) => item.href === tool.href);
  const next = [{ ...tool, usedAt: new Date().toISOString(), useCount: (existing?.useCount || 0) + 1 }, ...current.filter((item) => item.href !== tool.href)].slice(0, 12);
  writeJson(RECENT_TOOLS_KEY, next);
  window.dispatchEvent(new Event("classora-recent-tools-change"));
}

export function clearRecentTools() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_TOOLS_KEY);
  window.dispatchEvent(new Event("classora-recent-tools-change"));
}
