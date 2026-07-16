import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { lessonSlideSourceError, parseLessonSlideSource } from "@/lib/lesson-slides/file-parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để đọc tài liệu." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Vui lòng chọn một tệp." }, { status: 400 });
    const source = await parseLessonSlideSource({ name: file.name, buffer: Buffer.from(await file.arrayBuffer()) });
    return NextResponse.json({ ok: true, source });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("[lesson-slides:parse]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: lessonSlideSourceError(error) }, { status: 400 });
  }
}
