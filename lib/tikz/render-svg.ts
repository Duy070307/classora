import type { DiagramObject, DiagramPoint, TikzDiagramDraft } from "@/lib/tikz/types";

export type SemanticSvgSettings = {
  width?: number;
  height?: number;
  background?: "transparent" | "white";
  lineWeight?: "thin" | "standard" | "bold";
  showObjectBoxes?: boolean;
  showLabels?: boolean;
  showHiddenEdges?: boolean;
};

const escape = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const lineWidths = { thin: 1.4, standard: 2.2, bold: 3.2 };

export function renderTikzDraftToSvg(draft: TikzDiagramDraft, options: SemanticSvgSettings = {}) {
  const width = options.width || 900; const height = options.height || 600; const padding = 50; const bounds = draft.layout.bounds;
  const rangeX = Math.max(1, bounds.maxX - bounds.minX); const rangeY = Math.max(1, bounds.maxY - bounds.minY); const scale = Math.min((width - padding * 2) / rangeX, (height - padding * 2) / rangeY); const strokeWidth = lineWidths[options.lineWeight || "standard"];
  const xy = (point: DiagramPoint) => ({ x: padding + (point.x - bounds.minX) * scale, y: height - padding - (point.y - bounds.minY) * scale });
  const pointById = new Map(draft.objects.filter((item) => item.type === "point" && item.position).map((item) => [item.id, item])); const objectById = new Map(draft.objects.map((item) => [item.id, item]));
  const pathPoints = (object: DiagramObject) => object.coordinates?.length ? object.coordinates : (object.points || []).map((id) => pointById.get(id)?.position).filter((item): item is DiagramPoint => Boolean(item));
  const labelPosition = (object: DiagramObject) => object.position || (() => { const points = pathPoints(object); return points.length ? { x: points.reduce((sum, point) => sum + point.x, 0) / points.length, y: points.reduce((sum, point) => sum + point.y, 0) / points.length } : undefined; })();
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Bản xem trước hình TikZ">`];
  if (options.background !== "transparent") parts.push(`<rect width="100%" height="100%" fill="#ffffff"/>`);
  parts.push(`<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#172033"/></marker></defs>`, `<g stroke="#172033" fill="none" stroke-linecap="round" stroke-linejoin="round">`);
  for (const object of draft.objects) {
    const coords = pathPoints(object); const dash = object.style === "dashed" ? "8 6" : object.style === "dotted" ? "2 5" : "";
    if (object.type === "grid") {
      const step = Math.max(0.25, Number(object.metadata?.step || 1));
      for (let x = Math.ceil(bounds.minX / step) * step; x <= bounds.maxX; x += step) { const a = xy({ x, y: bounds.minY }); const b = xy({ x, y: bounds.maxY }); parts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#d9e1ea" stroke-width="1"/>`); }
      for (let y = Math.ceil(bounds.minY / step) * step; y <= bounds.maxY; y += step) { const a = xy({ x: bounds.minX, y }); const b = xy({ x: bounds.maxX, y }); parts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#d9e1ea" stroke-width="1"/>`); }
    }
    if (["segment", "line", "ray", "vector", "asymptote", "force_arrow", "optics_ray"].includes(object.type) && coords.length >= 2 && (options.showHiddenEdges !== false || object.style !== "dashed")) {
      parts.push(`<polyline points="${coords.map((point) => { const at = xy(point); return `${at.x},${at.y}`; }).join(" ")}" stroke-width="${strokeWidth}"${dash ? ` stroke-dasharray="${dash}"` : ""}${["vector", "ray", "force_arrow", "optics_ray"].includes(object.type) ? ` marker-end="url(#arrow)"` : ""}/>`);
    }
    if ((object.type === "polygon" || object.type === "polyhedron_face") && coords.length >= 3) parts.push(`<polygon points="${coords.map((point) => { const at = xy(point); return `${at.x},${at.y}`; }).join(" ")}" stroke-width="${strokeWidth}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`);
    if (object.type === "circle" && (object.position || coords[0])) { const at = xy(object.position || coords[0]); parts.push(`<circle cx="${at.x}" cy="${at.y}" r="${Math.max(4, (object.radius || 1) * scale)}" stroke-width="${strokeWidth}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`); }
    if (object.type === "axis" && coords.length >= 2) { const a = xy(coords[0]); const b = xy(coords[1]); parts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke-width="${strokeWidth}" marker-end="url(#arrow)"/>`); }
    if (object.type === "tick") { const axis = String(object.metadata?.axis || "x"); const value = Number(object.value || 0); const center = xy(axis === "y" ? { x: 0, y: value } : { x: value, y: 0 }); parts.push(axis === "y" ? `<line x1="${center.x - 5}" y1="${center.y}" x2="${center.x + 5}" y2="${center.y}" stroke-width="1.5"/>` : `<line x1="${center.x}" y1="${center.y - 5}" x2="${center.x}" y2="${center.y + 5}" stroke-width="1.5"/>`); }
    if (object.type === "function_curve" && coords.length >= 2) parts.push(`<polyline points="${coords.map((point) => { const at = xy(point); return `${at.x},${at.y}`; }).join(" ")}" stroke="#1d4ed8" stroke-width="${strokeWidth + 0.3}"/>`);
    if (object.type === "arc" || object.type === "angle_marker") { const center = object.position || coords[0]; if (center) { const at = xy(center); const radius = Math.max(10, Number(object.radius || 0.32) * scale); parts.push(`<path d="M ${at.x + radius} ${at.y} A ${radius} ${radius} 0 0 0 ${at.x} ${at.y - radius}" stroke-width="${Math.max(1.2, strokeWidth - 0.4)}"/>`); } }
    if (object.type === "right_angle_marker") { const vertex = pointById.get(object.points?.[0] || "")?.position || object.position; if (vertex) { const at = xy(vertex); const size = Math.max(9, scale * 0.18); parts.push(`<path d="M ${at.x + size} ${at.y} L ${at.x + size} ${at.y - size} L ${at.x} ${at.y - size}" stroke-width="${Math.max(1.2, strokeWidth - 0.4)}"/>`); } }
    if (object.type === "bar" && object.position) { const left = xy({ x: object.position.x - 0.35, y: object.value || 0 }); const right = xy({ x: object.position.x + 0.35, y: 0 }); parts.push(`<rect x="${left.x}" y="${left.y}" width="${right.x - left.x}" height="${right.y - left.y}" fill="#dbeafe" stroke="#1d4ed8"/>`); }
  }
  for (const relationship of draft.relationships) {
    if (relationship.type !== "parallel" && relationship.type !== "equal_length") continue;
    const targets = relationship.objectIds.map((id) => objectById.get(id)).filter((item): item is DiagramObject => Boolean(item));
    for (const target of targets) { const coords = pathPoints(target); if (coords.length < 2) continue; const midpoint = xy({ x: (coords[0].x + coords[1].x) / 2, y: (coords[0].y + coords[1].y) / 2 }); const mark = relationship.type === "parallel" ? 7 : 5; parts.push(`<path d="M ${midpoint.x - mark} ${midpoint.y + mark} L ${midpoint.x} ${midpoint.y - mark} M ${midpoint.x} ${midpoint.y + mark} L ${midpoint.x + mark} ${midpoint.y - mark}" stroke-width="1.4"/>`); }
  }
  parts.push(`</g>`);
  for (const object of draft.objects) {
    if ((object.type === "point" || object.type === "plotted_point") && object.position) { const at = xy(object.position); parts.push(`<circle cx="${at.x}" cy="${at.y}" r="4" fill="#172033"/>`); }
    const position = labelPosition(object);
    if (options.showLabels !== false && (object.label || object.text) && position) { const at = xy(position); const anchor = object.anchor || "above right"; const dx = /left/.test(anchor) ? -10 : /right/.test(anchor) ? 10 : 0; const dy = /above/.test(anchor) ? -10 : /below/.test(anchor) ? 18 : -8; parts.push(`<text x="${at.x + dx}" y="${at.y + dy}" text-anchor="${dx < 0 ? "end" : dx > 0 ? "start" : "middle"}" font-family="Arial, sans-serif" font-size="16" fill="#0f172a">${escape(object.label || object.text)}</text>`); }
    if (options.showObjectBoxes && position) { const at = xy(position); parts.push(`<rect x="${at.x - 12}" y="${at.y - 12}" width="24" height="24" fill="none" stroke="#06b6d4" stroke-dasharray="3 3"/>`); }
  }
  parts.push("</svg>"); const svg = parts.join("");
  const hasExternalResource = /(?:href|src)\s*=\s*["'](?:https?:|file:|\/\/)/i.test(svg);
  return { svg, width, height, valid: /^<svg\b/.test(svg) && /<\/svg>$/.test(svg) && !hasExternalResource && !/<(?:script|foreignObject)\b/i.test(svg) };
}

export function svgDataUrl(svg: string) { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; }
