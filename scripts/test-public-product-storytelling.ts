import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function count(text: string, pattern: RegExp) {
  return text.match(pattern)?.length || 0;
}

const landing = source("app/page.tsx");
const frame = source("components/landing/ProductScreenshotFrame.tsx");
const visuals = source("components/landing/PublicProductVisuals.tsx");
const workflows = source("components/landing/PublicWorkflowStories.tsx");
const tikz = source("components/landing/LandingTikzShowcase.tsx");
const navbar = source("components/Navbar.tsx");
const footer = source("components/SiteFooter.tsx");
const login = source("app/login/page.tsx");
const trial = source("app/dang-ky-dung-thu/page.tsx");
const trialForm = source("components/BetaRequestForm.tsx");
const maintenance = source("app/maintenance/page.tsx");
const globals = source("app/globals.css");
const packageJson = source("package.json");

// Một hệ thống frame duy nhất cho hình ảnh sản phẩm, có caption và biến thể rõ ràng.
assert.match(frame, /export function ProductScreenshotFrame/);
for (const variant of ["browser", "workspace", "comparison", "compact"]) assert.match(frame, new RegExp(`${variant}:`));
assert.match(frame, /<figcaption/);
assert.match(frame, /data-product-screenshot/);

// Hero dùng đúng một khung sản phẩm, không có caption hoặc panel tuyệt đối bị tách khỏi giao diện.
assert.equal(count(landing, /<HeroProductVisual \/>/g), 1);
assert.match(visuals, /data-testid="hero-product-visual"/);
const heroVisual = visuals.slice(visuals.indexOf("export function HeroProductVisual"), visuals.indexOf("function ExamGeneratorFrame"));
assert.equal(count(heroVisual, /<ProductScreenshotFrame/g), 0, "Hero wrapper không được thêm frame nổi thứ hai");
assert.doesNotMatch(heroVisual, /\babsolute\b|(?:^|\s)-(?:left|right|top|bottom|translate)-|AuthProductPreview/);
assert.match(visuals, /Thiết lập cấu trúc, rà soát nội dung và xuất tài liệu trong cùng một quy trình/);
assert.doesNotMatch(landing, /device-frame|perspective-|rotate-[xy]|autoplay/);

// Luồng đánh giá là tab tương tác bảy bước và chỉ hiển thị một visual đang chọn.
for (const id of ["generate", "blueprint", "audit", "solutions", "mix", "answer-sheet", "grading"]) assert.match(workflows, new RegExp(`id: "${id}"`));
assert.equal(count(workflows, /role="tab"/g), 2, "Hai bộ chọn dùng chung mẫu tab trong map, không phải card wall");
assert.match(workflows, /aria-selected=\{selected\}/);
assert.match(workflows, /<AssessmentStepVisual id=\{active\} \/>/);
assert.doesNotMatch(landing, /workflowGroups/);

// Tài liệu dạy học dùng danh sách chọn và một screenshot đang hoạt động.
for (const id of ["lesson-plan", "worksheet", "slides", "review-pack", "rubric"]) assert.match(workflows, new RegExp(`id: "${id}"`));
assert.match(workflows, /<TeachingDocumentVisual id=\{active\} \/>/);
assert.match(workflows, /aria-label="Nhóm tài liệu dạy học"/);

// TikZ dùng cùng geometry; mobile có tab, desktop giữ ba cột và code không đổi.
assert.match(tikz, /data-testid="tikz-comparison"/);
assert.match(tikz, /role="tablist" aria-label="So sánh quy trình TikZ"/);
assert.match(tikz, /lg:grid-cols-3/);
assert.match(tikz, /<LandingPyramidFigure \/>/);
assert.match(tikz, /LANDING_PYRAMID_TIKZ/);
assert.match(tikz, /AD, DC và SD bằng nét đứt/);

// Không có dữ liệu cá nhân, bằng chứng xã hội giả hoặc số liệu marketing giả trong visual công khai.
for (const publicSource of [landing, visuals, workflows, tikz, login, trial]) {
  assert.doesNotMatch(publicSource, /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  assert.doesNotMatch(publicSource, /testimonial|khách hàng nói gì|10\.000|99%|4\.9\/5/i);
}

// CTA chỉ xuất hiện ở hero và final CTA; khối thử nghiệm chỉ giải thích xét duyệt thủ công.
assert.equal(count(landing, /href="\/dang-ky-dung-thu"/g), 2);
assert.match(landing, /Quyền truy cập được xem xét thủ công/);
assert.match(landing, /không đồng nghĩa tài khoản được tạo ngay lập tức/);

// Motion ngắn, không autoplay và bị vô hiệu hóa khi người dùng giảm chuyển động.
assert.match(globals, /public-panel-enter 220ms/);
assert.match(globals, /public-menu-enter 180ms/);
assert.match(globals, /@media \(prefers-reduced-motion: reduce\)[\s\S]*public-switch-panel[\s\S]*animation: none/);
assert.doesNotMatch(landing + workflows + tikz, /animate-bounce|animate-pulse|infinite|framer-motion/);

// Header chuyển trạng thái không đổi chiều cao; menu vẫn khóa cuộn, trap focus và trả focus.
assert.match(navbar, /data-scrolled=\{scrolled \? "true" : "false"\}/);
assert.match(navbar, /window\.scrollY > 12/);
assert.match(navbar, /event\.key === "Escape"/);
assert.match(navbar, /event\.key !== "Tab"/);
assert.match(navbar, /document\.body\.style\.overflow = "hidden"/);
assert.match(navbar, /trigger\?\.focus/);

// Login tập trung vào biểu mẫu; trang đăng ký dùng panel sáng và cả hai giữ nguyên logic.
assert.match(login, /data-testid="login-form-container"/);
assert.match(login, /max-w-\[440px\]/);
assert.match(login, /flex min-h-screen items-center justify-center/);
assert.doesNotMatch(login, /AuthProductPreview|bg-slate-950|variant="inverse"/);
assert.match(login, /signInWithPassword/);
assert.match(login, /showPassword \? "text" : "password"/);
assert.match(login, /autoComplete="email"/);
assert.match(login, /autoComplete="current-password"/);
assert.match(trial, /data-testid="trial-information-panel"/);
assert.match(trial, /bg-blue-50\/70/);
assert.doesNotMatch(trial, /AuthProductPreview|bg-slate-950|text-white/);
assert.match(trial, /order-2[\s\S]*lg:order-1/);
assert.match(trialForm, /fetch\("\/api\/beta-request"/);
assert.match(trialForm, /method: "POST"/);

// Footer có nhóm rõ, maintenance và khả năng chống overflow được giữ nguyên.
assert.match(footer, /FooterLinkGroup title="Sản phẩm"/);
assert.match(footer, /FooterLinkGroup title="Thông tin"/);
assert.match(footer, /Tạo ra bởi Trần Đức Duy/);
assert.match(maintenance, /if \(!maintenance\.enabled\) redirect/);
assert.match(maintenance, /action="\/api\/auth\/logout"/);
assert.match(globals, /body[\s\S]*overflow-x: hidden/);
assert.match(packageJson, /npm run public:story-test/);

console.log("Public product storytelling checks passed: screenshot system, workflow tabs, TikZ, CTA, motion, auth pages and accessibility are covered.");
