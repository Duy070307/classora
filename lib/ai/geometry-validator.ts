import { buildStandaloneTikzDocument } from "@/lib/ai/extract-tikz";

export type Point2D = { x: number; y: number };
export type GeometryPoint = { label: string; approximatePosition?: string };
export type GeometrySegment = { from: string; to: string; style?: "solid" | "dashed" };
export type PointOnSegmentConstraint = { point: string; segment: [string, string]; between?: boolean };
export type PerpendicularConstraint = { segment1: [string, string]; segment2: [string, string]; vertex: string; certain?: boolean };
export type GeometryStructure = {
  points: GeometryPoint[];
  segments: GeometrySegment[];
  pointOnSegment: PointOnSegmentConstraint[];
  perpendicularRelations: PerpendicularConstraint[];
  parallelRelations: unknown[];
  equalLengthRelations: unknown[];
  visibleLabels: string[];
  warnings: string[];
};

export type GeometryDiagnostic = {
  labels: string[];
  pointOnSegment: Array<{ relation: string; passed: boolean }>;
  perpendicular: Array<{ relation: string; passed: boolean }>;
  warnings: string[];
  valid: boolean;
};

const LABEL_PATTERN = /^[A-Z][A-Z0-9']{0,5}$/;
const TOLERANCE = 0.04;

function cleanLabel(value: unknown) {
  const label = typeof value === "string" ? value.trim() : "";
  return LABEL_PATTERN.test(label) ? label : "";
}

function pair(value: unknown): [string, string] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const left = cleanLabel(value[0]);
  const right = cleanLabel(value[1]);
  return left && right && left !== right ? [left, right] : null;
}

export function parseGeometryStructure(raw: string): GeometryStructure | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let parsed: Record<string, unknown> | null = null;
  for (const candidate of [cleaned, cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1)]) {
    try {
      const value = JSON.parse(candidate);
      if (value && typeof value === "object" && !Array.isArray(value)) { parsed = value; break; }
    } catch { /* thử phần JSON nằm trong văn bản */ }
  }
  if (!parsed) return null;

  const points = (Array.isArray(parsed.points) ? parsed.points : []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    const label = cleanLabel(value.label ?? value.name);
    return label ? [{ label, approximatePosition: typeof value.approximatePosition === "string" ? value.approximatePosition : undefined }] : [];
  });
  const visibleLabels = (Array.isArray(parsed.visibleLabels) ? parsed.visibleLabels : []).map(cleanLabel).filter(Boolean);
  const pointLabels = points.map((point) => point.label);
  if (visibleLabels.length !== new Set(visibleLabels).size || pointLabels.length !== new Set(pointLabels).size) return null;
  const labels = [...new Set(visibleLabels.length ? visibleLabels : pointLabels)];
  if (!labels.length) return null;
  const labelSet = new Set(labels);

  const segments = (Array.isArray(parsed.segments) ? parsed.segments : []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    const from = cleanLabel(value.from); const to = cleanLabel(value.to);
    if (!labelSet.has(from) || !labelSet.has(to) || from === to) return [];
    return [{ from, to, style: value.style === "dashed" ? "dashed" as const : "solid" as const }];
  });
  const pointOnSegment = (Array.isArray(parsed.pointOnSegment) ? parsed.pointOnSegment : []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>; const point = cleanLabel(value.point); const segment = pair(value.segment);
    return point && segment && labelSet.has(point) && segment.every((label) => labelSet.has(label)) ? [{ point, segment, between: value.between !== false }] : [];
  });
  const perpendicularRelations = (Array.isArray(parsed.perpendicularRelations) ? parsed.perpendicularRelations : []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>; const segment1 = pair(value.segment1); const segment2 = pair(value.segment2); const vertex = cleanLabel(value.vertex);
    return segment1 && segment2 && vertex && [...segment1, ...segment2].every((label) => labelSet.has(label))
      ? [{ segment1, segment2, vertex, certain: value.certain !== false }] : [];
  });
  return {
    points: labels.map((label) => points.find((point) => point.label === label) || { label }),
    segments, pointOnSegment, perpendicularRelations,
    parallelRelations: Array.isArray(parsed.parallelRelations) ? parsed.parallelRelations : [],
    equalLengthRelations: Array.isArray(parsed.equalLengthRelations) ? parsed.equalLengthRelations : [],
    visibleLabels: labels,
    warnings: (Array.isArray(parsed.warnings) ? parsed.warnings : []).filter((value): value is string => typeof value === "string").slice(0, 8),
  };
}

function initialPosition(point: GeometryPoint, index: number, total: number): Point2D {
  const hint = (point.approximatePosition || "").toLowerCase();
  if (/top|above|trên/.test(hint)) return { x: 0, y: 4 };
  if (/bottom|below|dưới/.test(hint)) return { x: 0, y: 0 };
  if (/left|trái/.test(hint)) return { x: -3, y: 1 };
  if (/right|phải/.test(hint)) return { x: 3, y: 1 };
  const angle = Math.PI / 2 + (index * Math.PI * 2) / Math.max(total, 3);
  return { x: 2.8 * Math.cos(angle), y: 2.8 * Math.sin(angle) + 2 };
}

function midpoint(a: Point2D, b: Point2D, ratio = 0.5): Point2D {
  return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio };
}

export function layoutGeometry(structure: GeometryStructure): Record<string, Point2D> {
  const coordinates = Object.fromEntries(structure.points.map((point, index) => [point.label, initialPosition(point, index, structure.points.length)]));
  for (let iteration = 0; iteration < 4; iteration += 1) {
    for (const constraint of structure.pointOnSegment) {
      coordinates[constraint.point] = midpoint(coordinates[constraint.segment[0]], coordinates[constraint.segment[1]]);
    }
    for (const relation of structure.perpendicularRelations.filter((item) => item.certain !== false)) {
      const firstHasVertex = relation.segment1.includes(relation.vertex);
      const perpendicular = firstHasVertex ? relation.segment1 : relation.segment2;
      const reference = firstHasVertex ? relation.segment2 : relation.segment1;
      const moving = perpendicular.find((label) => label !== relation.vertex);
      if (!moving || !coordinates[relation.vertex]) continue;
      const a = coordinates[reference[0]]; const b = coordinates[reference[1]];
      const dx = b.x - a.x; const dy = b.y - a.y; const length = Math.max(Math.hypot(dx, dy), 1);
      coordinates[moving] = { x: coordinates[relation.vertex].x - (dy / length) * 2.6, y: coordinates[relation.vertex].y + (dx / length) * 2.6 };
    }
  }
  return coordinates;
}

export function pointOnSegment(point: Point2D, a: Point2D, b: Point2D, tolerance = TOLERANCE) {
  const dx = b.x - a.x; const dy = b.y - a.y; const length2 = dx * dx + dy * dy;
  if (length2 < 1e-9) return false;
  const t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / length2;
  const projection = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.hypot(point.x - projection.x, point.y - projection.y) / Math.sqrt(length2) <= tolerance && t >= -tolerance && t <= 1 + tolerance;
}

export function perpendicular(a: Point2D, b: Point2D, c: Point2D, d: Point2D, tolerance = TOLERANCE) {
  const ux = b.x - a.x; const uy = b.y - a.y; const vx = d.x - c.x; const vy = d.y - c.y;
  const denominator = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  return denominator > 1e-9 && Math.abs((ux * vx + uy * vy) / denominator) <= tolerance;
}

export function validateGeometry(structure: GeometryStructure, coordinates: Record<string, Point2D>): GeometryDiagnostic {
  const warnings = [...structure.warnings];
  const pointChecks = structure.pointOnSegment.map((item) => {
    const passed = pointOnSegment(coordinates[item.point], coordinates[item.segment[0]], coordinates[item.segment[1]]);
    if (!passed) warnings.push(`Chưa xác nhận chính xác điểm ${item.point} thuộc đoạn ${item.segment.join("")}.`);
    return { relation: `${item.point} ∈ ${item.segment.join("")}`, passed };
  });
  const perpendicularChecks = structure.perpendicularRelations.map((item) => {
    const vertexOnFirst = item.segment1.includes(item.vertex) || pointOnSegment(coordinates[item.vertex], coordinates[item.segment1[0]], coordinates[item.segment1[1]]);
    const vertexOnSecond = item.segment2.includes(item.vertex) || pointOnSegment(coordinates[item.vertex], coordinates[item.segment2[0]], coordinates[item.segment2[1]]);
    const passed = item.certain !== false && vertexOnFirst && vertexOnSecond
      && perpendicular(coordinates[item.segment1[0]], coordinates[item.segment1[1]], coordinates[item.segment2[0]], coordinates[item.segment2[1]]);
    if (!passed) warnings.push(`Chưa xác nhận chính xác quan hệ vuông góc tại điểm ${item.vertex}.`);
    return { relation: `${item.segment1.join("")} ⟂ ${item.segment2.join("")} tại ${item.vertex}`, passed };
  });
  return { labels: structure.visibleLabels, pointOnSegment: pointChecks, perpendicular: perpendicularChecks, warnings: [...new Set(warnings)], valid: [...pointChecks, ...perpendicularChecks].every((item) => item.passed) };
}

export function generateValidatedTikz(structure: GeometryStructure) {
  const coordinates = layoutGeometry(structure);
  const diagnostic = validateGeometry(structure, coordinates);
  const lines = ["\\begin{tikzpicture}[scale=1, line cap=round, line join=round]"];
  for (const label of structure.visibleLabels) {
    const point = coordinates[label];
    lines.push(`  \\coordinate (${label}) at (${point.x.toFixed(3)},${point.y.toFixed(3)});`);
  }
  for (const segment of structure.segments) lines.push(`  \\draw[${segment.style === "dashed" ? "dashed" : "solid"}] (${segment.from}) -- (${segment.to});`);
  for (const label of structure.visibleLabels) lines.push(`  \\fill (${label}) circle (1.4pt) node[above right] {$${label}$};`);
  structure.perpendicularRelations.forEach((relation, index) => {
    if (!diagnostic.perpendicular[index]?.passed) return;
    const firstOther = relation.segment1.find((label) => label !== relation.vertex);
    const secondOther = relation.segment2.find((label) => label !== relation.vertex);
    if (firstOther && secondOther) lines.push(`  \\pic[draw,angle radius=5mm] {right angle=${firstOther}--${relation.vertex}--${secondOther}};`);
  });
  lines.push("\\end{tikzpicture}");
  const tikzCode = lines.join("\n");
  return { tikzCode, standaloneLatex: buildStandaloneTikzDocument(tikzCode), diagnostic };
}
