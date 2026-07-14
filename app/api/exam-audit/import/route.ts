import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { importErrorMessage, importExamFile } from "@/lib/exam-audit/file-import";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để kiểm tra đề." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Vui lòng chọn file đề cần kiểm tra." }, { status: 400 });
    const result = await importExamFile(file);
    return NextResponse.json({ ok: true, exam: result.exam, warnings: result.warnings, confidence: result.confidence });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("exam_audit_import_failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: importErrorMessage(error) }, { status: 400 });
  }
}
