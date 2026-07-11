export type DiagramValidation = {
  valid: boolean;
  warnings: string[];
  missingComponents: string[];
  detected: { lines: number; points: number; axes: number; curves: number; guides: number; labels: number };
  generated: { lines: number; points: number; axes: number; curves: number; guides: number; labels: number };
};

function array(value: unknown) { return Array.isArray(value) ? value : []; }

export function validateDiagramCompleteness(diagramType: string, structure: Record<string, unknown>, tikz: string): DiagramValidation {
  const detected = {
    lines: array(structure.lines).length,
    points: array(structure.points).length,
    axes: structure.axes && typeof structure.axes === "object" ? Number(Boolean((structure.axes as Record<string, unknown>).xAxis)) + Number(Boolean((structure.axes as Record<string, unknown>).yAxis)) : 0,
    curves: array(structure.curves).length,
    guides: array(structure.guides).length,
    labels: array(structure.labels).length + array(structure.angleLabels).length + array(structure.lines).filter((line) => line && typeof line === "object" && typeof (line as Record<string, unknown>).label === "string").length,
  };
  const draws = [...tikz.matchAll(/\\draw(?:\[[^\]]*\])?/g)].length;
  const generated = {
    lines: draws,
    points: [...tikz.matchAll(/\\(?:fill|coordinate)\b/g)].length,
    axes: [...tikz.matchAll(/\\draw\[->\]/g)].length,
    curves: [...tikz.matchAll(/plot\[smooth\]|\.\.\s*controls/g)].length,
    guides: [...tikz.matchAll(/\\draw\[[^\]]*dashed[^\]]*\]/g)].length,
    labels: [...tikz.matchAll(/\\node(?:\[[^\]]*\])?\s+at/g)].length,
  };
  const missingComponents: string[] = [];
  if (diagramType === "function_graph" || diagramType === "coordinate_graph") {
    if (generated.axes < 2) missingComponents.push("axes");
    if (generated.curves < Math.max(1, detected.curves)) missingComponents.push("curve");
    if (array(structure.segments).length && !/% segment-/.test(tikz)) missingComponents.push("segments");
    if (detected.guides && generated.guides < detected.guides) missingComponents.push("guide_lines");
    if (!/\{\$?[Oxy]\$?\}|y=f\(x\)/i.test(tikz)) missingComponents.push("axis_or_function_labels");
    if (draws < 3) missingComponents.push("graph_draw_commands");
  }
  if (diagramType === "line_angle_diagram") {
    if (generated.lines < Math.max(3, detected.lines)) missingComponents.push("major_lines");
    for (const point of array(structure.points)) {
      const label = point && typeof point === "object" ? String((point as Record<string, unknown>).label || "") : "";
      if (label && !tikz.includes(`$${label}$`)) missingComponents.push(`point_${label}`);
    }
    if (array(structure.rightAngles).length && !/right angle|right-angle-marker/.test(tikz)) missingComponents.push("right_angles");
    if (array(structure.angleLabels).some((item) => item && typeof item === "object" && !tikz.includes(`$${String((item as Record<string, unknown>).label)}$`))) missingComponents.push("angle_labels");
  }
  return { valid: missingComponents.length === 0, warnings: missingComponents.length ? ["Không thể dựng lại đầy đủ hình từ cấu trúc đã nhận diện."] : [], missingComponents: [...new Set(missingComponents)], detected, generated };
}
