import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTikzDiagramDraft, normalizeLegacyTikzDraft } from "../lib/tikz/model";
import { preprocessDiagramImage, clearPreprocessCacheForTests } from "../lib/tikz/preprocess";
import { renderTikzDraftToSvg } from "../lib/tikz/render-svg";
import { generateTikzFromDraft } from "../lib/tikz/generator";
import { inspectTikzSafety } from "../lib/tikz/safety";
import { runTikzQaFixture, type TikzQaFixture } from "../lib/tikz/qa-harness";

let passed = 0;
async function check(name: string, task: () => void | Promise<void>) { await task(); passed += 1; console.log(`✓ ${passed}. ${name}`); }

const raw = {
  diagramType: "solid_geometry", figureType: "pyramid", confidence: 0.92,
  points: [{ label: "A", coordinate: [-3, 0] }, { label: "B", coordinate: [3, 0] }, { label: "C", coordinate: [2, 1.5] }, { label: "D", coordinate: [-2, 1.5] }, { label: "S", coordinate: [0, 4] }],
  solidEdges: [["A", "B"], ["B", "C"], ["C", "D"], ["S", "A"], ["S", "B"], ["S", "C"]],
  dashedEdges: [["D", "A"], ["S", "D"]],
};

async function main() {
  const draft = createTikzDiagramDraft({ sourceHash: "source-hash", sourceName: "hinh-chop.png", width: 900, height: 700, rawStructure: raw, tikzCode: "\\begin{tikzpicture}\n\\end{tikzpicture}" });
  const generated = generateTikzFromDraft(draft); draft.tikz = { ...draft.tikz, snippet: generated.snippet, generatedSnippet: generated.snippet, standalone: generated.standalone, libraries: generated.libraries, packages: generated.packages };
  draft.source.localDataUrl = "data:image/png;base64,cHJpdmF0ZQ=="; draft.source.sourceAvailable = true;

  await check("Canonical draft survives JSON History round-trip", () => { const restored = normalizeLegacyTikzDraft(JSON.parse(JSON.stringify(draft))); assert.equal(restored.source.localDataUrl, draft.source.localDataUrl); assert.equal(restored.objects.length, draft.objects.length); assert.equal(restored.relationships.length, draft.relationships.length); });
  await check("Legacy TikZ without source remains readable", () => { const old = normalizeLegacyTikzDraft({ content: generated.snippet, title: "Bản cũ" }); assert.equal(old.source.sourceAvailable, false); assert.match(old.tikz.snippet, /tikzpicture/); });
  await check("Private storage migration creates non-public bucket", () => { const sql = readFileSync("supabase/migrations/20260718_add_private_tikz_assets.sql", "utf8"); assert.match(sql, /tikz-assets/); assert.match(sql, /false/); assert.match(sql, /auth\.uid\(\)::text/); });
  await check("Asset route derives owner path server-side", () => { const source = readFileSync("app/api/tikz/assets/route.ts", "utf8"); assert.match(source, /getCurrentUser/); assert.match(source, /function objectPath\(userId: string, assetId: string/); assert.match(source, /objectPath\(context\.user\.id, assetId/); assert.doesNotMatch(source, /body\.ownerId|body\.user_id|storageObjectPath/); });
  await check("Asset deletion performs document reference check without client bypass", () => { const source = readFileSync("app/api/tikz/assets/route.ts", "utf8"); assert.match(source, /containsAssetId\(row\.metadata, assetId\)/); assert.doesNotMatch(source, /excludingDocumentId/); assert.match(source, /referenced:\s*true/); });
  await check("Asset creation is maintenance guarded", () => assert.match(readFileSync("app/api/tikz/assets/route.ts", "utf8"), /getMaintenanceBlockForUser/));
  await check("Confirmed private assets remain readable during maintenance", () => { const source = readFileSync("app/api/tikz/assets/route.ts", "utf8"); assert.match(source, /export async function GET[\s\S]*authenticatedContext\(false\)/); });
  await check("Compiler endpoint is authenticated and maintenance guarded", () => { const source = readFileSync("app/api/tikz/compiler/route.ts", "utf8"); assert.match(source, /getCurrentUser/); assert.match(source, /getMaintenanceBlockForUser/); });
  await check("Compiler uses fixed executable allowlist and no shell", () => { const source = readFileSync("lib/tikz/compiler.ts", "utf8"); assert.match(source, /pdflatex/); assert.match(source, /lualatex/); assert.match(source, /xelatex/); assert.match(source, /shell:\s*false/); assert.match(source, /no-shell-escape/); assert.doesNotMatch(source, /exec\s*\(/); });
  await check("Compiler verifies a real PDF signature", () => { const source = readFileSync("lib/tikz/compiler.ts", "utf8"); assert.match(source, /%PDF-/); assert.match(source, /verifiedOutput/); });
  await check("Unsafe TeX commands are blocked with command boundaries", () => { for (const code of ["\\write18{whoami}", "\\input{../secret}", "\\catcode`\\@=11", "https://example.com/a.png"]) assert.equal(inspectTikzSafety(code).safe, false); assert.equal(inspectTikzSafety("\\draw (0,0)--(1,1); \\node at (0,0) {A};").safe, true); });
  await check("Semantic SVG is standalone and has no external resource", () => { const output = renderTikzDraftToSvg(draft); assert.equal(output.valid, true); assert.match(output.svg, /^<svg/); assert.doesNotMatch(output.svg, /(?:href|src)\s*=\s*["'](?:https?:|file:|\/\/)|<script|foreignObject/i); });
  await check("Semantic SVG preserves Vietnamese labels and dashed edges", () => { const copy = structuredClone(draft); copy.objects.find((item) => item.label === "S")!.label = "Đỉnh S"; const svg = renderTikzDraftToSvg(copy).svg; assert.match(svg, /Đỉnh S/); assert.match(svg, /stroke-dasharray/); });

  const rotated = readFileSync("tests/fixtures/document-recognition/02-rotated-page.png");
  await check("Preprocessing settings are reversible and cache-keyed", async () => { clearPreprocessCacheForTests(); const original = await preprocessDiagramImage(rotated, { useOriginal: true }); const changed = await preprocessDiagramImage(rotated, { rotation: 90, deskew: true, thresholdMode: "adaptive" }); assert.equal(original.sourceHash, changed.sourceHash); assert.notEqual(original.settingsHash, changed.settingsHash); assert.notEqual(original.base64, changed.base64); });
  await check("Perspective setting preserves original source hash", async () => { const source = readFileSync("tests/fixtures/document-recognition/03-perspective-photo.png"); const before = await preprocessDiagramImage(source, { useOriginal: true }); const after = await preprocessDiagramImage(source, { perspectiveCorrection: true, lineEnhancement: true }); assert.equal(before.sourceHash, after.sourceHash); assert.ok(after.warnings.length > 0); });

  const manifest = JSON.parse(readFileSync("tests/fixtures/tikz/manifest.json", "utf8")) as TikzQaFixture[];
  for (const fixture of manifest) {
    await check(`QA fixture ${fixture.id} produces semantic SVG and TikZ`, async () => { const result = await runTikzQaFixture(fixture); assert.equal(result.classification, fixture.expectedClassification); assert.equal(result.svgValid, true); assert.match(result.tikz, /tikzpicture/); fixture.requiredObjects.forEach((type) => assert.ok(result.objectTypes.includes(type))); fixture.requiredRelationships.forEach((type) => assert.ok(result.relationshipTypes.includes(type))); assert.deepEqual(result.duplicateLabels.filter((label) => fixture.forbiddenDuplicateLabels?.includes(label)), []); });
  }
  await check("Debug package endpoint is admin-only and sanitized", () => { const source = readFileSync("app/api/tikz/debug/route.ts", "utf8"); assert.match(source, /user\.role !== "admin"/); assert.doesNotMatch(source, /OPENAI_API_KEY|GEMINI_API_KEY|storageObjectPath|rawPrompt/); });
  assert.equal(passed, 18);
  console.log(`TikZ persistence/production: ${passed}/18 checks passed.`);
}

void main();
