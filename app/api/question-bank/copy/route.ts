import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

function normalizeContent(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để sao chép câu hỏi." }, { status: 401 });
  }

  let body: { id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yêu cầu chưa hợp lệ." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ ok: false, error: "Thiếu câu hỏi cần sao chép." }, { status: 400 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để sao chép câu hỏi." }, { status: 401 });

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Chưa thể sao chép câu hỏi lúc này." }, { status: 503 });

  const { data: source, error: sourceError } = await supabase
    .from("question_bank")
    .select("*")
    .eq("id", id)
    .eq("bank_scope", "system")
    .maybeSingle();

  if (sourceError || !source) {
    return NextResponse.json({ ok: false, error: "Không tìm thấy câu hỏi Soạn Lab để sao chép." }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("question_bank")
    .select("id, content")
    .eq("bank_scope", "user")
    .eq("user_id", user.id)
    .eq("subject", source.subject)
    .eq("grade", source.grade)
    .limit(100);

  const sourceContent = normalizeContent(String(source.content || ""));
  if ((existing || []).some((row) => normalizeContent(String(row.content || "")) === sourceContent)) {
    return NextResponse.json({ ok: true, copied: false, message: "Câu hỏi này đã có trong ngân hàng của tôi." });
  }

  const metadata = source.metadata && typeof source.metadata === "object" ? source.metadata as Record<string, unknown> : {};
  const copiedMetadata = { ...metadata };
  delete copiedMetadata.generatedBy;
  delete copiedMetadata.seedKey;
  const bookSeries = String(source.book_series || metadata.bookSeries || "");
  const contentType = String(source.content_type || metadata.contentType || "");
  const { error } = await supabase.from("question_bank").insert({
    user_id: user.id,
    bank_scope: "user",
    subject: source.subject,
    grade: source.grade,
    topic: source.topic,
    question_type: source.question_type,
    difficulty: source.difficulty,
    content: source.content,
    options: source.options || null,
    answer: source.answer,
    explanation: source.explanation,
    book_series: bookSeries || null,
    source_type: "copied_from_soanlab",
    content_type: contentType || null,
    needs_review: true,
    metadata: {
      ...copiedMetadata,
      ...(bookSeries ? { bookSeries } : {}),
      ...(contentType ? { contentType } : {}),
      sourceType: "copied_from_soanlab",
      needsReview: true,
      referenceSourceId: source.id,
    },
  });

  if (error) return NextResponse.json({ ok: false, error: "Chưa thể sao chép câu hỏi lúc này." }, { status: 500 });

  return NextResponse.json({ ok: true, copied: true, message: "Đã sao chép câu hỏi vào ngân hàng của tôi." });
}
