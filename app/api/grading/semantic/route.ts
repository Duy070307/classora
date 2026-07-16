import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { requestOpenAICompatibleText } from "@/lib/ai/providers/openai-provider";
import { parseSemanticSuggestions } from "@/lib/grading/ai";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export const runtime = "nodejs";

function clean(value: unknown, max: number) { return typeof value === "string" ? value.replace(/\u0000/g, "").trim().slice(0, max) : ""; }

export async function POST(request: NextRequest) {
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để chấm bài." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const body = await request.json() as Record<string, unknown>; const rubric = clean(body.rubric, 20_000);
    const responses = Array.isArray(body.responses) ? body.responses.slice(0, 30).flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const item = row as Record<string, unknown>; const questionId = clean(item.questionId, 120); const question = clean(item.question, 3000); const expected = clean(item.expected, 3000); const studentAnswer = clean(item.studentAnswer, 12_000); const maximumScore = Number(item.maximumScore);
      return questionId && studentAnswer && Number.isFinite(maximumScore) ? [{ questionId, question, expected, studentAnswer, maximumScore }] : [];
    }) : [];
    if (!responses.length) return NextResponse.json({ ok: false, error: "Không có câu trả lời mở cần hỗ trợ chấm." }, { status: 400 });
    const raw = await requestOpenAICompatibleText(`Hỗ trợ giáo viên chấm câu trả lời mở dựa duy nhất trên nội dung bài làm, đáp án đã xác minh và rubric do giáo viên chọn. Không dùng thông tin nhân khẩu học, không suy diễn tính cách, năng lực hay sự trung thực. Đây chỉ là điểm đề xuất, luôn cần giáo viên duyệt. Trích dẫn bằng chứng ngắn từ bài làm. Trả JSON duy nhất: {"suggestions":[{"questionId":"","suggestedScore":0,"maximumScore":1,"evidence":"","reason":"","feedback":"","confidence":"high|medium|low"}]}. Rubric: ${JSON.stringify(rubric || "Chưa có rubric; chỉ đối chiếu đáp án cuối và yêu cầu giáo viên xem lại.")}. Câu trả lời: ${JSON.stringify(responses)}`);
    return NextResponse.json({ ok: true, suggestions: parseSemanticSuggestions(raw) });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("grading_semantic_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: "SOẠN LAB tạm thời chưa thể hỗ trợ chấm câu trả lời mở. Điểm trắc nghiệm vẫn được giữ lại." }, { status: 503 });
  }
}
