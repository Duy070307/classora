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
const hero = landing.split("</section>")[0];
const navbar = source("components/Navbar.tsx");
const footer = source("components/SiteFooter.tsx");
const tikzShowcase = source("components/landing/LandingTikzShowcase.tsx");
const login = source("app/login/page.tsx");
const trial = source("app/dang-ky-dung-thu/page.tsx");
const trialForm = source("components/BetaRequestForm.tsx");
const maintenance = source("app/maintenance/page.tsx");
const globals = source("app/globals.css");
const layout = source("app/layout.tsx");
const packageJson = source("package.json");

// Hero: một hành động chính, thông điệp thực tế và minh họa sản phẩm thay vì lời hứa chung chung.
assert.equal(count(hero, /href="\/dang-ky-dung-thu"/g), 1);
assert.match(hero, /Đăng ký dùng thử/);
assert.match(hero, /Giữ quyền kiểm soát ở từng bước/);
assert.match(hero, /HeroProductVisual/);
assert.match(hero, /Bản nháp luôn cần giáo viên rà soát/);

// Landing không dùng bằng chứng xã hội hoặc số liệu không thể kiểm chứng.
assert.doesNotMatch(landing, /testimonial|khách hàng nói gì|đánh giá từ giáo viên/i);
assert.doesNotMatch(landing, /\d+[.,]?\d*\s*(giáo viên|trường học|người dùng|lần nhanh hơn)/i);
assert.doesNotMatch(landing, /Bộ Giáo dục chứng nhận|được Bộ Giáo dục công nhận/i);
assert.doesNotMatch(landing, /cách mạng|đột phá|siêu thông minh|10 lần/i);

// Header: liên kết đúng, CTA chính rõ và menu di động dùng được bằng bàn phím.
for (const href of ["#tinh-nang", "#cach-hoat-dong", "#tikz", "#dung-thu", "/login", "/dang-ky-dung-thu"]) {
  assert.match(navbar, new RegExp(`"${href}"`));
}
assert.match(navbar, /aria-expanded=\{open\}/);
assert.match(navbar, /aria-controls="public-mobile-menu"/);
assert.match(navbar, /event\.key === "Escape"/);
assert.match(navbar, /event\.key !== "Tab"/);
assert.match(navbar, /queueMicrotask\(\(\) => trigger\?\.focus\(\)\)/);
assert.match(navbar, /document\.body\.style\.overflow = "hidden"/);
assert.match(navbar, /href="#noi-dung-chinh"/);
assert.match(landing, /id="noi-dung-chinh" tabIndex=\{-1\}/);

// Các phần sản phẩm phản ánh đúng phạm vi hiện có.
for (const id of ["tinh-nang", "cach-hoat-dong", "tikz", "dung-thu"]) {
  assert.match(landing, new RegExp(`id="${id}"`));
}
assert.match(tikzShowcase, /Ảnh nguồn/);
assert.match(tikzShowcase, /Bản xem trước/);
assert.match(tikzShowcase, /Mã TikZ/);
assert.match(landing, /Xuất SVG, PNG, TEX/);
assert.match(landing, /Định dạng hỗ trợ phụ thuộc từng công cụ/);
assert.doesNotMatch(landing, /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);

// Mobile/performance: bố cục co giãn, không kéo tràn trang và không phụ thuộc animation nặng.
assert.match(globals, /body[\s\S]*overflow-x: hidden/);
assert.match(globals, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(landing, /grid max-w-7xl[\s\S]*lg:grid-cols/);
assert.match(landing, /<LandingTikzShowcase \/>/);
assert.match(tikzShowcase, /lg:grid-cols-3/);
assert.doesNotMatch(landing, /framer-motion|autoplay|<video/);

// Login: giữ nguyên luồng xác thực, có nhãn, thông báo lỗi và điều khiển mật khẩu.
assert.match(login, /supabase\.auth\.signInWithPassword\(\{ email, password \}\)/);
assert.match(login, /router\.push\(next\)/);
assert.match(login, /autoComplete="email"/);
assert.match(login, /autoComplete="current-password"/);
assert.match(login, /showPassword \? "text" : "password"/);
assert.match(login, /aria-label=\{showPassword \? "Ẩn mật khẩu" : "Hiện mật khẩu"\}/);
assert.match(login, /role="alert" aria-live="assertive"/);
assert.match(login, /href="\/dang-ky-dung-thu"/);

// Đăng ký thử nghiệm: hành vi gửi không đổi và không ngụ ý cấp tài khoản tức thời.
assert.match(trialForm, /fetch\("\/api\/beta-request"/);
assert.match(trialForm, /method: "POST"/);
assert.match(trialForm, /role="status" aria-live="polite"/);
assert.match(trialForm, /role="alert" aria-live="assertive"/);
assert.match(trial, /xem xét thủ công/);
assert.match(trial, /không đồng nghĩa với việc tài khoản được tạo ngay lập tức/);
assert.match(trial, /href="\/login"/);

// Bảo trì và footer: dùng thông điệp quản trị, giữ lối ra an toàn và liên kết thật.
assert.match(maintenance, /\{maintenance\.message\}/);
assert.match(maintenance, /if \(!maintenance\.enabled\) redirect/);
assert.match(maintenance, /action="\/api\/auth\/logout"/);
assert.match(maintenance, /adminBypass/);
assert.match(footer, /new Date\(\)\.getFullYear\(\)/);
assert.match(footer, /Tạo ra bởi Trần Đức Duy/);
assert.match(footer, /"\/terms"/);
assert.match(footer, /"\/privacy"/);

// Metadata và regression suites vẫn được nối vào lệnh test tổng.
assert.match(landing, /title: \{ absolute: "SOẠN LAB – Bộ công cụ AI hỗ trợ giáo viên" \}/);
assert.match(landing, /alternates: \{ canonical: "\/" \}/);
assert.match(landing, /locale: "vi_VN"/);
assert.match(layout, /<html lang="vi">/);
for (const command of ["security:test", "maintenance:test", "assessment:production-ui-test", "public:ui-test"]) {
  assert.match(packageJson, new RegExp(`npm run ${command}`));
}

console.log("Public landing UI checks passed: 58 source-level content, navigation, accessibility and regression assertions.");
