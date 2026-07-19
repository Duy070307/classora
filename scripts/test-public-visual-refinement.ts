import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const landing = source("app/page.tsx");
const navbar = source("components/Navbar.tsx");
const footer = source("components/SiteFooter.tsx");
const tikz = source("components/landing/LandingTikzShowcase.tsx");
const visuals = source("components/landing/PublicProductVisuals.tsx");
const lockup = source("components/BrandLockup.tsx");
const markPath = resolve(process.cwd(), "public/brand/soan-lab-mark.png");
const wrongSvgPath = resolve(process.cwd(), "public/brand/soan-lab-mark.svg");
const login = source("app/login/page.tsx");
const trial = source("app/dang-ky-dung-thu/page.tsx");
const trialForm = source("components/BetaRequestForm.tsx");
const register = source("app/register/page.tsx");
const globals = source("app/globals.css");
const packageJson = source("package.json");

const nearBlackBackground = /bg-(?:black|slate-9(?:00|50))|background(?:-color)?:\s*#(?:000000|020617|0f172a)/i;

// Public surfaces use the light blue system; code and product accents use medium blue rather than near-black.
for (const publicSurface of [landing, tikz, footer, login, trial, visuals]) {
  assert.doesNotMatch(publicSurface, nearBlackBackground);
}
assert.match(landing, /id="tikz"[^\n]*bg-cyan-50/);
assert.match(tikz, /border-blue-200 bg-white/);
assert.match(tikz, /bg-\[#1E3A5F\]/);
assert.match(footer, /bg-\[#1E3A5F\]/);

// Internal approval wording is removed; the teacher sees only a concise next step.
const approvalSurfaces = [landing, login, trial, trialForm, register].join("\n");
assert.doesNotMatch(approvalSurfaces, /Quyền truy cập được xem xét thủ công|xem xét thủ công|nhóm phát triển xem xét/);
assert.match(landing, /Sau khi gửi yêu cầu, thầy\/cô vui lòng chờ quản trị viên duyệt tài khoản/);
assert.match(trialForm, /Sau khi gửi, thầy\/cô vui lòng chờ quản trị viên duyệt/);
assert.match(trialForm, /Thông tin tài khoản sẽ được gửi khi yêu cầu được chấp nhận/);

// One canonical historical asset drives public, authenticated and inverse lockups.
assert.match(navbar, /<BrandLockup href="\/" priority \/>/);
assert.match(lockup, /src="\/brand\/soan-lab-mark\.png"/);
assert.match(lockup, /iconOnly \? "size-8" : compact \? "size-\[34px\]" : "size-\[38px\]"/);
assert.match(lockup, /h-11 min-w-0 items-center gap-2\.5/);
assert.match(lockup, /text-\[16px\] font-bold/);
assert.match(lockup, /BRAND_SUBTITLE = "Bộ công cụ hỗ trợ giáo viên"/);
assert.match(lockup, /object-contain/);
assert.doesNotMatch(lockup, /soan-lab-mark\.svg|<svg|<path|border border-blue-200 bg-blue-50/);
assert.equal(existsSync(wrongSvgPath), false);
assert.equal(createHash("sha256").update(readFileSync(markPath)).digest("hex"), "08e981a7f629b10537633def1d628c1a58d534a0d1757158a3952b3db94cc5b5");

// Footer uses the inverse lockup directly, with no white wrapper or oversized spacing.
assert.match(footer, /<BrandLockup variant="inverse" href="\/" \/>/);
assert.doesNotMatch(footer, /bg-white[^\n]*BrandLockup|py-(?:1[2-9]|2\d)/);

// Responsive/accessibility contracts and existing auth behavior remain intact.
assert.match(navbar, /min-h-16/);
assert.match(navbar, /aria-label=\{open \? "Đóng menu" : "Mở menu"\}/);
assert.match(lockup, /aria-label=\{BRAND_ACCESSIBLE_NAME\}/);
assert.match(globals, /body[\s\S]*overflow-x: hidden/);
assert.match(login, /signInWithPassword\(\{ email, password \}\)/);
assert.match(trialForm, /fetch\("\/api\/beta-request"/);
assert.match(trialForm, /method: "POST"/);

// Geometry stays driven by the shared edge configuration and retains hidden edges.
assert.match(tikz, /\{ id: "AD", from: "A", to: "D", style: "dashed" \}/);
assert.match(tikz, /\{ id: "DC", from: "D", to: "C", style: "dashed" \}/);
assert.match(tikz, /\{ id: "AB", from: "A", to: "B", style: "solid" \}/);
assert.match(tikz, /\{ id: "BC", from: "B", to: "C", style: "solid" \}/);
for (const command of ["security:test", "maintenance:test", "landing:tikz-test"]) {
  assert.match(packageJson, new RegExp(`npm run ${command}`));
}

console.log("Public visual refinement checks passed: light surfaces, concise approval copy, original canonical logo asset, responsive safety and preserved auth/TikZ contracts.");
