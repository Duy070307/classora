"use client";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage";

const RECENT_TOOLS_KEY = STORAGE_KEYS.recentTools;

export type RecentTool = {
  title: string;
  href: string;
  usedAt: string;
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
    });
  } catch {
    return [];
  }
}

export function saveRecentTool(tool: Omit<RecentTool, "usedAt">) {
  const next = [{ ...tool, usedAt: new Date().toISOString() }, ...getRecentTools().filter((item) => item.href !== tool.href)].slice(0, 8);
  writeJson(RECENT_TOOLS_KEY, next);
}
