import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function count(text: string, pattern: RegExp) {
  return text.match(pattern)?.length || 0;
}

const dashboard = source("app/dashboard/page.tsx");
const tools = source("app/tools/page.tsx");
const toolCard = source("components/ToolCard.tsx");
const icon = source("components/ui/SoanLabIcon.tsx");
const questionBank = source("components/question-bank/QuestionBankWorkspace.tsx");
const exam = source("app/tools/exam-generator/page.tsx");
const output = source("components/tools/ToolOutputPanel.tsx");
const blueprint = source("components/exam-blueprint/ExamBlueprintWorkspace.tsx");
const grading = source("components/grading/GradingAssistantWorkspace.tsx");
const stages = source("components/assessment/AssessmentWorkspace.tsx");
const sidebar = source("components/Sidebar.tsx");
const topbar = source("components/TopBar.tsx");
const globals = source("app/globals.css");

// Dashboard: flat introduction, clickable compact rows and no repeated marketing action.
assert.match(dashboard, /<section className="border-b border-slate-200 pb-6 pt-2">/);
assert.doesNotMatch(dashboard, /<section className="ui-panel p-5 sm:p-6">/);
assert.equal(count(dashboard, /Mở công cụ/g), 0);
assert.match(dashboard, /className="group flex min-h-28 gap-3 border-b/);
assert.match(dashboard, /focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/);
assert.equal(count(dashboard, /badge: "/g), 1);
assert.match(dashboard, /mt-3 border-y border-slate-200/);

// Tool Center: dense three-column list, mobile-safe controls and progressive favorite action.
assert.match(tools, /block sm:hidden/);
assert.match(tools, /flex-wrap gap-x-1 gap-y-2 sm:flex/);
assert.match(tools, /md:grid-cols-2 xl:grid-cols-3/);
assert.doesNotMatch(tools, /2xl:grid-cols-4/);
assert.match(tools, /badge=\{tool\.badge === "Beta" \? "Beta" : undefined\}/);
assert.doesNotMatch(toolCard, /ArrowRight/);
assert.doesNotMatch(toolCard, />Mở công cụ</);
assert.doesNotMatch(toolCard, /categoryLabel \?/);
assert.match(toolCard, /opacity-0[\s\S]*group-hover:opacity-100 group-focus-within:opacity-100/);
assert.match(toolCard, /aria-label=\{favorite \?/);
assert.match(icon, /plain = false/);

// Question Bank: one side rail, flat toolbar/list and compact loading/empty states.
assert.match(questionBank, /lg:border-r lg:border-slate-200 lg:bg-transparent lg:pr-4/);
assert.match(questionBank, /<section className="border-b border-slate-200 pb-4">/);
assert.match(questionBank, /<section className="pt-4">/);
assert.match(questionBank, /<section className="border-b border-slate-200 pb-3">/);
assert.match(questionBank, /role="status"/);
assert.doesNotMatch(questionBank, /rounded-\[24px\][^\n]*Đang tải ngân hàng câu hỏi/);
assert.match(questionBank, /group border-b border-slate-200 bg-white px-2 py-4/);
assert.match(questionBank, /filterOpen \? "fixed inset-y-0 left-0/);

// Exam Generator: flat tabs/settings split and a real document canvas empty state.
assert.match(exam, /grid w-full max-w-2xl grid-cols-2 border-b border-slate-200/);
assert.match(exam, /xl:border-y-0 xl:border-r xl:pr-5/);
assert.doesNotMatch(output, /SoanLabIllustration/);
assert.doesNotMatch(output, /SoanLabBadge/);
assert.match(output, /min-h-\[420px\] border border-slate-200 bg-white/);
assert.match(output, /Kết quả sẽ xuất hiện tại đây/);
assert.match(exam, /handleSubmit/);
assert.match(exam, /ToolOutputActions/);

// Blueprint: underline tabs and one summary list instead of metric cards.
assert.match(blueprint, /hidden grid-cols-4 border-b border-slate-200 md:grid/);
assert.match(blueprint, /aside className="space-y-4 xl:border-l xl:border-slate-200 xl:pl-4"/);
assert.match(blueprint, /divide-y divide-slate-100 border-y border-slate-100/);
assert.doesNotMatch(blueprint, /function Metric[\s\S]*rounded-xl bg-slate-50 p-3/);
assert.match(blueprint, /function Metric[\s\S]*items-center justify-between/);
assert.match(blueprint, /downloadBlueprintDocx/);

// Grading: connected header/stepper/stage, flat source tabs, calculations untouched.
assert.match(stages, /overflow-x-auto border-b border-slate-200 bg-white md:flex/);
assert.doesNotMatch(stages, /overflow-x-auto rounded-xl border border-slate-200/);
assert.equal(count(grading, /<section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">/g), 0);
assert.match(grading, /sourceMode === "history" \? "border-blue-600 text-blue-700"/);
assert.match(grading, /sourceMode === "paste" \? "border-blue-600 text-blue-700"/);
assert.match(grading, /classSummary\(job\)/);
assert.match(grading, /createGradingJob/);

// Shell: only genuine Beta markers remain; controls keep practical touch targets.
assert.equal(count(sidebar, /"Mới"/g), 0);
assert.equal(count(sidebar, /"Beta"/g), 3);
assert.match(sidebar, /border-l-2[\s\S]*border-blue-600 bg-blue-50 text-blue-800/);
assert.match(topbar, /min-h-11/);
assert.match(topbar, /className="btn-primary shrink-0/);
assert.match(globals, /body[\s\S]*overflow-x: hidden/);

console.log("Card-dashboard declutter checks passed: 50 source-level visual, accessibility and workflow assertions.");
