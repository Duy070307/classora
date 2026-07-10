import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateTikzSnippetInput } from "@/lib/tikz-bank";

const selectFields = "id,created_at,updated_at,user_id,bank_scope,title,description,category,subject,grade,tags,tikz_code,full_latex,preview_note,source_type,needs_review";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập." }, { status: 401 });
    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ ok: false, error: "Chưa tải được Ngân hàng TikZ. Vui lòng thử lại." }, { status: 503 });

    if (user.role === "admin") {
      const { data, error } = await admin.from("tikz_bank").select(selectFields).order("created_at", { ascending: false });
      if (error) return NextResponse.json({ ok: false, error: "Chưa tải được Ngân hàng TikZ. Vui lòng thử lại." }, { status: 500 });
      return NextResponse.json({ ok: true, snippets: data || [], isAdmin: true, userId: user.id });
    }

    const [systemResult, ownResult] = await Promise.all([
      admin.from("tikz_bank").select(selectFields).eq("bank_scope", "system").order("title"),
      admin.from("tikz_bank").select(selectFields).eq("bank_scope", "user").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (systemResult.error || ownResult.error) return NextResponse.json({ ok: false, error: "Chưa tải được Ngân hàng TikZ. Vui lòng thử lại." }, { status: 500 });
    return NextResponse.json({ ok: true, snippets: [...(ownResult.data || []), ...(systemResult.data || [])], isAdmin: false, userId: user.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Chưa tải được Ngân hàng TikZ. Vui lòng thử lại." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để lưu mã TikZ." }, { status: 401 });
    const body = await request.json().catch(() => null);
    const validated = validateTikzSnippetInput(body);
    if (!validated.ok) return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ ok: false, error: "Chưa lưu được mã TikZ. Vui lòng thử lại." }, { status: 503 });
    const allowedSource = ["teacher_created", "generated_from_image"].includes(validated.data.source_type || "") ? validated.data.source_type : "teacher_created";
    const { data, error } = await admin.from("tikz_bank").insert({
      user_id: user.id,
      bank_scope: "user",
      ...validated.data,
      source_type: allowedSource,
      needs_review: true,
      updated_at: new Date().toISOString(),
    }).select(selectFields).single();
    if (error) return NextResponse.json({ ok: false, error: "Chưa lưu được mã TikZ. Vui lòng thử lại." }, { status: 500 });
    return NextResponse.json({ ok: true, snippet: data, warnings: validated.warnings });
  } catch {
    return NextResponse.json({ ok: false, error: "Chưa lưu được mã TikZ. Vui lòng thử lại." }, { status: 500 });
  }
}
