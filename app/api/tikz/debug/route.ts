import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { normalizeLegacyTikzDraft } from "@/lib/tikz/model";
import { buildTikzDebugZip } from "@/lib/tikz/server-export";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ ok: false, error: "Không có quyền xuất gói chẩn đoán." }, { status: 403 });
  try {
    const form = await request.formData(); const raw = form.get("draft"); if (typeof raw !== "string" || raw.length > 200_000) return NextResponse.json({ ok: false, error: "Bản TikZ chưa hợp lệ." }, { status: 400 });
    const draft = normalizeLegacyTikzDraft(JSON.parse(raw)); const image = form.get("processedImage"); const processed = image instanceof File && image.size <= 10 * 1024 * 1024 ? Buffer.from(await image.arrayBuffer()) : undefined;
    const zip = await buildTikzDebugZip(draft, processed);
    return new NextResponse(Uint8Array.from(zip).buffer, { headers: { "Content-Type": "application/zip", "Content-Disposition": "attachment; filename=soan-lab-tikz-debug.zip", "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Chưa tạo được gói chẩn đoán đã làm sạch." }, { status: 422 });
  }
}
