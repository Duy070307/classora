import JSZip from "jszip";
import sharp from "sharp";
import { renderTikzDraftToSvg } from "@/lib/tikz/render-svg";
import { inspectTikzSafety } from "@/lib/tikz/safety";
import type { TikzDiagramDraft } from "@/lib/tikz/types";

export async function buildTikzAssets(draft: TikzDiagramDraft, settings: { background?: "transparent" | "white"; lineWeight?: "thin" | "standard" | "bold"; showLabels?: boolean; scale?: 1 | 2 | 4 } = {}) {
  const safety = inspectTikzSafety(draft.tikz.snippet); if (!safety.safe) throw new Error("unsafe_tikz");
  const { svg, width, height, valid } = renderTikzDraftToSvg(draft, { width: 1200, height: 800, background: settings.background || "white", lineWeight: settings.lineWeight || "standard", showLabels: settings.showLabels !== false, showHiddenEdges: true });
  if (!valid) throw new Error("invalid_semantic_svg");
  const png = await sharp(Buffer.from(svg)).resize({ width: 1200 * (settings.scale || 2), withoutEnlargement: false }).png({ compressionLevel: 9 }).toBuffer();
  return { svg: Buffer.from(svg), png, width, height };
}

export async function buildTikzZip(draft: TikzDiagramDraft) {
  const assets = await buildTikzAssets(draft); const zip = new JSZip();
  zip.file("diagram.tex", draft.tikz.snippet); zip.file("diagram-standalone.tex", draft.tikz.standalone); zip.file("diagram.svg", assets.svg); zip.file("diagram.png", assets.png);
  zip.file("README.txt", ["SOẠN LAB - Gói hình TikZ", "", `Thư viện TikZ: ${draft.tikz.libraries.join(", ") || "Không có thư viện bổ sung"}`, "", "SVG và PNG là bản xem trước deterministic từ mô hình đối tượng. Môi trường máy chủ hiện tại chưa xác nhận biên dịch TeX/PDF.", "Giáo viên cần kiểm tra lại hình, nhãn và quan hệ trước khi sử dụng."].join("\n"));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 7 } });
}

export async function buildTikzDebugZip(draft: TikzDiagramDraft, processedImage?: Buffer) {
  const assets = await buildTikzAssets(draft); const zip = new JSZip();
  zip.file("diagram.tex", draft.tikz.snippet); zip.file("diagram-standalone.tex", draft.tikz.standalone); zip.file("semantic.svg", assets.svg);
  if (processedImage) zip.file("processed-image.png", processedImage);
  zip.file("preprocessing.json", JSON.stringify(draft.source.preprocessingSettings || {}, null, 2));
  zip.file("objects.json", JSON.stringify(draft.objects.map(({ id, type, label, text, position, points, coordinates, style, confidence, teacherConfirmed, sourceBox }) => ({ id, type, label, text, position, points, coordinates, style, confidence, teacherConfirmed, sourceBox })), null, 2));
  zip.file("relationships.json", JSON.stringify(draft.relationships, null, 2)); zip.file("validation.json", JSON.stringify(draft.validation, null, 2)); zip.file("comparison.json", JSON.stringify(draft.comparison || null, null, 2));
  zip.file("README.txt", "SOẠN LAB - Gói chẩn đoán TikZ đã làm sạch. Không chứa tài khoản giáo viên, thông tin nhà cung cấp, prompt, khóa truy cập hoặc đường dẫn lưu trữ riêng tư.");
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 7 } });
}
