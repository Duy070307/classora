"use client";

import { useEffect, useState } from "react";
import { getMockPlan, setMockPlan, type MockPlan } from "@/lib/usage";

export function PlanSelector() {
  const [plan, setPlan] = useState<MockPlan>("free");
  useEffect(() => queueMicrotask(() => setPlan(getMockPlan())), []);
  function change(next: MockPlan) { setPlan(next); setMockPlan(next); }
  return (
    <div>
      <p className="label">Gói mô phỏng để kiểm thử</p>
      <div className="mt-2 inline-flex rounded-md border border-line bg-slate-50 p-1">
        <button type="button" onClick={() => change("free")} className={`rounded px-4 py-2 text-sm font-semibold ${plan === "free" ? "bg-white text-brand shadow-sm" : "text-muted"}`}>Free demo</button>
        <button type="button" onClick={() => change("pro")} className={`rounded px-4 py-2 text-sm font-semibold ${plan === "pro" ? "bg-emerald-600 text-white shadow-sm" : "text-muted"}`}>Pro demo</button>
      </div>
      <p className="mt-2 text-xs text-muted">Chỉ thay đổi giao diện và giới hạn mô phỏng trên trình duyệt này. Không phát sinh thanh toán.</p>
    </div>
  );
}
