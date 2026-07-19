import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateDiagramCompleteness } from "../lib/ai/diagram-completeness-validator";
import { generateStructuredDiagramTikz } from "../lib/ai/structured-diagram-tikz";
import { compareDiagramModels } from "../lib/tikz/comparison";
import { generateTikzFromDraft } from "../lib/tikz/generator";
import { createTikzDiagramDraft } from "../lib/tikz/model";
import { renderTikzDraftToSvg } from "../lib/tikz/render-svg";
import { validateTikzDraft } from "../lib/tikz/validation";

const fixture = JSON.parse(readFileSync("scripts/fixtures/circle-geometry-with-background.json", "utf8")) as Record<string, unknown>;
const recognitionSource = readFileSync("lib/ai/image-to-latex.ts", "utf8");
const reviewSource = readFileSync("components/tikz/TikzReviewWorkspace.tsx", "utf8");
assert.match(recognitionSource, /circle_geometry_with_background/);
assert.match(recognitionSource, /decorativeElements/);
assert.match(reviewSource, /Cần giáo viên rà soát/);
const draft = createTikzDiagramDraft({ sourceHash: "circle-background-fixture", sourceType: "description", rawStructure: fixture, tikzCode: "\\begin{tikzpicture}\n\\end{tikzpicture}" });
const generated = generateTikzFromDraft(draft);
draft.tikz = { ...draft.tikz, snippet: generated.snippet, generatedSnippet: generated.snippet, standalone: generated.standalone, libraries: generated.libraries, packages: generated.packages };
draft.validation = validateTikzDraft(draft);

assert.equal(draft.classification.type, "circle_geometry_with_background");
assert.equal(draft.objects.filter((item) => item.type === "circle").length, 1, "Phải giữ đúng một đường tròn chính");
assert.ok(draft.relationships.some((item) => item.type === "center_of"), "Phải lưu quan hệ tâm O với đường tròn");
assert.ok(draft.relationships.some((item) => item.type === "radius_of"), "Phải lưu quan hệ bán kính OA");
assert.ok(draft.relationships.some((item) => item.type === "diameter_of"), "Phải lưu quan hệ đường kính");
assert.ok(draft.objects.some((item) => item.label === "O") && draft.objects.some((item) => item.label === "A"), "Phải giữ nhãn O và A");
assert.ok(draft.objects.some((item) => item.type === "angle_marker" && item.label === "30°"), "Phải giữ nhãn góc 30°");
assert.equal(draft.objects.filter((item) => item.metadata?.type === "ferris_wheel_spokes").length, 0, "Không được biến nan trang trí thành đoạn hình học");
assert.match(generated.snippet, /\\draw(?:\[[^\]]*\])?\s*\([^)]+\)\s+circle\s*\(3\)/, "TikZ phải vẽ đường tròn chính");
assert.match(generated.snippet, /30\^\\circ/, "TikZ phải giữ góc 30°");
assert.match(renderTikzDraftToSvg(draft).svg, /<circle[^>]+r="[^4][^"]*"/, "SVG phải có đường tròn hình học, không chỉ có chấm điểm");
assert.equal(draft.validation.valid, true, draft.validation.warnings.join("; "));

const structured = generateStructuredDiagramTikz(fixture);
assert.ok(structured && structured.validation.status !== "invalid", "Pipeline cấu trúc phải tạo được bản TikZ có đường tròn");
assert.match(structured?.tikzCode || "", /circle\s*\(/);

const linesOnly = "\\begin{tikzpicture}\n\\draw (-3,0)--(3,0);\n\\draw (0,-3)--(0,3);\n\\node at (0,0) {$O$};\n\\end{tikzpicture}";
const incomplete = validateDiagramCompleteness("circle_geometry_with_background", fixture, linesOnly);
assert.equal(incomplete.status, "invalid");
assert.ok(incomplete.failureReasons.includes("missing_principal_circle") && incomplete.failureReasons.includes("lines_without_principal_circle"));

const renderedWithoutCircle = structuredClone(draft);
renderedWithoutCircle.objects = renderedWithoutCircle.objects.filter((item) => item.type !== "circle");
assert.equal(compareDiagramModels(draft, renderedWithoutCircle).status, "mismatch", "Thiếu đường tròn chính phải là sai khác chặn sử dụng");

const lowConfidence = createTikzDiagramDraft({ sourceHash: "circle-low-confidence", rawStructure: { ...fixture, confidence: 0.2 }, tikzCode: generated.snippet });
assert.equal(lowConfidence.validation.status, "unreliable", "Nhận diện tin cậy thấp phải yêu cầu giáo viên rà soát");
assert.ok(lowConfidence.validation.warnings.some((item) => item.includes("Cắt ảnh chỉ còn phần hình")), "Tin cậy thấp phải gợi ý cắt gọn ảnh");
console.log("Circular TikZ recognition: circle-first semantics, generation, comparison và low-confidence gate đều đạt.");
