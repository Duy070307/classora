import assert from "node:assert/strict";
import { generateValidatedTikz, layoutGeometry, parseGeometryStructure, perpendicular, pointOnSegment } from "../lib/ai/geometry-validator";

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
    { label: "B", relativePosition: "bottom" }, { label: "C", relativePosition: "right" },
    { label: "D", relativePosition: "upper-right" }, { label: "O", relativePosition: "center" },
  ],
  visibleLabels: ["S", "A", "B", "C", "D", "O"],
  solidEdges: [["A", "B"], ["A", "D"], ["B", "C"], ["S", "A"], ["S", "B"], ["S", "C"], ["S", "D"]],
  dashedEdges: [["D", "C"], ["A", "C"], ["B", "D"], ["S", "O"]],
  relations: [{ type: "base", points: ["A", "B", "C", "D"] }, { type: "intersection", point: "O", lines: [["A", "C"], ["B", "D"]] }],
  warnings: [],
});
const pyramidCoordinates = layoutGeometry(pyramid);
for (const left of ["S", "A", "B", "C", "D", "O"]) for (const right of ["S", "A", "B", "C", "D", "O"]) {
  if (left >= right) continue;
  assert.ok(Math.hypot(pyramidCoordinates[left].x - pyramidCoordinates[right].x, pyramidCoordinates[left].y - pyramidCoordinates[right].y) > 0.05, `${left} và ${right} không được trùng`);
}
assert.ok(pointOnSegment(pyramidCoordinates.O, pyramidCoordinates.A, pyramidCoordinates.C));
assert.ok(pointOnSegment(pyramidCoordinates.O, pyramidCoordinates.B, pyramidCoordinates.D));
const pyramidResult = generateValidatedTikz(pyramid);
assert.equal(pyramidResult.diagnostic.valid, true);
assert.equal(pyramidResult.inspection.ok, true);
assert.match(pyramidResult.tikzCode, /name intersections=\{of=line0a and line0b, by=O\}/);
assert.match(pyramidResult.tikzCode, /\\draw\[thick\] \(A\) -- \(B\)/);
assert.match(pyramidResult.tikzCode, /\\draw\[thick, dashed\] \(A\) -- \(C\)/);
assert.doesNotMatch(pyramidResult.tikzCode, /\\coordinate \(O\) at/);

const duplicateSource = structure({ figureType: "triangle", points: [{ label: "A", relativePosition: "bottom" }, { label: "B", relativePosition: "bottom" }, { label: "C", relativePosition: "top" }], visibleLabels: ["A", "B", "C"], solidEdges: [["A", "B"], ["B", "C"], ["C", "A"]], relations: [], warnings: [] });
const duplicateFixed = layoutGeometry(duplicateSource);
assert.ok(Math.hypot(duplicateFixed.A.x - duplicateFixed.B.x, duplicateFixed.A.y - duplicateFixed.B.y) > 0.05);
assert.doesNotMatch(generateValidatedTikz(duplicateSource).tikzCode, /zero_length/);

console.log("Geometry validator: hình chóp S.ABCD/O, giao điểm, chống trùng/đoạn 0, nét đứt-liền và vuông góc đều đạt.");
