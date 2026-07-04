import { parseAIText } from "@/lib/ai/parse";
import type { AIProvider, AIRequest, AIResponse } from "@/lib/ai/types";

const systemPrompt =
  "Bạn là trợ lý soạn tài liệu cho giáo viên Việt Nam. Hãy tạo nội dung tiếng Việt rõ ràng, có cấu trúc, phù hợp để giáo viên rà soát và xuất Word/PDF.";

export const geminiProvider: AIProvider = {
  name: "gemini",
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),
  async generate(request: AIRequest): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY chưa được cấu hình.");
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const maxTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS || 4000);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: request.prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini không phản hồi thành công (${response.status}).`);
    }
    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim();
    if (!raw) throw new Error("Gemini không trả về nội dung.");
    const parsed = parseAIText(raw);
    return {
      ok: true,
      provider: "gemini",
      title: parsed.title || "Tài liệu",
      content: parsed.content,
      structuredExam: parsed.structuredExam,
      warnings: ["Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức."],
    };
  },
};
