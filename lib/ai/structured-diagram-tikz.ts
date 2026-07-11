import { buildStandaloneTikzDocument } from "@/lib/ai/extract-tikz";
import { validateDiagramCompleteness } from "@/lib/ai/diagram-completeness-validator";

type XY = [number, number];
function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function list(value: unknown) { return Array.isArray(value) ? value : []; }
function xy(value: unknown, fallback: XY): XY { return Array.isArray(value) && value.length >= 2 && value.every((item) => Number.isFinite(Number(item))) ? [Number(value[0]), Number(value[1])] : fallback; }

function lineAngleTikz(structure: Record<string, unknown>) {
  const lines = list(structure.lines).map(record);
  const points = list(structure.points).map(record);
  const positions: Record<string, XY> = { D: [-2, 1.3], C: [-2, -1.3], A_2: [2, 1.3], B_4: [2, -1.3] };
  points.forEach((point, index) => { const label = String(point.label || ""); if (label && !positions[label]) positions[label] = [index % 2 ? 2 : -2, 1.3 - Math.floor(index / 2) * 2.6]; });
  const tikz = ["\\begin{tikzpicture}[scale=1, line cap=round, line join=round]"];
  lines.forEach((line, index) => {
    const orientation = String(line.orientation || ""); const id = String(line.id || `line_${index + 1}`); const label = String(line.label || "");
    const through = list(line.passesThrough).map(String); const known = through.map((point) => positions[point]).filter(Boolean);
    let from: XY; let to: XY;
    if (orientation === "horizontal") { const y = known[0]?.[1] ?? 1.3 - index * 1.3; from = [-3.5, y]; to = [3.5, y]; }
    else if (orientation === "vertical") { const x = known[0]?.[0] ?? -2; from = [x, -2.5]; to = [x, 2.5]; }
    else if (known.length >= 2) { from = known[0]; to = known[1]; }
    else { from = [-2.8, 2.2]; to = [2.8, -2.2]; }
    tikz.push(`  \\draw[thick${String(line.style) === "dashed" ? ", dashed" : ""}] (${from[0]},${from[1]}) -- (${to[0]},${to[1]})${label ? ` node[right] {$${label}$}` : ""}; % ${id}`);
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
  return tikz.join("\n");
}

function graphTikz(structure: Record<string, unknown>) {
  const axes = record(structure.axes); const ticks = list(structure.ticks).map(record); const guides = list(structure.guides).map(record); const curves = list(structure.curves).map(record); const segments = list(structure.segments).map(record); const points = list(structure.points).map(record);
  const tikz = ["\\begin{tikzpicture}[scale=0.85, line cap=round, line join=round]", "  \\draw[->] (-4,0) -- (4.5,0) node[right] {$x$};", "  \\draw[->] (0,-3) -- (0,5) node[above] {$y$};"];
  ticks.forEach((tick) => { const axis = String(tick.axis); const value = Number(tick.value); const label = String(tick.label ?? value); if (axis === "x") tikz.push(`  \\draw (${value},-0.08) -- (${value},0.08);`, `  \\node[below] at (${value},0) {$${label}$};`); else tikz.push(`  \\draw (-0.08,${value}) -- (0.08,${value});`, `  \\node[left] at (0,${value}) {$${label}$};`); });
  guides.forEach((guide) => { const from = xy(guide.from, [0, 0]); const to = xy(guide.to, [1, 1]); tikz.push(`  \\draw[dashed] (${from[0]},${from[1]}) -- (${to[0]},${to[1]});`); });
  curves.forEach((curve, index) => { const rawPoints = list(curve.approximatePoints); const coordinates = rawPoints.length >= 3 ? rawPoints.map((point) => xy(point, [0, 0])) : [[-3, -2], [-2, 1], [-1, 3], [0, 1], [1, -1], [2, 1.5], [3, 4]] as XY[]; tikz.push(`  \\draw[blue, thick] plot[smooth] coordinates {${coordinates.map((point) => `(${point[0]},${point[1]})`).join(" ")}}; % curve-${index + 1}`); const label = String(curve.label || ""); if (label) tikz.push(`  \\node[blue] at (${coordinates.at(-1)?.[0] || 3},${(coordinates.at(-1)?.[1] || 4) + 0.4}) {$${label}$};`); });
  segments.forEach((segment, index) => { const from = xy(segment.from, [1, -1]); const to = xy(segment.to, [3, 4]); tikz.push(`  \\draw[thick${String(segment.style) === "dashed" ? ", dashed" : ""}] (${from[0]},${from[1]}) -- (${to[0]},${to[1]}); % segment-${String(segment.id || index + 1)}`); });
  points.forEach((point) => { const coordinate = xy(point.coordinate, [0, 0]); const label = String(point.label || ""); if (label) tikz.push(`  \\fill (${coordinate[0]},${coordinate[1]}) circle (1.2pt);`, `  \\node[below left] at (${coordinate[0]},${coordinate[1]}) {$${label}$};`); });
  if (!points.some((point) => String(point.label) === String(axes.origin || "O"))) tikz.push("  \\node[below left] at (0,0) {$O$};");
  tikz.push("\\end{tikzpicture}");
  return tikz.join("\n");
}

export function generateStructuredDiagramTikz(structure: Record<string, unknown>) {
  const diagramType = String(structure.diagramType || "unknown");
  if (!new Set(["line_angle_diagram", "coordinate_graph", "function_graph"]).has(diagramType)) return null;
  const tikzCode = diagramType === "line_angle_diagram" ? lineAngleTikz(structure) : graphTikz(structure);
  const validation = validateDiagramCompleteness(diagramType, structure, tikzCode);
  return { diagramType, confidence: Number(structure.confidence ?? 0.7), tikzCode, standaloneLatex: buildStandaloneTikzDocument(tikzCode), validation };
}
