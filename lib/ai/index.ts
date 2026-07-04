import { buildPrompt } from "@/lib/ai/prompts";
import { getConfiguredProvider } from "@/lib/ai/provider";
import type { AIRefinementAction, AIResponse } from "@/lib/ai/types";

export type {
  AIErrorResponse,
  AIProviderName,
  AIRefinementAction,
  AIGenerateMode,
  AIRequest,
  AIResponse,
} from "@/lib/ai/types";

export async function generateWithAI(
  tool: string,
  input: Record<string, unknown>,
  currentContent?: string,
  action?: AIRefinementAction,
  mode: "generate" | "refine" = action ? "refine" : "generate"
): Promise<AIResponse> {
  const provider = getConfiguredProvider();
  return provider.generate({
    tool,
    input,
    currentContent,
    action,
    mode,
    prompt: buildPrompt(tool, input, action, currentContent),
  });
}
