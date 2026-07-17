import { NextResponse } from "next/server";
import { DiagramIncompleteError, generateLatexFromImage, VisionCapabilityError, type ImageToLatexMode } from "@/lib/ai/image-to-latex";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getCurrentUser } from "@/lib/auth/user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { preprocessDiagramImage } from "@/lib/tikz/preprocess";
import { createTikzDiagramDraft } from "@/lib/tikz/model";

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const allowedModes = new Set<ImageToLatexMode>(["auto", "formula", "geometry"]);
const maxSize = 10 * 1024 * 1024;
const allowedExtensions = /\.(?:png|jpe?g|webp)$/i;

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (isSupabaseConfigured() && !currentUser) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng đăng nhập để dùng công cụ Ảnh công thức → LaTeX." },
        { status: 401 },
      );
    }
    const maintenance = await getMaintenanceBlockForUser(currentUser);
    if (maintenance) return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });

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

    if (file.name && !allowedExtensions.test(file.name)) {
      return NextResponse.json({ ok: false, error: "Tên tệp chưa đúng định dạng PNG, JPG/JPEG hoặc WEBP." }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({ ok: false, error: "Ảnh quá lớn. Vui lòng dùng ảnh tối đa 10MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rotationValue = Number(formData.get("rotation") || 0);
    const rotation = [-90, 0, 90, 180].includes(rotationValue) ? rotationValue as -90 | 0 | 90 | 180 : 0;
    const processed = await preprocessDiagramImage(buffer, {
      rotation,
      contrast: formData.get("contrast") === "enhanced" ? "enhanced" : "normal",
      useOriginal: formData.get("useOriginal") === "true",
    });
    const result = await generateLatexFromImage({
      imageBase64: processed.base64,
      mimeType: processed.mimeType,
      mode,
    });
    const developmentDiagnostics = process.env.NODE_ENV === "development";
    const tikzDraft = result.type === "tikz" && result.tikzCode ? createTikzDiagramDraft({
      sourceHash: processed.sourceHash,
      sourceName: file.name,
      width: processed.originalWidth,
      height: processed.originalHeight,
      processedWidth: processed.processedWidth,
      processedHeight: processed.processedHeight,
      rawStructure: result.detectedStructure || result.geometryStructure,
      tikzCode: result.tikzCode,
      standaloneLatex: result.standaloneLatex,
      warnings: result.warnings,
    }) : undefined;

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
      tikzDraft,
      preprocessing: {
        sourceHash: processed.sourceHash,
        originalWidth: processed.originalWidth,
        originalHeight: processed.originalHeight,
        processedWidth: processed.processedWidth,
        processedHeight: processed.processedHeight,
      },
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
