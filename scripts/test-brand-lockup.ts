import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const lockup = source("components/BrandLockup.tsx");
const navbar = source("components/Navbar.tsx");
const sidebar = source("components/Sidebar.tsx");
const footer = source("components/SiteFooter.tsx");
const login = source("app/login/page.tsx");
const trial = source("app/dang-ky-dung-thu/page.tsx");
const maintenance = source("app/maintenance/page.tsx");
const register = source("app/register/page.tsx");
const betaNotice = source("components/BetaNoticeModal.tsx");
const globals = source("app/globals.css");
const packageJson = source("package.json");

const consumers = [navbar, sidebar, footer, login, trial, maintenance, register, betaNotice];

// Component canonical duy nhất, bốn variant và subtitle thống nhất.
assert.match(lockup, /export function BrandLockup/);
assert.match(lockup, /"default" \| "compact" \| "inverse" \| "iconOnly"/);
assert.match(lockup, /BRAND_SUBTITLE = "Bộ công cụ hỗ trợ giáo viên"/);
assert.match(lockup, /BRAND_ACCESSIBLE_NAME = `SOẠN LAB – \$\{BRAND_SUBTITLE\}`/);
assert.match(lockup, /src="\/brand\/soan-lab-mark\.png"/);

// Mark 32px, một container, không shadow/ring/khung trang trí lồng thêm.
assert.match(lockup, /className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-blue-200 bg-blue-50"/);
assert.match(lockup, /className="size-6 object-contain"/);
assert.doesNotMatch(lockup, /shadow|ring-white|absolute inset-x|top-1 h-px/);

// Text không wrap; compact chỉ ẩn subtitle dưới ngưỡng được định nghĩa.
assert.match(lockup, /h-10 min-w-0 items-center gap-2\.5 whitespace-nowrap/);
assert.match(lockup, /text-\[15px\][^\n]*whitespace-nowrap|whitespace-nowrap[^\n]*text-\[15px\]/);
assert.match(lockup, /max-\[339px\]:hidden/);

// Icon-only có tên truy cập và tooltip; link có focus state rõ.
assert.match(lockup, /role="img" aria-label=\{BRAND_ACCESSIBLE_NAME\}/);
assert.match(lockup, /title=\{BRAND_ACCESSIBLE_NAME\}/);
assert.match(lockup, /focus-visible:ring-2 focus-visible:ring-blue-500/);
assert.match(lockup, /aria-label=\{BRAND_ACCESSIBLE_NAME\}/);

// Header và sidebar dùng component chuẩn, không ghép descriptor/divider riêng.
assert.match(navbar, /<BrandLockup href="\/" priority \/>/);
assert.doesNotMatch(navbar, /BrandLogo|border-l border-slate-200|Bộ công cụ hỗ trợ giáo viên<\/span>/);
assert.match(sidebar, /<BrandLockup variant="compact" href="\/dashboard"/);
assert.match(sidebar, /min-h-16 items-center[^\n]*px-3 py-2/);
assert.doesNotMatch(sidebar, /BrandLogo|showSubtitle/);

// Footer và vùng tối dùng inverse trực tiếp, không có capsule trắng bao ngoài.
assert.match(footer, /bg-slate-950/);
assert.match(footer, /<BrandLockup variant="inverse" href="\/" \/>/);
assert.match(login, /<BrandLockup href="\/" priority \/>/);
assert.doesNotMatch(login, /variant="inverse"|bg-slate-950/);
assert.doesNotMatch(login, /rounded-md bg-white px-3 py-2[\s\S]*BrandLockup/);

// Mọi consumer dùng BrandLockup; modal là vị trí icon-only thật sự bị giới hạn.
for (const consumer of consumers) {
  assert.match(consumer, /BrandLockup/);
  assert.doesNotMatch(consumer, /BrandLogo/);
  assert.doesNotMatch(consumer, /Dành cho giáo viên/);
}
assert.match(betaNotice, /<BrandLockup variant="iconOnly" \/>/);

// Navigation và khả năng chống overflow vẫn còn nguyên.
for (const href of ["#tinh-nang", "#cach-hoat-dong", "#tikz", "#dung-thu", "/login", "/dang-ky-dung-thu"]) {
  assert.match(navbar, new RegExp(`"${href}"`));
}
assert.match(navbar, /aria-controls="public-mobile-menu"/);
assert.match(sidebar, /href="\/dashboard"/);
assert.match(globals, /body[\s\S]*overflow-x: hidden/);
assert.match(packageJson, /npm run brand:lockup-test/);

console.log("Brand lockup checks passed: canonical variants, consumers, responsive behavior, accessibility and navigation are covered.");
