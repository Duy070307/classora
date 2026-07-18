import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const shared = source("components/assessment/AssessmentWorkspace.tsx");
const auditor = source("components/exam-audit/ExamAuditWorkspace.tsx");
const solutions = source(
  "components/answer-solutions/AnswerSolutionsWorkspace.tsx",
);
const mixer = source("components/exam-mixer/ExamMixerWorkspace.tsx");
const answerSheet = source("components/answer-sheet/AnswerSheetWorkspace.tsx");
const grading = source("components/grading/GradingAssistantWorkspace.tsx");
const globals = source("app/globals.css");
const packageJson = source("package.json");

// 1. Auditor filters remain available.
for (const filter of ["all", "error", "warning", "fixed"]) {
  assert.match(auditor, new RegExp(`\\["${filter}"`));
}
// 2. Warnings use review status and do not become a blocking state.
assert.match(auditor, /readiness === "review"[\s\S]*"review"/);
assert.match(auditor, /"Cần giáo viên xác nhận"/);
// 3. Safe fixes still show current/proposed content before confirmation.
assert.match(auditor, /change\.current/);
assert.match(auditor, /change\.proposed/);
assert.match(auditor, /onClick=\{confirmFixes\}/);

// 4. Solutions switch between the five review/document views.
for (const view of ["overview", "student", "quick", "detailed", "scoring"]) {
  assert.match(solutions, new RegExp(`\\["${view}"`));
}
// 5. Student preview uses the untouched source document.
assert.match(
  solutions,
  /view === "student" \? <OutputPreview document=\{source\}/,
);
// 6. Mixer advanced options are collapsed by default.
assert.match(mixer, /title="Cấu hình nâng cao"/);
assert.match(mixer, /advancedMixingOptions/);
// 7. Mixer previews one selected code at a time.
assert.match(mixer, /activeCode/);
assert.match(mixer, /activeVariant \? \(/);
// 8. Mixer has one primary whole-set export action.
assert.equal(
  (mixer.match(/onClick=\{\(\) => void exportAll\(\)\}/g) || []).length,
  1,
);
// 9. Answer sheet previews one selected template/page.
assert.match(answerSheet, /templates\[activeTemplate\]/);
assert.match(answerSheet, /layout\?\.pages\[activePage\]/);
// 10. Invalid grading stages are blocked and explained.
assert.match(grading, /canOpenStage/);
assert.match(grading, /stageDisabledReason/);
// 11. Grading includes a dedicated review queue.
assert.match(grading, /Hàng đợi rà soát/);
assert.match(grading, /reviewQueueFilter/);
// 12. Submission selection remains usable on 390 px screens.
assert.match(grading, /grading-submission-select/);
assert.match(grading, /md:hidden/);
// 13. Export actions remain grouped by compatible workflow.
assert.match(mixer, /label="Xuất riêng"/);
assert.match(grading, /label="Xuất kết quả"/);
// 14. Page overflow is prevented while wide tables scroll internally.
assert.match(globals, /body[\s\S]*overflow-x: hidden/);
assert.match(grading, /ui-table-wrap/);
// 15. Review drawers trap focus, close on Escape and restore trigger focus.
assert.match(shared, /event\.key === "Escape"/);
assert.match(shared, /event\.key !== "Tab"/);
assert.match(shared, /reviewTrigger\?\.focus/);
// 16. Unsaved solution edits retain the browser-leave confirmation.
assert.match(shared, /beforeunload/);
assert.match(solutions, /useUnsavedAssessmentWarning\(hasUnsavedChanges\)/);
// 17. Answer mapping implementation is not replaced by UI code.
assert.match(mixer, /variantAnswerRows\(set\)/);
assert.match(solutions, /applySolutionAnswerToDocument/);
// 18. Grading calculation entry points remain wired.
assert.match(grading, /regradeJob/);
assert.match(grading, /overrideQuestionScore/);
// 19. Existing assessment exports remain wired.
for (const exportEntry of [
  "exportVariantSetZip",
  "downloadAnswerSheetPdf",
  "exportGradingXlsx",
  "exportSolutionZip",
]) {
  assert.ok(
    `${mixer}${answerSheet}${grading}${solutions}`.includes(exportEntry),
    `Thiếu entry point xuất file ${exportEntry}`,
  );
}
// 20. Maintenance suite remains part of the full regression command.
assert.match(packageJson, /npm run maintenance:test/);

assert.match(shared, /data-assessment-workspace/);
assert.match(answerSheet, /AssessmentStageNavigation/);
assert.match(auditor, /AssessmentWorkspace/);

console.log(
  "Assessment UI regression checks passed: 20 workflow, responsive, accessibility and export-wiring checks.",
);
