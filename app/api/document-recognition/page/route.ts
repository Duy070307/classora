import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { recognizeExamPage } from "@/lib/document-recognition/vision";
import { recognitionErrorMessage, recognitionImageMimes, RECOGNITION_MAX_IMAGE_SIZE, validateRecognitionFile } from "@/lib/document-recognition/validation";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để đọc đề từ ảnh/PDF." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return NextResponse.json({ ok: false, error: "Vui lòng chọn ảnh trang cần nhận dạng." }, { status: 400 });
    if (!recognitionImageMimes.has(image.type) || image.size > RECOGNITION_MAX_IMAGE_SIZE) throw new Error(image.size > RECOGNITION_MAX_IMAGE_SIZE ? "file_too_large" : "unsupported_file");
    const bytes = new Uint8Array(await image.arrayBuffer());
    validateRecognitionFile({ name: image.name, type: image.type, size: image.size, bytes: bytes.slice(0, 16) });
    const pageNumber = Math.max(1, Math.min(30, Number(form.get("pageNumber") || 1)));
    const extractedText = String(form.get("extractedText") || "").slice(0, 20000);
    const result = await recognizeExamPage({ imageBase64: Buffer.from(bytes).toString("base64"), mimeType: image.type, pageNumber, extractedText });
    const handwritingWarning = "Đây có thể là nội dung viết tay. Kết quả nhận dạng có thể chưa chính xác và cần được kiểm tra kỹ.";
    const blocks = result.handwritingLikely ? result.blocks.map((block) => ({ ...block, confidence: block.confidence === "high" ? "medium" as const : block.confidence, reviewed: false, warnings: [...new Set([...block.warnings, handwritingWarning])] })) : result.blocks;
    return NextResponse.json({ ok: true, blocks, warnings: result.handwritingLikely ? [...new Set([...result.warnings, handwritingWarning])] : result.warnings, handwritingLikely: result.handwritingLikely });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("document_recognition_page_failed", error instanceof Error ? error.message : "unknown");
    const unavailable = error instanceof Error && /vision_(?:unavailable|failed|empty|parse_failed)/.test(error.message);
    return NextResponse.json({ ok: false, error: unavailable ? "SOẠN LAB tạm thời chưa thể đọc hình ảnh. Các trang đã xử lý vẫn được giữ lại." : recognitionErrorMessage(error) }, { status: unavailable ? 503 : 400 });
  }
}
