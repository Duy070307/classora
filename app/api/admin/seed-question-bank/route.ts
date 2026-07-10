import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getKnttTheorySeedQuestions } from "@/lib/question-bank/kntt-theory-seed";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/is-configured";

type SeedBody = {
  type?: string;
};

type SystemQuestionRow = {
  id: string;
  subject?: string | null;
  question_type?: string | null;
  content?: string | null;
  options?: Record<string, unknown> | null;
  answer?: string | null;
  explanation?: string | null;
  metadata?: Record<string, unknown> | null;
};

function hasValidOptions(options: unknown) {
  if (!options || typeof options !== "object") return false;
  const record = options as Record<string, unknown>;
  return ["A", "B", "C", "D"].every((key) => typeof record[key] === "string" && String(record[key]).trim().length > 0);
}

function isInvalidSystemMcq(row: SystemQuestionRow) {
  const answer = String(row.answer || "").trim().toUpperCase();
  const content = String(row.content || "");
  const explanation = String(row.explanation || "");
  const options = row.options || {};
  const optionValues = Object.values(options).map((value) => String(value || "").trim().toLowerCase());
  return row.question_type !== "Trắc nghiệm"
    || !["Vật lí", "Hóa học"].includes(String(row.subject || ""))
    || !hasValidOptions(row.options)
    || !["A", "B", "C", "D"].includes(answer)
    || new Set(optionValues).size < 4
    || /kiểm tra kiến thức nền|yêu cầu nào phù hợp|phương án nào phù hợp nhất/i.test(content)
    || /cần kiểm tra bản chất|Phương án A phù hợp/i.test(explanation);
}

export async function POST(request: NextRequest) {
  let body: SeedBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yêu cầu chưa hợp lệ." }, { status: 400 });
  }

  if (body.type !== "kntt-theory") {
    return NextResponse.json({ ok: false, error: "Loại dữ liệu mẫu chưa được hỗ trợ." }, { status: 400 });
  }

  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "Chưa thể thêm dữ liệu mẫu trong môi trường hiện tại." }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập." }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Chỉ quản trị viên mới có thể thêm câu hỏi mẫu." }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "Chưa thể thêm dữ liệu mẫu lúc này." }, { status: 503 });

  const seeds = getKnttTheorySeedQuestions();

  const { count: removedOtherSubjects, error: removeSubjectError } = await admin
    .from("question_bank")
    .delete({ count: "exact" })
    .eq("bank_scope", "system")
    .not("subject", "in", '("Vật lí","Hóa học")');

  if (removeSubjectError) {
    return NextResponse.json({ ok: false, error: "Chưa dọn được dữ liệu mẫu không còn dùng." }, { status: 500 });
  }

  const { count: removedOtherTypes, error: removeTypeError } = await admin
    .from("question_bank")
    .delete({ count: "exact" })
    .eq("bank_scope", "system")
    .neq("question_type", "Trắc nghiệm");

  if (removeTypeError) {
    return NextResponse.json({ ok: false, error: "Chưa dọn được dạng câu hỏi mẫu không còn dùng." }, { status: 500 });
  }

  const { error: normalizeError } = await admin
    .from("question_bank")
    .update({
      user_id: null,
      book_series: "Kết nối tri thức",
      source_type: "Soạn Lab seed",
      content_type: "Lý thuyết",
      needs_review: true,
    })
    .eq("bank_scope", "system");

  if (normalizeError) {
    return NextResponse.json({ ok: false, error: "Chưa chuẩn hóa được dữ liệu mẫu hiện có." }, { status: 500 });
  }

  const { data: healthRows, error: healthError } = await admin
    .from("question_bank")
    .select("id, subject, question_type, content, options, answer, explanation, metadata")
    .eq("bank_scope", "system");

  if (healthError) {
    return NextResponse.json({ ok: false, error: "Chưa kiểm tra được dữ liệu mẫu hiện có." }, { status: 500 });
  }

  const invalidRows = ((healthRows || []) as SystemQuestionRow[]).filter(isInvalidSystemMcq);
  if (invalidRows.length) {
    const { error: deleteInvalidError } = await admin
      .from("question_bank")
      .delete()
      .eq("bank_scope", "system")
      .in("id", invalidRows.map((row) => row.id));
    if (deleteInvalidError) {
      return NextResponse.json({ ok: false, error: "Chưa dọn được câu hỏi mẫu chưa hợp lệ." }, { status: 500 });
    }
  }

  const { data: existingRows, error: existingError } = await admin
    .from("question_bank")
    .select("id, subject, grade, topic, content, metadata, bank_scope, book_series, source_type")
    .eq("bank_scope", "system");

  if (existingError) {
    return NextResponse.json({ ok: false, error: "Chưa kiểm tra được dữ liệu mẫu hiện có." }, { status: 500 });
  }

  const existingKeys = new Set(
    (existingRows || []).map((row) => {
      const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {};
      return String(metadata.seedKey || row.content || "");
    })
  );

  const rows = seeds
    .filter((item) => !existingKeys.has(String(item.metadata?.seedKey || item.question)))
    .map((item) => ({
      id: item.id,
      user_id: null,
      bank_scope: "system",
      subject: item.subject,
      grade: item.grade,
      topic: item.topic,
      question_type: item.type,
      difficulty: item.difficulty,
      content: item.question,
      options: item.options || null,
      answer: item.answer,
      explanation: item.explanation,
      book_series: item.metadata?.bookSeries || "Kết nối tri thức",
      source_type: "Soạn Lab seed",
      content_type: item.metadata?.contentType || "Lý thuyết",
      needs_review: true,
      metadata: item.metadata || {},
      created_at: item.createdAt,
      updated_at: new Date().toISOString(),
    }));

  if (!rows.length) {
    return NextResponse.json({ ok: true, inserted: 0, skipped: seeds.length, cleaned: (removedOtherSubjects || 0) + (removedOtherTypes || 0) + invalidRows.length, health: { totalSystem: healthRows?.length || 0, invalidSystemMcq: invalidRows.length } });
  }

  const { error } = await admin.from("question_bank").upsert(rows, { onConflict: "id" });
  if (error) {
    return NextResponse.json({ ok: false, error: "Chưa thêm được câu hỏi mẫu. Vui lòng thử lại." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: rows.length, skipped: seeds.length - rows.length, cleaned: (removedOtherSubjects || 0) + (removedOtherTypes || 0) + invalidRows.length, health: { totalSystem: healthRows?.length || 0, invalidSystemMcq: invalidRows.length } });
}
