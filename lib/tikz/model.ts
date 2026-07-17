import { buildStandaloneTikzDocument, requiredTikzLibraries } from "@/lib/ai/extract-tikz";
import { inspectTikzSyntax } from "@/lib/tikz/syntax";
import type { DiagramClass, DiagramObject, DiagramObjectType, DiagramRelationship, DiagramRelationshipType, TikzDiagramDraft } from "@/lib/tikz/types";
import { validateTikzDraft, qualitySummary } from "@/lib/tikz/validation";

type UnknownRecord = Record<string, unknown>;
const record = (value: unknown): UnknownRecord => value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function stableTikzId(prefix: string, value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return `${prefix}-${(hash >>> 0).toString(36)}`;
}

export function normalizeDiagramClass(value: unknown): DiagramClass {
  const raw = text(value).toLowerCase();
  const aliases: Record<string, DiagramClass> = {
    geometry_diagram: "solid_geometry", coordinate_graph: "coordinate_geometry", chart: "statistical_chart",
    triangle: "plane_geometry", circle: "plane_geometry", polygon: "plane_geometry", mixed: "plane_geometry",
  };
  if (aliases[raw]) return aliases[raw];
  const supported: DiagramClass[] = ["solid_geometry", "plane_geometry", "function_graph", "coordinate_geometry", "line_angle_diagram", "statistical_chart", "physics_diagram", "formula_or_text", "unknown"];
  return supported.includes(raw as DiagramClass) ? raw as DiagramClass : "unknown";
}

function confidence(value: unknown): "high" | "medium" | "low" {
  if (value === "high" || value === "medium" || value === "low") return value;
  const numeric = number(value, 0.5); return numeric >= 0.8 ? "high" : numeric >= 0.5 ? "medium" : "low";
}

function pointObject(item: unknown, index: number): DiagramObject | null {
  const source = typeof item === "string" ? { label: item } : record(item);
  const label = text(source.label || source.name); if (!label) return null;
  const coordinate = Array.isArray(source.coordinate) ? source.coordinate : [source.x, source.y];
  const hints: Record<string, { x: number; y: number }> = { "left-lower": { x: -2.5, y: 0 }, "lower-left": { x: -2.5, y: 0 }, bottom: { x: 0, y: -1 }, "lower-right": { x: 2.5, y: 0 }, "right-upper": { x: 2, y: 2 }, "upper-right": { x: 2, y: 2 }, "left-upper": { x: -2, y: 2 }, "upper-left": { x: -2, y: 2 }, top: { x: 0, y: 4 }, center: { x: 0, y: 1 } };
  const position = coordinate.some((part) => part !== undefined) ? { x: number(coordinate[0], index % 4), y: number(coordinate[1], Math.floor(index / 4)) } : hints[text(source.relativePosition || source.approximatePosition).toLowerCase()] || { x: (index % 4) * 1.5 - 2.25, y: Math.floor(index / 4) * 1.5 };
  return { id: stableTikzId("point", label), type: "point", label, position, confidence: confidence(source.confidence), teacherConfirmed: false };
}

function edgeObject(item: unknown, index: number, defaultStyle: DiagramObject["style"]): DiagramObject | null {
  const source: UnknownRecord = Array.isArray(item) ? { from: item[0], to: item[1] } : record(item);
  const from = text(source.from || list(source.points)[0]); const to = text(source.to || list(source.points)[1]);
  if (!from || !to) return null;
  const style = source.style === "dashed" || source.style === "dotted" ? source.style : defaultStyle;
  return { id: stableTikzId("segment", `${from}-${to}-${index}`), type: "segment", points: [stableTikzId("point", from), stableTikzId("point", to)], style, confidence: confidence(source.confidence), teacherConfirmed: false, metadata: { from, to } };
}

function relation(type: DiagramRelationshipType, key: string, objectIds: string[], certain: unknown = true): DiagramRelationship {
  return { id: stableTikzId("rel", `${type}-${key}`), type, objectIds, confidence: certain === false ? "low" : "high", teacherConfirmed: false };
}

export function extractSemanticDiagram(raw: unknown) {
  const source = record(raw); const objects: DiagramObject[] = []; const relationships: DiagramRelationship[] = [];
  list(source.points).forEach((item, index) => { const object = pointObject(item, index); if (object) objects.push(object); });
  const addEdges = (value: unknown, style: DiagramObject["style"]) => list(value).forEach((item, index) => { const object = edgeObject(item, index, style); if (object) { objects.push(object); relationships.push(relation(style === "dashed" ? "hidden_edge" : "visible_edge", object.id, [object.id, ...(object.points || [])])); } });
  addEdges(source.solidEdges || source.segments, "solid"); addEdges(source.dashedEdges, "dashed");
  list(source.circles).forEach((item, index) => { const circle = record(item); const center = text(circle.center || "O"); objects.push({ id: stableTikzId("circle", `${center}-${index}`), type: "circle", label: center, radius: number(circle.radius, 1.5), position: objects.find((object) => object.label === center)?.position, confidence: confidence(circle.confidence), teacherConfirmed: false }); });
  list(source.intersections || list(source.relations).filter((item) => record(item).type === "intersection")).forEach((item, index) => { const value = record(item); const point = text(value.point || value.label); const lines = list(value.lines).flatMap((line) => list(line).map((label) => stableTikzId("point", text(label)))); if (point) relationships.push(relation("intersects", `${point}-${index}`, [stableTikzId("point", point), ...lines])); });
  list(source.relations).forEach((item, index) => { const value = record(item); const kind = text(value.type); const ids = list(value.points || value.segment || value.objectIds).map((label) => stableTikzId("point", text(label))); if (kind === "perpendicular") relationships.push(relation("perpendicular", String(index), [...list(value.segment1).map((label) => stableTikzId("point", text(label))), ...list(value.segment2).map((label) => stableTikzId("point", text(label)))], value.certain)); if (kind === "midpoint" || kind === "midpoint_of") relationships.push(relation("midpoint_of", String(index), [stableTikzId("point", text(value.point)), ...ids])); if (kind === "parallel") relationships.push(relation("parallel", String(index), ids)); if (kind === "pointOnSegment") relationships.push(relation("lies_on", String(index), [stableTikzId("point", text(value.point)), ...ids])); });
  list(source.rightAngles).forEach((item, index) => { const value = typeof item === "string" ? { vertex: item } : record(item); const vertex = text(value.vertex); if (vertex) objects.push({ id: stableTikzId("right-angle", `${vertex}-${index}`), type: "right_angle_marker", points: [stableTikzId("point", vertex)], confidence: confidence(value.certain === false ? 0.3 : 0.9), teacherConfirmed: false, metadata: { vertex } }); });
  const axes = record(source.axes); if (Object.keys(axes).length) {
    objects.push({ id: "axis-x", type: "axis", label: text(axes.xLabel) || "x", coordinates: [{ x: -4, y: 0 }, { x: 4, y: 0 }], confidence: "high", teacherConfirmed: false });
    objects.push({ id: "axis-y", type: "axis", label: text(axes.yLabel) || "y", coordinates: [{ x: 0, y: -3 }, { x: 0, y: 5 }], confidence: "high", teacherConfirmed: false });
  }
  list(source.ticks).forEach((item, index) => { const tick = record(item); objects.push({ id: stableTikzId("tick", `${tick.axis}-${tick.value}-${index}`), type: "tick", label: text(tick.label || tick.value), value: number(tick.value), metadata: { axis: text(tick.axis) }, confidence: confidence(tick.confidence), teacherConfirmed: false }); });
  list(source.curves).forEach((item, index) => { const curve = record(item); objects.push({ id: stableTikzId("curve", text(curve.id) || String(index)), type: "function_curve", label: text(curve.label), coordinates: list(curve.approximatePoints).map((point) => ({ x: number(list(point)[0]), y: number(list(point)[1]) })), confidence: confidence(curve.confidence), teacherConfirmed: false }); });
  list(source.markedPoints).forEach((item, index) => { const point = record(item); const coordinate = list(point.coordinate); objects.push({ id: stableTikzId("plotted", `${coordinate.join("-")}-${index}`), type: "plotted_point", label: text(point.label), position: { x: number(coordinate[0]), y: number(coordinate[1]) }, confidence: confidence(point.confidence), teacherConfirmed: false }); });
  list(source.guides).forEach((item, index) => { const guide = record(item); objects.push({ id: stableTikzId("guide", String(index)), type: "segment", coordinates: [list(guide.from), list(guide.to)].map((point) => ({ x: number(point[0]), y: number(point[1]) })), style: text(guide.style) === "solid" ? "solid" : "dashed", confidence: confidence(guide.confidence), teacherConfirmed: false }); });
  list(source.bars).forEach((item, index) => { const bar = record(item); objects.push({ id: stableTikzId("bar", `${bar.label}-${index}`), type: "bar", label: text(bar.label), value: number(bar.value), position: { x: number(bar.x, index), y: 0 }, confidence: confidence(bar.confidence), teacherConfirmed: false }); });
  list(source.forces).forEach((item, index) => { const force = record(item); objects.push({ id: stableTikzId("force", `${force.label}-${index}`), type: "force_arrow", label: text(force.label), coordinates: [list(force.from), list(force.to)].map((point) => ({ x: number(point[0]), y: number(point[1]) })), confidence: confidence(force.confidence), teacherConfirmed: false }); });
  list(source.opticsRays).forEach((item, index) => { const ray = record(item); objects.push({ id: stableTikzId("optics", String(index)), type: "optics_ray", coordinates: list(ray.points).map((point) => ({ x: number(list(point)[0]), y: number(list(point)[1]) })), confidence: confidence(ray.confidence), teacherConfirmed: false }); });
  list(source.circuitElements).forEach((item, index) => { const element = record(item); objects.push({ id: stableTikzId("circuit", `${element.type}-${index}`), type: "circuit_element", label: text(element.label || element.type), position: { x: number(element.x, index), y: number(element.y) }, confidence: confidence(element.confidence), teacherConfirmed: false }); });
  return { objects: dedupeObjects(objects), relationships: dedupeRelationships(relationships) };
}

function dedupeObjects(objects: DiagramObject[]) { const seen = new Set<string>(); return objects.filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id))); }
function dedupeRelationships(items: DiagramRelationship[]) { const seen = new Set<string>(); return items.filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id))); }

export function createTikzDiagramDraft(input: { sourceHash: string; sourceName?: string; width?: number; height?: number; processedWidth?: number; processedHeight?: number; rawStructure?: unknown; tikzCode: string; standaloneLatex?: string; warnings?: string[]; sourceType?: TikzDiagramDraft["source"]["sourceType"] }) {
  const raw = record(input.rawStructure); const semantics = extractSemanticDiagram(raw); const classification = normalizeDiagramClass(raw.diagramType || raw.type); const now = new Date().toISOString();
  const allPositions = semantics.objects.flatMap((object) => object.position ? [object.position] : object.coordinates || []);
  const xs = allPositions.map((point) => point.x); const ys = allPositions.map((point) => point.y);
  const bounds = { minX: xs.length ? Math.min(...xs) : -4, minY: ys.length ? Math.min(...ys) : -3, maxX: xs.length ? Math.max(...xs) : 4, maxY: ys.length ? Math.max(...ys) : 5 };
  const draft: TikzDiagramDraft = {
    id: stableTikzId("tikz", `${input.sourceHash}-${input.tikzCode.slice(0, 200)}`),
    source: { sourceType: input.sourceType || "image", sourceName: input.sourceName, sourceHash: input.sourceHash, originalWidth: input.width, originalHeight: input.height, processedWidth: input.processedWidth, processedHeight: input.processedHeight },
    classification: { type: classification, subtype: text(raw.subtype || raw.figureType) || undefined, confidence: confidence(raw.confidence), detectedFeatures: [...new Set(semantics.objects.map((item) => item.type))], warnings: input.warnings || [], teacherConfirmed: false },
    objects: semantics.objects, relationships: semantics.relationships,
    layout: { bounds, scale: 1, coordinateSystem: classification === "function_graph" || classification === "coordinate_geometry" ? "cartesian" : "diagram" },
    tikz: { snippet: input.tikzCode, generatedSnippet: input.tikzCode, standalone: input.standaloneLatex || buildStandaloneTikzDocument(input.tikzCode), libraries: requiredTikzLibraries(input.tikzCode), packages: ["tikz"], semanticSync: "synchronized" },
    compilation: inspectTikzSyntax(input.tikzCode), validation: { valid: false, status: "needs_review", checks: [], warnings: [], missingObjects: [] },
    quality: { classification: 0, objectCoverage: 0, labelCoverage: 0, relationships: 0, compilation: 0, layout: 0, comparison: 0, teacherConfirmationRequired: true, overall: "needs_review" },
    teacherEdits: [], status: "recognized", metadata: { createdAt: now, updatedAt: now, version: "2.0" },
  };
  draft.validation = validateTikzDraft(draft); draft.quality = qualitySummary(draft); draft.status = draft.validation.status === "ready" ? "valid" : "needs_review";
  return draft;
}

export function normalizeLegacyTikzDraft(value: unknown, fallbackCode = ""): TikzDiagramDraft {
  const source = record(value);
  if (source.metadata && source.source && source.tikz && Array.isArray(source.objects)) return source as unknown as TikzDiagramDraft;
  const code = text(record(source.tikz).snippet || source.tikzCode || source.tikz_code || source.content || fallbackCode);
  return createTikzDiagramDraft({ sourceHash: text(record(source.source).sourceHash) || stableTikzId("legacy", code), sourceName: text(record(source.source).sourceName || source.title) || "Mã TikZ cũ", sourceType: source.tikz_code ? "tikz_bank" : "existing_tikz", tikzCode: code, standaloneLatex: text(record(source.tikz).standalone || source.standaloneLatex || source.full_latex), rawStructure: source.detectedStructure || source.geometryStructure || record(source.metadata).tikzDiagramDraft || {} });
}

export function objectTypeLabel(type: DiagramObjectType) {
  const labels: Record<DiagramObjectType, string> = { point: "Điểm", label: "Nhãn", segment: "Đoạn thẳng", ray: "Tia", line: "Đường thẳng", vector: "Vectơ", polygon: "Đa giác", polyhedron_face: "Mặt đa diện", circle: "Đường tròn", arc: "Cung", angle_marker: "Dấu góc", right_angle_marker: "Dấu vuông góc", axis: "Trục", tick: "Vạch chia", grid: "Lưới", function_curve: "Đường cong", plotted_point: "Điểm đồ thị", asymptote: "Tiệm cận", bar: "Cột", chart_label: "Nhãn biểu đồ", force_arrow: "Vectơ lực", circuit_element: "Phần tử mạch", optics_ray: "Tia sáng", table: "Bảng", annotation: "Chú thích", unknown: "Chưa xác định" }; return labels[type];
}
