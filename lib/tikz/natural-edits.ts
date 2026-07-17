import { stableTikzId } from "@/lib/tikz/model";
import type { StructuredEditOperation, TikzDiagramDraft } from "@/lib/tikz/types";

export function parseNaturalDiagramEdit(command: string, draft: TikzDiagramDraft): { operations: StructuredEditOperation[]; warnings: string[] } {
  const value = command.trim(); const operations: StructuredEditOperation[] = []; const warnings: string[] = [];
  if (/\\(?:input|include|write|read|open|directlua)|https?:\/\//i.test(value)) return { operations: [], warnings: ["Yêu cầu chứa nội dung không được hỗ trợ vì lý do an toàn."] };
  const rename = value.match(/(?:đổi tên điểm|đổi điểm)\s+([A-Za-z][\w']*)\s+(?:thành|sang)\s+([A-Za-z][\w']*)/i);
  if (rename) { const object = draft.objects.find((item) => item.type === "point" && item.label?.toLowerCase() === rename[1].toLowerCase()); if (object) operations.push({ type: "rename_point", objectId: object.id, label: rename[2] }); else warnings.push(`Không tìm thấy điểm ${rename[1]}.`); }
  const dashed = value.match(/(?:đổi|cho)\s+(?:cạnh|đoạn)?\s*([A-Za-z])([A-Za-z])\s+(?:thành|là)\s+nét đứt/i);
  if (dashed) { const edge = draft.objects.find((item) => ["segment", "line"].includes(item.type) && String(item.metadata?.from || "").toLowerCase() === dashed[1].toLowerCase() && String(item.metadata?.to || "").toLowerCase() === dashed[2].toLowerCase()); if (edge) operations.push({ type: "change_line_style", objectId: edge.id, style: "dashed" }); else warnings.push(`Không tìm thấy cạnh ${dashed[1]}${dashed[2]}.`); }
  const moveLabel = value.match(/di chuyển nhãn\s+([^\s]+)\s+(?:xuống dưới|lên trên|sang trái|sang phải)/i);
  if (moveLabel) { const object = draft.objects.find((item) => item.label?.toLowerCase() === moveLabel[1].toLowerCase()); const anchor = /xuống dưới/i.test(value) ? "below" : /lên trên/i.test(value) ? "above" : /sang trái/i.test(value) ? "left" : "right"; if (object) operations.push({ type: "move_label", objectId: object.id, anchor }); else warnings.push(`Không tìm thấy nhãn ${moveLabel[1]}.`); }
  const rightAngle = value.match(/(?:thêm|đánh)\s+(?:dấu\s+)?vuông góc\s+tại\s+([A-Za-z][\w']*)/i);
  if (rightAngle) { const point = draft.objects.find((item) => item.type === "point" && item.label?.toLowerCase() === rightAngle[1].toLowerCase()); if (point) operations.push({ type: "add_right_angle", pointId: point.id }); else warnings.push(`Không tìm thấy điểm ${rightAngle[1]}.`); }
  const plotted = value.match(/thêm điểm\s*\(\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*\)/i);
  if (plotted) operations.push({ type: "add_point", label: `P(${plotted[1]};${plotted[2]})`, position: { x: Number(plotted[1]), y: Number(plotted[2]) } });
  const parallel = value.match(/(?:đường thẳng\s+)?([a-z])\s+song song với\s+([a-z])/i);
  if (parallel) { const items = draft.objects.filter((item) => ["line", "segment"].includes(item.type) && [parallel[1], parallel[2]].includes(item.label || "")); if (items.length === 2) operations.push({ type: "add_relationship", relationship: { id: stableTikzId("rel", `parallel-${items.map((item) => item.id).join("-")}`), type: "parallel", objectIds: items.map((item) => item.id), confidence: "high", teacherConfirmed: true } }); else warnings.push("Chưa xác định đủ hai đường thẳng cần đánh dấu song song."); }
  if (!operations.length && !warnings.length) warnings.push("SOẠN LAB chưa chuyển được yêu cầu này thành thao tác an toàn. Thầy cô có thể sửa bằng bảng đối tượng hoặc mã TikZ.");
  return { operations, warnings };
}
