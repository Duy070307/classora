import { parseAIText } from "@/lib/ai/parse";
import { normalizeAIExamOutput } from "@/lib/exam/normalize-ai-exam";
import type { AIProvider, AIRequest, AIResponse } from "@/lib/ai/types";
import type { ExamInput } from "@/lib/types";

export type OpenAICompatibleDiagnostic =
  | "success"
  | "unauthorized"
  | "invalid_model"
  | "timeout"
  | "unsupported_vision"
  | "empty_response"
  | "parser_failed"
  | "image_ignored";

export class OpenAICompatibleError extends Error {
  constructor(public readonly diagnostic: Exclude<OpenAICompatibleDiagnostic, "success">) {
    super(diagnostic);
    this.name = "OpenAICompatibleError";
  }
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type ChatMessage = {
  role: "system" | "user";
  content: string | ContentPart[];
};

const systemPrompt =
  "Bạn là trợ lý soạn tài liệu cho giáo viên Việt Nam. Hãy tạo nội dung tiếng Việt rõ ràng, có cấu trúc và phù hợp để giáo viên rà soát trước khi xuất Word/PDF. Không cam kết đúng tuyệt đối, không yêu cầu dữ liệu nhạy cảm và không để lộ thông tin hệ thống.";

function getBaseUrl() {
  return (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").trim().replace(/\/+$/, "");
}

function classifyFailure(status: number, body: string, vision: boolean): Exclude<OpenAICompatibleDiagnostic, "success"> {
  if (status === 401 || status === 403) return "unauthorized";
  if (/model|not found|does not exist|không tồn tại/i.test(body)) return "invalid_model";
  if (vision && (status === 400 || status === 415 || status === 422)) return "unsupported_vision";
  return status === 408 ? "timeout" : "empty_response";
}

function isTransient(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

async function requestChatCompletion({
  messages,
  model,
  timeoutMs,
  vision = false,
}: {
  messages: ChatMessage[];
  model: string;
  timeoutMs: number;
  vision?: boolean;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new OpenAICompatibleError("unauthorized");
  const maxTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS || 4000);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${getBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, temperature: vision ? 0.15 : 0.4, max_tokens: maxTokens, messages }),
        signal: controller.signal,
      });
      const body = await response.text();
      if (!response.ok) {
        if (attempt === 0 && isTransient(response.status)) continue;
        throw new OpenAICompatibleError(classifyFailure(response.status, body.slice(0, 1000), vision));
      }
      let data: { choices?: Array<{ message?: { content?: string } }> };
      try {
        data = JSON.parse(body) as typeof data;
      } catch {
        throw new OpenAICompatibleError("parser_failed");
      }
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new OpenAICompatibleError("empty_response");
      return content;
    } catch (error) {
      if (error instanceof OpenAICompatibleError) throw error;
      const timedOut = error instanceof Error && error.name === "AbortError";
      if (attempt === 0 && timedOut) continue;
      throw new OpenAICompatibleError(timedOut ? "timeout" : "empty_response");
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new OpenAICompatibleError("timeout");
}

export async function requestOpenAICompatibleText(prompt: string) {
  return requestChatCompletion({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    timeoutMs: 60_000,
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
  });
}

export async function requestOpenAICompatibleVision({
  prompt,
  imageBase64,
  mimeType,
  includeImage = true,
}: {
  prompt: string;
  imageBase64: string;
  mimeType: string;
  includeImage?: boolean;
}) {
  const content: ContentPart[] = [{ type: "text", text: prompt }];
  if (includeImage) {
    content.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } });
  }
  return requestChatCompletion({
    model: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
    timeoutMs: 120_000,
    vision: includeImage,
    messages: [{ role: "user", content }],
  });
}

export const openAIProvider: AIProvider = {
  name: "openai",
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
  async generate(request: AIRequest): Promise<AIResponse> {
    const raw = await requestOpenAICompatibleText(request.prompt);
    if (request.tool === "exam" || request.tool === "exam-generator") {
      const normalized = normalizeAIExamOutput(raw, request.input as unknown as ExamInput);
      if (normalized.ok) {
        return {
          ok: true,
          provider: "openai",
          title: normalized.title || "Đề kiểm tra",
          content: normalized.content,
          structuredExam: normalized.structuredExam,
          warnings: ["Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức."],
        };
      }
    }
    const parsed = parseAIText(raw);
    return {
      ok: true,
      provider: "openai",
      title: parsed.title || "Tài liệu",
      content: parsed.content,
      structuredExam: parsed.structuredExam,
      warnings: ["Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức."],
    };
  },
};
