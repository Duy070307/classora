import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const sidebar = source("components/Sidebar.tsx");
assert.match(sidebar, /document\.body\.style\.overflow = "hidden"/);
assert.match(sidebar, /event\.key === "Escape"/);
assert.match(sidebar, /event\.key !== "Tab"/);
assert.match(sidebar, /aria-modal=\{mobileOpen \? "true"/);

const questionBank = source(
  "components/question-bank/QuestionBankWorkspace.tsx",
);
assert.match(questionBank, /aria-label=\{filterOpen \? "Bộ lọc câu hỏi"/);
assert.match(questionBank, /filterTriggerRef\.current\?\.focus/);
assert.match(questionBank, /document\.body\.style\.overflow = "hidden"/);

const actionMenu = source("components/question-bank/ActionMenu.tsx");
assert.match(actionMenu, /"ArrowDown", "ArrowUp", "Home", "End"/);
assert.match(actionMenu, /triggerRef\.current\?\.focus/);
assert.match(actionMenu, /max-h-\[min\(24rem,calc\(100dvh-6rem\)\)\]/);

const toolCenter = source("app/tools/page.tsx");
assert.match(toolCenter, /<select className="form-field" value=\{category\}/);
assert.match(toolCenter, /Lọc &amp; sắp xếp/);
assert.match(toolCenter, /displayCategoryRegistry/);
assert.doesNotMatch(toolCenter, /flex gap-2 overflow-x-auto px-1/);

const toolCard = source("components/ToolCard.tsx");
assert.doesNotMatch(toolCard, /displayExample|displayTags/);
assert.match(toolCard, /min-h-\[132px\]/);

const dashboard = source("app/dashboard/page.tsx");
const coreTools = [
  "Tạo đề kiểm tra",
  "Ma trận & bảng đặc tả",
  "Ngân hàng câu hỏi",
  "Giáo án",
  "Phiếu học tập",
  "Hình học → TikZ",
];
let previousIndex = -1;
for (const title of coreTools) {
  const index = dashboard.indexOf(`title: "${title}"`);
  assert.ok(
    index > previousIndex,
    `Dashboard thiếu hoặc sai thứ tự công cụ: ${title}`,
  );
  previousIndex = index;
}
assert.doesNotMatch(dashboard, /placeholder="Tìm nhanh:/);

const history = source("components/HistoryList.tsx");
assert.match(history, /\{selected\.length \? <section className="sticky/);
assert.match(history, /label="Xuất đã chọn"/);

const examGenerator = source("app/tools/exam-generator/page.tsx");
assert.doesNotMatch(examGenerator, /Điền thử mẫu nhanh|function useSampleData/);

const globalStyles = source("app/globals.css");
assert.match(globalStyles, /max-h-\[calc\(100dvh-2rem\)\]/);
assert.match(globalStyles, /\.ui-table th[\s\S]*@apply sticky top-0/);

const authoring = source("components/authoring/AuthoringWorkspace.tsx");
assert.match(authoring, /2xl:hidden/);
assert.match(authoring, /role="tablist"/);
assert.match(authoring, /view === "inspector"/);
assert.match(authoring, /2xl:grid-cols-\[260px_minmax\(0,1fr\)_360px\]/);

const lessonPlan = source("components/lesson-plan/LessonPlanWorkspace.tsx");
const worksheet = source("components/worksheet/WorksheetWorkspace.tsx");
const worksheetContent = source(
  "components/worksheet/ActivityContentEditor.tsx",
);
const recognition = source(
  "components/document-recognition/DocumentRecognitionWorkspace.tsx",
);
const reviewPack = source("components/review-pack/ReviewPackWorkspace.tsx");
const rubric = source("components/rubric/RubricWorkspace.tsx");
const blueprint = source(
  "components/exam-blueprint/ExamBlueprintWorkspace.tsx",
);
const exportMenu = source("components/tools/DocumentExportMenu.tsx");

// 1. Inspector/navigator collapse to one selected view below 2xl.
for (const workspace of [
  lessonPlan,
  worksheet,
  recognition,
  reviewPack,
  rubric,
]) {
  assert.match(workspace, /<AuthoringWorkspace/);
}

// 2–4. Worksheet controls are type-aware, differentiation is single-view and preview audience is explicit.
assert.match(worksheetContent, /const showsOptions/);
assert.match(worksheetContent, /const showsPairs/);
assert.match(worksheetContent, /showsOptions \?/);
assert.match(worksheetContent, /activeLevel/);
assert.match(worksheetContent, /aria-label="Mức phân hóa"/);
assert.match(worksheet, /worksheetToText\(worksheet, previewAudience\)/);
assert.match(worksheet, /Bản học sinh không hiển thị đáp án/);

// 5–8. Recognition review queue and block-specific progressive disclosure remain present.
assert.match(recognition, /const reviewQueue = useMemo/);
assert.match(recognition, /!block\.reviewed \|\| block\.confidence !== "high"/);
assert.match(recognition, /block\.type === "formula"/);
assert.match(recognition, /block\.type === "table" && block\.table/);
assert.match(recognition, /block\.warnings\.slice\(0, 2\)/);

// 9–10. Exports and regeneration use compact menus instead of duplicate button rows.
assert.match(exportMenu, /<ActionMenu/);
assert.match(exportMenu, /label=\{exporting \? "Đang xuất…" : "Xuất"\}/);
for (const workspace of [lessonPlan, worksheet, reviewPack, rubric]) {
  assert.match(workspace, /label="Tạo lại"/);
}

// 11. Follow-up actions are gated by the completed editor/final-document state.
assert.match(worksheet, /stage === "editor" \?/);
assert.match(reviewPack, /stage === "editor" \?/);
assert.match(recognition, /finalDocument \?/);

// 12. Narrow layouts use one panel at a time and wide content scrolls internally.
assert.match(authoring, /view === value/);
assert.match(globalStyles, /body[\s\S]*overflow-x: hidden/);
for (const workspace of [lessonPlan, rubric, blueprint]) {
  assert.match(workspace, /ui-table-wrap/);
}

// 13–14. Edited-content confirmations and existing autosave markers remain intact.
assert.match(lessonPlan, /window\.confirm/);
assert.match(worksheet, /window\.confirm/);
assert.match(rubric, /window\.confirm/);
assert.match(worksheet, /savedOnce/);
assert.match(rubric, /savedOnce/);

// 15. Existing generation/export entry points are still wired; focused workflow suites execute separately.
assert.match(lessonPlan, /downloadLessonPlanDocx/);
assert.match(worksheet, /downloadWorksheetDocx/);
assert.match(reviewPack, /downloadReviewPackDocx/);
assert.match(rubric, /downloadRubricDocx/);
assert.match(blueprint, /downloadBlueprintDocx/);

console.log(
  "UI/UX regression checks passed: shared authoring views, contextual actions, recognition review, responsive tables and workflow wiring.",
);
