"use client";
import { readJson, readText, STORAGE_KEYS, writeJson, writeText } from "@/lib/storage";

export type MockPlan = "free" | "pro";

const USAGE_KEY = STORAGE_KEYS.usage;
const PLAN_KEY = STORAGE_KEYS.plan;
export const FREE_MONTHLY_LIMIT = 10;

type UsageState = { month: string; count: number };

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function getMockPlan(): MockPlan {
  if (typeof window === "undefined") return "free";
  return readText(PLAN_KEY) === "pro" ? "pro" : "free";
}

export function setMockPlan(plan: MockPlan) {
  writeText(PLAN_KEY, plan);
  window.dispatchEvent(new Event("classora-usage-change"));
}

export function getUsageState(): UsageState {
  if (typeof window === "undefined") return { month: currentMonth(), count: 0 };
  try {
    const parsed = readJson<Partial<UsageState>>(USAGE_KEY, {});
    if (parsed.month !== currentMonth()) return { month: currentMonth(), count: 0 };
    return { month: currentMonth(), count: Number.isFinite(parsed.count) ? Number(parsed.count) : 0 };
  } catch {
    return { month: currentMonth(), count: 0 };
  }
}

export function getUsageCount() {
  return getUsageState().count;
}

export function getRemainingUsage() {
  return getMockPlan() === "pro" ? null : Math.max(0, FREE_MONTHLY_LIMIT - getUsageCount());
}

export function incrementUsage() {
  const next = { month: currentMonth(), count: getUsageCount() + 1 };
  writeJson(USAGE_KEY, next);
  window.dispatchEvent(new CustomEvent("classora-usage-change", { detail: next }));
  if (getMockPlan() === "free" && next.count >= FREE_MONTHLY_LIMIT) {
    window.dispatchEvent(new Event("classora-limit-reached"));
  }
  return next.count;
}
