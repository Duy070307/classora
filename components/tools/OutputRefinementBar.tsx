"use client";

import { useState } from "react";
import type { AIRefinementAction } from "@/lib/ai";
import { generateToolContent } from "@/lib/ai/client";

const actions: { action: AIRefinementAction; label: string }[] = [
  { action: "regenerate", label: "Tạo lại" },
  { action: "shorter", label: "Ngắn hơn" },
  { action: "more-detailed", label: "Chi tiết hơn" },
  { action: "simpler", label: "Dễ hiểu hơn" },
  { action: "more-formal", label: "Trang trọng hơn" },
  { action: "easier", label: "Làm dễ hơn" },
  { action: "harder", label: "Làm khó hơn" },
];

export function OutputRefinementBar({
  tool,
  input,
  currentContent,
  onRefined,
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
      const data = await generateToolContent({
        tool,
        input: input as Record<string, unknown>,
        mode: "refine",
        currentContent,
        action,
      });
      onRefined(data.content);
    } catch (refinementError) {
      setError(refinementError instanceof Error ? refinementError.message : "Không thể tinh chỉnh nội dung.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="card border-blue-100 bg-blue-50/40 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Tinh chỉnh đầu ra</p>
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
