import { NextResponse } from "next/server";
import { buildPrompt } from "@/lib/ai/prompts";
import { getConfiguredProvider, getProviderStatus } from "@/lib/ai/provider";
import { localProvider } from "@/lib/ai/providers/local-provider";
import type { AIRefinementAction, AIGenerateMode } from "@/lib/ai";
import { validateStructuredExam } from "@/lib/exam/validate-structured-exam";
import type { ExamInput } from "@/lib/types";
import type { AIResponse } from "@/lib/ai/types";
import { createGenerationRequestContext } from "@/lib/generation/request-context";
import { filterStructuredExamByTopic } from "@/lib/generation/topic-validator";
import { structuredExamToText } from "@/lib/mock-exam-generator";

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

function validateTopicSafeExam(result: AIResponse, input: Record<string, unknown>) {
  const structural = validateStructuredExam(result.structuredExam, input as unknown as Partial<ExamInput>);
  if (!structural.ok || !result.structuredExam) return { ok: false as const, reason: structural.ok ? "empty_exam_content" : structural.reason };
  const context = createGenerationRequestContext(input, "exam");
  if (!context.topic) return { ok: true as const, result, rejectedCount: 0 };
  const filtered = filterStructuredExamByTopic(result.structuredExam, context);
  if (!filtered.validCount) return { ok: false as const, reason: "topic_mismatch", rejectedCount: filtered.rejected.length };
  const examInput = input as unknown as ExamInput;
  const safeResult: AIResponse = {
    ...result,
    structuredExam: filtered.exam,
    content: structuredExamToText(filtered.exam, examInput),
    warnings: [
      ...(result.warnings || []),
      ...(filtered.rejected.length ? [`Đã loại ${filtered.rejected.length} câu không bám sát chủ đề.`] : []),
    ],
  };
  return { ok: true as const, result: safeResult, rejectedCount: filtered.rejected.length };
}

function mergeSafeExamResults(base: AIResponse, addition: AIResponse, input: Record<string, unknown>): AIResponse {
  if (!base.structuredExam || !addition.structuredExam) return addition;
  const limits: Record<string, number> = {
    multiple_choice: Number(input.multipleChoiceCount ?? 0),
    true_false: Number(input.trueFalseCount ?? 0),
    short_answer: Number(input.shortAnswerCount ?? 0),
  };
  const parts = base.structuredExam.parts.map((part) => {
    const extra = addition.structuredExam?.parts.find((candidate) => candidate.type === part.type)?.questions || [];
    const unique = new Map(part.questions.map((question) => [question.stem.trim().toLocaleLowerCase("vi-VN"), question]));
    extra.forEach((question) => unique.set(question.stem.trim().toLocaleLowerCase("vi-VN"), question));
    const limit = limits[part.type] || unique.size;
    return { ...part, questions: [...unique.values()].slice(0, limit).map((question, index) => ({ ...question, number: index + 1 })) };
  });
  for (const part of addition.structuredExam.parts) {
    if (parts.some((candidate) => candidate.type === part.type)) continue;
    parts.push({ ...part, questions: part.questions.slice(0, limits[part.type] || part.questions.length) });
  }
  const structuredExam = { ...base.structuredExam, parts };
  return { ...addition, structuredExam, content: structuredExamToText(structuredExam, input as unknown as ExamInput), warnings: [...(base.warnings || []), ...(addition.warnings || [])] };
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
        let checked = validateTopicSafeExam(result, validated.input);
        if (checked.ok && checked.rejectedCount === 0 && checked.result.content.trim()) {
          return NextResponse.json({ ...checked.result, providerRequested: provider.name, retryCount: 0, warnings: [...(checked.result.warnings || []), "Soạn Lab đã kiểm tra chủ đề trước khi hiển thị đề."] });
        }
        let accumulated = checked.ok ? checked.result : undefined;
        let rejectionReason = checked.ok ? `${checked.rejectedCount} câu chưa đủ độ bám chủ đề` : checked.reason;
        for (let retry = 1; retry <= 2; retry += 1) {
          const repairPrompt = `${prompt}

Yêu cầu sửa nghiêm ngặt: nội dung trước bị loại vì ${rejectionReason}. Hãy tạo lại chỉ thuộc chủ đề "${String(validated.input.topic || "")}", đúng môn ${String(validated.input.subject || "")}, lớp ${String(validated.input.grade || "")}. Không dùng khái niệm từ chương hoặc môn khác. Trả về đúng JSON schema, không markdown fence.`;
          try {
            const repaired = await provider.generate({ ...validated, prompt: repairPrompt });
            checked = validateTopicSafeExam(repaired, validated.input);
            if (checked.ok && checked.result.content.trim()) {
              accumulated = accumulated ? mergeSafeExamResults(accumulated, checked.result, validated.input) : checked.result;
              const requested = Number(validated.input.multipleChoiceCount ?? 0) + Number(validated.input.trueFalseCount ?? 0) + Number(validated.input.shortAnswerCount ?? 0);
              const accumulatedCount = accumulated.structuredExam?.parts.reduce((sum, part) => sum + part.questions.length, 0) ?? 0;
              if (accumulatedCount < requested && retry < 2) {
                rejectionReason = `còn thiếu ${requested - accumulatedCount} câu hợp lệ`;
                continue;
              }
              return NextResponse.json({
                ...accumulated,
                providerRequested: provider.name,
                retryCount: retry,
                warnings: [...(accumulated.warnings || []), accumulatedCount < requested || checked.rejectedCount ? "Kết quả được giới hạn để bảo toàn độ bám chủ đề." : "Soạn Lab đã kiểm tra chủ đề trước khi hiển thị đề."],
              });
            }
            rejectionReason = checked.ok ? `${checked.rejectedCount} câu chưa đủ độ bám chủ đề` : checked.reason;
          } catch {
            rejectionReason = "lần tạo lại không hoàn tất";
          }
        }
        return NextResponse.json({ ok: false, error: "SOẠN LAB chưa tạo được đủ nội dung bám sát chủ đề này. Thầy cô có thể mô tả cụ thể hơn hoặc giảm số lượng yêu cầu." }, { status: 422 });
      }
      return NextResponse.json({ ...result, providerRequested: provider.name, retryCount: 0 });
    } catch {
      const fallback = await localProvider.generate({ ...validated, prompt });
      if (isExam) {
        const checked = validateTopicSafeExam(fallback, validated.input);
        if (!checked.ok) return NextResponse.json({ ok: false, error: "SOẠN LAB chưa tạo được đủ nội dung bám sát chủ đề này. Thầy cô có thể mô tả cụ thể hơn hoặc giảm số lượng yêu cầu." }, { status: 422 });
        return NextResponse.json({ ...checked.result, fallbackUsed: true, retryCount: 0, warnings: [...(checked.result.warnings || []), "Soạn Lab đã kiểm tra chủ đề trước khi hiển thị đề."] });
      }
      return NextResponse.json({
        ...fallback,
        fallbackUsed: true,
        warnings: [
          ...(fallback.warnings || []),
          "Soạn Lab đã tạo bản nháp bằng quy trình dự phòng. Vui lòng rà soát trước khi sử dụng.",
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
