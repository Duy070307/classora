import assert from "node:assert/strict";
import { generateValidatedTikz, layoutGeometry, parseGeometryStructure, perpendicular, pointOnSegment } from "../lib/ai/geometry-validator";
import { pyramidVisualQualityScore, slopeAngleDegrees } from "../lib/ai/geometry-layout";

function structure(value: Record<string, unknown>) {
  const parsed = parseGeometryStructure(JSON.stringify(value));
  assert.ok(parsed);
  return parsed;
}

const exact = structure({
  points: ["S", "A", "B", "C", "H", "I"].map((label) => ({ label })),
  visibleLabels: ["S", "A", "B", "C", "H", "I"],
  segments: [
    { from: "S", to: "A", style: "solid" }, { from: "S", to: "B", style: "solid" },
    { from: "S", to: "C", style: "solid" }, { from: "A", to: "B", style: "solid" },
    { from: "B", to: "C", style: "solid" }, { from: "A", to: "C", style: "dashed" },
    { from: "A", to: "I", style: "dashed" }, { from: "S", to: "H", style: "dashed" },
  ],
  pointOnSegment: [{ point: "I", segment: ["B", "C"] }, { point: "H", segment: ["A", "I"] }],
  perpendicularRelations: [
    { segment1: ["A", "I"], segment2: ["B", "C"], vertex: "I", certain: true },
    { segment1: ["S", "H"], segment2: ["A", "I"], vertex: "H", certain: true },
  ],
  parallelRelations: [], equalLengthRelations: [], warnings: [],
});
const coordinates = layoutGeometry(exact);
assert.ok(pointOnSegment(coordinates.I, coordinates.B, coordinates.C));
assert.ok(pointOnSegment(coordinates.H, coordinates.A, coordinates.I));
assert.ok(perpendicular(coordinates.A, coordinates.I, coordinates.B, coordinates.C));
assert.ok(perpendicular(coordinates.S, coordinates.H, coordinates.A, coordinates.I));
const exactResult = generateValidatedTikz(exact);
assert.equal(exactResult.diagnostic.valid, true);
assert.deepEqual(exactResult.diagnostic.labels, ["S", "A", "B", "C", "H", "I"]);
assert.doesNotMatch(exactResult.tikzCode, /\b[MUmu]\b/);
assert.match(exactResult.tikzCode, /right angle=A--I--B/);
assert.match(exactResult.tikzCode, /right angle=S--H--A/);
assert.match(exactResult.tikzCode, /\\draw\[thick, dashed\] \(A\) -- \(C\)/);

const plainTriangle = structure({ points: ["A", "B", "C"].map((label) => ({ label })), visibleLabels: ["A", "B", "C"], segments: [{ from: "A", to: "B" }, { from: "B", to: "C" }, { from: "C", to: "A" }], pointOnSegment: [], perpendicularRelations: [], warnings: [] });
assert.doesNotMatch(generateValidatedTikz(plainTriangle).tikzCode, /right angle/);

const pointM = structure({ points: ["A", "B", "M"].map((label) => ({ label })), visibleLabels: ["A", "B", "M"], segments: [{ from: "A", to: "B" }], pointOnSegment: [{ point: "M", segment: ["A", "B"] }], perpendicularRelations: [], warnings: [] });
const pointMCoordinates = layoutGeometry(pointM);
assert.ok(pointOnSegment(pointMCoordinates.M, pointMCoordinates.A, pointMCoordinates.B));

const uncertain = structure({ points: ["A", "B", "C"].map((label) => ({ label })), visibleLabels: ["A", "B", "C"], segments: [{ from: "A", to: "B" }, { from: "A", to: "C" }], pointOnSegment: [], perpendicularRelations: [{ segment1: ["A", "B"], segment2: ["A", "C"], vertex: "A", certain: false }], warnings: ["Ký hiệu góc vuông chưa rõ."] });
const uncertainResult = generateValidatedTikz(uncertain);
assert.doesNotMatch(uncertainResult.tikzCode, /right angle/);
assert.equal(uncertainResult.diagnostic.valid, false);

const pyramid = structure({
  figureType: "pyramid",
  points: [
    { label: "S", relativePosition: "top" }, { label: "A", relativePosition: "left-bottom" },
    { label: "B", relativePosition: "bottom" }, { label: "C", relativePosition: "right-upper" },
    { label: "D", relativePosition: "left-upper" }, { label: "O", relativePosition: "center" },
  ],
  visibleLabels: ["S", "A", "B", "C", "D", "O"],
  solidEdges: [["A", "B"], ["A", "D"], ["B", "C"], ["S", "A"], ["S", "B"], ["S", "C"], ["S", "D"]],
  dashedEdges: [["D", "C"], ["A", "C"], ["B", "D"], ["S", "O"]],
  visualHints: { AB: "nearly-horizontal", DC: "nearly-horizontal", basePerspective: "quadrilateral", baseOrder: ["A", "B", "C", "D"] },
  relations: [{ type: "base", points: ["A", "B", "C", "D"] }, { type: "intersection", point: "O", lines: [["A", "C"], ["B", "D"]] }],
  rightAngles: [{ vertex: "O", certain: false }],
  warnings: [],
});
const pyramidCoordinates = layoutGeometry(pyramid);
for (const left of ["S", "A", "B", "C", "D", "O"]) for (const right of ["S", "A", "B", "C", "D", "O"]) {
  if (left >= right) continue;
  assert.ok(Math.hypot(pyramidCoordinates[left].x - pyramidCoordinates[right].x, pyramidCoordinates[left].y - pyramidCoordinates[right].y) > 0.05, `${left} và ${right} không được trùng`);
}
assert.ok(pointOnSegment(pyramidCoordinates.O, pyramidCoordinates.A, pyramidCoordinates.C));
assert.ok(pointOnSegment(pyramidCoordinates.O, pyramidCoordinates.B, pyramidCoordinates.D));
assert.ok(pyramidCoordinates.D.x < pyramidCoordinates.O.x);
assert.equal(pyramidCoordinates.D.x, 1.25);
assert.equal(pyramidCoordinates.D.y, 1.65);
assert.ok(Math.abs(slopeAngleDegrees(pyramidCoordinates.A, pyramidCoordinates.B)) <= 8);
assert.ok(Math.abs(slopeAngleDegrees(pyramidCoordinates.D, pyramidCoordinates.C)) <= 10);
assert.ok(pyramidVisualQualityScore(pyramidCoordinates, true) >= 6);
assert.ok(Math.abs(pyramidCoordinates.B.x - pyramidCoordinates.D.x) >= 0.8);
assert.ok(pyramidCoordinates.S.y > Math.max(pyramidCoordinates.A.y, pyramidCoordinates.B.y, pyramidCoordinates.C.y, pyramidCoordinates.D.y));
const pyramidResult = generateValidatedTikz(pyramid);
assert.equal(pyramidResult.diagnostic.valid, true);
assert.equal(pyramidResult.inspection.ok, true);
assert.match(pyramidResult.tikzCode, /name intersections=\{of=AC and BD, by=O\}/);
assert.match(pyramidResult.tikzCode, /\\draw\[blue, thick\] \(A\) -- \(B\)/);
assert.match(pyramidResult.tikzCode, /\\draw\[blue, thick, dashed\] \(A\) -- \(C\)/);
assert.doesNotMatch(pyramidResult.tikzCode, /\\coordinate \(O\) at/);
assert.match(pyramidResult.standaloneLatex, /\\usetikzlibrary\{[^}]*intersections/);
assert.match(pyramidResult.tikzCode, /\\node\[below left\] at \(A\)/);
assert.match(pyramidResult.tikzCode, /\\node\[below right\] at \(B\)/);
assert.match(pyramidResult.tikzCode, /\\node\[right\] at \(C\)/);
assert.match(pyramidResult.tikzCode, /\\node\[above left\] at \(D\)/);
assert.match(pyramidResult.tikzCode, /\\node\[below right\] at \(O\)/);

const duplicateSource = structure({ figureType: "triangle", points: [{ label: "A", relativePosition: "bottom" }, { label: "B", relativePosition: "bottom" }, { label: "C", relativePosition: "top" }], visibleLabels: ["A", "B", "C"], solidEdges: [["A", "B"], ["B", "C"], ["C", "A"]], relations: [], warnings: [] });
const duplicateFixed = layoutGeometry(duplicateSource);
assert.ok(Math.hypot(duplicateFixed.A.x - duplicateFixed.B.x, duplicateFixed.A.y - duplicateFixed.B.y) > 0.05);
assert.doesNotMatch(generateValidatedTikz(duplicateSource).tikzCode, /zero_length/);

console.log("Geometry validator: hình chóp S.ABCD/O, giao điểm, chống trùng/đoạn 0, nét đứt-liền và vuông góc đều đạt.");
