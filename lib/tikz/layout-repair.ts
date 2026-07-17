import type { DiagramObject, TikzDiagramDraft } from "@/lib/tikz/types";

const anchorOffsets: Record<NonNullable<DiagramObject["anchor"]>, { x: number; y: number }> = {
  above: { x: 0, y: 0.28 }, below: { x: 0, y: -0.28 }, left: { x: -0.28, y: 0 }, right: { x: 0.28, y: 0 },
  "above left": { x: -0.24, y: 0.24 }, "above right": { x: 0.24, y: 0.24 }, "below left": { x: -0.24, y: -0.24 }, "below right": { x: 0.24, y: -0.24 },
};

function labelPosition(object: DiagramObject) { const at = object.position; if (!at) return null; const offset = anchorOffsets[object.anchor || "above right"]; return { x: at.x + offset.x, y: at.y + offset.y }; }

export function detectLabelOverlaps(draft: TikzDiagramDraft) {
  const labels = draft.objects.filter((item) => (item.label || item.text) && item.position).map((item) => ({ item, at: labelPosition(item)! })); const overlaps: Array<[string, string]> = [];
  for (let index = 0; index < labels.length; index += 1) for (let other = index + 1; other < labels.length; other += 1) if (Math.hypot(labels[index].at.x - labels[other].at.x, labels[index].at.y - labels[other].at.y) < 0.35) overlaps.push([labels[index].item.id, labels[other].item.id]);
  return overlaps;
}
export function proposeLayoutRepairs(draft: TikzDiagramDraft) {
  const anchors: NonNullable<DiagramObject["anchor"]>[] = ["above right", "below right", "above left", "below left", "above", "below", "right", "left"];
  const overlaps = detectLabelOverlaps(draft); const proposals: Array<{ objectId: string; from: DiagramObject["anchor"]; to: DiagramObject["anchor"]; reason: string }> = [];
  const used = new Set<string>(); overlaps.forEach(([, second], index) => { if (used.has(second)) return; const object = draft.objects.find((item) => item.id === second); if (!object) return; const to = anchors[(anchors.indexOf(object.anchor || "above right") + index + 1) % anchors.length]; proposals.push({ objectId: second, from: object.anchor, to, reason: "Nhãn đang chồng lên nhãn lân cận." }); used.add(second); });
  return proposals;
}

export function repairNearlyOverlappingPoints(draft: TikzDiagramDraft) {
  const next = structuredClone(draft); const points = next.objects.filter((item) => item.type === "point" && item.position); const moved: string[] = [];
  for (let index = 0; index < points.length; index += 1) for (let other = 0; other < index; other += 1) if (Math.hypot(points[index].position!.x - points[other].position!.x, points[index].position!.y - points[other].position!.y) < 0.15) { points[index].position = { x: points[index].position!.x + 0.35, y: points[index].position!.y + 0.25 }; moved.push(points[index].id); }
  return { draft: next, moved };
}
