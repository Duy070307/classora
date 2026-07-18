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

const questionBank = source("components/question-bank/QuestionBankWorkspace.tsx");
assert.match(questionBank, /aria-label=\{filterOpen \? "Bộ lọc câu hỏi"/);
assert.match(questionBank, /filterTriggerRef\.current\?\.focus/);
assert.match(questionBank, /document\.body\.style\.overflow = "hidden"/);

const actionMenu = source("components/question-bank/ActionMenu.tsx");
assert.match(actionMenu, /"ArrowDown", "ArrowUp", "Home", "End"/);
assert.match(actionMenu, /triggerRef\.current\?\.focus/);
assert.match(actionMenu, /max-h-\[min\(24rem,calc\(100dvh-6rem\)\)\]/);

const toolCenter = source("app/tools/page.tsx");
assert.match(toolCenter, /<select className="form-field" value=\{category\}/);
assert.match(toolCenter, /className="hidden flex-wrap gap-2 sm:flex"/);
assert.doesNotMatch(toolCenter, /flex gap-2 overflow-x-auto px-1/);

const toolCard = source("components/ToolCard.tsx");
assert.doesNotMatch(toolCard, /displayExample|displayTags/);
assert.match(toolCard, /min-h-\[210px\]/);

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
  assert.ok(index > previousIndex, `Dashboard thiếu hoặc sai thứ tự công cụ: ${title}`);
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

console.log("UI/UX regression checks passed: drawer focus, compact workflows, mobile filters and table/dialog safety.");
