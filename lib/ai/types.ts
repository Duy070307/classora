export type AIProviderName = "mock" | "openai" | "google";

export type AIRefinementAction =
  | "regenerate"
  | "shorter"
  | "more-detailed"
  | "simpler"
  | "more-formal"
  | "easier"
  | "harder";

export type AIRequest = {
  tool: string;
  input: unknown;
  prompt: string;
  currentContent?: string;
  action?: AIRefinementAction;
};

export type AIResponse = {
  title: string;
  content: string;
  warnings: string[];
  provider: "mock";
};

export type AIProvider = {
  name: AIProviderName;
  generate: (request: AIRequest) => Promise<AIResponse>;
};
