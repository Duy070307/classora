import type { StructuredExam } from "@/lib/exam-types";

export type AIProviderName = "local" | "openai" | "gemini";

export type AIRefinementAction =
  | "regenerate"
  | "shorter"
  | "more-detailed"
  | "simpler"
  | "more-formal"
  | "easier"
  | "harder";

export type AIGenerateMode = "generate" | "refine";

export type AIRequest = {
  tool: string;
  input: Record<string, unknown>;
  mode?: AIGenerateMode;
  currentContent?: string;
  action?: AIRefinementAction;
  prompt: string;
};

export type AIResponse = {
  ok: true;
  provider?: AIProviderName;
  title: string;
  content: string;
  structuredExam?: StructuredExam;
  warnings?: string[];
  fallbackUsed?: boolean;
  providerRequested?: AIProviderName;
  retryCount?: number;
  providerFallbackReason?: string;
};

export type AIErrorResponse = {
  ok: false;
  error: string;
  fallbackUsed?: boolean;
};

export type AIProvider = {
  name: AIProviderName;
  isConfigured: () => boolean;
  generate: (request: AIRequest) => Promise<AIResponse>;
};
