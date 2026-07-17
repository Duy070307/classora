import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { maintenanceAccessDecision } from "../lib/maintenance-access";
import { DEFAULT_MAINTENANCE_MESSAGE, validateMaintenanceUpdate } from "../lib/maintenance-shared";

const decide = (pathname: string, enabled: boolean, role: "admin" | "teacher" = "teacher") => maintenanceAccessDecision({ pathname, enabled, authenticated: true, role });

assert.equal(decide("/dashboard", false), "allow");
assert.equal(decide("/tools/exam-generator", true), "redirect");
assert.equal(decide("/history", true), "redirect");
assert.equal(decide("/admin", true, "admin"), "allow");
assert.equal(decide("/tools/image-to-latex", true, "admin"), "allow");
assert.equal(decide("/login", true), "allow");
assert.equal(decide("/dang-ky-dung-thu", true), "allow");
assert.equal(decide("/api/beta-request", true), "allow");
assert.equal(decide("/api/ai/generate", true), "block_api");
assert.equal(decide("/api/question-bank/ai-import", true), "block_api");
assert.equal(decide("/api/ai/generate", true, "admin"), "allow");
assert.equal(decide("/maintenance", true), "allow");
assert.equal(maintenanceAccessDecision({ pathname: "/dashboard", enabled: true, authenticated: false }), "allow");

const valid = validateMaintenanceUpdate({ enabled: true, message: DEFAULT_MAINTENANCE_MESSAGE });
assert.equal(valid.ok, true);
assert.equal(validateMaintenanceUpdate({ enabled: true, message: "" }).ok, false);
assert.equal(validateMaintenanceUpdate({ enabled: true, message: "x".repeat(601) }).ok, false);
const sanitized = validateMaintenanceUpdate({ enabled: true, message: "<b>Thông báo</b>" });
assert.ok(sanitized.ok && sanitized.message === "Thông báo");

const routeSource = readFileSync("app/api/admin/maintenance/route.ts", "utf8");
assert.match(routeSource, /status:\s*401/);
assert.match(routeSource, /isMaintenanceBypassed\(user\)/);
assert.match(routeSource, /status:\s*403/);
assert.match(routeSource, /setMaintenanceSettings/);

const middlewareSource = readFileSync("proxy.ts", "utf8");
assert.equal(existsSync("middleware.ts"), false, "Không giữ đồng thời middleware và proxy");
assert.match(middlewareSource, /export async function proxy\(/);
assert.match(middlewareSource, /getMaintenanceSettings\(\)/);
assert.match(middlewareSource, /isMaintenanceBypassed\(identity\)/);
assert.doesNotMatch(middlewareSource, /from\("system_settings"\)/, "Middleware không được đọc nguồn cấu hình khác helper canonical");
const userSource = readFileSync("lib/auth/user.ts", "utf8");
assert.match(userSource, /process\.env\.ADMIN_EMAIL/);

for (const apiRoute of ["app/api/ai/generate/route.ts", "app/api/ai/image-to-latex/route.ts", "app/api/ai/3d-animation/route.ts", "app/api/question-bank/ai-import/route.ts", "app/api/answer-sheet/layout/route.ts", "app/api/answer-sheet/recognize/route.ts"]) {
  const source = readFileSync(apiRoute, "utf8");
  assert.match(source, /getMaintenanceBlockForUser/, `${apiRoute} thiếu maintenance guard trực tiếp`);
  assert.match(source, /maintenance:\s*true/, `${apiRoute} thiếu maintenance JSON`);
}

const appShell = readFileSync("components/AppShell.tsx", "utf8");
assert.match(appShell, /fetch\("\/api\/maintenance"/);
assert.match(appShell, /router\.replace\("\/maintenance"\)/);

const migration = readFileSync("supabase/migrations/20260712_add_system_settings.sql", "utf8");
assert.match(migration, /create table if not exists public\.system_settings/);
assert.match(migration, /for select to authenticated/);
assert.doesNotMatch(migration, /for (?:insert|update|delete) to authenticated/);

console.log("Maintenance mode: OFF/ON, teacher redirect/API block, admin bypass, public login/trial, validation và admin-only storage đều đạt.");
