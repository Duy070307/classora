import type { DiagramComparisonResult, TikzDiagramDraft } from "@/lib/tikz/types";

export function compareDiagramModels(source: Pick<TikzDiagramDraft, "objects" | "relationships" | "layout">, rendered: Pick<TikzDiagramDraft, "objects" | "relationships" | "layout">): DiagramComparisonResult {
  const sourceObjects = new Map(source.objects.map((item) => [item.id, item])); const renderedObjects = new Map(rendered.objects.map((item) => [item.id, item]));
  const sourceLabels = new Set(source.objects.flatMap((item) => item.label ? [item.label] : [])); const renderedLabels = new Set(rendered.objects.flatMap((item) => item.label ? [item.label] : []));
  const matchedObjects = [...sourceObjects.keys()].filter((id) => renderedObjects.has(id)); const matchedLabels = [...sourceLabels].filter((label) => renderedLabels.has(label));
  const missingObjects = [...sourceObjects.keys()].filter((id) => !renderedObjects.has(id)); const extraObjects = [...renderedObjects.keys()].filter((id) => !sourceObjects.has(id));
  const objectCoverage = sourceObjects.size ? Math.round(100 * matchedObjects.length / sourceObjects.size) : 100;
  const labelCoverage = sourceLabels.size ? Math.round(100 * matchedLabels.length / sourceLabels.size) : 100;
  const sourceRelations = new Set(source.relationships.map((item) => `${item.type}:${[...item.objectIds].sort().join("|")}`)); const renderedRelations = new Set(rendered.relationships.map((item) => `${item.type}:${[...item.objectIds].sort().join("|")}`));
  const structuralSimilarity = sourceRelations.size ? Math.round(100 * [...sourceRelations].filter((key) => renderedRelations.has(key)).length / sourceRelations.size) : 100;
  const sourceRatio = Math.max(0.01, (source.layout.bounds.maxX - source.layout.bounds.minX) / Math.max(0.01, source.layout.bounds.maxY - source.layout.bounds.minY));
  const renderRatio = Math.max(0.01, (rendered.layout.bounds.maxX - rendered.layout.bounds.minX) / Math.max(0.01, rendered.layout.bounds.maxY - rendered.layout.bounds.minY));
  const sourceRenderAlignment = Math.round(Math.max(0, 100 - Math.abs(Math.log(sourceRatio / renderRatio)) * 45));
  const suspiciousDifferences = [missingObjects.length ? `Thiếu ${missingObjects.length} đối tượng.` : "", extraObjects.length > Math.max(2, sourceObjects.size * 0.25) ? `Có ${extraObjects.length} đối tượng ngoài mô hình nguồn.` : "", sourceRenderAlignment < 60 ? "Tỉ lệ khung hình thay đổi đáng kể." : ""].filter(Boolean);
  const blocking = objectCoverage < 70 || structuralSimilarity < 65; const status = blocking ? "mismatch" : objectCoverage < 90 || labelCoverage < 85 || suspiciousDifferences.length ? "needs_review" : "near_match";
  return { objectCoverage, labelCoverage, structuralSimilarity, sourceRenderAlignment, missingObjects, extraObjects, suspiciousDifferences, status };
}
