import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  "app/page.tsx",
  "app/dashboard/page.tsx",
  "app/tools/page.tsx",
  "app/tools/3d-animation/page.tsx",
  "app/tools/lesson-slides/page.tsx",
  "app/tools/grading-assistant/page.tsx",
  "app/api/grading/recognize/route.ts",
  "app/api/grading/semantic/route.ts",
  "components/grading/GradingAssistantWorkspace.tsx",
  "lib/grading/engine.ts",
  "app/api/lesson-slides/parse/route.ts",
  "app/api/lesson-slides/generate/route.ts",
  "app/api/lesson-slides/export/route.ts",
  "components/lesson-slides/LessonSlidesWorkspace.tsx",
  "lib/lesson-slides/types.ts",
  "lib/lesson-slides/pptx.ts",
  "app/samples/page.tsx",
  "app/history/page.tsx",
  "app/history/[id]/page.tsx",
  "app/drafts/page.tsx",
  "app/shortcuts/page.tsx",
  "app/print/page.tsx",
  "app/settings/page.tsx",
  "app/teacher-testing-guide/page.tsx",
  "app/question-bank/page.tsx",
  "app/tikz-bank/page.tsx",
  "app/tools/exam-generator/page.tsx",
  "app/tools/exam-audit/page.tsx",
  "app/api/exam-audit/import/route.ts",
  "app/api/exam-audit/semantic/route.ts",
  "app/tools/bulk-student-comments/page.tsx",
  "app/demo-data/page.tsx",
  "app/diagnostics/page.tsx",
  "app/data/page.tsx",
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/dang-ky-dung-thu/page.tsx",
  "app/admin/page.tsx",
  "app/admin/beta-requests/page.tsx",
  "app/admin/feedback/page.tsx",
  "app/maintenance/page.tsx",
  "app/ai-lab/page.tsx",
  "app/share/page.tsx",
  "app/system-status/page.tsx",
  "app/release-candidate/page.tsx",
  "app/known-issues/page.tsx",
  "app/error.tsx",
  "app/loading.tsx",
  "app/not-found.tsx",
  "app/sitemap.ts",
  "app/robots.ts",
  "public/manifest.json",
  "public/icon.svg",
  "app/api/ai/generate/route.ts",
  "app/api/ai/3d-animation/route.ts",
  "lib/ai/extract-json.ts",
  "lib/exam/normalize-ai-exam.ts",
  "lib/exam/topic-generators/math-12-probability.ts",
  "lib/exam/validate-structured-exam.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/me/route.ts",
  "app/api/feedback/route.ts",
  "app/api/beta-request/route.ts",
  "app/api/admin/beta-requests/[id]/route.ts",
  "app/api/admin/maintenance/route.ts",
  "app/api/maintenance/route.ts",
  "app/api/tikz-bank/route.ts",
  "app/api/tikz-bank/[id]/route.ts",
  "app/api/tikz-bank/copy/route.ts",
  "app/api/admin/seed-tikz-bank/route.ts",
  "app/api/admin/tikz-bank/import/route.ts",
  "middleware.ts",
  "supabase/schema.sql",
  "lib/supabase/client.ts",
  "lib/supabase/server.ts",
  "lib/supabase/admin.ts",
  "lib/auth/user.ts",
  "lib/data/documents-store.ts",
  "lib/data/templates-store.ts",
  "lib/data/question-bank-store.ts",
  "lib/data/settings-store.ts",
  "lib/ai/index.ts",
  "lib/ai/refine-output.ts",
  "components/tools/OutputRefinementBar.tsx",
  "components/tools/DocumentExportMenu.tsx",
  "components/tools/ThreeDAnimationTool.tsx",
  "components/tools/FormDraftControls.tsx",
  "components/tools/PresetSelect.tsx",
  "components/CommandPalette.tsx",
  "components/FeedbackWidget.tsx",
  "components/GuideFeedbackButton.tsx",
  "components/PageLoading.tsx",
  "hooks/useFormDraft.ts",
  "lib/form-drafts.ts",
  "lib/presets.ts",
  "lib/favorites.ts",
  "lib/sample-data.ts",
  "lib/local-data-manager.ts",
  "lib/feedback.ts",
  "lib/beta-requests.ts",
  "lib/maintenance.ts",
  "lib/maintenance-access.ts",
  "lib/export-text.ts",
  "lib/print-document.ts",
  "lib/built-in-templates.ts",
  "lib/document-header.ts",
  "docs/TEMPLATES.md",
  "docs/RELEASE_CANDIDATE.md",
  "docs/SUPABASE_SETUP.md",
  "docs/AUTH.md",
  "docs/DATABASE.md"
];

const missing = requiredFiles.filter((file) => !existsSync(resolve(file)));
if (missing.length) {
  console.error("Smoke test thất bại. Thiếu file:");
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

const probabilityGenerator = readFileSync(resolve("lib/exam/topic-generators/math-12-probability.ts"), "utf8");
const requiredProbabilityTerms = ["prob-mc-", "prob-tf-", "prob-sa-", "multiple_choice", "true_false", "short_answer", "isMath12Probability"];
const forbiddenProbabilityTerms = ["dao ham", "tich phan", "dong bien", "nghich bien", "cuc tri"];
const missingProbabilityTerms = requiredProbabilityTerms.filter((term) => !probabilityGenerator.includes(term));
const forbiddenProbabilityHits = forbiddenProbabilityTerms.filter((term) => probabilityGenerator.includes(term));
if (missingProbabilityTerms.length || forbiddenProbabilityHits.length) {
  console.error("Smoke test th?t b?i. Topic fallback To?n 12 X?c su?t ch?a ??t:");
  missingProbabilityTerms.forEach((term) => console.error(`- Thi?u term: ${term}`));
  forbiddenProbabilityHits.forEach((term) => console.error(`- C? forbidden term: ${term}`));
  process.exit(1);
}

console.log(`Smoke test đạt: ${requiredFiles.length} file/route quan trọng tồn tại.`);
