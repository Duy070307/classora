import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { parseExamSourceFile, examSourceErrorMessage } from "@/lib/exam-source/file-parser";
import { importRowsFromTable, importRowsFromText } from "@/lib/question-bank-core/import";

export async function POST(request: NextRequest) {
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để nhập câu hỏi." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Vui lòng chọn file cần nhập." }, { status: 400 });
    const parsed = await parseExamSourceFile(file);
    const tableRows = parsed.tables.flatMap((table) => importRowsFromTable(table.rows, `${file.name} · ${table.name}`));
    const rows = tableRows.length ? tableRows : importRowsFromText(parsed.text, file.name);
    return NextResponse.json({
      ok: true, rows, warnings: parsed.warnings,
      requiresRecognition: Boolean(parsed.metadata?.pageCount && !parsed.text.replace(/\s/g, "").length),
      source: { fileName: parsed.fileName, extension: parsed.extension, contentHash: parsed.contentHash },
    });
  } catch (error) {
    console.error("question_bank_import_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: examSourceErrorMessage(error) }, { status: 400 });
  }
}
