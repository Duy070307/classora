import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { buildAnswerSheetLayout } from "@/lib/answer-sheet/layout";
import { templateChecksumInput, answerSheetChecksum } from "@/lib/answer-sheet/checksum";
import type { AnswerSheetTemplate } from "@/lib/answer-sheet/types";

function isTemplate(value: unknown): value is AnswerSheetTemplate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AnswerSheetTemplate>;
  return typeof candidate.title === "string" && Array.isArray(candidate.sections) && typeof candidate.recognition?.templateId === "string";
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để tạo phiếu trả lời." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const body = await request.json() as { template?: unknown };
    if (!isTemplate(body.template)) return NextResponse.json({ ok: false, error: "Cấu hình phiếu trả lời chưa hợp lệ." }, { status: 400 });
    const expected = answerSheetChecksum(templateChecksumInput(body.template));
    if (body.template.recognition.checksum !== expected) return NextResponse.json({ ok: false, error: "Cấu hình phiếu đã thay đổi. Vui lòng tạo lại bản xem trước." }, { status: 400 });
    return NextResponse.json({ ok: true, layout: buildAnswerSheetLayout(body.template) });
  } catch {
    return NextResponse.json({ ok: false, error: "Chưa thể tạo bố cục phiếu trả lời lúc này." }, { status: 400 });
  }
}
