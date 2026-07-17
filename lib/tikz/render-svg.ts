import type { DiagramObject, TikzDiagramDraft } from "@/lib/tikz/types";

const escape = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderTikzDraftToSvg(draft: TikzDiagramDraft, options: { width?: number; height?: number; showObjectBoxes?: boolean; showLabels?: boolean; showHiddenEdges?: boolean } = {}) {
  const width = options.width || 900; const height = options.height || 600; const padding = 50; const bounds = draft.layout.bounds;
  const rangeX = Math.max(1, bounds.maxX - bounds.minX); const rangeY = Math.max(1, bounds.maxY - bounds.minY); const scale = Math.min((width - padding * 2) / rangeX, (height - padding * 2) / rangeY);
  const xy = (point: { x: number; y: number }) => ({ x: padding + (point.x - bounds.minX) * scale, y: height - padding - (point.y - bounds.minY) * scale });
  const pointById = new Map(draft.objects.filter((item) => item.type === "point" && item.position).map((item) => [item.id, item]));
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Bản xem trước hình TikZ">`, `<rect width="100%" height="100%" fill="#fffdf8"/>`, `<g stroke="#172033" fill="none" stroke-linecap="round" stroke-linejoin="round">`];
  const pathPoints = (object: DiagramObject) => {
    if (object.coordinates?.length) return object.coordinates;
    return (object.points || []).map((id) => pointById.get(id)?.position).filter((item): item is { x: number; y: number } => Boolean(item));
  };
  for (const object of draft.objects) {
    const coords = pathPoints(object); const dash = object.style === "dashed" ? "8 6" : object.style === "dotted" ? "2 5" : "";
    if (["segment", "line", "ray", "vector", "asymptote", "force_arrow", "optics_ray"].includes(object.type) && coords.length >= 2 && (options.showHiddenEdges !== false || object.style !== "dashed")) {
      const points = coords.map((point) => { const at = xy(point); return `${at.x},${at.y}`; }).join(" "); parts.push(`<polyline points="${points}" stroke-width="2.2"${dash ? ` stroke-dasharray="${dash}"` : ""}${["vector", "ray", "force_arrow", "optics_ray"].includes(object.type) ? ` marker-end="url(#arrow)"` : ""}/>`);
    }
    if ((object.type === "polygon" || object.type === "polyhedron_face") && coords.length >= 3) parts.push(`<polygon points="${coords.map((point) => { const at = xy(point); return `${at.x},${at.y}`; }).join(" ")}" stroke-width="2"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`);
    if (object.type === "circle" && (object.position || coords[0])) { const at = xy(object.position || coords[0]); parts.push(`<circle cx="${at.x}" cy="${at.y}" r="${Math.max(4, (object.radius || 1) * scale)}" stroke-width="2"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`); }
    if (object.type === "axis" && coords.length >= 2) { const a = xy(coords[0]); const b = xy(coords[1]); parts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke-width="1.8" marker-end="url(#arrow)"/>`); }
    if (object.type === "function_curve" && coords.length >= 2) parts.push(`<polyline points="${coords.map((point) => { const at = xy(point); return `${at.x},${at.y}`; }).join(" ")}" stroke="#1d4ed8" stroke-width="2.5"/>`);
    if (object.type === "bar" && object.position) { const left = xy({ x: object.position.x - 0.35, y: object.value || 0 }); const right = xy({ x: object.position.x + 0.35, y: 0 }); parts.push(`<rect x="${left.x}" y="${left.y}" width="${right.x - left.x}" height="${right.y - left.y}" fill="#dbeafe" stroke="#1d4ed8"/>`); }
  }
  parts.push(`</g><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#172033"/></marker></defs>`);
  for (const object of draft.objects) {
    if ((object.type === "point" || object.type === "plotted_point") && object.position) { const at = xy(object.position); parts.push(`<circle cx="${at.x}" cy="${at.y}" r="4" fill="#172033"/>`); }
    if (options.showLabels !== false && (object.label || object.text) && object.position) { const at = xy(object.position); const anchor = object.anchor || "above right"; const dx = /left/.test(anchor) ? -10 : /right/.test(anchor) ? 10 : 0; const dy = /above/.test(anchor) ? -10 : /below/.test(anchor) ? 18 : -8; parts.push(`<text x="${at.x + dx}" y="${at.y + dy}" text-anchor="${dx < 0 ? "end" : dx > 0 ? "start" : "middle"}" font-family="Arial, sans-serif" font-size="16" fill="#0f172a">${escape(object.label || object.text)}</text>`); }
    if (options.showObjectBoxes && object.position) { const at = xy(object.position); parts.push(`<rect x="${at.x - 12}" y="${at.y - 12}" width="24" height="24" fill="none" stroke="#06b6d4" stroke-dasharray="3 3"/>`); }
  }
  parts.push("</svg>"); return { svg: parts.join(""), width, height };
}

export function svgDataUrl(svg: string) { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; }
