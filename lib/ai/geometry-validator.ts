import { buildStandaloneTikzDocument } from "@/lib/ai/extract-tikz";
import { createGeometryLayout } from "@/lib/ai/geometry-layout";
import { inspectGeometryTikz } from "@/lib/ai/geometry-tikz-inspector";

export type Point2D = { x: number; y: number };
export type GeometryPoint = { label: string; approximatePosition?: string };
export type GeometrySegment = { from: string; to: string; style?: "solid" | "dashed" };
export type PointOnSegmentConstraint = { point: string; segment: [string, string]; between?: boolean };
export type PerpendicularConstraint = { segment1: [string, string]; segment2: [string, string]; vertex: string; certain?: boolean };
export type GeometryStructure = {
  figureType: string;
  visualHints: { AB?: string; DC?: string; basePerspective?: string; baseOrder?: string[] };
  points: GeometryPoint[];
  segments: GeometrySegment[];
  pointOnSegment: PointOnSegmentConstraint[];
  perpendicularRelations: PerpendicularConstraint[];
  intersections: Array<{ point: string; lines: [[string, string], [string, string]] }>;
  parallelRelations: unknown[];
  equalLengthRelations: unknown[];
  visibleLabels: string[];
  warnings: string[];
};

export type GeometryDiagnostic = {
  labels: string[];
  pointOnSegment: Array<{ relation: string; passed: boolean }>;
  perpendicular: Array<{ relation: string; passed: boolean }>;
  intersections: Array<{ relation: string; passed: boolean }>;
  basic: Array<{ relation: string; passed: boolean }>;
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
    const position = value.relativePosition ?? value.approximatePosition;
    return label ? [{ label, approximatePosition: typeof position === "string" ? position : undefined }] : [];
  });
  const visibleLabels = (Array.isArray(parsed.visibleLabels) ? parsed.visibleLabels : []).map(cleanLabel).filter(Boolean);
  const pointLabels = points.map((point) => point.label);
  if (visibleLabels.length !== new Set(visibleLabels).size || pointLabels.length !== new Set(pointLabels).size) return null;
  const labels = [...new Set(visibleLabels.length ? visibleLabels : pointLabels)];
  if (!labels.length) return null;
  const labelSet = new Set(labels);

  const rawSegments = [
    ...(Array.isArray(parsed.segments) ? parsed.segments : []),
    ...(Array.isArray(parsed.solidEdges) ? parsed.solidEdges.map((edge) => ({ edge, style: "solid" })) : []),
    ...(Array.isArray(parsed.visibleEdges) ? parsed.visibleEdges.map((edge) => ({ edge, style: "solid" })) : []),
    ...(Array.isArray(parsed.dashedEdges) ? parsed.dashedEdges.map((edge) => ({ edge, style: "dashed" })) : []),
    ...(Array.isArray(parsed.hiddenEdges) ? parsed.hiddenEdges.map((edge) => ({ edge, style: "dashed" })) : []),
    ...(Array.isArray(parsed.auxiliaryEdges) ? parsed.auxiliaryEdges.map((edge) => ({ edge, style: "dashed" })) : []),
  ];
  const segments = rawSegments.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    const edge = pair(value.edge);
    const from = edge?.[0] || cleanLabel(value.from); const to = edge?.[1] || cleanLabel(value.to);
    if (!labelSet.has(from) || !labelSet.has(to) || from === to) return [];
    return [{ from, to, style: value.style === "dashed" ? "dashed" as const : "solid" as const }];
  });
  const relations = Array.isArray(parsed.relations) ? parsed.relations : [];
  const pointOnInputs = [...(Array.isArray(parsed.pointOnSegment) ? parsed.pointOnSegment : []), ...relations.filter((item) => item && typeof item === "object" && (item as Record<string, unknown>).type === "pointOnSegment")];
  const pointOnSegment = pointOnInputs.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>; const point = cleanLabel(value.point); const segment = pair(value.segment);
    return point && segment && labelSet.has(point) && segment.every((label) => labelSet.has(label)) ? [{ point, segment, between: value.between !== false }] : [];
  });
  const perpendicularInputs = [...(Array.isArray(parsed.perpendicularRelations) ? parsed.perpendicularRelations : []), ...relations.filter((item) => item && typeof item === "object" && (item as Record<string, unknown>).type === "perpendicular")];
  const perpendicularRelations = perpendicularInputs.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>; const segment1 = pair(value.segment1); const segment2 = pair(value.segment2); const vertex = cleanLabel(value.vertex);
    return segment1 && segment2 && vertex && [...segment1, ...segment2].every((label) => labelSet.has(label))
      ? [{ segment1, segment2, vertex, certain: value.certain !== false }] : [];
  });
  const intersections = relations.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    if (value.type !== "intersection" || !Array.isArray(value.lines) || value.lines.length !== 2) return [];
    const point = cleanLabel(value.point); const first = pair(value.lines[0]); const second = pair(value.lines[1]);
    return point && first && second && labelSet.has(point) && [...first, ...second].every((label) => labelSet.has(label)) ? [{ point, lines: [first, second] as [[string, string], [string, string]] }] : [];
  });
  return {
    figureType: typeof parsed.figureType === "string" ? parsed.figureType : "unknown",
    visualHints: parsed.visualHints && typeof parsed.visualHints === "object" && !Array.isArray(parsed.visualHints) ? parsed.visualHints as GeometryStructure["visualHints"] : {},
    points: labels.map((label) => points.find((point) => point.label === label) || { label }),
    segments: [...new Map(segments.map((item) => [[item.from, item.to].sort().join("|"), item])).values()], pointOnSegment, perpendicularRelations, intersections,
    parallelRelations: Array.isArray(parsed.parallelRelations) ? parsed.parallelRelations : [],
    equalLengthRelations: Array.isArray(parsed.equalLengthRelations) ? parsed.equalLengthRelations : [],
    visibleLabels: labels,
    warnings: (Array.isArray(parsed.warnings) ? parsed.warnings : []).filter((value): value is string => typeof value === "string").slice(0, 8),
  };
}

export function layoutGeometry(structure: GeometryStructure): Record<string, Point2D> {
  return createGeometryLayout(structure);
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
  if (structure.figureType === "unknown") warnings.push("Chưa xác định chắc chắn loại hình; bản vẽ được dựng theo hướng bảo thủ.");
  const basic: Array<{ relation: string; passed: boolean }> = [];
  for (let index = 0; index < structure.visibleLabels.length; index += 1) {
    const label = structure.visibleLabels[index];
    for (let previous = 0; previous < index; previous += 1) {
      const other = structure.visibleLabels[previous];
      const passed = Math.hypot(coordinates[label].x - coordinates[other].x, coordinates[label].y - coordinates[other].y) >= 0.05;
      basic.push({ relation: `${label} khác tọa độ ${other}`, passed });
      if (!passed) warnings.push(`Đã phát hiện điểm ${label} và ${other} trùng tọa độ.`);
    }
  }
  structure.segments.forEach((segment) => {
    const passed = Boolean(coordinates[segment.from] && coordinates[segment.to]) && Math.hypot(coordinates[segment.from].x - coordinates[segment.to].x, coordinates[segment.from].y - coordinates[segment.to].y) >= 0.05;
    basic.push({ relation: `Đoạn ${segment.from}${segment.to} có độ dài dương`, passed });
    if (!passed) warnings.push(`Đã loại đoạn ${segment.from}${segment.to} có độ dài bằng 0.`);
  });
  if (structure.figureType === "pyramid" && ["S", "A", "B", "C", "D"].every((label) => coordinates[label])) {
    const base = [coordinates.A, coordinates.B, coordinates.C, coordinates.D];
    const baseArea = Math.abs(base.reduce((sum, point, index) => {
      const next = base[(index + 1) % base.length];
      return sum + point.x * next.y - point.y * next.x;
    }, 0)) / 2;
    const apexPassed = coordinates.S.y > Math.max(...base.map((point) => point.y)) + 0.5;
    basic.push({ relation: "Đỉnh S nằm phía trên đáy ABCD", passed: apexPassed });
    if (!apexPassed) warnings.push("Chưa xác nhận vị trí đỉnh S so với đáy ABCD.");
    const visualChecks = [
      { relation: "B nằm bên phải A", passed: coordinates.B.x > coordinates.A.x },
      { relation: "AB gần nằm ngang", passed: Math.abs(coordinates.B.y - coordinates.A.y) <= 0.25 },
      { relation: "D nằm bên trái C", passed: coordinates.D.x < coordinates.C.x },
      { relation: "DC gần nằm ngang", passed: Math.abs(coordinates.C.y - coordinates.D.y) <= 0.35 },
      { relation: "A nằm bên trái C", passed: coordinates.A.x < coordinates.C.x },
      { relation: "D nằm phía trên A", passed: coordinates.D.y > coordinates.A.y },
      { relation: "C nằm phía trên B", passed: coordinates.C.y > coordinates.B.y },
      { relation: "BD là đường chéo, không gần thẳng đứng", passed: Math.abs(coordinates.B.x - coordinates.D.x) >= 0.8 },
      { relation: "Đáy ABCD không bị co thành tam giác mảnh", passed: baseArea >= 3 },
    ];
    if (coordinates.O) visualChecks.push(
      { relation: "B nằm dưới tâm O", passed: coordinates.B.y < coordinates.O.y },
      { relation: "D nằm trái O", passed: coordinates.D.x < coordinates.O.x },
      { relation: "C nằm phải O", passed: coordinates.C.x > coordinates.O.x },
      { relation: "O không quá gần đỉnh đáy", passed: Math.min(...base.map((point) => Math.hypot(point.x - coordinates.O.x, point.y - coordinates.O.y))) >= 1 },
    );
    visualChecks.forEach((check) => { basic.push(check); if (!check.passed) warnings.push(`Bố cục hình chóp cần rà soát: ${check.relation}.`); });
  }
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
  const intersectionChecks = structure.intersections.map((item) => {
    const point = coordinates[item.point]; const first = item.lines[0]; const second = item.lines[1];
    const passed = pointOnSegment(point, coordinates[first[0]], coordinates[first[1]], 0.06) && pointOnSegment(point, coordinates[second[0]], coordinates[second[1]], 0.06);
    if (!passed) warnings.push(`Chưa xác nhận chính xác giao điểm ${item.point}.`);
    else warnings.push(`Đã tính ${item.point} là giao điểm của ${first.join("")} và ${second.join("")}.`);
    return { relation: `${item.point} = ${first.join("")} ∩ ${second.join("")}`, passed };
  });
  const checks = [...basic, ...pointChecks, ...perpendicularChecks, ...intersectionChecks];
  return { labels: structure.visibleLabels, basic, pointOnSegment: pointChecks, perpendicular: perpendicularChecks, intersections: intersectionChecks, warnings: [...new Set(warnings)], valid: checks.every((item) => item.passed) };
}

export function generateValidatedTikz(structure: GeometryStructure) {
  let coordinates = layoutGeometry(structure);
  let diagnostic = validateGeometry(structure, coordinates);
  if (structure.figureType === "pyramid" && !diagnostic.valid) {
    structure.warnings.push("Đã tự động hiệu chỉnh bố cục đáy ABCD theo quan hệ topology.");
    coordinates = createGeometryLayout(structure, true);
    diagnostic = validateGeometry(structure, coordinates);
  }
  const lines = ["\\begin{tikzpicture}[scale=1, line cap=round, line join=round]"];
  for (const label of structure.visibleLabels) {
    if (structure.intersections.some((item) => item.point === label)) continue;
    const point = coordinates[label];
    lines.push(`  \\coordinate (${label}) at (${point.x.toFixed(3)},${point.y.toFixed(3)});`);
  }
  structure.intersections.forEach((relation, index) => {
    const firstName = `${relation.lines[0][0]}${relation.lines[0][1]}${index || ""}`;
    const secondName = `${relation.lines[1][0]}${relation.lines[1][1]}${index || ""}`;
    lines.push(`  \\path[name path=${firstName}] (${relation.lines[0][0]}) -- (${relation.lines[0][1]});`);
    lines.push(`  \\path[name path=${secondName}] (${relation.lines[1][0]}) -- (${relation.lines[1][1]});`);
    lines.push(`  \\path[name intersections={of=${firstName} and ${secondName}, by=${relation.point}}];`);
  });
  for (const segment of structure.segments) {
    const a = coordinates[segment.from]; const b = coordinates[segment.to];
    if (!a || !b || Math.hypot(a.x - b.x, a.y - b.y) < 0.05) continue;
    lines.push(`  \\draw[${structure.figureType === "pyramid" ? "blue, " : ""}thick${segment.style === "dashed" ? ", dashed" : ""}] (${segment.from}) -- (${segment.to});`);
  }
  const labelAnchor = (label: string) => {
    const defaults: Record<string, string> = { S: "above", A: "below left", B: "below right", C: "right", D: "above left", O: "below right", H: "below left", I: "below right" };
    return defaults[label] || "above right";
  };
  for (const label of structure.visibleLabels) {
    lines.push(`  \\fill (${label}) circle (1.4pt);`);
    lines.push(`  \\node[${labelAnchor(label)}] at (${label}) {$${label}$};`);
  }
  structure.perpendicularRelations.forEach((relation, index) => {
    if (!diagnostic.perpendicular[index]?.passed) return;
    const firstOther = relation.segment1.find((label) => label !== relation.vertex);
    const secondOther = relation.segment2.find((label) => label !== relation.vertex);
    if (firstOther && secondOther) lines.push(`  \\pic[draw,angle radius=5mm] {right angle=${firstOther}--${relation.vertex}--${secondOther}};`);
  });
  lines.push("\\end{tikzpicture}");
  const tikzCode = lines.join("\n");
  const standaloneLatex = buildStandaloneTikzDocument(tikzCode);
  const inspection = inspectGeometryTikz(tikzCode, structure, coordinates, standaloneLatex);
  if (!inspection.ok) diagnostic.warnings.push("Một số quan hệ hình học chưa được xác nhận chính xác.", ...inspection.issues);
  diagnostic.valid = diagnostic.valid && inspection.ok;
  return { tikzCode, standaloneLatex, diagnostic, inspection };
}
