import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeTikzSnippetRecords, validateTikzSnippetInput } from "@/lib/tikz-bank";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập." }, { status: 401 });
    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ ok: false, error: "Chưa tải được Ngân hàng TikZ. Vui lòng thử lại." }, { status: 503 });

    if (user.role === "admin") {
      const { data, error } = await admin.from("tikz_bank").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) {
        console.error("tikz_bank_admin_load_failed", { code: error.code, message: error.message });
        return NextResponse.json({ ok: false, error: "Chưa tải được Ngân hàng TikZ. Vui lòng thử lại." }, { status: 500 });
      }
      const normalized = normalizeTikzSnippetRecords(data || []);
      return NextResponse.json({ ok: true, snippets: normalized.snippets, ignoredRecords: normalized.rejected, isAdmin: true, userId: user.id });
    }

    const [systemResult, ownResult] = await Promise.all([
      admin.from("tikz_bank").select("*").eq("bank_scope", "system").order("title").limit(500),
      admin.from("tikz_bank").select("*").eq("bank_scope", "user").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500),
    ]);
    if (systemResult.error || ownResult.error) {
      const error = systemResult.error || ownResult.error;
      console.error("tikz_bank_teacher_load_failed", { code: error?.code, message: error?.message });
      return NextResponse.json({ ok: false, error: "Chưa tải được Ngân hàng TikZ. Vui lòng thử lại." }, { status: 500 });
    }
    const normalized = normalizeTikzSnippetRecords([...(ownResult.data || []), ...(systemResult.data || [])]);
    return NextResponse.json({ ok: true, snippets: normalized.snippets, ignoredRecords: normalized.rejected, isAdmin: false, userId: user.id });
  } catch (error) {
    console.error("tikz_bank_load_exception", error instanceof Error ? error.message : "unknown_error");
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
    }).select("*").single();
    if (error) return NextResponse.json({ ok: false, error: "Chưa lưu được mã TikZ. Vui lòng thử lại." }, { status: 500 });
    return NextResponse.json({ ok: true, snippet: data, warnings: validated.warnings });
  } catch {
    return NextResponse.json({ ok: false, error: "Chưa lưu được mã TikZ. Vui lòng thử lại." }, { status: 500 });
  }
}
