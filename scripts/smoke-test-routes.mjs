import { existsSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  "app/page.tsx",
  "app/dashboard/page.tsx",
  "app/tools/page.tsx",
  "app/history/page.tsx",
  "app/history/[id]/page.tsx",
  "app/drafts/page.tsx",
  "app/print/page.tsx",
  "app/settings/page.tsx",
  "app/question-bank/page.tsx",
  "app/tools/exam-generator/page.tsx",
  "app/tools/bulk-student-comments/page.tsx",
  "app/demo-data/page.tsx",
  "app/diagnostics/page.tsx",
  "app/data/page.tsx",
  "app/ai-lab/page.tsx",
  "app/api/ai/generate/route.ts",
  "lib/ai/index.ts",
  "lib/ai/refine-output.ts",
  "components/tools/OutputRefinementBar.tsx",
  "components/tools/DocumentExportMenu.tsx",
  "components/tools/FormDraftControls.tsx",
  "components/tools/PresetSelect.tsx",
  "hooks/useFormDraft.ts",
  "lib/form-drafts.ts",
  "lib/presets.ts",
  "lib/sample-data.ts",
  "lib/local-data-manager.ts",
  "lib/export-text.ts",
  "lib/print-document.ts",
  "lib/built-in-templates.ts",
  "lib/document-header.ts",
  "docs/TEMPLATES.md"
];

const missing = requiredFiles.filter((file) => !existsSync(resolve(file)));
if (missing.length) {
  console.error("Smoke test thất bại. Thiếu file:");
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log(`Smoke test đạt: ${requiredFiles.length} file/route quan trọng tồn tại.`);
