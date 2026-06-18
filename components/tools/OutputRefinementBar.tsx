"use client";

import { useState } from "react";
import type { AIRefinementAction, AIResponse } from "@/lib/ai";

const actions: { action: AIRefinementAction; label: string }[] = [
  { action: "regenerate", label: "Tạo lại" },
  { action: "shorter", label: "Ngắn hơn" },
  { action: "more-detailed", label: "Chi tiết hơn" },
  { action: "simpler", label: "Dễ hiểu hơn" },
  { action: "more-formal", label: "Trang trọng hơn" },
  { action: "easier", label: "Làm dễ hơn" },
  { action: "harder", label: "Làm khó hơn" }
];

export function OutputRefinementBar({
  tool,
  input,
  currentContent,
  onRefined
}: {
  tool: string;
  input: unknown;
  currentContent: string;
  onRefined: (content: string) => void;
}) {
  const [pending, setPending] = useState<AIRefinementAction | null>(null);
  const [error, setError] = useState("");

  async function refine(action: AIRefinementAction) {
    setPending(action);
    setError("");
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, input, currentContent, action })
      });
      const data = await response.json() as AIResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "Không thể tinh chỉnh nội dung.");
      onRefined(data.content);
    } catch (refinementError) {
      setError(refinementError instanceof Error ? refinementError.message : "Không thể tinh chỉnh nội dung.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="card border-indigo-100 bg-gradient-to-r from-white to-indigo-50/60 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Tinh chỉnh đầu ra · Mock AI</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((item) => (
          <button key={item.action} type="button" className="btn-secondary min-h-9 px-3 py-1.5 text-xs" disabled={pending !== null} onClick={() => refine(item.action)}>
            {pending === item.action ? "Đang xử lý..." : item.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
