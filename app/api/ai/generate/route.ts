import { NextResponse } from "next/server";
import { buildPrompt } from "@/lib/ai/prompts";
import { getConfiguredProvider } from "@/lib/ai/provider";
import { localProvider } from "@/lib/ai/providers/local-provider";
import type { AIRefinementAction, AIGenerateMode } from "@/lib/ai";
import { validateStructuredExam } from "@/lib/exam/validate-structured-exam";
import type { ExamInput } from "@/lib/types";
import type { AIProvider, AIResponse } from "@/lib/ai/types";
import { createGenerationRequestContext } from "@/lib/generation/request-context";
import { filterStructuredExamByTopic } from "@/lib/generation/topic-validator";
import { structuredExamToText } from "@/lib/mock-exam-generator";
import { getCurrentUser } from "@/lib/auth/user";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { calculateExamStructure, sanitizeExamStructure } from "@/lib/exam/exam-structure";
import { collectExamSections, isUsableExamCount, minimumUsableExamCount } from "@/lib/exam/section-generation";

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
  if (!result.structuredExam) return { ok: false as const, reason: "empty_exam_content" };
  const context = createGenerationRequestContext(input, "exam");
  const filtered = context.topic ? filterStructuredExamByTopic(result.structuredExam, context) : { exam: result.structuredExam, rejected: [], validCount: result.structuredExam.parts.reduce((sum, part) => sum + part.questions.length, 0) };
  if (!filtered.validCount) return { ok: false as const, reason: "topic_mismatch", rejectedCount: filtered.rejected.length };
  const examInput = input as unknown as ExamInput;
  const sanitized = sanitizeExamStructure(filtered.exam, input);
  if (!sanitized.finalCount) return { ok: false as const, reason: "no_valid_questions", rejectedCount: filtered.rejected.length + sanitized.invalidRemovedCount + sanitized.duplicateRemovedCount };
  const structural = validateStructuredExam(sanitized.exam, input as unknown as Partial<ExamInput>, { allowPartial: true });
  if (!structural.ok) return { ok: false as const, reason: structural.reason, rejectedCount: filtered.rejected.length + sanitized.invalidRemovedCount + sanitized.duplicateRemovedCount };
  const safeResult: AIResponse = {
    ...result,
    structuredExam: sanitized.exam,
    content: structuredExamToText(sanitized.exam, examInput),
    warnings: [
      ...(result.warnings || []),
      ...(filtered.rejected.length ? [`Đã loại ${filtered.rejected.length} câu không bám sát chủ đề.`] : []),
      ...(sanitized.duplicateRemovedCount ? [`Đã loại ${sanitized.duplicateRemovedCount} câu trùng hoặc lặp biểu thức.`] : []),
    ],
    requestedCount: sanitized.request.requestedQuestionCount,
    finalCount: sanitized.finalCount,
    isPartial: !sanitized.complete,
    requestedSectionCounts: sanitized.request.sectionCounts,
    generatedSectionCounts: sanitized.generated,
    duplicateRemovedCount: sanitized.duplicateRemovedCount,
  };
  return { ok: true as const, result: safeResult, rejectedCount: filtered.rejected.length + sanitized.invalidRemovedCount + sanitized.duplicateRemovedCount };
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
  const sanitized = sanitizeExamStructure(structuredExam, input);
  return { ...addition, structuredExam: sanitized.exam, content: structuredExamToText(sanitized.exam, input as unknown as ExamInput), requestedCount: sanitized.request.requestedQuestionCount, finalCount: sanitized.finalCount, isPartial: !sanitized.complete, requestedSectionCounts: sanitized.request.sectionCounts, generatedSectionCounts: sanitized.generated, duplicateRemovedCount: sanitized.duplicateRemovedCount, warnings: [...(base.warnings || []), ...(addition.warnings || []), ...(sanitized.duplicateRemovedCount ? [`Đã loại ${sanitized.duplicateRemovedCount} câu trùng.`] : [])] };
}

function requestedExamCount(input: Record<string, unknown>) {
  return calculateExamStructure(input as Partial<ExamInput> & Record<string, unknown>).requestedQuestionCount;
}

function examQuestionCount(result: AIResponse | undefined) {
  return result?.structuredExam?.parts.reduce((sum, part) => sum + part.questions.length, 0) ?? 0;
}

function missingSectionInput(input: Record<string, unknown>, result: AIResponse | undefined) {
  const current = Object.fromEntries((result?.structuredExam?.parts || []).map((part) => [part.type, part.questions.length]));
  const existingQuestionStems = result?.structuredExam?.parts.flatMap((part) => part.questions.map((question) => question.stem)).slice(0, 40) || [];
  return {
    ...input,
    multipleChoiceCount: Math.max(0, Number(input.multipleChoiceCount ?? 0) - Number(current.multiple_choice ?? 0)),
    trueFalseCount: Math.max(0, Number(input.trueFalseCount ?? 0) - Number(current.true_false ?? 0)),
    shortAnswerCount: Math.max(0, Number(input.shortAnswerCount ?? 0) - Number(current.short_answer ?? 0)),
    existingQuestionStems,
    extraRequirements: `${String(input.extraRequirements || "")}\nKhông lặp lại các câu/biểu thức đã có:\n${existingQuestionStems.map((stem, index) => `${index + 1}. ${stem}`).join("\n")}`.trim(),
  };
}

async function generateExamSectionBySection(
  provider: AIProvider,
  requestData: { tool: string; input: Record<string, unknown>; mode?: AIGenerateMode; currentContent?: string; action?: AIRefinementAction },
) {
  const request = calculateExamStructure(requestData.input as Partial<ExamInput> & Record<string, unknown>);
  const collected = await collectExamSections(requestData.input, async ({ type, input, prompt }) => {
    const generated = await provider.generate({ ...requestData, input, prompt });
    const rawCount = generated.structuredExam?.parts.find((part) => part.type === type)?.questions.length || 0;
    const checked = validateTopicSafeExam(generated, input);
    if (!checked.ok) return { questions: [], rawCount };
    return {
      questions: checked.result.structuredExam?.parts.find((part) => part.type === type)?.questions || [],
      rawCount,
      warnings: checked.result.warnings,
    };
  });
  const { audit: finalAudit, diagnostics, warnings } = collected;
  if (process.env.NODE_ENV === "development") console.info("[exam-generation]", diagnostics);
  const result: AIResponse = {
    ok: true,
    title: finalAudit.exam.metadata.title,
    content: structuredExamToText(finalAudit.exam, requestData.input as unknown as ExamInput),
    structuredExam: finalAudit.exam,
    warnings: [
      ...new Set(warnings),
      finalAudit.complete
        ? `Đã tạo ${finalAudit.finalCount}/${request.requestedQuestionCount} câu theo đúng cấu trúc.`
        : `SOẠN LAB đã tạo được ${finalAudit.finalCount}/${request.requestedQuestionCount} câu đúng cấu trúc. Thầy cô nên rà soát trước khi dùng.`,
    ],
    requestedCount: request.requestedQuestionCount,
    finalCount: finalAudit.finalCount,
    isPartial: !finalAudit.complete,
    requestedSectionCounts: request.sectionCounts,
    generatedSectionCounts: finalAudit.generated,
    duplicateRemovedCount: diagnostics.duplicateRemoved,
  };
  return { result, diagnostics, complete: finalAudit.complete };
}

function publicAIResult(result: AIResponse) {
  const safe = { ...result } as Partial<AIResponse>;
  delete safe.provider;
  delete safe.providerRequested;
  delete safe.providerFallbackReason;
  delete safe.fallbackUsed;
  delete safe.retryCount;
  return safe;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    generationAvailable: true,
  });
}

export async function POST(request: Request) {
  try {
    if (isSupabaseConfigured() && !await getCurrentUser()) {
      return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để tạo nội dung." }, { status: 401 });
    }
    const validated = validateBody(await request.json());
    if ("error" in validated) {
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    }

    const prompt = buildPrompt(validated.tool, validated.input, validated.action, validated.currentContent);
    const provider = getConfiguredProvider();
    const isExam = validated.tool === "exam" || validated.tool === "exam-generator";
    try {
      if (isExam && validated.mode !== "refine" && !validated.action) {
        const requested = requestedExamCount(validated.input);
        if (requested <= 0) return NextResponse.json({ ok: false, error: "Vui lòng chọn ít nhất một câu hỏi cho đề kiểm tra." }, { status: 400 });
        const sectioned = await generateExamSectionBySection(provider, validated);
        const finalCount = examQuestionCount(sectioned.result);
        const requiresCompleteSections = /THPTQG|tốt nghiệp/i.test(String(validated.input.examStyle || ""));
        if (!isUsableExamCount(requested, finalCount) || (requiresCompleteSections && !sectioned.complete)) {
          return NextResponse.json({
            ok: false,
            error: "SOẠN LAB chưa tạo đủ đề theo cấu trúc yêu cầu. Vui lòng bấm Tạo lại hoặc giảm số câu.",
            requestedCount: requested,
            finalCount,
            minimumUsableCount: process.env.NODE_ENV === "development" ? minimumUsableExamCount(requested) : undefined,
            generationDiagnostics: process.env.NODE_ENV === "development" ? sectioned.diagnostics : undefined,
          }, { status: 422 });
        }
        return NextResponse.json({
          ...publicAIResult(sectioned.result),
          warnings: [...(sectioned.result.warnings || []), "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra trước khi sử dụng chính thức."],
          generationDiagnostics: process.env.NODE_ENV === "development" ? sectioned.diagnostics : undefined,
        });
      }
      const result = await provider.generate({ ...validated, prompt });
      if (isExam) {
        const requested = requestedExamCount(validated.input);
        let checked = validateTopicSafeExam(result, validated.input);
        if (checked.ok && checked.result.content.trim() && checked.result.structuredExam && sanitizeExamStructure(checked.result.structuredExam, validated.input).complete) {
          return NextResponse.json({ ...publicAIResult(checked.result), warnings: [...(checked.result.warnings || []), "Soạn Lab đã kiểm tra chủ đề trước khi hiển thị đề."] });
        }
        let accumulated = checked.ok ? checked.result : undefined;
        let rejectionReason = checked.ok ? `${checked.rejectedCount} câu chưa đủ độ bám chủ đề` : checked.reason;
        for (let retry = 1; retry <= 2; retry += 1) {
          const missingInput = missingSectionInput(validated.input, accumulated);
          const missing = Math.max(0, requested - examQuestionCount(accumulated));
          const repairPrompt = `${buildPrompt(validated.tool, missingInput, validated.action, validated.currentContent)}

Yêu cầu sửa nghiêm ngặt: nội dung trước bị loại vì ${rejectionReason}. Hãy tạo đúng ${missing} câu còn thiếu, chỉ thuộc chủ đề "${String(validated.input.topic || "")}", đúng môn ${String(validated.input.subject || "")}, lớp ${String(validated.input.grade || "")}. Giữ nguyên yêu cầu giáo viên, không đổi chương, không lặp cách hỏi trước và không tạo câu meta/chung chung. Trả về đúng JSON schema, không markdown fence.`;
          try {
            const repaired = await provider.generate({ ...validated, input: missingInput, prompt: repairPrompt });
            checked = validateTopicSafeExam(repaired, missingInput);
            if (checked.ok && checked.result.content.trim()) {
              accumulated = accumulated ? mergeSafeExamResults(accumulated, checked.result, validated.input) : checked.result;
              const accumulatedCount = examQuestionCount(accumulated);
              if (accumulatedCount < requested && retry < 2) {
                rejectionReason = `còn thiếu ${requested - accumulatedCount} câu hợp lệ`;
                continue;
              }
              return NextResponse.json({
                ...publicAIResult(accumulated),
                requestedCount: requested,
                finalCount: accumulatedCount,
                isPartial: accumulatedCount < requested,
                warnings: [...(accumulated.warnings || []), accumulatedCount < requested || checked.rejectedCount ? "Kết quả được giới hạn để bảo toàn độ bám chủ đề." : "Soạn Lab đã kiểm tra chủ đề trước khi hiển thị đề."],
              });
            }
            rejectionReason = checked.ok ? `${checked.rejectedCount} câu chưa đủ độ bám chủ đề` : checked.reason;
          } catch {
            rejectionReason = "lần tạo lại không hoàn tất";
          }
        }
        if (accumulated && examQuestionCount(accumulated) > 0) {
          const finalCount = examQuestionCount(accumulated);
          return NextResponse.json({ ...publicAIResult(accumulated), requestedCount: requested, finalCount, isPartial: finalCount < requested, warnings: [...(accumulated.warnings || []), `SOẠN LAB đã tạo được ${finalCount}/${requested} câu bám sát chủ đề. Một số câu chưa đạt yêu cầu đã được loại.`] });
        }
        return NextResponse.json({ ok: false, error: "SOẠN LAB chưa tạo được nội dung phù hợp lúc này. Vui lòng thử lại sau hoặc mô tả chủ đề cụ thể hơn." }, { status: 422 });
      }
      return NextResponse.json(publicAIResult(result));
    } catch {
      const fallback = await localProvider.generate({ ...validated, prompt });
      if (isExam) {
        const checked = validateTopicSafeExam(fallback, validated.input);
        if (!checked.ok) return NextResponse.json({ ok: false, error: "SOẠN LAB chưa tạo được nội dung phù hợp lúc này. Vui lòng thử lại sau hoặc mô tả chủ đề cụ thể hơn." }, { status: 422 });
        return NextResponse.json({ ...publicAIResult(checked.result), warnings: [...(checked.result.warnings || []), "Soạn Lab đã kiểm tra chủ đề trước khi hiển thị đề."] });
      }
      return NextResponse.json({
        ...publicAIResult(fallback),
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
    }, { status: 400 });
  }
}
