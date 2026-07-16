import { NextResponse } from "next/server";
import jsQR from "jsqr";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth/user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildAnswerSheetLayout } from "@/lib/answer-sheet/layout";
import { isAnswerSheetOwner, parseQrPayload, validateQrPayload } from "@/lib/answer-sheet/checksum";
import { bubblesToRecognizedAnswers, recognizeAnswerSheetPage, shortAnswerRegionsToRecognizedAnswers, type GrayImage } from "@/lib/answer-sheet/recognition";
import type { AnswerSheetLayout, AnswerSheetTemplate } from "@/lib/answer-sheet/types";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

async function decode(buffer: Buffer) {
  const result = await sharp(buffer).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8ClampedArray(result.data.buffer, result.data.byteOffset, result.data.byteLength);
  const qr = jsQR(pixels, result.info.width, result.info.height, { inversionAttempts: "attemptBoth" });
  return { ...result, qr };
}

async function normalizeRotation(buffer: Buffer) {
  let decoded = await decode(buffer);
  if (!decoded.qr) return decoded;
  const { topLeftCorner, topRightCorner } = decoded.qr.location;
  const angle = Math.atan2(topRightCorner.y - topLeftCorner.y, topRightCorner.x - topLeftCorner.x) * 180 / Math.PI;
  const nearest = Math.round(angle / 90) * 90;
  if (!nearest) return decoded;
  decoded = await decode(await sharp(buffer).rotate(-nearest, { background: "white" }).toBuffer());
  return decoded;
}

function grayFromRgba(data: Buffer, width: number, height: number): GrayImage {
  const gray = new Uint8Array(width * height);
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    gray[index] = Math.round(data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114);
  }
  return { width, height, data: gray };
}

async function shortAnswerCrops(data: Buffer, width: number, height: number, page: AnswerSheetLayout["pages"][number]) {
  const crops: Record<string, string> = {};
  const image = sharp(data, { raw: { width, height, channels: 4 } });
  for (const region of page.recognitionRegions.filter((item) => item.type === "short_answer")) {
    const left = Math.max(0, Math.floor(region.boundingBox.x / page.width * width));
    const top = Math.max(0, Math.floor(region.boundingBox.y / page.height * height));
    const cropWidth = Math.max(1, Math.min(width - left, Math.ceil(region.boundingBox.width / page.width * width)));
    const cropHeight = Math.max(1, Math.min(height - top, Math.ceil(region.boundingBox.height / page.height * height)));
    const crop = await image.clone().extract({ left, top, width: cropWidth, height: cropHeight }).resize({ width: 480, withoutEnlargement: true }).jpeg({ quality: 68 }).toBuffer();
    crops[region.id] = `data:image/jpeg;base64,${crop.toString("base64")}`;
  }
  return crops;
}

async function ownedTemplate(templateId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("documents").select("metadata,user_id").eq("id", templateId).eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  const metadata = data.metadata as Record<string, unknown> | null;
  const stored = metadata?.answerSheetTemplate as AnswerSheetTemplate | undefined;
  const template = stored ? { ...stored, ownerId: data.user_id as string } : undefined;
  const layout = metadata?.answerSheetLayout as AnswerSheetLayout | undefined;
  return template ? { template, layout: layout || buildAnswerSheetLayout(template) } : null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để đọc phiếu trả lời." }, { status: 401 });
  const maintenance = await getMaintenanceBlockForUser(user);
  if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
  try {
    const form = await request.formData();
    const file = form.get("image");
    const selectedTemplateId = String(form.get("templateId") || "").trim();
    if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type)) return NextResponse.json({ ok: false, error: "Chỉ hỗ trợ ảnh PNG, JPG/JPEG hoặc WEBP." }, { status: 400 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ ok: false, error: "Ảnh phiếu trả lời vượt quá giới hạn 12 MB." }, { status: 400 });
    const decoded = await normalizeRotation(Buffer.from(await file.arrayBuffer()));
    const payload = decoded.qr ? parseQrPayload(decoded.qr.data) : null;
    const templateId = payload?.templateId || selectedTemplateId;
    if (!templateId) return NextResponse.json({ ok: false, error: "Không đọc được mã QR. Vui lòng chọn đúng mẫu phiếu để thử căn theo điểm định vị." }, { status: 400 });
    const owned = await ownedTemplate(templateId, user.id);
    if (!owned || !isAnswerSheetOwner(owned.template, user.id)) return NextResponse.json({ ok: false, error: "Không tìm thấy phiếu trả lời thuộc tài khoản này." }, { status: 403 });
    if (payload && !validateQrPayload(payload, owned.template)) return NextResponse.json({ ok: false, error: "Mã nhận diện không hợp lệ hoặc không thuộc mẫu phiếu đã chọn." }, { status: 400 });
    const pageNumber = payload?.page || Math.max(1, Number(form.get("pageNumber")) || 1);
    const image = grayFromRgba(decoded.data, decoded.info.width, decoded.info.height);
    const result = recognizeAnswerSheetPage(image, owned.template, owned.layout, pageNumber, Boolean(payload));
    const pageLayout = owned.layout.pages.find((page) => page.pageNumber === pageNumber) || owned.layout.pages[0];
    const objectiveAnswers = bubblesToRecognizedAnswers(owned.template, result.bubbles, pageNumber).map((answer) => {
      const regions = pageLayout?.recognitionRegions.filter((region) => region.questionId === answer.questionId && region.type === "bubble") || [];
      if (!regions.length || !pageLayout) return answer;
      const left = Math.min(...regions.map((region) => region.boundingBox.x)); const top = Math.min(...regions.map((region) => region.boundingBox.y));
      const right = Math.max(...regions.map((region) => region.boundingBox.x + region.boundingBox.width)); const bottom = Math.max(...regions.map((region) => region.boundingBox.y + region.boundingBox.height));
      return { ...answer, sourceRegion: { x: left / pageLayout.width, y: top / pageLayout.height, width: (right - left) / pageLayout.width, height: (bottom - top) / pageLayout.height } };
    });
    const crops = pageLayout ? await shortAnswerCrops(decoded.data, decoded.info.width, decoded.info.height, pageLayout) : {};
    const shortAnswers = pageLayout ? shortAnswerRegionsToRecognizedAnswers(pageLayout, crops) : [];
    const answers = [...objectiveAnswers, ...shortAnswers];
    return NextResponse.json({ ok: true, templateId, variantCode: owned.template.variantCode, examCode: owned.template.variantCode, examCodeConfidence: owned.template.variantCode ? "high" : undefined, pageNumber, expectedPageCount: owned.layout.pages.length, result, answers, warnings: result.warnings, format: "soanlab_answer_sheet" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("answer_sheet_recognition_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: "Chưa thể đọc phiếu trả lời này. Vui lòng kiểm tra ảnh và thử lại." }, { status: 400 });
  }
}
