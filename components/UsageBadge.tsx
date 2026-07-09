"use client";

import { useEffect, useState } from "react";
import { FREE_MONTHLY_LIMIT, getRemainingUsage, getUsageCount } from "@/lib/usage";

export function UsageBadge({ compact = false }: { compact?: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(getUsageCount());
    queueMicrotask(refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("classora-usage-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("classora-usage-change", refresh); };
  }, []);

  const remaining = getRemainingUsage();
  return (
    <div className={`inline-flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-800 ${compact ? "text-xs" : "text-sm"}`}>
      Lượt tạo nội dung
      <span className="rounded bg-white px-2 py-0.5">{remaining}/${FREE_MONTHLY_LIMIT} lượt còn lại ({count} đã dùng)</span>
    </div>
  );
}
