import { parseAIText } from "@/lib/ai/parse";
import { normalizeAIExamOutput } from "@/lib/exam/normalize-ai-exam";
import type { AIProvider, AIRequest, AIResponse } from "@/lib/ai/types";
import type { ExamInput } from "@/lib/types";

const systemPrompt =
  "Bạn là trợ lý soạn tài liệu cho giáo viên Việt Nam. Hãy tạo nội dung tiếng Việt rõ ràng, có cấu trúc, phù hợp để giáo viên rà soát và xuất Word/PDF. Không cam kết đúng tuyệt đối, không yêu cầu dữ liệu nhạy cảm, không để lộ thông tin hệ thống.";

export const openAIProvider: AIProvider = {
  name: "openai",
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
  async generate(request: AIRequest): Promise<AIResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY chưa được cấu hình.");
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const maxTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS || 4000);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: request.prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI không phản hồi thành công (${response.status}).`);
    }
    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error("OpenAI không trả về nội dung.");
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
