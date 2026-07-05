import { NextResponse } from "next/server";
import { buildPrompt } from "@/lib/ai/prompts";
import { getConfiguredProvider, getProviderStatus } from "@/lib/ai/provider";
import { localProvider } from "@/lib/ai/providers/local-provider";
import type { AIRefinementAction, AIGenerateMode } from "@/lib/ai";
import { validateStructuredExam } from "@/lib/exam/validate-structured-exam";
import type { ExamInput } from "@/lib/types";

const actions = new Set<AIRefinementAction>([
  "regenerate",
  "shorter",
  "more-detailed",
  "simpler",
  "more-formal",
  "easier",
  "harder",
]);

const modes = new Set<AIGenerateMode>(["generate", "refine"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateBody(body: unknown) {
  if (!isRecord(body)) return { error: "Yêu cầu không hợp lệ." };
  const tool = typeof body.tool === "string" ? body.tool.trim() : "";
  if (!tool) return { error: "Thiếu công cụ tạo nội dung." };
  const input = isRecord(body.input) ? body.input : {};
  const mode = typeof body.mode === "string" && modes.has(body.mode as AIGenerateMode)
    ? body.mode as AIGenerateMode
    : undefined;
  const currentContent = typeof body.currentContent === "string" ? body.currentContent.slice(0, 60000) : undefined;
  const action = typeof body.action === "string" ? body.action as AIRefinementAction : undefined;
  if (action && !actions.has(action)) return { error: "Yêu cầu tinh chỉnh không được hỗ trợ." };
  return { tool, input, mode, currentContent, action };
}

export async function GET() {
  const status = getProviderStatus();
  return NextResponse.json({
    ok: true,
    provider: status.active,
    requestedProvider: status.requested,
    openaiKeyConfigured: status.openaiKeyConfigured,
    geminiKeyConfigured: status.geminiKeyConfigured,
    dailyLimit: status.dailyLimit,
    maxOutputTokens: status.maxOutputTokens,
  });
}

export async function POST(request: Request) {
  try {
    const validated = validateBody(await request.json());
    if ("error" in validated) {
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    }

    const prompt = buildPrompt(validated.tool, validated.input, validated.action, validated.currentContent);
    const provider = getConfiguredProvider();
    const isExam = validated.tool === "exam" || validated.tool === "exam-generator";
    try {
      const result = await provider.generate({ ...validated, prompt });
      if (isExam) {
        const validation = validateStructuredExam(result.structuredExam, validated.input as unknown as Partial<ExamInput>);
        const validationReason = validation.ok ? "empty_exam_content" : validation.reason;
        if (!validation.ok || !result.content.trim()) {
          if (validationReason === "topic_mismatch") {
            const repairPrompt = `${prompt}

Yêu cầu sửa nghiêm ngặt: lần trả lời trước không bám đúng chủ đề "${String(validated.input.topic || "")}". Hãy tạo lại chỉ với câu hỏi thuộc chủ đề đã chọn, không dùng đạo hàm, tích phân, khảo sát hàm số hoặc nội dung ngoài chủ đề. Trả về đúng JSON schema, không markdown fence.`;
            try {
              const repaired = await provider.generate({ ...validated, prompt: repairPrompt });
              const repairedValidation = validateStructuredExam(repaired.structuredExam, validated.input as unknown as Partial<ExamInput>);
              if (repairedValidation.ok && repaired.content.trim()) {
                return NextResponse.json({
                  ...repaired,
                  providerRequested: provider.name,
                  retryCount: 1,
                  warnings: [
                    ...(repaired.warnings || []),
                    "Soạn Lab đã kiểm tra chủ đề trước khi hiển thị đề.",
                  ],
                });
              }
            } catch {
              // Fall through to topic-aware local fallback.
            }
          }
          const fallback = await localProvider.generate({ ...validated, prompt });
          return NextResponse.json({
            ...fallback,
            providerRequested: provider.name,
            retryCount: validationReason === "topic_mismatch" ? 1 : 0,
            fallbackUsed: true,
            warnings: [
              ...(fallback.warnings || []),
              "Soạn Lab đã tự dùng cấu trúc đề cục bộ vì nội dung AI chưa đủ an toàn để xuất Word/PDF.",
            ],
            providerFallbackReason: validationReason,
          });
        }
      }
      return NextResponse.json({ ...result, providerRequested: provider.name, retryCount: 0 });
    } catch {
      const fallback = await localProvider.generate({ ...validated, prompt });
      return NextResponse.json({
        ...fallback,
        fallbackUsed: true,
        warnings: [
          ...(fallback.warnings || []),
          "Soạn Lab đã dùng chế độ cục bộ vì nhà cung cấp AI qua máy chủ chưa sẵn sàng.",
        ],
      });
    }
  } catch {
    return NextResponse.json({
      ok: false,
      error: "Không thể tạo nội dung lúc này. Vui lòng thử lại hoặc dùng nội dung đã lưu trong lịch sử.",
      fallbackUsed: false,
    }, { status: 400 });
  }
}
