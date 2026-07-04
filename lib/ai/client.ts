import { canUseAIGeneration, getAILimitMessage, incrementAIUsage } from "@/lib/ai/usage-limit";
import type { AIResponse, AIRefinementAction } from "@/lib/ai/types";

export async function generateToolContent({
  tool,
  input,
  mode = "generate",
  currentContent,
  action,
}: {
  tool: string;
  input: Record<string, unknown>;
  mode?: "generate" | "refine";
  currentContent?: string;
  action?: AIRefinementAction;
}): Promise<AIResponse> {
  if (!canUseAIGeneration()) {
    throw new Error(getAILimitMessage());
  }
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, input, mode, currentContent, action }),
  });
  const data = await response.json() as AIResponse | { ok?: false; error?: string };
  if (!response.ok || data.ok === false) {
    throw new Error("error" in data && data.error ? data.error : "Không thể tạo nội dung lúc này.");
  }
  incrementAIUsage();
  return data as AIResponse;
}
