import type { ExamQuestion } from "@/lib/exam-types";
import type { QuestionBankItem } from "@/lib/question-bank-core/types";
import type { GeneratedDocument } from "@/lib/types";
import type { ConfirmedDiagramAsset } from "@/lib/tikz/types";

export type DiagramInsertionTarget = { id: string; label: string; kind: "exam_question" | "worksheet_activity" | "lesson_activity" | "slide" | "review_activity" | "solution" | "document" };

function assetKey(asset: ConfirmedDiagramAsset) { return `${asset.diagramId}@${asset.version}`; }
function imageData(asset: ConfirmedDiagramAsset) { return asset.pngDataUrl || asset.svgDataUrl || ""; }

export function listDiagramInsertionTargets(document: GeneratedDocument): DiagramInsertionTarget[] {
  if (document.structuredExam) return document.structuredExam.parts.flatMap((part) => part.questions.map((question) => ({ id: question.id, label: `Câu ${question.number} · ${question.stem.slice(0, 70)}`, kind: "exam_question" as const })));
  if (document.worksheet) return document.worksheet.activities.map((activity) => ({ id: activity.id, label: `Hoạt động ${activity.order} · ${activity.title || activity.prompt.slice(0, 70)}`, kind: "worksheet_activity" as const }));
  if (document.lessonPlan) return document.lessonPlan.periods.flatMap((period) => period.activities.map((activity) => ({ id: activity.id, label: `Hoạt động ${activity.order} · ${activity.title}`, kind: "lesson_activity" as const })));
  if (document.slideDeck) return document.slideDeck.slides.map((slide) => ({ id: slide.id, label: `Slide ${slide.order} · ${slide.title || "Không tiêu đề"}`, kind: "slide" as const }));
  if (document.reviewPack) return document.reviewPack.practiceActivities.map((activity) => ({ id: activity.id, label: `Bài luyện tập ${activity.order} · ${activity.title || activity.prompt.slice(0, 70)}`, kind: "review_activity" as const }));
  if (document.examSolutionSet) return document.examSolutionSet.questions.map((solution) => ({ id: solution.questionId, label: `Lời giải câu ${solution.questionNumber}`, kind: "solution" as const }));
  return [{ id: document.id, label: "Cuối tài liệu", kind: "document" }];
}

function attachExamVisual(question: ExamQuestion, asset: ConfirmedDiagramAsset) {
  const content = imageData(asset); const existing = question.visuals || [];
  return { ...question, visuals: [...existing.filter((visual) => visual.content !== content), { type: asset.pngDataUrl ? "image" as const : "svg" as const, content, alt: asset.altText }] };
}

export function insertConfirmedDiagram(document: GeneratedDocument, asset: ConfirmedDiagramAsset, locationId: string) {
  if (!asset.confirmedAt || !asset.semanticHash || !imageData(asset)) throw new Error("diagram_not_confirmed");
  const next = structuredClone(document); next.diagramAssets = [...(next.diagramAssets || []).filter((item) => assetKey(item) !== assetKey(asset)), asset];
  let inserted = false;
  if (next.structuredExam) { next.structuredExam.diagramAssets = [...(next.structuredExam.diagramAssets || []).filter((item) => assetKey(item) !== assetKey(asset)), asset]; next.structuredExam.parts = next.structuredExam.parts.map((part) => ({ ...part, questions: part.questions.map((question) => { if (question.id !== locationId) return question; inserted = true; return attachExamVisual(question, asset); }) })); }
  if (next.worksheet) { next.worksheet.diagramAssets = [...(next.worksheet.diagramAssets || []).filter((item) => assetKey(item) !== assetKey(asset)), asset]; next.worksheet.activities = next.worksheet.activities.map((activity) => { if (activity.id !== locationId) return activity; inserted = true; return { ...activity, blocks: [...(activity.blocks || []).filter((block) => block.id !== assetKey(asset)), { id: assetKey(asset), type: "image" as const, assetId: assetKey(asset), alt: asset.altText, dataUrl: imageData(asset) }] }; }); }
  if (next.lessonPlan) { next.lessonPlan.diagramAssets = [...(next.lessonPlan.diagramAssets || []).filter((item) => assetKey(item) !== assetKey(asset)), asset]; next.lessonPlan.periods = next.lessonPlan.periods.map((period) => ({ ...period, activities: period.activities.map((activity) => { if (activity.id !== locationId) return activity; inserted = true; return { ...activity, materials: [...(activity.materials || []).filter((item) => item.id !== assetKey(asset)), { id: assetKey(asset), type: "tikz" as const, title: asset.caption || asset.altText, documentId: asset.diagramId }] }; }) })); }
  if (next.slideDeck) { const slideAssetId = assetKey(asset); next.slideDeck.assets = [...next.slideDeck.assets.filter((item) => item.id !== slideAssetId), { id: slideAssetId, kind: "tikz", mimeType: asset.pngDataUrl ? "image/png" : "image/svg+xml", dataUrl: imageData(asset), width: asset.width, height: asset.height, alt: asset.altText, sourceReference: `${asset.diagramId}@${asset.version}` }]; next.slideDeck.slides = next.slideDeck.slides.map((slide) => { if (slide.id !== locationId) return slide; inserted = true; return { ...slide, blocks: [...slide.blocks.filter((block) => block.id !== slideAssetId), { id: slideAssetId, type: "tikz" as const, content: asset.caption || asset.altText, tikz: asset.tikzSource, renderedAssetId: slideAssetId, region: "main" as const, alignment: "center" as const }] }; }); }
  if (next.reviewPack) { next.reviewPack.diagramAssets = [...(next.reviewPack.diagramAssets || []).filter((item) => assetKey(item) !== assetKey(asset)), asset]; next.reviewPack.practiceActivities = next.reviewPack.practiceActivities.map((activity) => { if (activity.id !== locationId) return activity; inserted = true; return { ...activity, blocks: [...(activity.blocks || []).filter((block) => block.id !== assetKey(asset)), { id: assetKey(asset), type: "image" as const, assetId: assetKey(asset), alt: asset.altText, dataUrl: imageData(asset) }] }; }); }
  if (next.examSolutionSet) { next.examSolutionSet.diagramAssets = [...(next.examSolutionSet.diagramAssets || []).filter((item) => assetKey(item) !== assetKey(asset)), asset]; next.examSolutionSet.questions = next.examSolutionSet.questions.map((solution) => { if (solution.questionId !== locationId) return solution; inserted = true; return { ...solution, diagramAssetIds: [...new Set([...(solution.diagramAssetIds || []), assetKey(asset)])] }; }); }
  if (!inserted && locationId === next.id) inserted = true;
  if (!inserted) throw new Error("diagram_target_not_found");
  return next;
}

export function insertDiagramIntoQuestion(item: QuestionBankItem, asset: ConfirmedDiagramAsset) {
  if (!asset.confirmedAt || !imageData(asset)) throw new Error("diagram_not_confirmed");
  return { ...item, visuals: [...item.visuals.filter((visual) => visual.id !== assetKey(asset)), { id: assetKey(asset), type: "tikz" as const, content: asset.tikzSource, alt: asset.altText }], updatedAt: new Date().toISOString() };
}
