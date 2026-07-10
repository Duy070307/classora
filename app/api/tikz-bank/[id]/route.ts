import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateTikzSnippetInput } from "@/lib/tikz-bank";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const selectFields = "id,created_at,updated_at,user_id,bank_scope,title,description,category,subject,grade,tags,tikz_code,full_latex,preview_note,source_type,needs_review";

async function contextFor(id: string) {
  if (!uuidPattern.test(id)) return { error: NextResponse.json({ ok: false, error: "Mã TikZ chưa hợp lệ." }, { status: 400 }) };
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ ok: false, error: "Vui lòng đăng nhập." }, { status: 401 }) };
  const admin = createSupabaseAdminClient();
  if (!admin) return { error: NextResponse.json({ ok: false, error: "Chưa thể cập nhật Ngân hàng TikZ." }, { status: 503 }) };
  const { data: current, error } = await admin.from("tikz_bank").select("id,user_id,bank_scope").eq("id", id).maybeSingle();
  if (error || !current) return { error: NextResponse.json({ ok: false, error: "Không tìm thấy mã TikZ." }, { status: 404 }) };
  const allowed = user.role === "admin" || (current.bank_scope === "user" && current.user_id === user.id);
  if (!allowed) return { error: NextResponse.json({ ok: false, error: "Thầy/cô không có quyền thay đổi mã TikZ này." }, { status: 403 }) };
  return { user, admin, current };
}

export async function PATCH(request: NextRequest, routeContext: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await routeContext.params;
    const context = await contextFor(id);
    if ("error" in context) return context.error;
    const body = await request.json().catch(() => null);
    const validated = validateTikzSnippetInput(body);
    if (!validated.ok) return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    const { data, error } = await context.admin.from("tikz_bank").update({
      title: validated.data.title,
      description: validated.data.description,
      category: validated.data.category,
      subject: validated.data.subject,
      grade: validated.data.grade,
      tags: validated.data.tags,
      tikz_code: validated.data.tikz_code,
      full_latex: validated.data.full_latex,
      preview_note: validated.data.preview_note,
      needs_review: true,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select(selectFields).single();
    if (error) return NextResponse.json({ ok: false, error: "Chưa cập nhật được mã TikZ. Vui lòng thử lại." }, { status: 500 });
    return NextResponse.json({ ok: true, snippet: data, warnings: validated.warnings });
  } catch {
    return NextResponse.json({ ok: false, error: "Chưa cập nhật được mã TikZ. Vui lòng thử lại." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, routeContext: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await routeContext.params;
    const context = await contextFor(id);
    if ("error" in context) return context.error;
    const { error } = await context.admin.from("tikz_bank").delete().eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: "Chưa xóa được mã TikZ. Vui lòng thử lại." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Chưa xóa được mã TikZ. Vui lòng thử lại." }, { status: 500 });
  }
}
