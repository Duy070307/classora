import { geminiProvider } from "@/lib/ai/providers/gemini-provider";
import { localProvider } from "@/lib/ai/providers/local-provider";
import { openAIProvider } from "@/lib/ai/providers/openai-provider";
import type { AIProvider, AIProviderName } from "@/lib/ai/types";

export function normalizeProviderName(value = process.env.AI_PROVIDER || "local"): AIProviderName {
  const normalized = value.toLowerCase();
  if (normalized === "openai") return "openai";
  if (normalized === "gemini" || normalized === "google") return "gemini";
  return "local";
}

export function getConfiguredProvider(): AIProvider {
  const name = normalizeProviderName();
  if (name === "openai" && openAIProvider.isConfigured()) return openAIProvider;
  if (name === "gemini" && geminiProvider.isConfigured()) return geminiProvider;
  return localProvider;
}

export function getProviderStatus() {
  const requested = normalizeProviderName();
  const active = getConfiguredProvider().name;
  return {
    requested,
    active,
    openaiKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    dailyLimit: Number(process.env.AI_DAILY_LIMIT || 30),
    maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS || 4000),
  };
}
