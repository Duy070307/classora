"use client";

export type MockPlan = "free" | "pro";

const USAGE_KEY = "classora_usage";
const PLAN_KEY = "classora_mock_plan";
export const FREE_MONTHLY_LIMIT = 10;

type UsageState = { month: string; count: number };

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function getMockPlan(): MockPlan {
  if (typeof window === "undefined") return "free";
  return localStorage.getItem(PLAN_KEY) === "pro" ? "pro" : "free";
}

export function setMockPlan(plan: MockPlan) {
  localStorage.setItem(PLAN_KEY, plan);
  window.dispatchEvent(new Event("classora-usage-change"));
}

export function getUsageState(): UsageState {
  if (typeof window === "undefined") return { month: currentMonth(), count: 0 };
  try {
    const parsed = JSON.parse(localStorage.getItem(USAGE_KEY) || "{}") as Partial<UsageState>;
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
  localStorage.setItem(USAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("classora-usage-change", { detail: next }));
  if (getMockPlan() === "free" && next.count >= FREE_MONTHLY_LIMIT) {
    window.dispatchEvent(new Event("classora-limit-reached"));
  }
  return next.count;
}
