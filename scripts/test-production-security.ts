import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const clientFiles = globSync("{app,components,lib}/**/*.{ts,tsx}").filter((file) => readFileSync(file, "utf8").trimStart().startsWith('"use client"'));
for (const file of clientFiles) {
  const source = readFileSync(file, "utf8");
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|GEMINI_API_KEY/, `Không được dùng secret trong client: ${file}`);
}

const schema = readFileSync("supabase/schema.sql", "utf8");
for (const table of ["documents", "question_bank", "feedback", "beta_requests", "tikz_bank"]) {
  assert.match(schema, new RegExp(`alter table public\\.${table} enable row level security`, "i"), `Thiếu RLS cho ${table}`);
}
assert.match(schema, /question_bank_select_system_own_or_admin/i);
assert.match(schema, /tikz_bank_select_system_own_or_admin/i);
assert.match(schema, /beta_requests_admin_select/i);
assert.match(schema, /documents_own_all/i);

const aiStatusRoute = readFileSync("app/api/ai/generate/route.ts", "utf8");
assert.doesNotMatch(aiStatusRoute.match(/export async function GET\(\)[\s\S]*?\n\}/)?.[0] || "", /provider|KeyConfigured|maxOutputTokens|dailyLimit/i);

console.log(`Production security: ${clientFiles.length} client files không chứa secret; RLS và endpoint trạng thái công khai đạt.`);
