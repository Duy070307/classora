export type AIProviderName = "mock" | "openai" | "google";

export type AIRequest = {
  tool: string;
  input: unknown;
  prompt: string;
};

export type AIResponse = {
  title: string;
  content: string;
  warnings?: string[];
};

export type AIProvider = {
  name: AIProviderName;
  generate: (request: AIRequest) => Promise<AIResponse>;
};
