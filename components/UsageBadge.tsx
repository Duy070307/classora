"use client";

import { useEffect, useState } from "react";
import { getUsageCount } from "@/lib/usage";

export function UsageBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    queueMicrotask(() => setCount(getUsageCount()));
    const onStorage = () => setCount(getUsageCount());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
      Free plan
      <span className="rounded bg-white px-2 py-0.5 text-blue-700">{count}/10 lượt tạo/tháng</span>
    </div>
  );
}
