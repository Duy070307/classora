import assert from "node:assert/strict";
import { generateStructuredDiagramTikz } from "../lib/ai/structured-diagram-tikz";
import { validateDiagramCompleteness } from "../lib/ai/diagram-completeness-validator";

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
assert.match(lineResult?.tikzCode || "", /\(-2,1\.3\)/);
assert.match(lineResult?.tikzCode || "", /\(-2,-1\.3\)/);

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
assert.ok(incompleteGraph.missingComponents.includes("axes"));
assert.ok(incompleteGraph.missingComponents.includes("curve"));
const incompleteLine = validateDiagramCompleteness("line_angle_diagram", lineAngle, "\\begin{tikzpicture}\\draw (D)--(C);\\end{tikzpicture}");
assert.equal(incompleteLine.valid, false);
assert.ok(incompleteLine.missingComponents.includes("major_lines"));
console.log("Diagram structure: line-angle và function graph đầy đủ; output chỉ O hoặc D--C bị chặn đúng.");
