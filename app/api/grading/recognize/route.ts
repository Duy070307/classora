import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { requestOpenAICompatibleVision } from "@/lib/ai/providers/openai-provider";
import { parseSubmissionRecognition } from "@/lib/grading/ai";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { recognitionImageMimes, RECOGNITION_MAX_IMAGE_SIZE, validateRecognitionFile } from "@/lib/document-recognition/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;
  if (isSupabaseConfigured() && !user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để chấm bài." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const form = await request.formData(); const image = form.get("image");
    if (!(image instanceof File)) return NextResponse.json({ ok: false, error: "Vui lòng chọn trang bài làm cần nhận dạng." }, { status: 400 });
    if (!recognitionImageMimes.has(image.type) || image.size > RECOGNITION_MAX_IMAGE_SIZE) throw new Error(image.size > RECOGNITION_MAX_IMAGE_SIZE ? "file_too_large" : "unsupported_file");
    const bytes = new Uint8Array(await image.arrayBuffer()); validateRecognitionFile({ name: image.name, type: image.type, size: image.size, bytes: bytes.slice(0, 16) });
    const pageNumber = Math.max(1, Math.min(30, Number(form.get("pageNumber") || 1)));
    const expectedQuestions = String(form.get("expectedQuestions") || "").slice(0, 1000);
    const raw = await requestOpenAICompatibleVision({ imageBase64: Buffer.from(bytes).toString("base64"), mimeType: image.type, prompt: `Đọc một trang bài làm của học sinh Việt Nam để giáo viên rà soát. Chỉ chép nội dung nhìn thấy; không giải bài, không suy đoán đáp án bị mờ, không tự chấm điểm. Nhận diện họ tên, mã học sinh, lớp, số báo danh, MÃ ĐỀ, câu trả lời A/B/C/D, Đúng/Sai, số, biểu thức và nội dung viết tay. Dấu mờ, tẩy xóa, khoanh nhiều phương án, chữ viết tay hoặc vùng bị cắt phải confidence=low. Trả JSON duy nhất, không markdown: {"student":{"displayName":"","studentCode":"","className":"","candidateNumber":""},"examCode":"","examCodeConfidence":"high|medium|low","answers":[{"questionId":"","questionNumber":1,"rawValue":"","normalizedValue":"","confidence":"high|medium|low","sourceRegion":{"x":0,"y":0,"width":1,"height":0.1},"warnings":[]}],"warnings":[]}. Trang ${pageNumber}. Danh sách câu dự kiến để đối chiếu số thứ tự, không dùng để đoán câu trả lời: ${expectedQuestions}` });
    return NextResponse.json({ ok: true, ...parseSubmissionRecognition(raw, pageNumber) });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("grading_recognition_failed", error instanceof Error ? error.message : "unknown");
    const code = error instanceof Error ? error.message : "unknown";
    const message = code === "file_too_large" ? "Bài làm vượt quá giới hạn dung lượng cho phép." : code === "unsupported_file" ? "Định dạng bài làm này chưa được hỗ trợ." : "SOẠN LAB tạm thời chưa thể đọc bài làm này. Kết quả đã xử lý vẫn được giữ lại.";
    return NextResponse.json({ ok: false, error: message }, { status: code === "file_too_large" || code === "unsupported_file" ? 400 : 503 });
  }
}
