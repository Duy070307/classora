import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { normalizeLegacyTikzDraft } from "@/lib/tikz/model";
import { buildTikzAssets, buildTikzZip } from "@/lib/tikz/server-export";
import { sanitizeDownloadName } from "@/lib/tikz/safety";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để kết xuất hình TikZ." }, { status: 401 });
    const maintenance = await getMaintenanceBlockForUser(user); if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
    const body = await request.json() as { draft?: unknown; format?: string; fileName?: string }; const format = body.format || "svg";
    if (!body.draft || !["svg", "png", "zip"].includes(format)) return NextResponse.json({ ok: false, error: "Yêu cầu kết xuất hình chưa hợp lệ." }, { status: 400 });
    const draft = normalizeLegacyTikzDraft(body.draft); const fileName = sanitizeDownloadName(body.fileName || "soan-lab-tikz");
    if (format === "zip") return new NextResponse(Uint8Array.from(await buildTikzZip(draft)).buffer, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${fileName}.zip"`, "Cache-Control": "private, no-store" } });
    const assets = await buildTikzAssets(draft); const data = format === "png" ? assets.png : assets.svg; const contentType = format === "png" ? "image/png" : "image/svg+xml; charset=utf-8";
    return new NextResponse(Uint8Array.from(data).buffer, { headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="${fileName}.${format}"`, "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("[tikz-render]", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ ok: false, error: "Chưa thể kết xuất hình TikZ. Vui lòng kiểm tra mã và thử lại." }, { status: 422 });
  }
}
