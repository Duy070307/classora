import { mockProvider } from "@/lib/ai/mock-provider";
import { buildPrompt } from "@/lib/ai/prompts";
import type { AIProvider, AIProviderName, AIResponse } from "@/lib/ai/types";

export type { AIProviderName, AIRequest, AIResponse } from "@/lib/ai/types";

export function getAIProviderName(): AIProviderName {
  return "mock";
}

export function getAIProvider(): AIProvider {
  // Provider thật cố ý chưa được bật. Env/API key tương lai phải được xử lý server-side.
  return mockProvider;
}

export async function generateWithAI(tool: string, input: unknown): Promise<AIResponse> {
  return getAIProvider().generate({ tool, input, prompt: buildPrompt(tool, input) });
}
