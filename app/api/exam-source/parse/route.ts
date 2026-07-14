import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createExamBlueprint } from "@/lib/exam-source/blueprint";
import { examSourceErrorMessage, parseExamSourceFile, parsePastedExamSource } from "@/lib/exam-source/file-parser";
import type { ExamSourceType } from "@/lib/exam-source/types";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export const runtime = "nodejs";

const sourceTypes = new Set<ExamSourceType>(["matrix", "specification", "previous_exam", "lesson_material", "unknown"]);

export async function POST(request: NextRequest) {
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để tạo đề từ file." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const contentType = request.headers.get("content-type") || "";
    let sourceType: ExamSourceType = "unknown";
    let parsed;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const requestedType = String(form.get("sourceType") || "unknown") as ExamSourceType;
      sourceType = sourceTypes.has(requestedType) ? requestedType : "unknown";
      if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Vui lòng chọn file cần đọc." }, { status: 400 });
      parsed = await parseExamSourceFile(file, sourceType);
    } else {
      const body = await request.json() as { text?: unknown; sourceType?: unknown };
      const requestedType = String(body.sourceType || "unknown") as ExamSourceType;
      sourceType = sourceTypes.has(requestedType) ? requestedType : "unknown";
      if (typeof body.text !== "string") return NextResponse.json({ ok: false, error: "Vui lòng dán nội dung cần đọc." }, { status: 400 });
      parsed = await parsePastedExamSource(body.text, sourceType);
    }
    const blueprint = createExamBlueprint(parsed, sourceType);
    return NextResponse.json({ ok: true, source: parsed, blueprint });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("exam_source_parse_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: examSourceErrorMessage(error) }, { status: 400 });
  }
}

