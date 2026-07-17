import JSZip from "jszip";
import sharp from "sharp";
import { renderTikzDraftToSvg } from "@/lib/tikz/render-svg";
import { inspectTikzSafety } from "@/lib/tikz/safety";
import type { TikzDiagramDraft } from "@/lib/tikz/types";

export async function buildTikzAssets(draft: TikzDiagramDraft) {
  const safety = inspectTikzSafety(draft.tikz.snippet); if (!safety.safe) throw new Error("unsafe_tikz");
  const { svg, width, height } = renderTikzDraftToSvg(draft, { width: 1200, height: 800, showLabels: true, showHiddenEdges: true });
  const png = await sharp(Buffer.from(svg)).resize({ width: 1800, withoutEnlargement: false }).png({ compressionLevel: 9 }).toBuffer();
  return { svg: Buffer.from(svg), png, width, height };
}

export async function buildTikzZip(draft: TikzDiagramDraft) {
  const assets = await buildTikzAssets(draft); const zip = new JSZip();
  zip.file("diagram.tex", draft.tikz.snippet); zip.file("diagram-standalone.tex", draft.tikz.standalone); zip.file("diagram.svg", assets.svg); zip.file("diagram.png", assets.png);
  zip.file("README.txt", ["SOẠN LAB - Gói hình TikZ", "", `Thư viện TikZ: ${draft.tikz.libraries.join(", ") || "Không có thư viện bổ sung"}`, "", "SVG và PNG là bản xem trước deterministic từ mô hình đối tượng. Môi trường máy chủ hiện tại chưa xác nhận biên dịch TeX/PDF.", "Giáo viên cần kiểm tra lại hình, nhãn và quan hệ trước khi sử dụng."].join("\n"));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 7 } });
}
