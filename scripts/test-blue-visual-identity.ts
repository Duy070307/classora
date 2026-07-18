import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const globals = source("app/globals.css");
const sidebar = source("components/Sidebar.tsx");
const topbar = source("components/TopBar.tsx");
const toolHeader = source("components/tools/ToolPageHeader.tsx");
const dashboard = source("app/dashboard/page.tsx");
const toolCenter = source("app/tools/page.tsx");
const toolCard = source("components/ToolCard.tsx");
const picker = source("components/assessment/AssessmentSourcePicker.tsx");
const stages = source("components/assessment/AssessmentWorkspace.tsx");
const tikzUpload = source("components/tikz/TikzUploadState.tsx");
const tikzPage = source("app/tools/image-to-latex/page.tsx");
const questionBank = source("components/question-bank/QuestionBankWorkspace.tsx");
const history = source("components/HistoryList.tsx");
const packageJson = source("package.json");

const sharedBrandSources = [
  globals,
  sidebar,
  topbar,
  toolHeader,
  dashboard,
  toolCenter,
  toolCard,
  picker,
  tikzUpload,
  source("components/DashboardOnboarding.tsx"),
  source("components/CommandPalette.tsx"),
  source("components/PageHeader.tsx"),
  source("components/ui/SoanLabBadge.tsx"),
  source("components/ui/SoanLabIcon.tsx"),
];

const priorityWorkspaces = [
  source("components/exam-audit/ExamAuditWorkspace.tsx"),
  source("components/answer-solutions/AnswerSolutionsWorkspace.tsx"),
  source("components/exam-mixer/ExamMixerWorkspace.tsx"),
  source("components/answer-sheet/AnswerSheetWorkspace.tsx"),
  source("components/grading/GradingAssistantWorkspace.tsx"),
  tikzPage,
];

// 1-2. Token thương hiệu chính dùng xanh dương nhất quán.
assert.match(globals, /--brand: #2563eb/);
assert.match(globals, /--brand-strong: #1d4ed8/);
// 3. CTA chính có đủ trạng thái tương tác và không dùng gradient.
assert.match(globals, /\.btn-primary[\s\S]*bg-blue-600[\s\S]*hover:bg-blue-700[\s\S]*active:bg-blue-800/);
// 4. Focus ring có độ tương phản xanh dương.
assert.match(globals, /:focus-visible[\s\S]*rgba\(37, 99, 235, 0\.3\)/);
// 5. Input có hover/focus rõ và chiều cao chạm tối thiểu 44px.
assert.match(globals, /\.form-field[\s\S]*min-h-11[\s\S]*focus:border-blue-500/);
// 6. Shared UI không còn màu thương hiệu emerald/teal/indigo/purple/violet/cyan/sky.
for (const item of sharedBrandSources) {
  assert.doesNotMatch(item, /emerald|teal|indigo|purple|violet|cyan|sky/);
}
// 7. Xanh lá vẫn được giữ cho trạng thái hoàn thành có nghĩa.
assert.match(stages, /stage\.completed \? "bg-emerald-100 text-emerald-800"/);
// 8-9. Dashboard và Tool Center dùng selection/CTA xanh dương.
assert.match(dashboard, /hover:border-blue-300/);
assert.match(toolCenter, /category === item \? "bg-blue-600 text-white"/);
// 10. Tool card có focus rõ, radius tiết chế và không còn CTA xanh lá.
assert.match(toolCard, /rounded-xl[\s\S]*focus-within:ring-blue-100/);
assert.doesNotMatch(toolCard, /emerald/);
// 11. Bộ chọn nguồn assessment giữ lưới responsive và selected state xanh dương.
assert.match(picker, /grid grid-cols-1 gap-3/);
assert.match(picker, /border-blue-300 bg-blue-50/);
// 12. Stepper có active xanh dương nhưng completed vẫn là success xanh lá.
assert.match(stages, /bg-blue-600 text-white/);
assert.match(stages, /bg-emerald-50 text-emerald-800/);
// 13. Header công cụ là dải nội dung gọn, không còn card nổi có rail xanh lá.
assert.match(toolHeader, /border-b border-slate-200 bg-white/);
assert.doesNotMatch(toolHeader, /ui-panel|border-l-emerald/);
// 14. TikZ upload-first dùng một CTA chính xanh dương và không dùng màu brand cũ.
assert.match(tikzUpload, /border-blue-300 bg-blue-50\/40/);
assert.match(tikzUpload, /className="btn-primary mt-5"/);
// 15. Sáu workspace ưu tiên không còn indigo/purple/teal/violet hay radius tùy ý 28px.
for (const item of priorityWorkspaces) {
  assert.doesNotMatch(item, /indigo|purple|teal|violet|rounded-\[28px\]/);
}
// 16. Question Bank dùng xanh dương cho collection, filter và selection.
assert.match(questionBank, /bg-blue-50 text-blue-900/);
assert.match(questionBank, /border-blue-400 ring-2 ring-blue-100/);
// 17. History dùng xanh dương cho selection nhưng vẫn có badge trạng thái verified xanh lá.
assert.match(history, /border-blue-400 bg-blue-50\/50 ring-2 ring-blue-100/);
assert.match(history, /verificationStatus === "verified" \? "bg-emerald-100/);
// 18. Không tràn trang; bảng rộng cuộn trong vùng riêng.
assert.match(globals, /body[\s\S]*overflow-x: hidden/);
assert.match(globals, /\.ui-table-wrap[\s\S]*overflow-x-auto/);
// 19. Drawer/dialog có giới hạn theo viewport và primitive card dùng radius thống nhất.
assert.match(globals, /\.ui-dialog[\s\S]*max-h-\[calc\(100dvh-2rem\)\]/);
assert.match(globals, /\.ui-panel[\s\S]*rounded-xl/);
// 20. Các suite chức năng trọng yếu vẫn nằm trong lệnh regression đầy đủ.
for (const command of [
  "export:reliability-test",
  "security:test",
  "maintenance:test",
  "tikz:workflow-test",
  "assessment:production-ui-test",
]) {
  assert.match(packageJson, new RegExp(`npm run ${command}`));
}

console.log("Blue visual identity checks passed: 20 design-system, semantic color, responsive and workflow assertions.");
