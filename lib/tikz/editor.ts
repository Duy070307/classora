import { generateTikzFromDraft } from "@/lib/tikz/generator";
import { buildStandaloneTikzDocument } from "@/lib/ai/extract-tikz";
import { stableTikzId } from "@/lib/tikz/model";
import { inspectTikzSyntax } from "@/lib/tikz/syntax";
import type { DiagramEdit, StructuredEditOperation, TikzDiagramDraft } from "@/lib/tikz/types";
import { qualitySummary, validateTikzDraft } from "@/lib/tikz/validation";

function timestamp() { return new Date().toISOString(); }
function commit(draft: TikzDiagramDraft, edit: DiagramEdit) {
  const generated = generateTikzFromDraft(draft); draft.tikz = { ...draft.tikz, snippet: generated.snippet, generatedSnippet: generated.snippet, standalone: generated.standalone, libraries: generated.libraries, packages: generated.packages, semanticSync: "synchronized" };
  draft.compilation = inspectTikzSyntax(generated.snippet); draft.teacherEdits.push(edit); draft.metadata.updatedAt = edit.at; draft.validation = validateTikzDraft(draft); draft.quality = qualitySummary(draft); draft.status = "needs_review"; return draft;
}

export function applyStructuredEdit(current: TikzDiagramDraft, operation: StructuredEditOperation) {
  const draft = structuredClone(current); const at = timestamp();
  if (operation.type === "move_object") { const object = draft.objects.find((item) => item.id === operation.objectId); if (!object) return current; const before = object.position; object.position = operation.position; return commit(draft, { id: stableTikzId("edit", `${at}-${object.id}`), at, source: "structured", operation: operation.type, objectId: object.id, before, after: object.position }); }
  if (operation.type === "rename_point") { const object = draft.objects.find((item) => item.id === operation.objectId && item.type === "point"); if (!object) return current; const before = object.label; object.label = operation.label.replace(/[{}\\]/g, "").slice(0, 20); return commit(draft, { id: stableTikzId("edit", `${at}-${object.id}`), at, source: "structured", operation: operation.type, objectId: object.id, before, after: object.label }); }
  if (operation.type === "change_line_style") { const object = draft.objects.find((item) => item.id === operation.objectId); if (!object) return current; const before = object.style; object.style = operation.style; const relation = draft.relationships.find((item) => item.objectIds.includes(object.id) && ["hidden_edge", "visible_edge"].includes(item.type)); if (relation) relation.type = operation.style === "dashed" ? "hidden_edge" : "visible_edge"; return commit(draft, { id: stableTikzId("edit", `${at}-${object.id}`), at, source: "structured", operation: operation.type, objectId: object.id, before, after: object.style }); }
  if (operation.type === "move_label") { const object = draft.objects.find((item) => item.id === operation.objectId); if (!object) return current; const before = object.anchor; object.anchor = operation.anchor; return commit(draft, { id: stableTikzId("edit", `${at}-${object.id}`), at, source: "structured", operation: operation.type, objectId: object.id, before, after: object.anchor }); }
  if (operation.type === "add_point") { const id = stableTikzId("point", operation.label); draft.objects.push({ id, type: "point", label: operation.label.replace(/[{}\\]/g, "").slice(0, 20), position: operation.position, confidence: "high", teacherConfirmed: true }); return commit(draft, { id: stableTikzId("edit", `${at}-${id}`), at, source: "structured", operation: operation.type, objectId: id, after: operation }); }
  if (operation.type === "add_right_angle") { const id = stableTikzId("right-angle", `${operation.pointId}-${at}`); draft.objects.push({ id, type: "right_angle_marker", points: [operation.pointId], confidence: "high", teacherConfirmed: true }); return commit(draft, { id: stableTikzId("edit", `${at}-${id}`), at, source: "structured", operation: operation.type, objectId: id, after: operation }); }
  if (operation.type === "add_relationship") { draft.relationships.push(operation.relationship); return commit(draft, { id: stableTikzId("edit", `${at}-${operation.relationship.id}`), at, source: "structured", operation: operation.type, after: operation.relationship }); }
  return current;
}

export function applyManualTikzCode(current: TikzDiagramDraft, code: string) {
  const draft = structuredClone(current); const at = timestamp(); draft.tikz.snippet = code; draft.tikz.standalone = buildStandaloneTikzDocument(code); draft.tikz.semanticSync = code === draft.tikz.generatedSnippet ? "synchronized" : "partially_detached"; draft.compilation = inspectTikzSyntax(code); draft.teacherEdits.push({ id: stableTikzId("edit", `${at}-code`), at, source: "code", operation: "edit_code", before: current.tikz.snippet, after: code }); draft.metadata.updatedAt = at; draft.validation = validateTikzDraft(draft); draft.quality = qualitySummary(draft); draft.status = "needs_review"; return draft;
}

export function undoLatestEdit(current: TikzDiagramDraft) {
  const latest = current.teacherEdits.at(-1); if (!latest) return current;
  if (latest.source === "code" && typeof latest.before === "string") return applyManualTikzCode({ ...current, teacherEdits: current.teacherEdits.slice(0, -1) }, latest.before);
  return current;
}
