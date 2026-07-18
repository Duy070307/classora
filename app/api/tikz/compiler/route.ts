import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { compileTikzDocument, getTikzCompilerStatus } from "@/lib/tikz/compiler";

export async function GET() {
  const user = await getCurrentUser();
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để kiểm tra bản TikZ." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user); if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  return NextResponse.json({ ok: true, ...(await getTikzCompilerStatus()) }, { headers: { "Cache-Control": "private, max-age=300" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để biên dịch TikZ." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user); if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  const body = await request.json().catch(() => null) as { source?: string } | null;
  if (!body?.source || typeof body.source !== "string") return NextResponse.json({ ok: false, error: "Mã TikZ chưa hợp lệ." }, { status: 400 });
  const compiled = await compileTikzDocument(body.source);
  if (!compiled.result.success || !compiled.pdf) return NextResponse.json({ ok: false, compilation: compiled.result, error: compiled.result.available ? "Biên dịch TikZ chưa thành công." : "Máy chủ hiện chưa có trình biên dịch TeX. SOẠN LAB vẫn tạo mã TikZ và bản SVG để thầy cô kiểm tra." }, { status: compiled.result.available ? 422 : 501 });
  return new NextResponse(Uint8Array.from(compiled.pdf).buffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=soan-lab-tikz.pdf", "Cache-Control": "private, no-store" } });
}
