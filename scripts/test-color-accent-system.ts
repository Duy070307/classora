import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { accentForToolCategory, accentForToolHeader, toolAccentClasses } from "../lib/ui-accent";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const globals = source("app/globals.css");
const sidebar = source("components/Sidebar.tsx");
const dashboard = source("app/dashboard/page.tsx");
const toolCenter = source("app/tools/page.tsx");
const toolCard = source("components/ToolCard.tsx");
const toolHeader = source("components/tools/ToolPageHeader.tsx");
const tikzPage = source("app/tools/image-to-latex/page.tsx");
const lessonSlides = source("components/lesson-slides/LessonSlidesWorkspace.tsx");
const grading = source("components/grading/GradingAssistantWorkspace.tsx");
const examBlueprint = source("components/exam-blueprint/ExamBlueprintWorkspace.tsx");
const examAudit = source("components/exam-audit/ExamAuditWorkspace.tsx");
const badge = source("components/ui/SoanLabBadge.tsx");
const emptyState = source("components/ui/SoanLabEmptyState.tsx");
const landing = source("app/page.tsx");
const packageJson = source("package.json");

function relativeLuminance(hex: string) {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground: string, background: string) {
  const brighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (brighter + 0.05) / (darker + 0.05);
}

// 1. Primary CTA remains the blue brand hierarchy.
assert.match(globals, /\.btn-primary[\s\S]*bg-blue-600[\s\S]*hover:bg-blue-700[\s\S]*active:bg-blue-800/);
assert.doesNotMatch(globals.match(/\.btn-primary[\s\S]*?\n\}/)?.[0] || "", /cyan|violet|amber|rose|green|red/);

// 2. Active navigation remains blue; only Beta receives a cyan badge.
assert.match(sidebar, /selected \? "border-blue-600 bg-blue-50 text-blue-800"/);
assert.match(sidebar, /border-cyan-200 bg-cyan-50[\s\S]*text-cyan-800/);

// 3-6. Tool families resolve deterministically without changing the primary CTA.
assert.equal(accentForToolCategory("formula-latex"), "cyan");
assert.equal(accentForToolHeader("Hình học → TikZ"), "cyan");
assert.equal(accentForToolHeader("Giáo án"), "violet");
assert.equal(accentForToolCategory("exam-assessment", "/tools/exam-generator"), "amber");
assert.equal(accentForToolCategory("exam-assessment", "/tools/grading-assistant"), "rose");
assert.match(tikzPage, /border-l-cyan-600 bg-cyan-50\/40/);
assert.match(lessonSlides, /accent="violet"/);
assert.match(examBlueprint, /data-tool-accent="amber"/);
assert.match(examAudit, /data-tool-accent="amber"/);
assert.match(grading, /data-tool-accent="rose"/);

// 7. Green is not a decorative family accent; it remains a named success semantic.
assert.doesNotMatch(JSON.stringify(toolAccentClasses), /green|emerald/);
assert.match(globals, /--semantic-success: #16a34a/);
assert.match(globals, /--semantic-success-soft: #f0fdf4/);

// 8. Red stays outside the family accent palette and existing invalid states remain explicit.
assert.doesNotMatch(JSON.stringify(toolAccentClasses), /red/);
assert.match(lessonSlides, /bg-red-50[\s\S]*text-red-800/);

// 9. No rainbow or family-colored gradient is introduced in the refined surfaces.
for (const item of [landing, dashboard, toolCenter, toolCard, toolHeader, tikzPage, lessonSlides, grading, examBlueprint, examAudit]) {
  assert.doesNotMatch(item, /bg-gradient|from-(cyan|violet|amber|rose|green).*to-/);
}

// 10. Responsive primitives prevent page-level overflow and card grids remain mobile-first.
assert.match(globals, /body[\s\S]*overflow-x: hidden/);
assert.match(toolCenter, /grid gap-0 md:grid-cols-2[\s\S]*xl:grid-cols-3/);
assert.match(toolCard, /min-w-0/);

// 11. Category grouping uses a single accent marker, not a badge on every card.
assert.match(toolCenter, /data-category-accent=\{tone\}/);
assert.match(toolCenter, /h-6 w-1 rounded-full/);
assert.doesNotMatch(toolCard, /categoryLabel/);

// 12. Beta is cyan, New remains blue, and functional regression suites stay wired.
assert.match(badge, /beta: "border-cyan-200 bg-cyan-50 text-cyan-800"/);
assert.match(badge, /new: "border-blue-100 bg-blue-50 text-blue-800"/);
for (const command of ["security:test", "maintenance:test", "tikz:workflow-test", "export:reliability-test", "ui:accent-test"]) {
  assert.match(packageJson, new RegExp(`npm run ${command}`));
}

// 13. Family labels retain WCAG AA contrast on their pale surfaces.
for (const [foreground, background] of [
  ["#1e40af", "#eff6ff"],
  ["#155e75", "#ecfeff"],
  ["#5b21b6", "#f5f3ff"],
  ["#92400e", "#fffbeb"],
  ["#9f1239", "#fff1f2"],
]) {
  assert.ok(contrastRatio(foreground, background) >= 4.5, `${foreground} on ${background} must meet WCAG AA`);
}

// 14. Empty states stay compact and avoid decorative gradients or large illustrations.
assert.match(emptyState, /<Inbox/);
assert.match(emptyState, /rounded-xl border border-slate-200 bg-white/);
assert.doesNotMatch(emptyState, /SoanLabIllustration|bg-gradient|shadow-/);

console.log("Color accent system checks passed: blue hierarchy, semantic accents, badges, responsive layout and regression wiring are covered.");
