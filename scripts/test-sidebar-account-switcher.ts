import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const accountPanel = source("components/AccountPanel.tsx");
const sidebar = source("components/Sidebar.tsx");
const packageJson = source("package.json");

// 1–2. Hàng tài khoản luôn có danh tính, vai trò và email không xuống dòng.
assert.match(accountPanel, /displayedAccount\.email/);
assert.match(accountPanel, /roleLabel\(displayedAccount\.role\)/);
assert.match(accountPanel, /truncate whitespace-nowrap text-\[13px\]/);
assert.match(accountPanel, /title=\{displayedAccount\.email\}/);

// 3–4. Hành động chỉ xuất hiện trong menu điều khiển bởi trigger có semantics đầy đủ.
assert.match(accountPanel, /\{menuOpen \? \([\s\S]*role="menu"[\s\S]*\) : null\}/);
assert.match(accountPanel, /aria-haspopup="menu"/);
assert.match(accountPanel, /aria-expanded=\{menuOpen\}/);
assert.match(accountPanel, /onClick=\{\(\) => setMenuOpen\(\(current\) => !current\)\}/);

// 5–6. Mục quản trị chỉ được tạo khi đúng vai trò admin.
assert.match(accountPanel, /account\?\.role === "admin" \? \([\s\S]*href="\/admin"[\s\S]*Quản trị[\s\S]*\) : null/);

// 7. Đăng xuất nằm sau đường phân cách và có treatment riêng.
assert.match(accountPanel, /role="separator"[\s\S]*action="\/api\/auth\/logout"/);
assert.match(accountPanel, /hover:bg-red-50 hover:text-red-700/);

// 8–9. Escape đóng menu và trả focus về trigger; các phím mũi tên điều hướng được.
assert.match(accountPanel, /event\.key !== "Escape"/);
assert.match(accountPanel, /setMenuOpen\(false\);\s*triggerRef\.current\?\.focus\(\)/);
for (const key of ["ArrowDown", "ArrowUp", "Home", "End"]) assert.match(accountPanel, new RegExp(`"${key}"`));

// 10. Chế độ thu gọn chỉ còn avatar và vẫn có tên truy cập đầy đủ.
assert.match(accountPanel, /collapsed \? `Mở menu tài khoản: \$\{identity\}`/);
assert.match(accountPanel, /!collapsed \? \([\s\S]*displayedAccount\.email/);
assert.match(accountPanel, /collapsed \? "grid-cols-1 justify-items-center"/);

// 11. Menu mở lên, bị giới hạn theo viewport và touch target đạt tối thiểu 44px.
assert.match(accountPanel, /bottom-\[calc\(100%\+0\.5rem\)\]/);
assert.match(accountPanel, /max-w-\[calc\(100vw-2rem\)\]/);
assert.match(accountPanel, /max-h-\[min\(18rem,calc\(100dvh-6rem\)\)\]/);
assert.match(accountPanel, /flex min-h-11 w-full/);

// 12. Logout giữ nguyên POST endpoint và chặn submit lặp.
assert.match(accountPanel, /action="\/api\/auth\/logout"\s*method="post"/);
assert.match(accountPanel, /if \(loggingOut\)[\s\S]*event\.preventDefault\(\)/);
assert.match(accountPanel, /disabled=\{loggingOut\}/);

// 13. Settings và feedback giữ đúng route/event hiện có; mobile đóng drawer sau điều hướng.
assert.match(accountPanel, /href="\/settings"/);
assert.match(accountPanel, /new CustomEvent\("soanlab:open-feedback"\)/);
assert.match(sidebar, /<AccountPanel onNavigate=\{onClose\} \/>/);
assert.match(packageJson, /sidebar:account-test/);

console.log("Sidebar account switcher checks passed: compact layout, role visibility, menu behavior, accessibility and existing actions are covered.");
