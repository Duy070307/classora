export type DiagramValidationStatus = "valid" | "draft_with_warnings" | "invalid";

export type DiagramValidation = {
  valid: boolean;
  status: DiagramValidationStatus;
  warnings: string[];
  missingComponents: string[];
  failureReasons: string[];
  detected: { lines: number; points: number; axes: number; curves: number; guides: number; labels: number };
  generated: { lines: number; points: number; axes: number; curves: number; guides: number; labels: number };
};

function array(value: unknown) { return Array.isArray(value) ? value : []; }
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function structureLabels(structure: Record<string, unknown>) {
  return [
    ...array(structure.points).map((item) => String(record(item).label || record(item).name || "")),
    ...array(structure.visibleLabels).map(String),
    ...array(structure.labels).map((item) => String(record(item).text || record(item).label || item || "")),
    ...array(structure.angleLabels).map((item) => String(record(item).label || "")),
    ...array(structure.lines).map((item) => String(record(item).label || "")),
  ].filter(Boolean);
}

function hasTikzLabel(tikz: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:\\$${escaped}\\$|\\{${escaped}\\}|\\(${escaped.replace(/_/g, "_?")}\\))`).test(tikz);
}

export function validateDiagramCompleteness(diagramType: string, structure: Record<string, unknown>, tikz: string): DiagramValidation {
  const detectedLines = array(structure.lines).length
    || array(structure.segments).length
    || array(structure.solidEdges).length + array(structure.dashedEdges).length;
  const detected = {
    lines: detectedLines,
    points: array(structure.points).length || array(structure.visibleLabels).length,
    axes: structure.axes && typeof structure.axes === "object"
      ? Number(Boolean(record(structure.axes).xAxis)) + Number(Boolean(record(structure.axes).yAxis))
      : 0,
    curves: array(structure.curves).length,
    guides: array(structure.guides).length,
    labels: new Set(structureLabels(structure)).size,
  };
  const draws = [...tikz.matchAll(/\\draw(?:\[[^\]]*\])?/g)].length;
  const generated = {
    lines: draws,
    points: [...tikz.matchAll(/\\(?:fill|coordinate)\b/g)].length,
    axes: [...tikz.matchAll(/\\draw\[[^\]]*(?:->|<->)[^\]]*\]/g)].length,
    curves: [...tikz.matchAll(/plot(?:\[[^\]]*\])?\s*coordinates|\.\.\s*controls|\\(?:draw|path)[^;]*\bplot\b/g)].length,
    guides: [...tikz.matchAll(/\\draw\[[^\]]*dashed[^\]]*\]/g)].length,
    labels: [...tikz.matchAll(/\\node(?:\[[^\]]*\])?\s+(?:at|\{)/g)].length,
  };
  const missingComponents: string[] = [];
  const hardFailures: string[] = [];

  if (diagramType === "function_graph" || diagramType === "coordinate_graph") {
    const hasCurveOrSegment = generated.curves > 0 || /%\s*segment-|\\draw[^;]*--/i.test(tikz) && draws > generated.axes;
    if (generated.axes < 2) missingComponents.push("axes");
    if (!hasCurveOrSegment) missingComponents.push("curve_or_segment");
    if (detected.curves && generated.curves < detected.curves) missingComponents.push("curve");
    if (array(structure.segments).length && !/%\s*segment-/.test(tikz)) missingComponents.push("segments");
    if (detected.guides && generated.guides < detected.guides) missingComponents.push("guide_lines");
    if (!/\{\$?[Oxy]\$?\}|y\s*=\s*f\(x\)/i.test(tikz)) missingComponents.push("axis_or_function_labels");
    if (generated.axes < 2) hardFailures.push("missing_axes");
    if (!hasCurveOrSegment) hardFailures.push("missing_curve_or_segment");
    if (draws < 3) hardFailures.push("output_too_small");
  } else if (diagramType === "line_angle_diagram") {
    if (generated.lines < Math.max(3, Math.min(4, detected.lines || 3))) missingComponents.push("major_lines");
    for (const point of array(structure.points)) {
      const label = String(record(point).label || "");
      if (label && !hasTikzLabel(tikz, label)) missingComponents.push(`point_${label}`);
    }
    for (const line of array(structure.lines)) {
      const label = String(record(line).label || "");
      if (label && !hasTikzLabel(tikz, label)) missingComponents.push(`line_${label}`);
      if (label && /^[abc]$/i.test(label)) {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const match = tikz.match(new RegExp(`\\\\draw(?:\\[[^\\]]*\\])?\\s*\\(([-\\d.]+),([-\\d.]+)\\)\\s*--\\s*\\(([-\\d.]+),([-\\d.]+)\\)[^;]*\\{\\$${escaped}\\$\\}`));
        if (match) {
          const [, x1, y1, x2, y2] = match.map(Number);
          const orientation = String(record(line).orientation || "");
          if (orientation === "horizontal" && Math.abs(y1 - y2) > 1e-6) hardFailures.push(`line_${label}_orientation_invalid`);
          if (orientation === "vertical" && Math.abs(x1 - x2) > 1e-6) hardFailures.push(`line_${label}_orientation_invalid`);
        }
      }
    }
    if (array(structure.rightAngles).length && !/right angle|right-angle-marker/i.test(tikz)) missingComponents.push("right_angles");
    for (const item of array(structure.angleLabels)) {
      const label = String(record(item).label || "");
      if (label && !hasTikzLabel(tikz, label)) missingComponents.push(`angle_${label}`);
    }
    if (generated.lines <= 1) hardFailures.push("too_few_major_lines");
    if (generated.labels === 0) hardFailures.push("missing_labels");
  } else if (diagramType === "geometry_diagram") {
    const expectedLabels = structureLabels(structure);
    const meaningfulPoints = Math.max(generated.points, generated.labels);
    if (meaningfulPoints < Math.min(3, detected.points)) missingComponents.push("main_points");
    if (generated.lines < Math.min(2, Math.max(2, detected.lines))) missingComponents.push("main_edges");
    for (const label of expectedLabels) {
      if (label && !hasTikzLabel(tikz, label)) missingComponents.push(`point_${label}`);
    }
    if (meaningfulPoints < 3) hardFailures.push("too_few_points");
    if (generated.lines < 2) hardFailures.push("too_few_edges");
  } else {
    hardFailures.push("classification_failed");
  }

  const uniqueMissing = [...new Set(missingComponents)];
  const uniqueFailures = [...new Set(hardFailures)];
  const status: DiagramValidationStatus = uniqueFailures.length
    ? "invalid"
    : uniqueMissing.length
      ? "draft_with_warnings"
      : "valid";
  return {
    valid: status === "valid",
    status,
    warnings: status === "draft_with_warnings"
      ? ["Bản vẽ là bản nháp TikZ. SOẠN LAB chưa xác nhận đầy đủ mọi quan hệ hình học, thầy cô nên rà soát trước khi dùng."]
      : status === "invalid"
        ? ["Chưa có đủ thành phần có ý nghĩa để dựng một bản TikZ sử dụng được."]
        : [],
    missingComponents: uniqueMissing,
    failureReasons: uniqueFailures,
    detected,
    generated,
  };
}
