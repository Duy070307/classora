import { NextResponse } from "next/server";
import { DiagramIncompleteError, generateLatexFromImage, VisionCapabilityError, type ImageToLatexMode } from "@/lib/ai/image-to-latex";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const allowedModes = new Set<ImageToLatexMode>(["auto", "formula", "geometry"]);
const maxSize = 5 * 1024 * 1024;

async function requireUserIfConfigured() {
  if (!isSupabaseConfigured()) return true;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return true;
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

export async function POST(request: Request) {
  try {
    const authenticated = await requireUserIfConfigured();
    if (!authenticated) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng đăng nhập để dùng công cụ Ảnh công thức → LaTeX." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("image");
    const modeValue = formData.get("mode");
    const mode = typeof modeValue === "string" && allowedModes.has(modeValue as ImageToLatexMode)
      ? modeValue as ImageToLatexMode
      : "auto";

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Vui lòng chọn một ảnh công thức để nhận diện." }, { status: 400 });
    }

    if (!allowedMimeTypes.has(file.type)) {
      return NextResponse.json({ ok: false, error: "Soạn Lab chỉ hỗ trợ ảnh PNG, JPG/JPEG hoặc WEBP." }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({ ok: false, error: "Ảnh quá lớn. Vui lòng dùng ảnh tối đa 5MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await generateLatexFromImage({
      imageBase64: buffer.toString("base64"),
      mimeType: file.type,
      mode,
    });
    const developmentDiagnostics = process.env.NODE_ENV === "development";

    return NextResponse.json({
      ok: true,
      type: result.type,
      latex: result.latex,
      displayLatex: result.displayLatex,
      tikzCode: result.tikzCode,
      standaloneLatex: result.standaloneLatex,
      explanation: result.explanation,
      confidence: result.confidence,
      warnings: result.warnings,
      geometryDiagnostic: developmentDiagnostics ? result.geometryDiagnostic : undefined,
      geometryStructure: developmentDiagnostics ? result.geometryStructure : undefined,
      diagramType: result.diagramType,
      diagramConfidence: result.diagramConfidence,
      diagramStatus: result.diagramStatus,
      detectedStructure: developmentDiagnostics ? result.detectedStructure : undefined,
      diagramValidation: developmentDiagnostics ? result.diagramValidation : undefined,
      retryCount: developmentDiagnostics ? result.retryCount : undefined,
      fallbackUsed: developmentDiagnostics ? result.fallbackUsed : undefined,
    });
  } catch (error) {
    if (error instanceof DiagramIncompleteError) {
      if (process.env.NODE_ENV === "development") {
        const validation = error.diagnostics?.validation;
        console.warn("[image-to-tikz]", {
          reason: error.reason,
          diagramType: error.diagnostics?.diagramType,
          classificationConfidence: error.diagnostics?.classificationConfidence,
          detected: validation?.detected,
          generated: validation?.generated,
          validationStatus: validation?.status,
          validationFailureReasons: validation?.failureReasons,
          missingComponents: validation?.missingComponents,
          retryCount: error.diagnostics?.retryCount,
          fallbackUsed: error.diagnostics?.fallbackUsed,
        });
      }
      const message = error.reason === "classification_failed"
        ? "SOẠN LAB chưa phân loại được dạng hình trong ảnh. Vui lòng cắt ảnh rõ phần hình chính."
        : error.reason === "output_too_small"
          ? "SOẠN LAB chỉ nhận được một phần rất nhỏ của hình, chưa đủ để dựng TikZ hoàn chỉnh."
          : "SOẠN LAB đã thử tạo bản nháp TikZ nhưng chưa xác nhận được các thành phần hình học chính.";
      return NextResponse.json({ ok: false, error: message }, { status: 422 });
    }
    if (error instanceof VisionCapabilityError) {
      return NextResponse.json({ ok: false, error: "Tính năng nhận diện ảnh hiện chưa sẵn sàng. Vui lòng thử lại sau." }, { status: 422 });
    }
    if (process.env.NODE_ENV === "development") console.warn("[image-to-tikz]", { reason: error instanceof Error ? error.name : "unknown_error" });
    return NextResponse.json(
      {
        ok: false,
        error: "SOẠN LAB chưa xử lý được ảnh lúc này. Vui lòng thử lại sau.",
      },
      { status: 400 },
    );
  }
}
