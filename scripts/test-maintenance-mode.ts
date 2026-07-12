import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
assert.match(routeSource, /user\.role !== "admin"/);
assert.match(routeSource, /status:\s*403/);
assert.match(routeSource, /setMaintenanceSettings/);

const migration = readFileSync("supabase/migrations/20260712_add_system_settings.sql", "utf8");
assert.match(migration, /create table if not exists public\.system_settings/);
assert.match(migration, /for select to authenticated/);
assert.doesNotMatch(migration, /for (?:insert|update|delete) to authenticated/);

console.log("Maintenance mode: OFF/ON, teacher redirect/API block, admin bypass, public login/trial, validation và admin-only storage đều đạt.");
