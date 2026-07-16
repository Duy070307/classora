import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { getConfiguredProvider } from "@/lib/ai/provider";
import { buildSlidePrompt, parseGeneratedSlide } from "@/lib/lesson-slides/ai";
import { slideCacheKey } from "@/lib/lesson-slides/normalize";
import type { Slide, SlideGenerationSettings } from "@/lib/lesson-slides/types";

const cache = new Map<string, Slide>();

function validBody(value: unknown): value is { slide: Slide; settings: SlideGenerationSettings; sourceText: string; sourceHash?: string; sourceConfirmed?: boolean; action?: string } {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return Boolean(body.slide && typeof body.slide === "object" && body.settings && typeof body.settings === "object" && typeof body.sourceText === "string" && body.sourceText.length <= 180_000);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để tạo slide." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const body: unknown = await request.json();
    if (!validBody(body)) return NextResponse.json({ ok: false, error: "Yêu cầu tạo slide không hợp lệ." }, { status: 400 });
    if (body.sourceConfirmed === false) return NextResponse.json({ ok: false, error: "Tài liệu vẫn còn nội dung chưa được xác nhận. Vui lòng hoàn tất rà soát trước khi tạo slide." }, { status: 409 });
    const key = slideCacheKey(body.slide, body.sourceHash || "");
    const cached = cache.get(key);
    if (cached && !body.action) return NextResponse.json({ ok: true, slide: cached, cached: true });
    const prompt = buildSlidePrompt(body.slide, body.settings, body.sourceText, body.action);
    let slide: Slide;
    try {
      const provider = getConfiguredProvider();
      const response = await provider.generate({ tool: "lesson-slides", input: {}, prompt });
      slide = parseGeneratedSlide(response.content, body.slide, body.settings, body.sourceText);
    } catch {
      slide = parseGeneratedSlide("", body.slide, body.settings, body.sourceText);
    }
    cache.set(key, slide);
    if (cache.size > 160) cache.delete(cache.keys().next().value || "");
    return NextResponse.json({ ok: true, slide, cached: false });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("[lesson-slides:generate]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: "Slide này chưa tạo được nội dung. Thầy cô có thể thử lại riêng slide này." }, { status: 400 });
  }
}
