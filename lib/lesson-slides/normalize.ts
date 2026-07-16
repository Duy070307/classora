import type { DeckValidation, Slide, SlideBlock, SlideDeck, SlideGenerationSettings } from "@/lib/lesson-slides/types";

export function makeStableId(prefix = "slide") {
  return `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function cleanText(value: unknown, max = 4000) {
  return typeof value === "string" ? value.replace(/\u0000/g, "").trim().slice(0, max) : "";
}

export function normalizeSlideCount(value: unknown) {
  return Math.max(6, Math.min(30, Math.round(Number(value) || 12)));
}

export function normalizeBlock(block: SlideBlock): SlideBlock {
  const base = { ...block, id: cleanText(block.id, 120) || makeStableId("block"), region: block.region || "main", alignment: block.alignment || "left" };
  if (base.type === "bullets") return { ...base, content: base.content.map((item) => cleanText(item, 300)).filter(Boolean).slice(0, 8) };
  if (base.type === "table") return { ...base, content: cleanText(base.content), headers: base.headers.map((item) => cleanText(item, 160)).slice(0, 8), rows: base.rows.slice(0, 20).map((row) => row.slice(0, 8).map((item) => cleanText(item, 300))) };
  if (base.type === "process") return { ...base, content: cleanText(base.content), steps: base.steps.map((item) => cleanText(item, 240)).filter(Boolean).slice(0, 8) };
  if (base.type === "formula") return { ...base, content: cleanText(base.content), latex: cleanText(base.latex, 2000) };
  if (base.type === "tikz") return { ...base, content: cleanText(base.content), tikz: cleanText(base.tikz, 12000) };
  if (base.type === "question") return { ...base, content: cleanText(base.content, 1000), options: base.options?.map((item) => cleanText(item, 300)).filter(Boolean).slice(0, 6), answer: cleanText(base.answer, 1000) || undefined, explanation: cleanText(base.explanation, 2000) || undefined };
  return { ...base, content: cleanText(base.content) };
}

export function normalizeDeck(deck: SlideDeck): SlideDeck {
  const now = new Date().toISOString();
  return {
    ...deck,
    title: cleanText(deck.title, 180) || "Slide bài giảng",
    subtitle: cleanText(deck.subtitle, 240) || undefined,
    slides: deck.slides.map((slide, index) => ({
      ...slide,
      id: cleanText(slide.id, 120) || makeStableId("slide"),
      order: index + 1,
      title: cleanText(slide.title, 180) || undefined,
      subtitle: cleanText(slide.subtitle, 240) || undefined,
      blocks: slide.blocks.map(normalizeBlock),
      teacherNotes: cleanText(slide.teacherNotes, 6000) || undefined,
    })),
    assets: Array.isArray(deck.assets) ? deck.assets.filter((asset) => asset?.id && asset?.kind && asset?.mimeType) : [],
    metadata: { ...deck.metadata, createdAt: deck.metadata?.createdAt || now, updatedAt: now, generationVersion: deck.metadata?.generationVersion || "lesson-slides-v1" },
  };
}

export function slideWordCount(slide: Slide) {
  const values = [slide.title || "", slide.subtitle || "", ...slide.blocks.flatMap((block) => Array.isArray(block.content) ? block.content : [block.content])];
  return values.join(" ").trim().split(/\s+/).filter(Boolean).length;
}

export function densityWarnings(slide: Slide) {
  const warnings: string[] = [];
  if ((slide.title || "").trim().split(/\s+/).filter(Boolean).length > 12) warnings.push("Tiêu đề dài hơn 12 từ.");
  if ((slide.subtitle || "").trim().split(/\s+/).filter(Boolean).length > 20) warnings.push("Phụ đề dài hơn 20 từ.");
  if (slideWordCount(slide) > 80) warnings.push("Slide có hơn 80 từ, nên rút gọn hoặc tách slide.");
  for (const block of slide.blocks) {
    if (block.type === "bullets" && block.content.length > 6) warnings.push("Khối gạch đầu dòng có hơn 6 ý.");
    if (block.type === "bullets" && block.content.some((item) => item.trim().split(/\s+/).length > 18)) warnings.push("Một gạch đầu dòng dài hơn 18 từ.");
    if (block.type === "question" && block.content.split(/[?？]/).filter(Boolean).length > 2) warnings.push("Slide câu hỏi có quá nhiều câu hỏi chính.");
  }
  return [...new Set(warnings)];
}

export function validateDeckForExport(deck: SlideDeck, audience: "student" | "teacher"): DeckValidation {
  const issues: DeckValidation["issues"] = [];
  const ids = new Set<string>();
  deck.slides.forEach((slide, index) => {
    if (!slide.id || ids.has(slide.id)) issues.push({ level: "error", slideId: slide.id, code: "invalid_slide_id", message: `Slide ${index + 1} có mã không hợp lệ hoặc bị trùng.` });
    ids.add(slide.id);
    if (!slide.type || slide.order !== index + 1) issues.push({ level: "error", slideId: slide.id, code: "invalid_structure", message: `Cấu trúc slide ${index + 1} không hợp lệ.` });
    if (!slide.title && !slide.blocks.length) issues.push({ level: "error", slideId: slide.id, code: "empty_slide", message: `Slide ${index + 1} chưa có nội dung.` });
    densityWarnings(slide).forEach((message) => issues.push({ level: "warning", slideId: slide.id, code: "density", message: `Slide ${index + 1}: ${message}` }));
    slide.blocks.forEach((block) => {
      if (block.type === "image" && !deck.assets.some((asset) => asset.id === block.assetId && asset.dataUrl)) issues.push({ level: "error", slideId: slide.id, code: "missing_asset", message: `Slide ${index + 1} thiếu ảnh nguồn.` });
      if (block.type === "formula" && !block.latex.trim()) issues.push({ level: "error", slideId: slide.id, code: "broken_formula", message: `Slide ${index + 1} có công thức rỗng.` });
      if (block.type === "tikz" && (!block.tikz.trim() || !block.renderedAssetId || !deck.assets.some((asset) => asset.id === block.renderedAssetId && asset.dataUrl))) issues.push({ level: "error", slideId: slide.id, code: "broken_tikz", message: `Slide ${index + 1} có hình TikZ chưa được kết xuất thành ảnh.` });
      if (audience === "student" && block.teacherOnly) issues.push({ level: "warning", slideId: slide.id, code: "teacher_only_removed", message: `Nội dung dành cho giáo viên ở slide ${index + 1} sẽ được loại khỏi bản học sinh.` });
    });
  });
  return { status: issues.some((issue) => issue.level === "error") ? "blocked" : issues.length ? "warning" : "ready", issues };
}

export function deckForAudience(deck: SlideDeck, audience: "student" | "teacher") {
  const normalized = normalizeDeck(deck);
  if (audience === "teacher") return normalized;
  return {
    ...normalized,
    teacherNotesEnabled: false,
    slides: normalized.slides.filter((slide) => !slide.hidden).map((slide) => ({
      ...slide,
      teacherNotes: undefined,
      blocks: slide.blocks.filter((block) => !block.teacherOnly).map((block) => block.type === "question" && block.answerMode !== "immediate" ? { ...block, answer: undefined, explanation: undefined } : block),
    })),
  };
}

export function slideCacheKey(slide: Slide, sourceHash = "") {
  const raw = JSON.stringify({ type: slide.type, title: slide.title, purpose: slide.purpose, expectedContent: slide.expectedContent, sourceHash });
  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) hash = Math.imul(hash ^ raw.charCodeAt(index), 16777619);
  return `slide-v1-${(hash >>> 0).toString(16)}`;
}

export const defaultSlideSettings: SlideGenerationSettings = {
  subject: "", grade: "", topic: "", textbookSeries: "", duration: "45 phút", slideCount: 12, objectives: "", keyKnowledge: "", presentationStyle: "Rõ ràng, trực quan", additionalNotes: "", purpose: "new_lesson", detailLevel: "standard", audience: "secondary", aspectRatio: "16:9", themeId: "education-blue",
  options: { objectives: true, warmUp: true, examples: true, interactiveQuestions: true, practice: true, summary: true, homework: true, teacherNotes: true },
};
