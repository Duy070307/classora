import assert from "node:assert/strict";
import { generateStructuredDiagramTikz, validateDeterministicLineAngleTikz } from "../lib/ai/structured-diagram-tikz";
import { validateDiagramCompleteness } from "../lib/ai/diagram-completeness-validator";
import { generateValidatedTikz, parseGeometryStructure } from "../lib/ai/geometry-validator";

const lineAngle = {
  diagramType: "line_angle_diagram", confidence: 0.9,
  lines: [
    { id: "a", label: "a", orientation: "horizontal", style: "solid", passesThrough: ["D", "A_2"] },
    { id: "b", label: "b", orientation: "horizontal", style: "solid", passesThrough: ["C", "B_4"] },
    { id: "c", label: "c", orientation: "vertical", style: "solid", passesThrough: ["D", "C"] },
    { id: "diagonal_1", label: "", orientation: "slanted", style: "solid", passesThrough: ["A_2", "B_4"] },
  ],
  points: ["D", "C", "A_2", "B_4"].map((label) => ({ label, type: "intersection" })),
  intersections: [{ point: "D", lines: ["a", "c"] }, { point: "C", lines: ["b", "c"] }],
  rightAngles: [{ vertex: "D", between: ["a", "c"] }, { vertex: "C", between: ["b", "c"] }],
  angleLabels: ["1", "2", "3", "4"].map((label, index) => ({ label, near: ["D", "A_2", "C", "B_4"][index] })),
};
const lineResult = generateStructuredDiagramTikz(lineAngle);
assert.ok(lineResult?.validation.valid);
assert.ok((lineResult?.tikzCode.match(/\\draw/g) || []).length >= 4);
for (const label of ["a", "b", "c", "D", "C", "A_2", "B_4", "1", "2", "3", "4"]) assert.ok(lineResult?.tikzCode.includes(`$${label}$`), `Thiếu nhãn ${label}`);
assert.equal((lineResult?.tikzCode.match(/right-angle-marker/g) || []).length, 2);
assert.equal(lineResult?.fallbackUsed, true);
assert.match(lineResult?.tikzCode || "", /\(0,2\)/);
assert.match(lineResult?.tikzCode || "", /\(0,0\)/);
assert.match(lineResult?.tikzCode || "", /\(3,2\)/);
assert.match(lineResult?.tikzCode || "", /\(4,0\)/);
assert.match(lineResult?.tikzCode || "", /\(-1\.3,2\) -- \(5\.2,2\)/);
assert.match(lineResult?.tikzCode || "", /\(-1\.3,0\) -- \(5\.2,0\)/);
assert.match(lineResult?.tikzCode || "", /\(2\.6,2\.8\) -- \(4\.4,-0\.8\)/);
assert.deepEqual(validateDeterministicLineAngleTikz(lineResult?.tikzCode || ""), { valid: true, reasons: [] });
const angleCoordinates = [...(lineResult?.tikzCode || "").matchAll(/\\node at \(([-\d.]+),([-\d.]+)\) \{\$[1-4]\$\}/g)].map((match) => `${match[1]},${match[2]}`);
assert.equal(angleCoordinates.length, 8);
assert.equal(new Set(angleCoordinates).size, 8);

const graph = {
  diagramType: "function_graph", confidence: 0.86,
  axes: { xAxis: true, yAxis: true, origin: "O", xLabel: "x", yLabel: "y", hasArrowheads: true },
  ticks: [{ axis: "x", value: -3, label: "-3" }, { axis: "x", value: 3, label: "3" }, { axis: "y", value: 4, label: "4" }],
  curves: [{ id: "curve_1", label: "y=f(x)", kind: "smooth_curve", approximatePoints: [[-3, -2], [-1, 3], [1, -1], [3, 4]] }],
  segments: [{ id: "segment_1", from: [1, -1], to: [3, 4], style: "solid" }],
  points: [{ label: "O", coordinate: [0, 0] }],
  guides: [{ style: "dashed", from: [-3, 0], to: [-3, -2] }, { style: "dashed", from: [3, 0], to: [3, 4] }, { style: "dashed", from: [0, 4], to: [3, 4] }],
  labels: [{ text: "y=f(x)", near: "curve_1" }],
};
const graphResult = generateStructuredDiagramTikz(graph);
assert.ok(graphResult?.validation.valid);
assert.equal((graphResult?.tikzCode.match(/\\draw\[->\]/g) || []).length, 2);
assert.match(graphResult?.tikzCode || "", /plot\[smooth\]/);
assert.equal((graphResult?.tikzCode.match(/\\draw\[dashed\]/g) || []).length, 3);
assert.match(graphResult?.tikzCode || "", /\$y=f\(x\)\$/);
assert.match(graphResult?.tikzCode || "", /\$O\$/);

const incompleteGraph = validateDiagramCompleteness("function_graph", graph, "\\begin{tikzpicture}\\coordinate (O) at (0,0);\\node at (O) {$O$};\\end{tikzpicture}");
assert.equal(incompleteGraph.valid, false);
assert.equal(incompleteGraph.status, "invalid");
assert.ok(incompleteGraph.missingComponents.includes("axes"));
assert.ok(incompleteGraph.missingComponents.includes("curve"));
const incompleteLine = validateDiagramCompleteness("line_angle_diagram", lineAngle, "\\begin{tikzpicture}\\draw (D)--(C);\\end{tikzpicture}");
assert.equal(incompleteLine.valid, false);
assert.equal(incompleteLine.status, "invalid");
assert.ok(incompleteLine.missingComponents.includes("major_lines"));
const lineDraft = validateDiagramCompleteness("line_angle_diagram", lineAngle, "\\begin{tikzpicture}\\draw (-2,1)--(2,1);\\draw (-2,-1)--(2,-1);\\draw (0,-2)--(0,2);\\node at (0,1) {$D$};\\node at (0,-1) {$C$};\\end{tikzpicture}");
assert.equal(lineDraft.status, "draft_with_warnings");
const brokenOrientation = validateDiagramCompleteness("line_angle_diagram", lineAngle, "\\begin{tikzpicture}\\draw[thick] (0,0)--(2,1) node[right] {$a$};\\draw[thick] (-2,0)--(2,0) node[right] {$b$};\\draw[thick] (0,-2)--(0,2) node[right] {$c$};\\draw[thick] (1,2)--(2,-2);\\node at (0,1) {$D$};\\node at (0,0) {$C$};\\node at (1,1) {$A_2$};\\node at (2,0) {$B_4$};\\end{tikzpicture}");
assert.equal(brokenOrientation.status, "invalid");
assert.ok(brokenOrientation.failureReasons.includes("line_a_orientation_invalid"));

const pyramidStructure = parseGeometryStructure(JSON.stringify({
  diagramType: "geometry_diagram", figureType: "pyramid",
  points: ["S", "A", "B", "C", "D", "O"].map((label) => ({ label })),
  visibleLabels: ["S", "A", "B", "C", "D", "O", "O"],
  solidEdges: [["S", "A"], ["S", "B"], ["S", "C"], ["S", "D"], ["A", "B"], ["B", "C"]],
  dashedEdges: [["C", "D"], ["A", "C"], ["B", "D"]],
  relations: [{ type: "intersection", point: "O", lines: [["A", "C"], ["B", "D"]] }],
}));
assert.ok(pyramidStructure, "Nhãn OCR lặp không được làm hỏng toàn bộ cấu trúc hình chóp");
if (pyramidStructure) {
  const pyramidResult = generateValidatedTikz(pyramidStructure);
  const pyramidValidation = validateDiagramCompleteness("geometry_diagram", { points: pyramidStructure.points, visibleLabels: pyramidStructure.visibleLabels, segments: pyramidStructure.segments }, pyramidResult.tikzCode);
  assert.notEqual(pyramidValidation.status, "invalid");
  for (const label of ["S", "A", "B", "C", "D", "O"]) assert.match(pyramidResult.tikzCode, new RegExp(`\\$${label}\\$`));
  assert.match(pyramidResult.tikzCode, /name intersections=\{of=AC and BD, by=O\}/);
}
console.log("Diagram structure: valid/draft/invalid, line-angle fallback, function graph và pyramid đều đạt; output chỉ O hoặc D--C bị chặn.");
