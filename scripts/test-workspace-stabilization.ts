import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeTikzSnippetRecord, normalizeTikzSnippetRecords } from "../lib/tikz-bank";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const tools = source("app/tools/page.tsx");
assert.match(tools, /Lọc &amp; sắp xếp/);
assert.match(tools, /hasActiveFilters \? <button[^>]+onClick=\{clear\}/);
assert.match(tools, /displayCategoryRegistry/);
assert.doesNotMatch(tools, /mt-2 flex flex-wrap items-center gap-1 border-t/);
assert.doesNotMatch(tools, /min-h-screen|min-h-\[\d+px\].*filter/i);

// Ô tìm kiếm Tool Center chỉ có một icon, chừa đủ khoảng trái và giữ nguyên hành vi.
assert.equal(tools.match(/<Search\b/g)?.length, 1);
assert.match(tools, /pointer-events-none absolute left-3\.5 top-1\/2 -translate-y-1\/2[^"]*"\s*size=\{16\}/);
assert.match(tools, /className="form-field h-12 !pl-11"/);
assert.match(tools, /aria-label="Tìm công cụ"/);
assert.match(tools, /placeholder="Tìm: đề, kiểm tra, giáo án, LaTeX, hình học\.\.\."/);
assert.match(tools, /value=\{query\}\s*onChange=\{\(e\) => setQuery\(e\.target\.value\)\}/);

const globals = source("app/globals.css");
const blueprint = source("components/exam-blueprint/ExamBlueprintWorkspace.tsx");
assert.match(globals, /--app-topbar-height: 4rem/);
assert.match(globals, /\.app-sticky-summary[\s\S]*top: calc\(var\(--app-topbar-height\) \+ 1rem\)/);
assert.match(globals, /max-height: calc\(100dvh - var\(--app-topbar-height\) - 2rem\)/);
assert.match(blueprint, /className="app-sticky-summary/);
assert.doesNotMatch(blueprint, /sticky top-20/);

const navigation = source("components/tools/WorkflowNavigation.tsx");
assert.match(navigation, /aria-current=\{active \? "step"/);
assert.match(navigation, /role="tablist"/);
assert.match(navigation, /"ArrowLeft", "ArrowRight", "Home", "End"/);
for (const path of [
  "components/worksheet/WorksheetWorkspace.tsx",
  "components/lesson-plan/LessonPlanWorkspace.tsx",
  "components/review-pack/ReviewPackWorkspace.tsx",
  "components/rubric/RubricWorkspace.tsx",
  "components/lesson-slides/LessonSlidesWorkspace.tsx",
]) {
  const workspace = source(path);
  assert.match(workspace, /WorkflowStageNavigation/);
  assert.match(workspace, /SourceModeTabs/);
  assert.doesNotMatch(workspace, /function Step\(\{ active, label \}/);
}
assert.match(source("app/tools/image-to-latex/page.tsx"), /SourceModeTabs/);
assert.match(source("components/tikz/TikzReviewWorkspace.tsx"), /SourceModeTabs/);

const current = normalizeTikzSnippetRecord({
  id: "current-1",
  bank_scope: "system",
  title: "Tam giác ABC",
  tikz_code: "\\begin{tikzpicture}\\draw (0,0)--(1,0);\\end{tikzpicture}",
  metadata: { ownerEmail: "private@example.com" },
});
assert.equal(current?.bank_scope, "system");
assert.equal(current?.user_id, null);
assert.deepEqual(current?.metadata, {});

const legacy = normalizeTikzSnippetRecord({
  id: "legacy-1",
  bankScope: "user",
  ownerId: "teacher-1",
  name: "Đường tròn",
  tikzCode: "\\begin{tikzpicture}\\draw (0,0) circle (1);\\end{tikzpicture}",
  fullLatex: "\\documentclass{standalone}",
  needsReview: false,
});
assert.equal(legacy?.title, "Đường tròn");
assert.equal(legacy?.user_id, "teacher-1");
assert.equal(legacy?.needs_review, false);
assert.equal(normalizeTikzSnippetRecords([legacy, { id: "bad" }]).rejected, 1);

const bankPage = source("app/tikz-bank/page.tsx");
assert.match(bankPage, /const \[loadError, setLoadError\]/);
assert.match(bankPage, /loading && snippets\.length === 0/);
assert.match(bankPage, /!loading && loadError && snippets\.length === 0 \? null/);
assert.match(bankPage, /!loading && !loadError \? <div className="empty-state/);
assert.match(bankPage, /Dữ liệu đã tải trước đó vẫn được giữ nguyên/);
assert.match(bankPage, /Thử lại<\/button>/);

const bankApi = source("app/api/tikz-bank/route.ts");
assert.match(bankApi, /select\("\*"\)/);
assert.match(bankApi, /eq\("bank_scope", "user"\)\.eq\("user_id", user\.id\)/);
assert.match(bankApi, /normalizeTikzSnippetRecords/);
assert.doesNotMatch(bankApi, /body\.user_id|request\.nextUrl\.searchParams\.get\("user/);

console.log("Workspace stabilization checks passed: compact Tool Center, safe sticky summary, shared workflow UI and exclusive TikZ Bank data states.");
