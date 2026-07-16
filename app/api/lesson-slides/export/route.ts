import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { buildLessonSlidesPptx } from "@/lib/lesson-slides/pptx";
import { normalizeDeck, validateDeckForExport } from "@/lib/lesson-slides/normalize";
import type { SlideDeck } from "@/lib/lesson-slides/types";

export const runtime = "nodejs";

function validBody(value: unknown): value is { deck: SlideDeck; audience: "student" | "teacher" } {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  const deck = body.deck as Record<string, unknown> | undefined;
  return Boolean(deck && typeof deck.title === "string" && Array.isArray(deck.slides) && deck.slides.length > 0 && deck.slides.length <= 30 && (body.audience === "student" || body.audience === "teacher"));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để xuất PowerPoint." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const raw = await request.text();
    if (raw.length > 14 * 1024 * 1024) return NextResponse.json({ ok: false, error: "Bản trình chiếu có quá nhiều dữ liệu ảnh để xuất." }, { status: 413 });
    const body: unknown = JSON.parse(raw);
    if (!validBody(body)) return NextResponse.json({ ok: false, error: "Bản trình chiếu không hợp lệ." }, { status: 400 });
    const deck = normalizeDeck(body.deck);
    const validation = validateDeckForExport(deck, body.audience);
    if (validation.status === "blocked") return NextResponse.json({ ok: false, error: validation.issues.filter((issue) => issue.level === "error").map((issue) => issue.message).join(" ") }, { status: 422 });
    const file = await buildLessonSlidesPptx(deck, body.audience);
    return new Response(file, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "Content-Disposition": "attachment; filename=Soan_Lab_Lesson_Slides.pptx", "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("[lesson-slides:export]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: "Chưa thể xuất PowerPoint. Vui lòng kiểm tra các cảnh báo và thử lại." }, { status: 400 });
  }
}
