import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getKnttTheorySeedQuestions } from "@/lib/question-bank/kntt-theory-seed";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/is-configured";

type SeedBody = {
  type?: string;
};

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
    return NextResponse.json({ ok: true, inserted: 0, skipped: seeds.length });
  }

  const { error } = await admin.from("question_bank").upsert(rows, { onConflict: "id" });
  if (error) {
    return NextResponse.json({ ok: false, error: "Chưa thêm được câu hỏi mẫu. Vui lòng thử lại." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: rows.length, skipped: seeds.length - rows.length });
}
