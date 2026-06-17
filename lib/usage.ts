"use client";

const USAGE_KEY = "classora_usage_count";

export function getUsageCount() {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(USAGE_KEY) || "0");
}

export function incrementUsage() {
  const next = getUsageCount() + 1;
  localStorage.setItem(USAGE_KEY, String(next));
  return next;
}
