"use client";

import { useEffect, useState } from "react";
import { getMockPlan, setMockPlan, type MockPlan } from "@/lib/usage";

export function PlanSelector() {
  const [plan, setPlan] = useState<MockPlan>("free");
  useEffect(() => queueMicrotask(() => setPlan(getMockPlan())), []);
  function change(next: MockPlan) { setPlan(next); setMockPlan(next); }
  return (
    <div>
      <p className="label">Chế độ sử dụng trên trình duyệt này</p>
      <div className="mt-2 inline-flex rounded-md border border-line bg-slate-50 p-1">
        <button type="button" onClick={() => change("free")} className={`rounded px-4 py-2 text-sm font-semibold ${plan === "free" ? "bg-white text-brand shadow-sm" : "text-muted"}`}>Miễn phí</button>
        <button type="button" onClick={() => change("pro")} className={`rounded px-4 py-2 text-sm font-semibold ${plan === "pro" ? "bg-blue-600 text-white shadow-sm" : "text-muted"}`}>Cá nhân</button>
      </div>
      <p className="mt-2 text-xs text-muted">Lựa chọn này chỉ điều chỉnh giới hạn sử dụng trên trình duyệt hiện tại. Không phát sinh thanh toán.</p>
    </div>
  );
}
