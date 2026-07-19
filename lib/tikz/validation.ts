import type { DiagramObject, TikzDiagramDraft, TikzQualitySummary, TikzValidationResult } from "@/lib/tikz/types";

function check(code: string, passed: boolean, severity: "info" | "warning" | "error", message: string, objectIds?: string[]) { return { code, passed, severity, message, objectIds }; }
function labels(draft: TikzDiagramDraft) { return draft.objects.filter((object) => object.label || object.text); }
function points(draft: TikzDiagramDraft) { return draft.objects.filter((object) => object.type === "point"); }
function segments(draft: TikzDiagramDraft) { return draft.objects.filter((object) => object.type === "segment" || object.type === "line" || object.type === "ray" || object.type === "vector"); }
function circles(draft: TikzDiagramDraft) { return draft.objects.filter((object) => object.type === "circle"); }
function hasDetachedReference(draft: TikzDiagramDraft, object: DiagramObject) { const ids = new Set(draft.objects.map((item) => item.id)); return (object.points || []).some((id) => !ids.has(id)); }

export function validateTikzDraft(draft: TikzDiagramDraft): TikzValidationResult {
  const checks: TikzValidationResult["checks"] = [];
  const missingObjects: string[] = [];
  checks.push(check("syntax", draft.compilation.errors.length === 0, "error", draft.compilation.errors.length ? "Mã còn lỗi cú pháp hoặc an toàn." : "Mã vượt qua kiểm tra cú pháp và an toàn."));
  const detached = draft.objects.filter((object) => hasDetachedReference(draft, object));
  checks.push(check("references", detached.length === 0, "error", detached.length ? "Có đối tượng tham chiếu điểm không tồn tại." : "Các tham chiếu đối tượng hợp lệ.", detached.map((item) => item.id)));
  const duplicateLabels = labels(draft).filter((item, index, all) => item.label && all.findIndex((candidate) => candidate.label === item.label && candidate.type === item.type) !== index);
  checks.push(check("duplicate_labels", duplicateLabels.length === 0, "warning", duplicateLabels.length ? "Có nhãn bị lặp cần kiểm tra." : "Không phát hiện nhãn lặp ngoài chủ ý.", duplicateLabels.map((item) => item.id)));
  if (draft.classification.type === "circle_geometry_with_background") {
    const circleItems = circles(draft); const pointLabels = new Set(points(draft).map((item) => item.label));
    const centerRelations = draft.relationships.filter((item) => item.type === "center_of");
    const circleRelations = draft.relationships.filter((item) => ["radius_of", "diameter_of", "chord_of", "secant_of", "tangent_to", "lies_on_circle"].includes(item.type));
    const angleLabels = draft.objects.filter((item) => item.type === "angle_marker" || item.type === "arc").map((item) => item.label).filter(Boolean);
    checks.push(check("principal_circle", circleItems.length > 0, "error", circleItems.length ? "Đã nhận diện đường tròn chính." : "Thiếu đường tròn chính; không thể chỉ dựng các đoạn thẳng nền."));
    checks.push(check("circle_center", pointLabels.has("O") && centerRelations.length > 0, "error", pointLabels.has("O") && centerRelations.length > 0 ? "Tâm O đã được gắn với đường tròn." : "Thiếu tâm O hoặc quan hệ tâm–đường tròn."));
    checks.push(check("circle_relations", circleRelations.length > 0, "warning", circleRelations.length ? "Đã lưu quan hệ điểm/đoạn thẳng với đường tròn." : "Chưa xác nhận bán kính, đường kính, dây hoặc điểm thuộc đường tròn."));
    const expectsThirtyDegrees = angleLabels.some((label) => /30\s*(?:°|\\circ)/.test(String(label)));
    checks.push(check("circle_angle_labels", !expectsThirtyDegrees || draft.objects.some((item) => (item.type === "angle_marker" || item.type === "arc") && Boolean(item.position)), "error", expectsThirtyDegrees ? "Nhãn góc 30° đã gắn với vị trí hình học." : "Không có nhãn góc bắt buộc cần kiểm tra."));
    if (!circleItems.length) missingObjects.push("Đường tròn chính");
    if (!pointLabels.has("O")) missingObjects.push("Tâm O");
  }
  if (draft.classification.type === "solid_geometry") {
    const subtype = draft.classification.subtype || ""; const pointLabels = new Set(points(draft).map((item) => item.label));
    if (subtype === "pyramid") {
      const required = ["S", "A", "B", "C", "D"].filter((label) => !pointLabels.has(label)); missingObjects.push(...required.map((label) => `Điểm ${label}`));
      checks.push(check("pyramid_vertices", required.length === 0, "error", required.length ? `Hình chóp thiếu ${required.join(", ")}.` : "Đỉnh và đáy hình chóp đã có đủ."));
      checks.push(check("pyramid_edges", segments(draft).length >= 8, "error", segments(draft).length >= 8 ? "Số cạnh hình chóp hợp lý." : "Hình chóp có thể thiếu cạnh đáy hoặc cạnh bên."));
    }
    const brokenHidden = draft.relationships.filter((relationship) => relationship.type === "hidden_edge").filter((relationship) => !relationship.objectIds.some((id) => draft.objects.find((object) => object.id === id && object.style === "dashed")));
    checks.push(check("hidden_edges", brokenHidden.length === 0, "error", brokenHidden.length ? "Quan hệ cạnh khuất chưa khớp kiểu nét đứt." : "Cạnh khuất giữ đúng kiểu nét.", brokenHidden.map((item) => item.id)));
  }
  if (draft.classification.type === "function_graph" || draft.classification.type === "coordinate_geometry") {
    const axes = draft.objects.filter((object) => object.type === "axis"); const originLabels = labels(draft).filter((object) => object.label === "O");
    checks.push(check("graph_axes", axes.length >= 2, "error", axes.length >= 2 ? "Đã có hai trục tọa độ." : "Thiếu trục x hoặc trục y."));
    checks.push(check("origin_once", originLabels.length <= 1, "warning", originLabels.length <= 1 ? "Nhãn gốc tọa độ không bị lặp." : "Nhãn gốc tọa độ xuất hiện nhiều lần."));
    const curves = draft.objects.filter((object) => object.type === "function_curve"); checks.push(check("graph_curve", curves.length > 0, "error", curves.length ? "Đã có đường biểu diễn hàm số." : "Chưa có đường biểu diễn hàm số."));
  }
  if (draft.classification.type === "line_angle_diagram") {
    const parallel = draft.relationships.some((item) => item.type === "parallel"); const perpendicular = draft.relationships.some((item) => item.type === "perpendicular") || draft.objects.some((item) => item.type === "right_angle_marker");
    checks.push(check("line_count", segments(draft).length >= 2, "error", segments(draft).length >= 2 ? "Có đủ đường thẳng chính." : "Sơ đồ góc còn thiếu đường thẳng."));
    checks.push(check("line_relations", parallel || perpendicular, "warning", parallel || perpendicular ? "Đã lưu quan hệ đường thẳng." : "Chưa xác nhận quan hệ song song hoặc vuông góc."));
  }
  if (draft.classification.type === "statistical_chart") {
    const bars = draft.objects.filter((item) => item.type === "bar"); checks.push(check("chart_values", bars.length > 0 && bars.every((item) => item.label && Number.isFinite(item.value)), "error", bars.length ? "Đã đối chiếu nhãn và giá trị cột." : "Biểu đồ chưa có dữ liệu cột."));
  }
  if (draft.classification.type === "physics_diagram") {
    const components = draft.objects.filter((item) => ["force_arrow", "optics_ray", "circuit_element"].includes(item.type)); checks.push(check("physics_components", components.length > 0, "error", components.length ? "Đã nhận diện thành phần vật lí cơ bản." : "Chưa đủ thành phần để dựng sơ đồ vật lí."));
  }
  const errors = checks.filter((item) => !item.passed && item.severity === "error"); const warnings = checks.filter((item) => !item.passed && item.severity === "warning");
  const unreliable = draft.classification.type === "unknown" || draft.classification.confidence === "low" || draft.objects.length < 2;
  const status = unreliable ? "unreliable" : errors.length ? "needs_review" : warnings.length || !draft.classification.teacherConfirmed ? "warning" : "ready";
  const confidenceWarnings = draft.classification.confidence === "low"
    ? [
      ...(draft.classification.type === "circle_geometry_with_background" ? ["Chưa xác định chắc chắn đường tròn chính hoặc một số quan hệ góc."] : []),
      "Cắt ảnh chỉ còn phần hình và thử lại.",
    ]
    : [];
  return { valid: !errors.length && !unreliable, status, checks, warnings: [...draft.classification.warnings, ...warnings.map((item) => item.message), ...confidenceWarnings], missingObjects };
}

export function qualitySummary(draft: TikzDiagramDraft): TikzQualitySummary {
  const labelItems = labels(draft); const confirmed = draft.objects.filter((item) => item.teacherConfirmed).length;
  const classification = draft.classification.confidence === "high" ? 100 : draft.classification.confidence === "medium" ? 65 : 30;
  const objectCoverage = draft.objects.length ? Math.round(50 + 50 * confirmed / draft.objects.length) : 0;
  const labelCoverage = labelItems.length ? Math.round(100 * labelItems.filter((item) => item.label || item.text).length / labelItems.length) : 40;
  const relationships = draft.relationships.length ? Math.round(100 * draft.relationships.filter((item) => item.confidence !== "low").length / draft.relationships.length) : 35;
  const compilation = draft.compilation.success ? 100 : draft.compilation.errors.length ? 0 : 50;
  const layout = draft.validation.checks.some((item) => item.code === "references" && !item.passed) ? 30 : 75;
  const comparison = draft.comparison ? Math.round((draft.comparison.objectCoverage + draft.comparison.labelCoverage + draft.comparison.structuralSimilarity + draft.comparison.sourceRenderAlignment) / 4) : 0;
  const teacherConfirmationRequired = !draft.classification.teacherConfirmed || draft.validation.status !== "ready" || !draft.compilation.success;
  const overall = draft.validation.status === "unreliable" ? "unreliable" : draft.validation.status === "needs_review" ? "needs_review" : teacherConfirmationRequired ? "warning" : "ready";
  return { classification, objectCoverage, labelCoverage, relationships, compilation, layout, comparison, teacherConfirmationRequired, overall };
}
