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
assert.match(exactResult.tikzCode, /\\draw\[dashed\] \(A\) -- \(C\)/);

const plainTriangle = structure({ points: ["A", "B", "C"].map((label) => ({ label })), visibleLabels: ["A", "B", "C"], segments: [{ from: "A", to: "B" }, { from: "B", to: "C" }, { from: "C", to: "A" }], pointOnSegment: [], perpendicularRelations: [], warnings: [] });
assert.doesNotMatch(generateValidatedTikz(plainTriangle).tikzCode, /right angle/);

const pointM = structure({ points: ["A", "B", "M"].map((label) => ({ label })), visibleLabels: ["A", "B", "M"], segments: [{ from: "A", to: "B" }], pointOnSegment: [{ point: "M", segment: ["A", "B"] }], perpendicularRelations: [], warnings: [] });
const pointMCoordinates = layoutGeometry(pointM);
assert.ok(pointOnSegment(pointMCoordinates.M, pointMCoordinates.A, pointMCoordinates.B));

const uncertain = structure({ points: ["A", "B", "C"].map((label) => ({ label })), visibleLabels: ["A", "B", "C"], segments: [{ from: "A", to: "B" }, { from: "A", to: "C" }], pointOnSegment: [], perpendicularRelations: [{ segment1: ["A", "B"], segment2: ["A", "C"], vertex: "A", certain: false }], warnings: ["Ký hiệu góc vuông chưa rõ."] });
const uncertainResult = generateValidatedTikz(uncertain);
assert.doesNotMatch(uncertainResult.tikzCode, /right angle/);
assert.equal(uncertainResult.diagnostic.valid, false);

console.log("Geometry validator: S/A/B/C/H/I, thẳng hàng, vuông góc, nét đứt, nhãn và marker an toàn đều đạt.");
