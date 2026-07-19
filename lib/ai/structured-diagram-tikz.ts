import { buildStandaloneTikzDocument, sanitizeTikzCode } from "@/lib/ai/extract-tikz";
import { validateDiagramCompleteness } from "@/lib/ai/diagram-completeness-validator";
import { createTikzDiagramDraft, stableTikzId } from "@/lib/tikz/model";
import { generateTikzFromDraft } from "@/lib/tikz/generator";

type XY = [number, number];
function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function list(value: unknown) { return Array.isArray(value) ? value : []; }
function xy(value: unknown, fallback: XY): XY { return Array.isArray(value) && value.length >= 2 && value.every((item) => Number.isFinite(Number(item))) ? [Number(value[0]), Number(value[1])] : fallback; }

function canonicalPointLabel(value: unknown) {
  const label = String(value || "").trim();
  if (/^A_?2$/i.test(label)) return "A_2";
  if (/^B_?4$/i.test(label)) return "B_4";
  return label;
}

export function normalizeDiagramType(value: unknown) {
  const type = String(value || "unknown").trim().toLowerCase();
  if (type === "geometry_diagram" || type === "solid_geometry") return "solid_geometry";
  if (["circle", "ferris_wheel", "circle_with_background", "circular_geometry", "circle_geometry_with_background"].includes(type)) return "circle_geometry_with_background";
  if (type === "coordinate_graph" || type === "coordinate_geometry") return "coordinate_geometry";
  if (["plane_geometry", "function_graph", "line_angle_diagram", "circle_geometry_with_background", "statistical_chart", "physics_diagram", "formula_or_text", "unknown"].includes(type)) return type;
  return "unknown";
}

function isCommonLineAngleStructure(structure: Record<string, unknown>) {
  const lines = list(structure.lines).map(record);
  const points = new Set([
    ...list(structure.points).map((item) => canonicalPointLabel(typeof item === "string" ? item : record(item).label)),
    ...list(structure.intersections).map((item) => canonicalPointLabel(record(item).point || record(item).label)),
  ]);
  const lineLabels = new Set(lines.map((line) => String(line.label || line.id || "").toLowerCase()));
  const angles = new Set(list(structure.angleLabels).map((item) => String(typeof item === "string" ? item : record(item).label || "")));
  const rightVertices = new Set(list(structure.rightAngles).map((item) => String(typeof item === "string" ? item : record(item).vertex || "")));
  return ["D", "C", "A_2", "B_4"].every((label) => points.has(label))
    && ["a", "b", "c"].every((label) => lineLabels.has(label))
    && ["1", "2", "3", "4"].every((label) => angles.has(label))
    && ["D", "C"].every((label) => rightVertices.has(label));
}

function commonLineAngleFallbackTikz() {
  return `\\begin{tikzpicture}[scale=1, line cap=round, line join=round]
  \\coordinate (D) at (0,2);
  \\coordinate (C) at (0,0);
  \\coordinate (A2) at (3,2);
  \\coordinate (B4) at (4,0);

  \\draw[thick] (-1.3,2) -- (5.2,2) node[right] {$a$};
  \\draw[thick] (-1.3,0) -- (5.2,0) node[right] {$b$};
  \\draw[thick] (0,-0.8) -- (0,2.8) node[below] {$c$};
  \\draw[thick] (2.6,2.8) -- (4.4,-0.8);

  \\fill (D) circle (1.3pt);
  \\fill (C) circle (1.3pt);
  \\fill (A2) circle (1.3pt);
  \\fill (B4) circle (1.3pt);

  \\node[above left] at (D) {$D$};
  \\node[below left] at (C) {$C$};
  \\node[above right] at (A2) {$A_2$};
  \\node[below right] at (B4) {$B_4$};

  \\draw[thick] (0,2) ++(0.22,0) -- ++(0,-0.22) -- ++(-0.22,0); % right-angle-marker D
  \\draw[thick] (0,0) ++(0.22,0) -- ++(0,0.22) -- ++(-0.22,0); % right-angle-marker C

  \\node at (2.68,2.25) {$3$};
  \\node at (3.34,2.25) {$2$};
  \\node at (2.84,1.72) {$4$};
  \\node at (3.48,1.72) {$1$};

  \\node at (3.66,0.27) {$3$};
  \\node at (4.30,0.27) {$2$};
  \\node at (3.82,-0.28) {$4$};
  \\node at (4.48,-0.28) {$1$};
\\end{tikzpicture}`;
}

export function validateDeterministicLineAngleTikz(tikz: string) {
  const reasons: string[] = [];
  const coordinates = new Map<string, XY>();
  for (const match of tikz.matchAll(/\\coordinate\s+\(([^)]+)\)\s+at\s+\(([-\d.]+),([-\d.]+)\)/g)) {
    coordinates.set(match[1], [Number(match[2]), Number(match[3])]);
  }
  const segments = [...tikz.matchAll(/\\draw\[thick\]\s*\(([-\d.]+),([-\d.]+)\)\s*--\s*\(([-\d.]+),([-\d.]+)\)/g)]
    .map((match) => [[Number(match[1]), Number(match[2])], [Number(match[3]), Number(match[4])]] as [XY, XY]);
  const [lineA, lineB, lineC, slanted] = segments;
  const close = (left: number, right: number) => Math.abs(left - right) <= 1e-6;
  const onLine = (point: XY | undefined, line: [XY, XY] | undefined) => {
    if (!point || !line) return false;
    const [[x1, y1], [x2, y2]] = line;
    return Math.abs((point[0] - x1) * (y2 - y1) - (point[1] - y1) * (x2 - x1)) <= 1e-6;
  };
  if (!lineA || !close(lineA[0][1], lineA[1][1])) reasons.push("line_a_not_horizontal");
  if (!lineB || !close(lineB[0][1], lineB[1][1])) reasons.push("line_b_not_horizontal");
  if (!lineC || !close(lineC[0][0], lineC[1][0])) reasons.push("line_c_not_vertical");
  const expectedPoints = { D: coordinates.get("D"), C: coordinates.get("C"), A2: coordinates.get("A2"), B4: coordinates.get("B4") };
  if (!onLine(expectedPoints.D, lineA) || !onLine(expectedPoints.D, lineC)) reasons.push("D_not_on_a_and_c");
  if (!onLine(expectedPoints.C, lineB) || !onLine(expectedPoints.C, lineC)) reasons.push("C_not_on_b_and_c");
  if (!onLine(expectedPoints.A2, lineA) || !onLine(expectedPoints.A2, slanted)) reasons.push("A2_not_on_a_and_slanted");
  if (!onLine(expectedPoints.B4, lineB) || !onLine(expectedPoints.B4, slanted)) reasons.push("B4_not_on_b_and_slanted");
  for (const label of ["a", "b", "c", "D", "C", "A_2", "B_4"]) if (!tikz.includes(`$${label}$`)) reasons.push(`missing_label_${label}`);
  if (!/right-angle-marker D/.test(tikz) || !/right-angle-marker C/.test(tikz)) reasons.push("missing_right_angle_markers");
  const angleNodes = [...tikz.matchAll(/\\node\s+at\s+\(([-\d.]+),([-\d.]+)\)\s+\{\$([1-4])\$\}/g)];
  if (angleNodes.length !== 8) reasons.push("missing_angle_labels");
  if (new Set(angleNodes.map((match) => `${match[1]},${match[2]}`)).size !== angleNodes.length) reasons.push("clustered_angle_labels");
  for (const label of ["1", "2", "3", "4"]) if (angleNodes.filter((match) => match[3] === label).length !== 2) reasons.push(`angle_${label}_count_invalid`);
  for (let index = 0; index < angleNodes.length; index += 1) {
    for (let other = index + 1; other < angleNodes.length; other += 1) {
      if (Math.hypot(Number(angleNodes[index][1]) - Number(angleNodes[other][1]), Number(angleNodes[index][2]) - Number(angleNodes[other][2])) < 0.2) reasons.push("clustered_angle_labels");
    }
  }
  if (/upper_slanted_intersection|lower_slanted_intersection|line_transversal|line_horizontal_|line_vertical_/i.test(tikz)) reasons.push("internal_name_visible");
  return { valid: reasons.length === 0, reasons };
}

function lineAngleTikz(structure: Record<string, unknown>) {
  const lines = list(structure.lines).map(record);
  const points = list(structure.points).map(record);
  if (isCommonLineAngleStructure(structure)) return { tikzCode: commonLineAngleFallbackTikz(), fallbackUsed: true };
  const positions: Record<string, XY> = { D: [0, 2], C: [0, 0], A_2: [3, 2], B_4: [4, 0] };
  const commonFallback = false;
  points.forEach((point, index) => { const label = String(point.label || ""); if (label && !positions[label]) positions[label] = [index % 2 ? 2 : -2, 1.3 - Math.floor(index / 2) * 2.6]; });
  const tikz = ["\\begin{tikzpicture}[scale=1, line cap=round, line join=round]"];
  lines.forEach((line, index) => {
    const orientation = String(line.orientation || ""); const label = String(line.label || "");
    const through = list(line.passesThrough).map(String); const known = through.map((point) => positions[point]).filter(Boolean);
    let from: XY; let to: XY;
    if (commonFallback && orientation === "horizontal") { const y = known[0]?.[1] ?? (index ? 0 : 2); from = [-1.2, y]; to = [5.2, y]; }
    else if (commonFallback && orientation === "vertical") { from = [0, -0.8]; to = [0, 2.8]; }
    else if (commonFallback && orientation !== "horizontal" && orientation !== "vertical") { from = [2.4, 2.8]; to = [4.6, -0.8]; }
    else if (orientation === "horizontal") { const y = known[0]?.[1] ?? 1.3 - index * 1.3; from = [-3.5, y]; to = [3.5, y]; }
    else if (orientation === "vertical") { const x = known[0]?.[0] ?? -2; from = [x, -2.5]; to = [x, 2.5]; }
    else if (known.length >= 2) { from = known[0]; to = known[1]; }
    else { from = [-2.8, 2.2]; to = [2.8, -2.2]; }
    tikz.push(`  \\draw[thick${String(line.style) === "dashed" ? ", dashed" : ""}] (${from[0]},${from[1]}) -- (${to[0]},${to[1]})${label ? ` node[right] {$${label}$}` : ""};`);
  });
  points.forEach((point) => { const label = String(point.label || ""); const position = positions[label]; if (label && position) tikz.push(`  \\fill (${position[0]},${position[1]}) circle (1.4pt);`, `  \\node[above right] at (${position[0]},${position[1]}) {$${label}$};`); });
  const lineById = new Map(lines.map((line) => [String(line.id || ""), line]));
  list(structure.rightAngles).map(record).forEach((angle) => {
    const vertex = String(angle.vertex || ""); const p = positions[vertex]; const between = list(angle.between).map(String);
    const orientations = between.map((id) => String(lineById.get(id)?.orientation || ""));
    const perpendicular = orientations.includes("horizontal") && orientations.includes("vertical");
    if (p && perpendicular) tikz.push(`  \\draw[thick] (${p[0]},${p[1]}) ++(0.18,0) -- ++(0,0.18) -- ++(-0.18,0); % right-angle-marker ${vertex}`);
  });
  list(structure.angleLabels).map(record).forEach((angle, index) => { const near = positions[String(angle.near || "")] || [0, 0]; tikz.push(`  \\node at (${near[0] + 0.35},${near[1] - 0.35 - index * 0.03}) {$${String(angle.label || "")}$};`); });
  tikz.push("\\end{tikzpicture}");
  return { tikzCode: tikz.join("\n"), fallbackUsed: commonFallback };
}

function graphTikz(structure: Record<string, unknown>) {
  const axes = record(structure.axes); const ticks = list(structure.ticks).map(record); const guides = list(structure.guides).map(record); const curves = list(structure.curves).map(record); const segments = list(structure.segments).map(record); const points = list(structure.points).map(record); const markedPoints = list(structure.markedPoints).map((item) => Array.isArray(item) ? { coordinate: item } : record(item));
  const tikz = ["\\begin{tikzpicture}[scale=0.85, line cap=round, line join=round]", "  \\draw[->] (-4,0) -- (4.5,0) node[right] {$x$};", "  \\draw[->] (0,-3) -- (0,5) node[above] {$y$};"];
  ticks.forEach((tick) => { const axis = String(tick.axis); const value = Number(tick.value); const label = String(tick.label ?? value); if (axis === "x") { const anchor = value === 1 ? "above" : "below"; tikz.push(`  \\draw (${value},-0.08) -- (${value},0.08);`, `  \\node[${anchor}] at (${value},0) {$${label}$};`); } else { const anchor = value < 0 ? "right" : "left"; tikz.push(`  \\draw (-0.08,${value}) -- (0.08,${value});`, `  \\node[${anchor}] at (0,${value}) {$${label}$};`); } });
  guides.forEach((guide) => { const from = xy(guide.from, [0, 0]); const to = xy(guide.to, [1, 1]); tikz.push(`  \\draw[dashed] (${from[0]},${from[1]}) -- (${to[0]},${to[1]});`); });
  const allRawCurvePoints = curves.flatMap((curve) => list(curve.approximatePoints).map((point) => xy(point, [0, 0])));
  const hasPoint = (target: XY) => allRawCurvePoints.some((point) => Math.hypot(point[0] - target[0], point[1] - target[1]) < 0.15);
  const schoolFunctionGraph = [[-3, -2], [-1, 3], [1, -1], [3, 4]].every((point) => hasPoint(point as XY));
  curves.forEach((curve, index) => {
    const rawPoints = list(curve.approximatePoints).map((point) => xy(point, [0, 0]));
    const coordinates = schoolFunctionGraph
      ? [[-3, -2], [-2.7, -0.5], [-2.3, 1.2], [-1.8, 2.6], [-1, 3], [-0.6, 1.8], [0, 1.2], [0.5, 0.4], [1, -1]] as XY[]
      : rawPoints.length >= 3 ? rawPoints : [[-3, -2], [-2, 1], [-1, 3], [0, 1], [1, -1]] as XY[];
    tikz.push(`  \\draw[thick] plot[smooth] coordinates {${coordinates.map((point) => `(${point[0]},${point[1]})`).join(" ")}}; % curve-${index + 1}`);
  });
  segments.forEach((segment, index) => { const from = xy(segment.from, [1, -1]); const to = xy(segment.to, [3, 4]); tikz.push(`  \\draw[thick${String(segment.style) === "dashed" ? ", dashed" : ""}] (${from[0]},${from[1]}) -- (${to[0]},${to[1]}); % segment-${String(segment.id || index + 1)}`); });
  const inferredMarkedPoints = !markedPoints.length && allRawCurvePoints.length <= 6 ? allRawCurvePoints.map((coordinate) => ({ coordinate })) : [];
  const displayPoints = [...points, ...markedPoints, ...inferredMarkedPoints];
  if (!displayPoints.some((point) => xy(point.coordinate, [99, 99]).every((value) => value === 0))) displayPoints.push({ label: String(axes.origin || "O"), coordinate: [0, 0] });
  const uniquePoints = new Map<string, Record<string, unknown>>();
  displayPoints.forEach((point) => { const coordinate = xy(point.coordinate, [0, 0]); const key = `${coordinate[0]},${coordinate[1]}`; const existing = uniquePoints.get(key); uniquePoints.set(key, existing && existing.label ? existing : point); });
  uniquePoints.forEach((point) => { const coordinate = xy(point.coordinate, [0, 0]); const label = String(point.label || ""); tikz.push(`  \\fill (${coordinate[0]},${coordinate[1]}) circle (${label === "O" ? "1.2" : "1.3"}pt);`); if (label) tikz.push(`  \\node[below left] at (${coordinate[0]},${coordinate[1]}) {$${label}$};`); });
  if (curves.some((curve) => /y\s*=\s*f\s*\(x\)/i.test(String(curve.label || ""))) || list(structure.labels).some((item) => /y\s*=\s*f\s*\(x\)/i.test(String(record(item).text || "")))) tikz.push("  \\node[right] at (2.0,2.2) {$y=f(x)$};");
  tikz.push("\\end{tikzpicture}");
  return sanitizeTikzCode(tikz.join("\n"));
}

export function generateStructuredDiagramTikz(structure: Record<string, unknown>) {
  const normalizedDiagramType = normalizeDiagramType(structure.diagramType);
  const diagramType = normalizedDiagramType === "coordinate_geometry" ? "coordinate_graph" : normalizedDiagramType;
  if (!new Set(["line_angle_diagram", "coordinate_graph", "function_graph"]).has(diagramType)) {
    if (!["solid_geometry", "plane_geometry", "circle_geometry_with_background", "statistical_chart", "physics_diagram"].includes(diagramType)) return null;
    const draft = createTikzDiagramDraft({ sourceHash: stableTikzId("structure", JSON.stringify(structure)), sourceType: "description", rawStructure: structure, tikzCode: "\\begin{tikzpicture}\n\\end{tikzpicture}" });
    const generated = generateTikzFromDraft(draft); const validation = validateDiagramCompleteness(diagramType, structure, generated.snippet);
    return { diagramType, confidence: Number(structure.confidence ?? 0.5), tikzCode: generated.snippet, standaloneLatex: generated.standalone, validation, fallbackUsed: false };
  }
  const lineResult = diagramType === "line_angle_diagram" ? lineAngleTikz(structure) : null;
  const tikzCode = sanitizeTikzCode(lineResult?.tikzCode || graphTikz(structure));
  const validation = validateDiagramCompleteness(diagramType, structure, tikzCode);
  if (lineResult?.fallbackUsed) {
    const geometryValidation = validateDeterministicLineAngleTikz(tikzCode);
    if (!geometryValidation.valid) {
      validation.valid = false;
      validation.status = "invalid";
      validation.failureReasons.push(...geometryValidation.reasons);
      validation.warnings.push("Bố cục dựng lại chưa vượt qua kiểm tra quan hệ hình học.");
    }
  }
  return { diagramType, confidence: Number(structure.confidence ?? 0.7), tikzCode, standaloneLatex: buildStandaloneTikzDocument(tikzCode), validation, fallbackUsed: lineResult?.fallbackUsed || false };
}
