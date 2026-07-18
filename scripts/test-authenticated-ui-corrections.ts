import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const picker = source("components/assessment/AssessmentSourcePicker.tsx");
const stages = source("components/assessment/AssessmentWorkspace.tsx");
const auditor = source("components/exam-audit/ExamAuditWorkspace.tsx");
const solutions = source(
  "components/answer-solutions/AnswerSolutionsWorkspace.tsx",
);
const mixer = source("components/exam-mixer/ExamMixerWorkspace.tsx");
const answerSheet = source("components/answer-sheet/AnswerSheetWorkspace.tsx");
const grading = source("components/grading/GradingAssistantWorkspace.tsx");
const tikzPage = source("app/tools/image-to-latex/page.tsx");
const tikzUpload = source("components/tikz/TikzUploadState.tsx");
const tikzReview = source("components/tikz/TikzReviewWorkspace.tsx");
const globals = source("app/globals.css");
const packageJson = source("package.json");

// 1. Bốn nguồn của Kiểm tra đề dùng lưới 2x2 cân bằng.
assert.match(auditor, /<AssessmentSourcePicker[\s\S]*columns=\{4\}/);
assert.match(picker, /md:grid-cols-2 xl:grid-cols-2/);
// 2. Kiểm tra đề không lặp hành động tạo đề của topbar.
assert.doesNotMatch(auditor, />\s*Tạo đề mới\s*</);
// 3. Lời giải dùng cùng mô hình chọn nguồn.
assert.match(solutions, /AssessmentSourcePicker/);
assert.match(solutions, /stageSource/);
// 4. Chỉ hiện tiếp tục lời giải khi có nguồn chờ xác nhận.
assert.match(
  solutions,
  /pendingSource \? "Tiếp tục kiểm tra đáp án" : undefined/,
);
// 5. Trộn mã không lặp hành động tạo đề.
assert.doesNotMatch(mixer, />\s*Tạo đề mới\s*</);
// 6. Trộn mã có hành động tiếp tục sau khi chọn nguồn.
assert.match(mixer, /pendingSource \? "Tiếp tục cấu hình mã đề" : undefined/);
// 7. Nguồn xếp một cột ở mobile và chỉ tăng cột theo breakpoint.
assert.match(picker, /grid grid-cols-1 gap-3/);
// 8. Bước chưa thực hiện có độ tương phản đọc được.
assert.match(stages, /text-slate-700 hover:bg-emerald-50/);
assert.match(stages, /disabled:opacity-60/);
// 9. Mobile không hiển thị bảy nhãn bước ngang.
assert.match(stages, /md:hidden/);
assert.match(stages, /Bước \{activeIndex \+ 1\}\/\{stages.length\}/);
// 10. Đáp án dán có label, gợi ý và hành động liền trường.
assert.match(grading, /htmlFor="grading-pasted-answer"/);
assert.match(grading, /id="grading-pasted-answer-hint"/);
assert.match(grading, /Dùng đáp án đã dán/);
// 11. TikZ mở bằng dropzone upload-first.
assert.match(tikzUpload, /Tải hoặc dán ảnh hình học/);
assert.match(tikzUpload, /PNG, JPG, JPEG, WEBP · tối đa 10 MB/);
// 12. Trạng thái đầu không dựng editor mã rỗng.
assert.match(tikzPage, /!previewUrl && !hasOutput/);
assert.match(tikzPage, /hasOutput \? <section className="card overflow-hidden">/);
// 13. Thanh xuất không xuất hiện trước khi có kết quả.
assert.match(tikzPage, /hasOutput \? <section[\s\S]*label="Xuất"/);
// 14. Hướng dẫn TikZ là disclosure nhỏ gọn.
assert.match(tikzUpload, /<details[\s\S]*Mẹo để nhận diện tốt hơn/);
// 15. Hành động xuất chỉ nằm trong nhánh kết quả.
assert.ok(tikzPage.indexOf('label="Xuất"') > tikzPage.indexOf("hasOutput ?"));
// 16. Chèn tài liệu chỉ hiện sau khi có tài sản đã xác nhận.
assert.match(tikzReview, /draft\.confirmedAsset \? <section[\s\S]*Chèn vào tài liệu/);
// 17. Workspace không tạo tràn ngang ở 390px.
assert.match(tikzPage, /min-w-0 flex-1/);
assert.match(globals, /body[\s\S]*overflow-x: hidden/);
// 18. Các entry point nạp nguồn cũ vẫn còn được nối dây.
assert.match(auditor, /openDocument/);
assert.match(solutions, /loadSource/);
assert.match(mixer, /selectSource/);
// 19. Luồng chấm và phiếu trả lời vẫn dùng engine/cấu hình hiện có.
assert.match(grading, /regradeJob/);
assert.match(grading, /overrideQuestionScore/);
assert.match(answerSheet, /createAnswerSheetTemplate/);
// 20. TikZ workflow vẫn thuộc bộ test đầy đủ.
assert.match(packageJson, /npm run tikz:workflow-test/);

console.log(
  "Authenticated UI correction checks passed: 20 screenshot-driven regressions.",
);
