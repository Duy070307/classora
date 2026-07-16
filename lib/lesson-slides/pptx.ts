import PptxGenJS from "pptxgenjs";
import { deckForAudience, validateDeckForExport } from "@/lib/lesson-slides/normalize";
import { getSlideTheme } from "@/lib/lesson-slides/themes";
import type { Slide, SlideAsset, SlideBlock, SlideDeck } from "@/lib/lesson-slides/types";

type Audience = "student" | "teacher";

function asciiFilename(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 100) || "Bai_giang";
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function textSvgData(text: string, color: string, width = 1200, height = 260) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="transparent"/><text x="${width / 2}" y="${height / 2}" dominant-baseline="middle" text-anchor="middle" fill="#${color}" font-family="Cambria Math, Times New Roman" font-size="54">${escapeXml(text)}</text></svg>`;
  return `data:image/svg+xml;base64,${typeof Buffer !== "undefined" ? Buffer.from(svg).toString("base64") : btoa(unescape(encodeURIComponent(svg)))}`;
}

function imageBox(asset: SlideAsset, x: number, y: number, w: number, h: number) {
  const sourceRatio = asset.width && asset.height ? asset.width / asset.height : w / h;
  const targetRatio = w / h;
  if (sourceRatio > targetRatio) {
    const height = w / sourceRatio;
    return { x, y: y + (h - height) / 2, w, h: height };
  }
  const width = h * sourceRatio;
  return { x: x + (w - width) / 2, y, w: width, h };
}

function cleanColor(value: string) {
  return value.replace(/^#/, "");
}

function addBlock(pptx: PptxGenJS, pptSlide: PptxGenJS.Slide, block: SlideBlock, deck: SlideDeck, slide: Slide, theme: ReturnType<typeof getSlideTheme>, box: { x: number; y: number; w: number; h: number }) {
  const bodyColor = cleanColor(theme.bodyColor);
  const common = { x: box.x, y: box.y, w: box.w, h: box.h, fontFace: theme.bodyFont, color: bodyColor, margin: 0.08, breakLine: false, valign: "middle" as const, fit: "shrink" as const };
  if (block.type === "bullets") {
    pptSlide.addText(block.content.map((item) => `• ${item}`).join("\n"), { ...common, fontSize: 21, breakLine: true, paraSpaceAfter: 11 });
    return;
  }
  if (block.type === "formula") {
    const asset = deck.assets.find((item) => item.id === block.renderedAssetId && item.dataUrl);
    pptSlide.addImage({ data: asset?.dataUrl || textSvgData(block.latex, bodyColor), ...box });
    if (block.content && block.content !== block.latex) pptSlide.addText(block.content, { x: box.x, y: box.y + box.h - 0.45, w: box.w, h: 0.4, fontFace: theme.bodyFont, fontSize: 14, color: bodyColor, align: "center", margin: 0 });
    return;
  }
  if (block.type === "image" || block.type === "tikz") {
    const assetId = block.type === "image" ? block.assetId : block.renderedAssetId;
    const asset = deck.assets.find((item) => item.id === assetId && item.dataUrl);
    if (asset?.dataUrl) pptSlide.addImage({ data: asset.dataUrl, ...imageBox(asset, box.x, box.y, box.w, box.h) });
    else pptSlide.addText(block.type === "tikz" ? "Hình TikZ cần được kết xuất lại" : block.content, { ...common, align: "center", italic: true, fontSize: 16 });
    return;
  }
  if (block.type === "table") {
    const rows = [block.headers, ...block.rows].filter((row) => row.length);
    pptSlide.addTable(rows.map((row) => row.map((text) => ({ text }))), { x: box.x, y: box.y, w: box.w, h: box.h, border: { type: "solid", color: cleanColor(theme.secondary), pt: 1 }, fill: { color: cleanColor(theme.surface) }, color: bodyColor, fontFace: theme.bodyFont, fontSize: Math.max(11, 18 - rows.length / 2), margin: 0.06, bold: false });
    return;
  }
  if (block.type === "question") {
    pptSlide.addShape(pptx.ShapeType.roundRect, { ...box, rectRadius: 0.08, fill: { color: cleanColor(theme.surface), transparency: 3 }, line: { color: cleanColor(theme.secondary), pt: 1.4 } });
    const options = block.options?.length ? `\n\n${block.options.map((item, index) => `${String.fromCharCode(65 + index)}. ${item}`).join("\n")}` : "";
    const immediate = block.answerMode === "immediate" && block.answer ? `\n\nĐáp án: ${block.answer}` : "";
    pptSlide.addText(`${block.content}${options}${immediate}`, { ...common, x: box.x + 0.18, y: box.y + 0.14, w: box.w - 0.36, h: box.h - 0.28, fontSize: 21, bold: true });
    return;
  }
  if (block.type === "process") {
    const gap = 0.12;
    const stepW = Math.max(1, (box.w - gap * Math.max(0, block.steps.length - 1)) / Math.max(1, block.steps.length));
    block.steps.forEach((step, index) => {
      const x = box.x + index * (stepW + gap);
      pptSlide.addShape(pptx.ShapeType.roundRect, { x, y: box.y + 0.2, w: stepW, h: box.h - 0.4, rectRadius: 0.06, fill: { color: cleanColor(theme.surface) }, line: { color: cleanColor(theme.primary), pt: 1.2 } });
      pptSlide.addText(step, { x: x + 0.08, y: box.y + 0.3, w: stepW - 0.16, h: box.h - 0.6, fontFace: theme.bodyFont, fontSize: 16, color: bodyColor, align: "center", valign: "middle", margin: 0.04, fit: "shrink" });
    });
    return;
  }
  if (block.type === "callout") {
    pptSlide.addShape(pptx.ShapeType.roundRect, { ...box, rectRadius: 0.08, fill: { color: cleanColor(theme.surface) }, line: { color: cleanColor(theme.accent), pt: 2 } });
    pptSlide.addText(`${block.label ? `${block.label}\n` : ""}${block.content}`, { ...common, x: box.x + 0.15, y: box.y + 0.12, w: box.w - 0.3, h: box.h - 0.24, fontSize: 19, bold: Boolean(block.label) });
    return;
  }
  pptSlide.addText(block.content, { ...common, fontSize: block.style?.size === "large" ? 26 : block.style?.size === "small" ? 15 : 20, bold: block.style?.emphasis, align: block.alignment });
  void slide;
}

function boxesFor(slide: Slide, count: number, width: number, height: number) {
  const x = 0.8;
  const y = slide.type === "cover" || slide.type === "end" ? 2.3 : 1.55;
  const w = width - 1.6;
  const h = height - y - 0.72;
  if (count <= 1) return [{ x, y, w, h }];
  if (slide.layout === "two_columns" || slide.layout === "image_left" || slide.layout === "image_right") return Array.from({ length: count }, (_, index) => ({ x: x + (index % 2) * (w / 2 + 0.12), y: y + Math.floor(index / 2) * (h / Math.ceil(count / 2)), w: w / 2 - 0.12, h: h / Math.ceil(count / 2) - 0.12 }));
  return Array.from({ length: count }, (_, index) => ({ x, y: y + index * (h / count), w, h: h / count - 0.08 }));
}

export function createLessonSlidesPresentation(input: SlideDeck, audience: Audience) {
  const deck = deckForAudience(input, audience);
  const validation = validateDeckForExport(deck, audience);
  if (validation.status === "blocked") throw new Error(validation.issues.filter((issue) => issue.level === "error").map((issue) => issue.message).join(" "));
  const theme = getSlideTheme(deck.themeId);
  const pptx = new PptxGenJS();
  pptx.layout = deck.aspectRatio === "4:3" ? "LAYOUT_4X3" : "LAYOUT_WIDE";
  pptx.author = "SOẠN LAB";
  pptx.company = "SOẠN LAB";
  pptx.subject = [deck.subject, deck.grade, deck.topic].filter(Boolean).join(" · ");
  pptx.title = deck.title;
  pptx.theme = { headFontFace: theme.titleFont, bodyFontFace: theme.bodyFont };
  const width = deck.aspectRatio === "4:3" ? 10 : 13.333;
  const height = 7.5;
  deck.slides.forEach((slide, index) => {
    const page = pptx.addSlide();
    page.background = { color: cleanColor(theme.background) };
    page.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.14, h: height, line: { color: cleanColor(theme.primary), transparency: 100 }, fill: { color: cleanColor(theme.primary) } });
    if (slide.type === "cover" || slide.type === "end") {
      page.addText(slide.title || deck.title, { x: 0.9, y: 2.15, w: width - 1.8, h: 1.2, fontFace: theme.titleFont, fontSize: deck.aspectRatio === "4:3" ? 30 : 36, bold: true, color: cleanColor(theme.titleColor), align: "center", valign: "middle", margin: 0.02, fit: "shrink" });
      if (slide.subtitle || (slide.type === "cover" && deck.subject)) page.addText(slide.subtitle || [deck.subject, deck.grade].filter(Boolean).join(" · "), { x: 1.2, y: 3.45, w: width - 2.4, h: 0.65, fontFace: theme.bodyFont, fontSize: 20, color: cleanColor(theme.bodyColor), align: "center", margin: 0 });
    } else {
      page.addText(slide.title || `Slide ${index + 1}`, { x: 0.8, y: 0.48, w: width - 1.6, h: 0.68, fontFace: theme.titleFont, fontSize: deck.aspectRatio === "4:3" ? 24 : 27, bold: true, color: cleanColor(theme.titleColor), margin: 0, fit: "shrink" });
      page.addShape(pptx.ShapeType.line, { x: 0.8, y: 1.22, w: width - 1.6, h: 0, line: { color: cleanColor(theme.secondary), pt: 1.2 } });
    }
    const blocks = slide.blocks.filter((block) => !block.teacherOnly || audience === "teacher");
    const boxes = boxesFor(slide, blocks.length, width, height);
    blocks.forEach((block, blockIndex) => addBlock(pptx, page, block, deck, slide, theme, boxes[blockIndex] || boxes[0]));
    page.addText(String(index + 1), { x: width - 0.75, y: height - 0.42, w: 0.35, h: 0.22, fontFace: theme.bodyFont, fontSize: 9, color: cleanColor(theme.bodyColor), align: "right", margin: 0 });
    if (audience === "teacher") {
      const answers = slide.blocks.filter((block): block is Extract<SlideBlock, { type: "question" }> => block.type === "question" && Boolean(block.answer)).map((block) => `Đáp án: ${block.answer}${block.explanation ? `\nGiải thích: ${block.explanation}` : ""}`);
      const notes = [slide.teacherNotes, ...answers].filter(Boolean).join("\n\n");
      if (notes) page.addNotes(notes);
    }
  });
  return { pptx, deck, validation };
}

export async function buildLessonSlidesPptx(deck: SlideDeck, audience: Audience) {
  const { pptx } = createLessonSlidesPresentation(deck, audience);
  const result = await pptx.write({ outputType: "arraybuffer", compression: true });
  if (!(result instanceof ArrayBuffer)) throw new Error("pptx_export_failed");
  return result;
}

export async function downloadLessonSlidesPptx(deck: SlideDeck, audience: Audience) {
  const response = await fetch("/api/lesson-slides/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deck, audience }) });
  if (response.status === 503) { window.location.assign("/maintenance"); return; }
  if (!response.ok) { const data = await response.json().catch(() => ({})) as { error?: string }; throw new Error(data.error || "Chưa thể xuất PowerPoint."); }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Slide_${asciiFilename(`${deck.subject || "Bai_giang"}_${deck.grade || ""}_${deck.topic || deck.title}`)}${audience === "teacher" ? "_Giao_vien" : ""}.pptx`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
