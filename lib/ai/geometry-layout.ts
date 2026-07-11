import type { GeometryStructure, Point2D } from "@/lib/ai/geometry-validator";

function initialPosition(hint: string, index: number, total: number): Point2D {
  const value = hint.toLowerCase();
  const offsets: Record<string, Point2D> = {
    "left-bottom": { x: -2.8, y: 0 }, "left-lower": { x: -2.8, y: 0 }, "lower-left": { x: -2.8, y: 0 },
    bottom: { x: 0, y: -1.2 }, "right-bottom": { x: 2.8, y: 0 },
    "lower-right": { x: 2.8, y: 0 }, right: { x: 2.8, y: 1 }, "upper-right": { x: 1.7, y: 2 },
    "right-upper": { x: 1.7, y: 2 }, "upper-left": { x: -1.7, y: 2 }, "left-upper": { x: -1.7, y: 2 },
    top: { x: 0, y: 4 }, center: { x: 0, y: 1 }, left: { x: -2.8, y: 1 },
  };
  if (offsets[value]) return { ...offsets[value] };
  const angle = Math.PI / 2 + (index * Math.PI * 2) / Math.max(total, 3);
  return { x: 2.8 * Math.cos(angle), y: 2.8 * Math.sin(angle) + 2 };
}

function lineIntersection(a: Point2D, b: Point2D, c: Point2D, d: Point2D): Point2D | null {
  const denominator = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
  if (Math.abs(denominator) < 1e-8) return null;
  const cross1 = a.x * b.y - a.y * b.x; const cross2 = c.x * d.y - c.y * d.x;
  return {
    x: (cross1 * (c.x - d.x) - (a.x - b.x) * cross2) / denominator,
    y: (cross1 * (c.y - d.y) - (a.y - b.y) * cross2) / denominator,
  };
}

function enforceDistinct(coordinates: Record<string, Point2D>, labels: string[]) {
  const fixed: string[] = [];
  labels.forEach((label, index) => {
    for (let previous = 0; previous < index; previous += 1) {
      const other = labels[previous];
      if (Math.hypot(coordinates[label].x - coordinates[other].x, coordinates[label].y - coordinates[other].y) < 0.25) {
        coordinates[label] = { x: coordinates[label].x + 0.55 + index * 0.08, y: coordinates[label].y - 0.35 - index * 0.05 };
        fixed.push(`${other}/${label}`);
      }
    }
  });
  return fixed;
}

export function createGeometryLayout(structure: GeometryStructure, forcePyramidTemplate = false): Record<string, Point2D> {
  const labels = structure.visibleLabels;
  const coordinates = Object.fromEntries(structure.points.map((point, index) => [point.label, initialPosition(point.approximatePosition || "", index, structure.points.length)]));
  const pyramidBase = ["A", "B", "C", "D"].every((label) => labels.includes(label)) && labels.includes("S") && structure.figureType === "pyramid";
  if (pyramidBase) {
    const hints = Object.fromEntries(structure.points.map((point) => [point.label, (point.approximatePosition || "").toLowerCase()]));
    Object.assign(coordinates, {
      A: !forcePyramidTemplate && /right/.test(hints.A) ? { x: 4.8, y: 0 } : { x: 0, y: 0 },
      B: !forcePyramidTemplate && /left/.test(hints.B) ? { x: 1.2, y: -1.6 } : { x: 2.7, y: -1.6 },
      C: !forcePyramidTemplate && /left/.test(hints.C) ? { x: 0.8, y: 1.2 } : { x: 5.4, y: 0.2 },
      D: !forcePyramidTemplate && /right/.test(hints.D) && !/left/.test(hints.D) ? { x: 3.8, y: 1.45 } : { x: 1.4, y: 1.45 },
      S: !forcePyramidTemplate && /left/.test(hints.S) ? { x: 1.6, y: 3.9 } : !forcePyramidTemplate && /right/.test(hints.S) ? { x: 3.8, y: 3.9 } : { x: 2.8, y: 3.9 },
    });
    structure.warnings.push("SOẠN LAB đã ưu tiên giữ đúng quan hệ hình học và bố cục tương đối của hình.");
  }
  const fixed = enforceDistinct(coordinates, labels.filter((label) => !structure.intersections.some((item) => item.point === label)));
  if (fixed.length) structure.warnings.push(`Đã phát hiện và sửa điểm trùng tọa độ: ${fixed.join(", ")}.`);
  for (let iteration = 0; iteration < 4; iteration += 1) {
    for (const constraint of structure.pointOnSegment) {
      const a = coordinates[constraint.segment[0]]; const b = coordinates[constraint.segment[1]];
      coordinates[constraint.point] = { x: a.x + (b.x - a.x) * 0.5, y: a.y + (b.y - a.y) * 0.5 };
    }
    for (const relation of structure.perpendicularRelations.filter((item) => item.certain !== false)) {
      const firstHasVertex = relation.segment1.includes(relation.vertex);
      const target = firstHasVertex ? relation.segment1 : relation.segment2;
      const reference = firstHasVertex ? relation.segment2 : relation.segment1;
      const moving = target.find((label) => label !== relation.vertex);
      if (!moving || !coordinates[relation.vertex]) continue;
      const a = coordinates[reference[0]]; const b = coordinates[reference[1]];
      const dx = b.x - a.x; const dy = b.y - a.y; const length = Math.max(Math.hypot(dx, dy), 1);
      coordinates[moving] = { x: coordinates[relation.vertex].x - dy / length * 2.6, y: coordinates[relation.vertex].y + dx / length * 2.6 };
    }
    for (const relation of structure.intersections) {
      const point = lineIntersection(coordinates[relation.lines[0][0]], coordinates[relation.lines[0][1]], coordinates[relation.lines[1][0]], coordinates[relation.lines[1][1]]);
      if (point) coordinates[relation.point] = point;
    }
  }
  return coordinates;
}

export { lineIntersection };
