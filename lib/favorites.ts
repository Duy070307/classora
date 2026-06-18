"use client";

import { readJson, STORAGE_KEYS, writeJson, removeStored } from "@/lib/storage";

const KEY = STORAGE_KEYS.favoriteTools;

export function getFavoriteTools(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = readJson<unknown>(KEY, []);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function addFavoriteTool(toolHref: string) {
  const next = Array.from(new Set([toolHref, ...getFavoriteTools()]));
  writeJson(KEY, next);
  window.dispatchEvent(new Event("classora-favorites-change"));
}

export function removeFavoriteTool(toolHref: string) {
  writeJson(KEY, getFavoriteTools().filter((href) => href !== toolHref));
  window.dispatchEvent(new Event("classora-favorites-change"));
}

export function toggleFavoriteTool(toolHref: string) {
  if (isFavoriteTool(toolHref)) removeFavoriteTool(toolHref);
  else addFavoriteTool(toolHref);
}

export function isFavoriteTool(toolHref: string) {
  return getFavoriteTools().includes(toolHref);
}

export function clearFavoriteTools() {
  removeStored(KEY);
  window.dispatchEvent(new Event("classora-favorites-change"));
}
