import type { GeometryStructure, Point2D } from "@/lib/ai/geometry-validator";

export function inspectGeometryTikz(tikz: string, structure: GeometryStructure, coordinates: Record<string, Point2D>, standaloneLatex = "") {
  const issues: string[] = [];
  for (const label of structure.visibleLabels) {
    const hasPoint = new RegExp(`\\\\coordinate \\(${label}\\)|by=${label}\\}`).test(tikz);
    if (!hasPoint) issues.push(`missing_point_${label}`);
  }
  const declared = [...tikz.matchAll(/\\coordinate\s+\(([^)]+)\)\s+at\s+\(([-\d.]+),([-\d.]+)\)/g)];
  for (let i = 0; i < declared.length; i += 1) {
    for (let j = i + 1; j < declared.length; j += 1) {
      if (Math.hypot(Number(declared[i][2]) - Number(declared[j][2]), Number(declared[i][3]) - Number(declared[j][3])) < 0.01) issues.push(`duplicate_coordinates_${declared[i][1]}_${declared[j][1]}`);
    }
  }
  for (const segment of structure.segments) {
    const draw = new RegExp(`\\\\draw\\[([^\\]]*)\\]\\s*\\(${segment.from}\\)\\s*--\\s*\\(${segment.to}\\)|\\\\draw\\[([^\\]]*)\\]\\s*\\(${segment.to}\\)\\s*--\\s*\\(${segment.from}\\)`, "i").exec(tikz);
    if (!draw) issues.push(`missing_edge_${segment.from}${segment.to}`);
    else {
      const style = draw[1] || draw[2] || "";
      if (segment.style === "dashed" && !/dashed/.test(style)) issues.push(`dashed_edge_not_dashed_${segment.from}${segment.to}`);
      if (segment.style !== "dashed" && /dashed/.test(style)) issues.push(`solid_edge_is_dashed_${segment.from}${segment.to}`);
    }
    const a = coordinates[segment.from]; const b = coordinates[segment.to];
    if (!a || !b || Math.hypot(a.x - b.x, a.y - b.y) < 0.05) issues.push(`zero_length_${segment.from}${segment.to}`);
  }
  for (const relation of structure.intersections) {
    if (!new RegExp(`name intersections=\\{of=.*by=${relation.point}\\}`).test(tikz)) issues.push(`missing_computed_intersection_${relation.point}`);
  }
  if (/name intersections=/.test(tikz) && !/\\usetikzlibrary\{[^}]*intersections[^}]*\}/.test(standaloneLatex)) issues.push("missing_intersections_library");
  return { ok: issues.length === 0, issues };
}
