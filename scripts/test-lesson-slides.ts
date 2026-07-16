import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { createSlideOutline, duplicateOutlineSlide, localBlocksForSlide, replaceSlide } from "../lib/lesson-slides/outline";
import { deckForAudience, defaultSlideSettings, densityWarnings, normalizeDeck, slideCacheKey, validateDeckForExport } from "../lib/lesson-slides/normalize";
import { buildLessonSlidesPptx } from "../lib/lesson-slides/pptx";
import { parseLessonSlideSource } from "../lib/lesson-slides/file-parser";
import { settingsFromDocument, sourceFromDocument } from "../lib/lesson-slides/source";
import { maintenanceAccessDecision } from "../lib/maintenance-access";
import type { SlideBlock, SlideDeck, SlideSource } from "../lib/lesson-slides/types";
import type { GeneratedDocument } from "../lib/types";

let passed = 0;
async function check(name: string, run: () => void | Promise<void>) { await run(); passed += 1; console.log(`✓ ${name}`); }

const source: SlideSource = { type: "manual", title: "Định luật Ohm", text: "Cường độ dòng điện qua dây dẫn tỉ lệ thuận với hiệu điện thế. Điện trở có đơn vị là ôm. Công thức liên hệ là U = I.R.", confirmed: true, contentHash: "ohm" };
const settings = { ...defaultSlideSettings, subject: "Vật lí", grade: "11", topic: "Định luật Ohm", objectives: "Phát biểu được định luật Ohm\nVận dụng công thức U = I.R", keyKnowledge: "Cường độ dòng điện và hiệu điện thế\nĐiện trở của dây dẫn", slideCount: 12 };
const outline = createSlideOutline(settings, source);
const populated = normalizeDeck({ ...outline, slides: outline.slides.map((slide) => ({ ...slide, ...localBlocksForSlide(slide, settings, source.text), generationStatus: "ready" as const })) });
const contentSlide = populated.slides.find((slide) => slide.type === "content") || populated.slides[3];
const formula: SlideBlock = { id: "formula", type: "formula", content: "Định luật Ohm", latex: "U = I\\cdot R", region: "main", alignment: "center" };
const table: SlideBlock = { id: "table", type: "table", content: "Đại lượng", headers: ["Đại lượng", "Đơn vị"], rows: [["U", "V"], ["I", "A"], ["R", "Ω"]], region: "main", alignment: "left" };
const question: SlideBlock = { id: "question", type: "question", content: "Điện trở có đơn vị gì?", questionType: "quick_check", options: ["V", "A", "Ω"], answer: "Ω", explanation: "Đơn vị điện trở là ôm.", answerMode: "teacher_notes", region: "main", alignment: "left" };
const tikz: SlideBlock = { id: "tikz", type: "tikz", content: "Tam giác", tikz: "\\begin{tikzpicture}\\draw (0,0)--(1,0)--(0,1)--cycle;\\end{tikzpicture}", renderedAssetId: "tikz-asset", region: "main", alignment: "center" };
const image: SlideBlock = { id: "image", type: "image", content: "Sơ đồ", assetId: "image-asset", alt: "Sơ đồ mạch điện", region: "main", alignment: "center" };
const svg = "data:image/svg+xml;base64," + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><path d="M10 190 L200 10 L390 190 Z" fill="none" stroke="black"/></svg>').toString("base64");
const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEElEQVR42mNk+M/wn4GBgQEACfsD/QeMcXkAAAAASUVORK5CYII=";
const deck: SlideDeck = normalizeDeck({ ...populated, assets: [{ id: "tikz-asset", kind: "tikz", mimeType: "image/svg+xml", dataUrl: svg, width: 400, height: 200, alt: "Tam giác" }, { id: "image-asset", kind: "image", mimeType: "image/png", dataUrl: png, width: 2, height: 1, alt: "Sơ đồ" }], slides: populated.slides.map((slide) => slide.id === contentSlide.id ? { ...slide, blocks: [formula, table, question, tikz, image], teacherNotes: "Nhắc học sinh đổi đơn vị." } : slide) });

async function main() {
await check("1. Chủ đề tạo dàn ý 12 slide", () => { assert.equal(outline.slides.length, 12); assert.equal(outline.slides[0].type, "cover"); });
await check("2. Giáo án ánh xạ mục tiêu", () => { const d = createSlideOutline(settings, { ...source, type: "lesson_plan", extracted: { objectives: ["Mục tiêu"], stages: ["Khởi động"] } }); assert.ok(d.slides.some((s) => s.type === "objectives")); assert.equal(d.metadata.sourceType, "lesson_plan"); });
await check("3. Nội dung xác nhận được dùng", () => assert.match(JSON.stringify(localBlocksForSlide(contentSlide, settings, source.text)), /Cường độ dòng điện/));
await check("4. Bản nhận dạng chưa xác nhận bị chặn", () => { const doc: GeneratedDocument = { id: "r", title: "Scan", type: "document-recognition", content: "thấp", createdAt: "", recognitionDraft: { id: "r", sourceType: "scanned_pdf", sourceFileName: "a.pdf", pageCount: 1, pages: [], reviewStatus: "needs_review", documentHash: "h", createdAt: "", updatedAt: "" } }; const s = sourceFromDocument(doc); assert.equal(s.confirmed, false); assert.equal(s.text, ""); });
await check("5. Dàn ý chỉnh trước generation", () => assert.equal(replaceSlide(outline, outline.slides[1].id, { ...outline.slides[1], title: "Đã sửa" }).slides[1].title, "Đã sửa"));
await check("6. Thứ tự ổn định", () => assert.deepEqual(normalizeDeck({ ...outline, slides: [...outline.slides].reverse() }).slides.map((s) => s.order), Array.from({ length: 12 }, (_, i) => i + 1)));
await check("7. ID ổn định sau sửa", () => assert.equal(replaceSlide(outline, outline.slides[2].id, { ...outline.slides[2], title: "Mới" }).slides[2].id, outline.slides[2].id));
await check("8. Tạo lại không thay slide khác", () => { const d = replaceSlide(outline, outline.slides[3].id, { ...outline.slides[3], title: "Tạo lại" }); assert.equal(d.slides[2].title, outline.slides[2].title); });
await check("9. Có cảnh báo trước ghi đè sửa tay", () => assert.match(readFileSync("components/lesson-slides/LessonSlidesWorkspace.tsx", "utf8"), /Slide này đã được chỉnh sửa/));
await check("10. Phát hiện slide quá dày", () => assert.ok(densityWarnings({ ...outline.slides[2], blocks: [{ id: "b", type: "text", content: Array(100).fill("từ").join(" "), region: "main", alignment: "left" }] }).length));
await check("11. Giữ LaTeX", () => assert.equal(formula.type === "formula" && formula.latex, "U = I\\cdot R"));
await check("12. TikZ có export asset", () => assert.equal(validateDeckForExport(deck, "student").issues.some((i) => i.code === "broken_tikz"), false));
await check("13. Bảng đúng hàng cột", () => { assert.equal(table.type === "table" && table.rows.length, 3); assert.equal(table.type === "table" && table.headers.length, 2); });
await check("14. Ảnh giữ tỷ lệ", () => { const a = deck.assets.find((x) => x.id === "image-asset")!; assert.equal(a.width! / a.height!, 2); });
await check("15. Bản học sinh bỏ notes", () => assert.ok(deckForAudience(deck, "student").slides.every((s) => !s.teacherNotes)));
await check("16. Bản học sinh bỏ đáp án ẩn", () => assert.ok(deckForAudience(deck, "student").slides.flatMap((s) => s.blocks).every((b) => b.type !== "question" || !b.answer)));
await check("17. Bản giáo viên giữ đáp án", () => assert.ok(deckForAudience(deck, "teacher").slides.flatMap((s) => s.blocks).some((b) => b.type === "question" && b.answer === "Ω")));

const studentFile = await buildLessonSlidesPptx(deck, "student");
const teacherFile = await buildLessonSlidesPptx(deck, "teacher");
const studentZip = await JSZip.loadAsync(studentFile);
const teacherZip = await JSZip.loadAsync(teacherFile);
const presentationXml = await studentZip.file("ppt/presentation.xml")!.async("string");
const slideXmls = await Promise.all(Object.keys(studentZip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p)).map((p) => studentZip.file(p)!.async("string")));
await check("18. PPTX đúng 16:9", () => assert.match(presentationXml, /cx="12192000" cy="6858000"/));
await check("19. Text là đối tượng chỉnh sửa", () => assert.match(slideXmls.join(""), /<a:t>/));
await check("20. Giữ tiếng Việt", () => assert.match(slideXmls.join(""), /Định luật Ohm/));
await check("21. JSON lịch sử phục hồi đúng deck", () => { const restored = JSON.parse(JSON.stringify(deck)) as SlideDeck; assert.equal(restored.title, deck.title); assert.deepEqual(restored.slides.map((slide) => slide.id), deck.slides.map((slide) => slide.id)); assert.equal(restored.slides[3].blocks.length, deck.slides[3].blocks.length); });
await check("22. Giáo án prefill đúng", () => { const doc: GeneratedDocument = { id: "lp", title: "Giáo án", type: "lesson-plan", content: "", createdAt: "", generationMeta: { subject: "Vật lí", grade: "11", topic: "Ohm" } }; assert.deepEqual(settingsFromDocument(doc), { subject: "Vật lí", grade: "11", topic: "Ohm", purpose: "new_lesson" }); });
await check("23. Worksheet ánh xạ chữa bài", () => assert.equal(settingsFromDocument({ id: "w", title: "Phiếu", type: "worksheet", content: "", createdAt: "" }).purpose, "solution"));
await check("24. Tái dùng lời giải", () => assert.match(sourceFromDocument({ id: "s", title: "Lời giải", type: "answer-key", content: "Đáp án đã xác minh", createdAt: "" }).text, /xác minh/));
await check("25. API xác thực server", () => ["parse", "generate", "export"].forEach((name) => { const code = readFileSync(`app/api/lesson-slides/${name}/route.ts`, "utf8"); assert.match(code, /getCurrentUser/); assert.doesNotMatch(code, /body\.user_id|body\.ownerId/); }));
await check("26. Bảo trì chặn teacher", () => assert.equal(maintenanceAccessDecision({ pathname: "/tools/lesson-slides", enabled: true, authenticated: true, role: "teacher" }), "redirect"));
await check("27. Admin bypass", () => assert.equal(maintenanceAccessDecision({ pathname: "/tools/lesson-slides", enabled: true, authenticated: true, role: "admin" }), "allow"));
await check("28. Đọc lại PPTX nguồn", async () => { const parsed = await parseLessonSlideSource({ name: "bai.pptx", buffer: Buffer.from(studentFile) }); assert.equal(parsed.type, "existing_presentation"); assert.equal(parsed.extracted?.slideTitles?.length, deck.slides.length); });
await check("29. Nhân bản có ID mới và cache theo nguồn", () => { const copy = duplicateOutlineSlide(outline, outline.slides[2].id); assert.notEqual(copy.slides[2].id, copy.slides[3].id); assert.notEqual(slideCacheKey(outline.slides[2], "a"), slideCacheKey(outline.slides[2], "b")); });
await check("30. Không lộ bí mật; teacher có notes", async () => { const xml = await Promise.all(Object.keys(teacherZip.files).filter((p) => p.endsWith(".xml")).map((p) => teacherZip.file(p)!.async("string"))); assert.doesNotMatch(xml.join(""), /OPENAI_API_KEY|GEMINI_API_KEY|OPENAI_BASE_URL|providerRequested/); assert.ok(Object.keys(teacherZip.files).some((p) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(p))); });

assert.equal(passed, 30);
console.log(`\nĐã vượt qua ${passed}/30 kiểm thử slide bài giảng.`);
}

void main();
