import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để lưu mã TikZ." }, { status: 401 });
    const body = await request.json().catch(() => null) as { id?: unknown } | null;
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ ok: false, error: "Thiếu mã TikZ cần lưu." }, { status: 400 });
    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ ok: false, error: "Chưa lưu được mã TikZ. Vui lòng thử lại." }, { status: 503 });
    const { data: source, error: sourceError } = await admin.from("tikz_bank").select("*").eq("id", id).eq("bank_scope", "system").maybeSingle();
    if (sourceError || !source) return NextResponse.json({ ok: false, error: "Không tìm thấy mã TikZ SOẠN LAB để lưu." }, { status: 404 });
    const { data: existing } = await admin.from("tikz_bank").select("id").eq("bank_scope", "user").eq("user_id", user.id).eq("title", source.title).limit(1);
    if (existing?.length) return NextResponse.json({ ok: true, copied: false, message: "Mã TikZ này đã có trong ngân hàng của tôi." });
    const { data, error } = await admin.from("tikz_bank").insert({
      user_id: user.id,
      bank_scope: "user",
      title: source.title,
      description: source.description,
      category: source.category,
      subject: source.subject,
      grade: source.grade,
      tags: source.tags,
      tikz_code: source.tikz_code,
      full_latex: source.full_latex,
      preview_note: source.preview_note,
      source_type: "copied_from_soanlab",
      needs_review: true,
    }).select("*").single();
    if (error) return NextResponse.json({ ok: false, error: "Chưa lưu được mã TikZ. Vui lòng thử lại." }, { status: 500 });
    return NextResponse.json({ ok: true, copied: true, snippet: data, message: "Đã lưu mã TikZ vào ngân hàng của tôi." });
  } catch {
    return NextResponse.json({ ok: false, error: "Chưa lưu được mã TikZ. Vui lòng thử lại." }, { status: 500 });
  }
}
