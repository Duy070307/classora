import { NextRequest, NextResponse } from "next/server";
import { extractJson } from "@/lib/ai/extract-json";
import { getConfiguredProvider } from "@/lib/ai/provider";
import type { SemanticSolutionPatch, SolutionConfidence } from "@/lib/answer-solutions/types";
import { stableHash } from "@/lib/answer-solutions/hash";
import { getCurrentUser } from "@/lib/auth/user";
import type { StructuredExam } from "@/lib/exam-types";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const statuses = new Set(["matches", "mismatch", "uncertain", "not_verified"]);
const confidences = new Set<SolutionConfidence>(["high", "medium", "low"]);

function isExam(value: unknown): value is StructuredExam {
  return Boolean(value) && typeof value === "object" && Array.isArray((value as StructuredExam).parts);
}

function text(value: unknown, max = 3000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizePatches(value: unknown, allowed: Set<string>): SemanticSolutionPatch[] {
  if (!value || typeof value !== "object") return [];
  const rows = Array.isArray((value as { questions?: unknown }).questions) ? (value as { questions: unknown[] }).questions : [];
  return rows.flatMap((row): SemanticSolutionPatch[] => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const questionId = text(item.questionId, 160);
    const confidence = text(item.confidence, 20) as SolutionConfidence;
    const answerStatus = text(item.answerStatus, 30) as SemanticSolutionPatch["answerStatus"];
    if (!allowed.has(questionId) || !confidences.has(confidence) || !statuses.has(answerStatus)) return [];
    const steps = Array.isArray(item.steps) ? item.steps.slice(0, 12).flatMap((step, index) => step && typeof step === "object" ? [{ order: index + 1, title: text((step as Record<string, unknown>).title, 160) || undefined, content: text((step as Record<string, unknown>).content, 1000), formula: text((step as Record<string, unknown>).formula, 500) || undefined, result: text((step as Record<string, unknown>).result, 300) || undefined }] : []) : undefined;
    const statementExplanations = Array.isArray(item.statementExplanations) ? item.statementExplanations.slice(0, 8).flatMap((statement, index) => {
      if (!statement || typeof statement !== "object") return [];
      const entry = statement as Record<string, unknown>;
      const statementConfidence = text(entry.confidence, 20) as SolutionConfidence;
      return [{ statementId: text(entry.statementId, 200), statementIndex: Number.isInteger(entry.statementIndex) ? Number(entry.statementIndex) : index, value: Boolean(entry.value), explanation: text(entry.explanation, 1200), confidence: confidences.has(statementConfidence) ? statementConfidence : "low" as const }];
    }) : undefined;
    return [{
      questionId,
      verifiedAnswer: item.verifiedAnswer,
      answerStatus,
      confidence,
      conciseAnswer: text(item.conciseAnswer, 500),
      detailedSolution: text(item.detailedSolution, 5000) || undefined,
      steps,
      statementExplanations,
      warnings: Array.isArray(item.warnings) ? item.warnings.map((warning) => text(warning, 500)).filter(Boolean).slice(0, 8) : [],
      assumptions: ["semantic-review", ...(Array.isArray(item.assumptions) ? item.assumptions.map((assumption) => text(assumption, 300)).filter(Boolean).slice(0, 6) : [])],
    }];
  });
}

export async function POST(request: NextRequest) {
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để tạo lời giải." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const body = await request.json() as { exam?: unknown; questionIds?: unknown; detailLevel?: unknown };
    if (!isExam(body.exam)) return NextResponse.json({ ok: false, error: "Dữ liệu đề không hợp lệ." }, { status: 400 });
    const requested = Array.isArray(body.questionIds) ? body.questionIds.map(String) : [];
    const allowed = new Set(requested.slice(0, 15));
    const questions = body.exam.parts.flatMap((part) => part.questions).filter((question) => allowed.has(question.id)).slice(0, 15);
    if (!questions.length) return NextResponse.json({ ok: false, error: "Vui lòng chọn ít nhất một câu cần tạo lời giải." }, { status: 400 });
    const provider = getConfiguredProvider();
    if (provider.name === "local") return NextResponse.json({ ok: false, unavailable: true, error: "Một số câu chưa tạo được lời giải. Thầy cô có thể thử lại riêng các câu này." }, { status: 503 });
    const detailLevel = ["short", "standard", "detailed"].includes(String(body.detailLevel)) ? String(body.detailLevel) : "standard";
    const prompt = `Bạn hỗ trợ giáo viên Việt Nam kiểm tra độc lập đáp án và viết lời giải. Không bịa dữ liệu/hình bị thiếu, không giải thích ngoài câu hỏi, không nêu hạ tầng kỹ thuật. Với dữ liệu không đủ: answerStatus=uncertain, confidence=low. Chỉ đánh dấu high khi phép tính hoặc lập luận đầy đủ xác nhận chắc chắn. Không tự thay đáp án. Mức chi tiết: ${detailLevel}. Trả JSON object {"title":"Lời giải","content":"<JSON string>"}; content là JSON {"questions":[{"questionId":"...","verifiedAnswer":"...","answerStatus":"matches|mismatch|uncertain|not_verified","confidence":"high|medium|low","conciseAnswer":"...","detailedSolution":"...","steps":[{"title":"...","content":"...","formula":"...","result":"..."}],"statementExplanations":[{"statementId":"...","statementIndex":0,"value":true,"explanation":"...","confidence":"high|medium|low"}],"warnings":[],"assumptions":[]}]}. Với Đúng/Sai, giải thích độc lập từng mệnh đề và giữ statementId đã cho. Không markdown.\n\nCâu hỏi:\n${JSON.stringify(questions.map((question) => ({ questionId: question.id, type: question.part, stem: question.stem, options: question.options, statements: question.trueFalseItems?.map((item, index) => ({ statementId: item.id || `${question.id}:${stableHash(item.text)}`, index, text: item.text, currentValue: item.answer })), currentAnswer: question.answer, score: question.score })))} `;
    const response = await provider.generate({ tool: "answer-solutions", input: {}, prompt });
    const parsed = extractJson(response.content);
    if (!parsed.ok) return NextResponse.json({ ok: false, error: "Một số câu chưa tạo được lời giải. Thầy cô có thể thử lại riêng các câu này." }, { status: 502 });
    return NextResponse.json({ ok: true, questions: normalizePatches(parsed.value, new Set(questions.map((question) => question.id))) });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("answer_solutions_generate_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: "Một số câu chưa tạo được lời giải. Thầy cô có thể thử lại riêng các câu này." }, { status: 502 });
  }
}
