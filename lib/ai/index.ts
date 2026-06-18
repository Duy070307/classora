import { mockProvider } from "@/lib/ai/mock-provider";
import { buildPrompt } from "@/lib/ai/prompts";
import type { AIProvider, AIProviderName, AIRefinementAction, AIResponse } from "@/lib/ai/types";

export type { AIProviderName, AIRefinementAction, AIRequest, AIResponse } from "@/lib/ai/types";

export function getAIProviderName(): AIProviderName {
  return "mock";
}

export function getAIProvider(): AIProvider {
  // Provider thật cố ý chưa được bật. Env/API key tương lai phải được xử lý server-side.
  return mockProvider;
}

export async function generateWithAI(
  tool: string,
  input: unknown,
  currentContent?: string,
  action?: AIRefinementAction
): Promise<AIResponse> {
  return getAIProvider().generate({
    tool,
    input,
    currentContent,
    action,
    prompt: buildPrompt(tool, input, action, currentContent)
  });
}
