"use client";

import { useEffect, useState } from "react";
import { FREE_MONTHLY_LIMIT, getMockPlan, getRemainingUsage, getUsageCount, type MockPlan } from "@/lib/usage";

export function UsageBadge({ compact = false }: { compact?: boolean }) {
  const [count, setCount] = useState(0);
  const [plan, setPlan] = useState<MockPlan>("free");

  useEffect(() => {
    const refresh = () => { setCount(getUsageCount()); setPlan(getMockPlan()); };
    queueMicrotask(refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("classora-usage-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("classora-usage-change", refresh); };
  }, []);

  const remaining = getRemainingUsage();
  return (
    <div className={`inline-flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 font-semibold ${compact ? "text-xs" : "text-sm"} ${plan === "pro" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}>
      {plan === "pro" ? "Cá nhân" : "Miễn phí"}
      <span className="rounded bg-white px-2 py-0.5">{plan === "pro" ? "Không giới hạn" : `${remaining}/${FREE_MONTHLY_LIMIT} lượt còn lại (${count} đã dùng)`}</span>
    </div>
  );
}
