import { renderTikzDraftToSvg } from "@/lib/tikz/render-svg";
import { inspectTikzSafety } from "@/lib/tikz/safety";
import type { ConfirmedDiagramAsset, TikzDiagramDraft, TikzReviewItem } from "@/lib/tikz/types";

export type TikzReadiness = { status: "unbuildable" | "needs_review" | "warning" | "ready"; blockers: string[]; warnings: string[] };

function stableHash(prefix: string, value: string) { let hash = 2166136261; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); } return `${prefix}-${(hash >>> 0).toString(36)}`; }

export function buildTikzReviewQueue(draft: TikzDiagramDraft): TikzReviewItem[] {
  const previous = new Map((draft.reviewQueue || []).map((item) => [item.id, item])); const items: TikzReviewItem[] = [];
  const add = (item: Omit<TikzReviewItem, "status">) => items.push({ ...item, status: previous.get(item.id)?.status || "pending" });
  draft.objects.forEach((object) => {
    if (object.confidence !== "low" || object.teacherConfirmed) return;
    const category: TikzReviewItem["category"] = object.type === "label" ? "label" : object.type === "right_angle_marker" || object.type === "angle_marker" ? "marker" : object.type === "point" ? "intersection" : object.type === "segment" && object.style === "dashed" ? "hidden_edge" : "unknown_object";
    add({ id: `object-${object.id}`, category, objectId: object.id, blocking: ["point", "segment", "right_angle_marker", "unknown"].includes(object.type), message: `${object.label || object.text || "Đối tượng"} có độ tin cậy thấp và cần giáo viên xác nhận.` });
  });
  draft.relationships.forEach((relationship) => { if (relationship.confidence === "low" && !relationship.teacherConfirmed) add({ id: `relationship-${relationship.id}`, category: relationship.type === "hidden_edge" ? "hidden_edge" : relationship.type === "intersects" ? "intersection" : "relationship", relationshipId: relationship.id, blocking: true, message: `Quan hệ ${relationship.label || relationship.type} chưa được xác nhận.` }); });
  return items;
}

export function decideReviewItem(draft: TikzDiagramDraft, id: string, status: TikzReviewItem["status"]) {
  const next = structuredClone(draft); next.reviewQueue = buildTikzReviewQueue(next).map((item) => item.id === id ? { ...item, status } : item);
  const object = next.objects.find((item) => `object-${item.id}` === id); if (object && status === "confirmed") object.teacherConfirmed = true;
  const relationship = next.relationships.find((item) => `relationship-${item.id}` === id); if (relationship && status === "confirmed") relationship.teacherConfirmed = true;
  next.metadata.updatedAt = new Date().toISOString(); return next;
}

export function evaluateTikzReadiness(draft: TikzDiagramDraft): TikzReadiness {
  const safety = inspectTikzSafety(draft.tikz.snippet); const render = renderTikzDraftToSvg(draft); const queue = buildTikzReviewQueue(draft); const blockers: string[] = []; const warnings: string[] = [];
  if (!safety.safe) blockers.push("Mã TikZ chứa lệnh không an toàn.");
  if (!render.valid) blockers.push("Chưa tạo được bản SVG ngữ nghĩa hợp lệ.");
  if (!draft.validation.valid) blockers.push(...draft.validation.checks.filter((item) => !item.passed && item.severity === "error").map((item) => item.message));
  if (queue.some((item) => item.blocking && item.status === "pending")) blockers.push("Còn quan hệ hoặc đối tượng quan trọng chưa được xác nhận.");
  if (draft.classification.type === "unknown") blockers.push("Chưa xác định chắc chắn loại hình.");
  if (!draft.compilation.available) warnings.push("Máy chủ hiện chưa có trình biên dịch TeX; bản SVG ngữ nghĩa vẫn có thể sử dụng sau khi xác nhận.");
  if (queue.some((item) => !item.blocking && item.status === "pending")) warnings.push("Còn nhãn hoặc bố cục nhỏ cần rà soát.");
  if (blockers.length) return { status: draft.objects.length < 2 || !render.valid || !safety.safe ? "unbuildable" : "needs_review", blockers, warnings };
  if (draft.status !== "confirmed" || !draft.confirmedAsset) return { status: warnings.length ? "warning" : "needs_review", blockers, warnings: [...warnings, "Giáo viên chưa xác nhận và tạo tài sản hình."] };
  return { status: warnings.length ? "warning" : "ready", blockers, warnings };
}

export function semanticDiagramHash(draft: TikzDiagramDraft) {
  return stableHash("semantic", JSON.stringify({ objects: draft.objects, relationships: draft.relationships, layout: draft.layout, edits: draft.teacherEdits }));
}

export function createConfirmedDiagramAsset(draft: TikzDiagramDraft, input: { svgDataUrl: string; pngDataUrl: string; svgAssetId?: string; pngAssetId?: string; caption?: string }): ConfirmedDiagramAsset {
  const rendered = renderTikzDraftToSvg(draft, { width: 1200, height: 800 });
  return { diagramId: draft.id, version: draft.metadata.version, semanticHash: semanticDiagramHash(draft), tikzSource: draft.tikz.snippet, standaloneSource: draft.tikz.standalone, svgAssetId: input.svgAssetId, pngAssetId: input.pngAssetId, svgDataUrl: input.svgDataUrl, pngDataUrl: input.pngDataUrl, altText: draft.classification.subtype ? `Hình ${draft.classification.subtype}` : "Hình TikZ đã được giáo viên xác nhận", caption: input.caption, width: rendered.width, height: rendered.height, confirmedAt: new Date().toISOString() };
}

export function nextDiagramVersion(current: string) {
  const parts = current.split(".").map(Number); return `${Number.isFinite(parts[0]) ? parts[0] : 1}.${(Number.isFinite(parts[1]) ? parts[1] : 0) + 1}`;
}
