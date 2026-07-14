import { NextRequest, NextResponse } from "next/server";
import { extractJson } from "@/lib/ai/extract-json";
import { getConfiguredProvider } from "@/lib/ai/provider";
import { getCurrentUser } from "@/lib/auth/user";
import type { StructuredExam } from "@/lib/exam-types";
import type { SemanticAuditFinding } from "@/lib/exam-audit/types";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const allowedCodes = new Set(["possible_answer_mismatch", "ambiguous_question", "missing_data", "cognitive_level_mismatch"]);
const invalidDeterministicCodes = new Set(["missing_prompt", "missing_answer", "invalid_option_count", "duplicate_options", "invalid_true_false_count", "invalid_numeric_answer"]);

function isExam(value: unknown): value is StructuredExam {
  return Boolean(value) && typeof value === "object" && Array.isArray((value as StructuredExam).parts);
}

function normalizeFindings(value: unknown, questionIds: Set<string>): SemanticAuditFinding[] {
  if (!value || typeof value !== "object") return [];
  const rows = Array.isArray((value as { findings?: unknown }).findings) ? (value as { findings: unknown[] }).findings : [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const questionId = String(item.questionId || "");
    const code = String(item.code || "") as SemanticAuditFinding["code"];
    const confidence = String(item.confidence || "low") as SemanticAuditFinding["confidence"];
    if (!questionIds.has(questionId) || !allowedCodes.has(code) || !["high", "medium", "low"].includes(confidence)) return [];
    return [{
      questionId,
      code,
      severity: item.severity === "info" ? "info" as const : "warning" as const,
      title: String(item.title || "Cần giáo viên xác nhận").slice(0, 160),
      description: String(item.description || "Kết quả rà soát ngữ nghĩa cần giáo viên xác nhận.").slice(0, 800),
      suggestedFix: String(item.suggestedFix || "Giáo viên kiểm tra lại dữ kiện và đáp án.").slice(0, 500),
      confidence,
      detectedDifficulty: ["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"].includes(String(item.detectedDifficulty)) ? item.detectedDifficulty as SemanticAuditFinding["detectedDifficulty"] : undefined,
    }];
  }).slice(0, 50);
}

export async function POST(request: NextRequest) {
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để rà soát chuyên sâu." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const body = await request.json() as { exam?: unknown; deterministicIssues?: Array<{ code?: string; questionId?: string }> };
    if (!isExam(body.exam)) return NextResponse.json({ ok: false, error: "Dữ liệu đề không hợp lệ." }, { status: 400 });
    const blockedIds = new Set((body.deterministicIssues || []).filter((issue) => invalidDeterministicCodes.has(String(issue.code))).map((issue) => String(issue.questionId || "")));
    const questions = body.exam.parts.flatMap((part) => part.questions).filter((question) => !blockedIds.has(question.id)).slice(0, 30);
    if (!questions.length) return NextResponse.json({ ok: true, findings: [], reviewedQuestionCount: 0 });
    const provider = getConfiguredProvider();
    if (provider.name === "local") return NextResponse.json({ ok: false, unavailable: true, error: "Rà soát chuyên sâu hiện chưa được cấu hình. Bộ kiểm tra cấu trúc vẫn hoạt động đầy đủ." }, { status: 503 });
    const prompt = `Bạn kiểm tra ngữ nghĩa câu hỏi cho giáo viên Việt Nam. Chỉ xem các lỗi khó xác định bằng quy tắc: thiếu dữ kiện, mơ hồ, có thể có nhiều đáp án, đáp án có khả năng sai, hoặc nhãn mức độ nhận thức lệch rõ ràng. Không sửa đề. Không khẳng định chắc chắn nếu chưa đủ dữ liệu. Không nêu tên hệ thống hay nhà cung cấp.\n\nTrả về đúng JSON object có hai trường: {"title":"Kiểm tra đề","content":"<chuỗi JSON>"}. Trường content phải là chuỗi JSON hợp lệ có dạng {"findings":[{"questionId":"...","code":"possible_answer_mismatch|ambiguous_question|missing_data|cognitive_level_mismatch","severity":"warning|info","title":"...","description":"...","suggestedFix":"...","confidence":"high|medium|low","detectedDifficulty":"Nhận biết|Thông hiểu|Vận dụng|Vận dụng cao"}]}. Không thêm markdown. Chỉ báo vấn đề có căn cứ; nếu không có thì findings rỗng.\n\nCâu hỏi:\n${JSON.stringify(questions.map((question) => ({ id: question.id, part: question.part, stem: question.stem, options: question.options, statements: question.trueFalseItems, answer: question.answer, explanation: question.explanation, difficulty: question.cognitiveLevel || question.difficulty })))}`;
    const response = await provider.generate({ tool: "exam-audit", input: {}, prompt });
    const parsed = extractJson(response.content);
    if (!parsed.ok) return NextResponse.json({ ok: false, error: "Chưa thể đọc kết quả rà soát chuyên sâu. Vui lòng thử lại." }, { status: 502 });
    const questionIds = new Set(questions.map((question) => question.id));
    return NextResponse.json({ ok: true, findings: normalizeFindings(parsed.value, questionIds), reviewedQuestionCount: questions.length });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("exam_audit_semantic_failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Chưa thể rà soát chuyên sâu lúc này. Bộ kiểm tra cấu trúc vẫn có thể sử dụng." }, { status: 502 });
  }
}
