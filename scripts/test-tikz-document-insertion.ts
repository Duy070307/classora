import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { buildGenericDocxBlob } from "../lib/export-docx";
import { buildOfficialExamDocxBlob } from "../lib/export-exam-docx";
import { buildLessonSlidesPptx } from "../lib/lesson-slides/pptx";
import { insertConfirmedDiagram, insertDiagramIntoQuestion, listDiagramInsertionTargets } from "../lib/tikz/document-insertion";
import { applyStructuredEdit } from "../lib/tikz/editor";
import { createTikzDiagramDraft } from "../lib/tikz/model";
import { createConfirmedDiagramAsset } from "../lib/tikz/readiness";
import type { GeneratedDocument } from "../lib/types";

const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEElEQVR42mNk+M/wn4GBgQEACfsD/QeMcXkAAAAASUVORK5CYII=";
const draft = createTikzDiagramDraft({ sourceHash: "insert-source", rawStructure: { diagramType: "plane_geometry", confidence: 0.95, points: [{ label: "A", coordinate: [0, 0] }, { label: "B", coordinate: [3, 0] }, { label: "C", coordinate: [1, 2] }], segments: [["A", "B"], ["B", "C"], ["C", "A"]] }, tikzCode: "\\begin{tikzpicture}\n\\draw (0,0)--(3,0)--(1,2)--cycle;\n\\end{tikzpicture}" });
const svg = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><path d="M0 400L600 400L200 0Z"/></svg>');
const asset = createConfirmedDiagramAsset(draft, { svgDataUrl: svg, pngDataUrl: png, caption: "Hình tam giác ABC" });
draft.confirmedAsset = asset; draft.status = "confirmed";
const now = new Date().toISOString();
const base = (id: string, type: GeneratedDocument["type"]): GeneratedDocument => ({ id, title: id, type, content: "Nội dung học sinh", createdAt: now });

let passed = 0;
async function check(name: string, task: () => void | Promise<void>) { await task(); passed += 1; console.log(`✓ ${passed}. ${name}`); }

async function main() {
  const exam = { ...base("exam", "exam"), structuredExam: { metadata: { title: "Đề", examStyle: "Kiểm tra", subject: "Toán", grade: "8", duration: "45 phút", examCode: "101" }, parts: [{ type: "multiple_choice", title: "Phần I", instruction: "Chọn đáp án", questions: [{ id: "q1", part: "multiple_choice", number: 1, stem: "Quan sát hình", options: { A: "Phương án Alpha", B: "Phương án Beta", C: "Phương án Gamma", D: "Phương án Delta" }, answer: "A", explanation: "", score: 1, difficulty: "Nhận biết", topic: "Tam giác" }] }], teacherOnly: { scoringGuide: "", matrix: "", specification: "", notes: "" } } } as unknown as GeneratedDocument;
  const worksheet = { ...base("worksheet", "worksheet"), worksheet: { activities: [{ id: "wa1", order: 1, title: "Quan sát hình", prompt: "Trả lời", blocks: [] }] } } as unknown as GeneratedDocument;
  const lesson = { ...base("lesson", "lesson-plan"), lessonPlan: { periods: [{ activities: [{ id: "la1", order: 1, title: "Khám phá", materials: [] }] }] } } as unknown as GeneratedDocument;
  const slides = { ...base("slides", "lesson-slides"), slideDeck: { title: "Tam giác", purpose: "new_lesson", aspectRatio: "16:9", themeId: "classic-blue", slides: [{ id: "s1", order: 1, type: "content", layout: "title_content", title: "Hình", blocks: [] }], assets: [], teacherNotesEnabled: false, metadata: { sourceType: "manual", createdAt: now, updatedAt: now } } } as unknown as GeneratedDocument;
  const review = { ...base("review", "review-pack"), reviewPack: { practiceActivities: [{ id: "ra1", order: 1, title: "Bài tập", prompt: "Quan sát", blocks: [] }] } } as unknown as GeneratedDocument;
  const solutions = { ...base("solutions", "answer-key"), examSolutionSet: { questions: [{ questionId: "sq1", questionNumber: 1 }] } } as unknown as GeneratedDocument;

  await check("Confirmed diagram inserts into Exam question", () => { const result = insertConfirmedDiagram(exam, asset, "q1"); assert.equal(result.structuredExam?.parts[0].questions[0].visuals?.length, 1); assert.equal(result.diagramAssets?.[0].version, asset.version); });
  await check("Confirmed diagram inserts into Worksheet activity", () => assert.equal(insertConfirmedDiagram(worksheet, asset, "wa1").worksheet?.activities[0].blocks?.[0].type, "image"));
  await check("Confirmed diagram inserts into Lesson Plan activity", () => assert.equal(insertConfirmedDiagram(lesson, asset, "la1").lessonPlan?.periods[0].activities[0].materials?.[0].type, "tikz"));
  await check("Confirmed diagram inserts into Lesson Slides", () => { const result = insertConfirmedDiagram(slides, asset, "s1"); assert.equal(result.slideDeck?.assets[0].kind, "tikz"); assert.equal(result.slideDeck?.slides[0].blocks[0].type, "tikz"); });
  await check("Confirmed diagram inserts into Review Pack", () => assert.equal(insertConfirmedDiagram(review, asset, "ra1").reviewPack?.practiceActivities[0].blocks?.[0].type, "image"));
  await check("Confirmed diagram inserts into Answer Solutions", () => assert.equal(insertConfirmedDiagram(solutions, asset, "sq1").examSolutionSet?.questions[0].diagramAssetIds?.[0], `${asset.diagramId}@${asset.version}`));
  await check("Insertion targets are real canonical locations", () => { assert.equal(listDiagramInsertionTargets(exam)[0].id, "q1"); assert.equal(listDiagramInsertionTargets(slides)[0].id, "s1"); });
  await check("Unconfirmed asset cannot be inserted", () => assert.throws(() => insertConfirmedDiagram(exam, { ...asset, confirmedAt: "" }, "q1"), /diagram_not_confirmed/));
  await check("Missing target cannot be modified", () => assert.throws(() => insertConfirmedDiagram(exam, asset, "other-user-target"), /diagram_target_not_found/));
  await check("Question Bank insertion keeps native TikZ", () => { const question = { id: "bank-1", visuals: [], updatedAt: now } as never; const result = insertDiagramIntoQuestion(question, asset); assert.equal(result.visuals[0].type, "tikz"); assert.equal(result.visuals[0].content, asset.tikzSource); });
  await check("History JSON round-trip preserves asset reference", () => { const restored = JSON.parse(JSON.stringify(insertConfirmedDiagram(exam, asset, "q1"))) as GeneratedDocument; assert.equal(restored.diagramAssets?.[0].semanticHash, asset.semanticHash); assert.equal(restored.structuredExam?.parts[0].questions[0].visuals?.length, 1); });
  await check("Editing an inserted diagram creates a new version", () => { const point = draft.objects.find((item) => item.label === "A")!; const edited = applyStructuredEdit(draft, { type: "move_object", objectId: point.id, position: { x: -1, y: 0 } }); assert.notEqual(edited.metadata.version, draft.metadata.version); assert.equal(edited.confirmedAsset, undefined); assert.equal(asset.version, draft.metadata.version); });

  await check("Generic DOCX archive contains confirmed image", async () => { const document = insertConfirmedDiagram({ ...base("doc", "worksheet"), content: "PHIẾU HỌC TẬP" }, asset, "doc"); const zip = await JSZip.loadAsync(await (await buildGenericDocxBlob(document)).arrayBuffer()); assert.ok(Object.keys(zip.files).some((name) => /^word\/media\//.test(name))); const xml = await zip.file("word/document.xml")!.async("text"); assert.doesNotMatch(xml, /semanticHash|confidence|compiler|sourceHash/); });
  await check("Official exam DOCX places image beside its selected question", async () => { const inserted = insertConfirmedDiagram(exam, asset, "q1"); const zip = await JSZip.loadAsync(await (await buildOfficialExamDocxBlob(inserted, { includeTeacher: false })).arrayBuffer()); const xml = await zip.file("word/document.xml")!.async("text"); const stem = xml.indexOf("Quan sát hình"); const drawing = xml.indexOf("<w:drawing", stem); const option = xml.indexOf("Phương án Alpha", stem); assert.ok(stem >= 0 && drawing > stem && option > drawing); });
  await check("PPTX archive contains confirmed image", async () => { const inserted = insertConfirmedDiagram(slides, asset, "s1"); const zip = await JSZip.loadAsync(await buildLessonSlidesPptx(inserted.slideDeck!, "student")); assert.ok(Object.keys(zip.files).some((name) => /^ppt\/media\//.test(name))); const xml = (await Promise.all(Object.keys(zip.files).filter((name) => name.endsWith(".xml")).map((name) => zip.file(name)!.async("text")))).join(""); assert.doesNotMatch(xml, /semanticHash|sourceHash|compiler|recognition warning/i); });
  await check("Cloud document insertion awaits canonical cloud save", () => assert.match(readFileSync("components/tikz/TikzReviewWorkspace.tsx", "utf8"), /await saveDocumentToCloud\(updated\)/));
  await check("Maintenance is checked immediately before insertion", () => assert.match(readFileSync("components/tikz/TikzReviewWorkspace.tsx", "utf8"), /fetch\("\/api\/maintenance"/));
  assert.equal(passed, 17);
  console.log(`TikZ document insertion/export: ${passed}/17 checks passed.`);
}

void main();
