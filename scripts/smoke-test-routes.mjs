import { existsSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  "app/page.tsx",
  "app/dashboard/page.tsx",
  "app/tools/page.tsx",
  "app/history/page.tsx",
  "app/settings/page.tsx",
  "app/question-bank/page.tsx",
  "app/tools/exam-generator/page.tsx",
  "app/tools/bulk-student-comments/page.tsx",
  "app/demo-data/page.tsx",
  "app/diagnostics/page.tsx",
  "lib/ai/index.ts",
  "lib/sample-data.ts"
];

const missing = requiredFiles.filter((file) => !existsSync(resolve(file)));
if (missing.length) {
  console.error("Smoke test thất bại. Thiếu file:");
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log(`Smoke test đạt: ${requiredFiles.length} file/route quan trọng tồn tại.`);
