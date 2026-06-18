# Classora

Classora là bộ công cụ AI dạng MVP dành cho giáo viên Việt Nam, gom các workflow soạn đề, tài liệu dạy học, nhận xét, ngân hàng câu hỏi và xuất Word vào một workspace đơn giản.

Trạng thái hiện tại: zero-cost MVP/demo dành cho private beta, không cần API key.

Slogan: “Soạn đề, tạo tài liệu, xuất Word trong vài phút.”

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- `docx` để xuất file `.docx`
- `localStorage` cho lịch sử tài liệu và số lượt sử dụng
- Mock AI, không cần API key
- Built-in Vietnamese teacher document templates and placeholder-based personal templates
- Global command palette (`Ctrl/Cmd + K`), favorite tools and recently used tools

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Deploy

Classora là ứng dụng Next.js không cần API key. Có thể deploy lên Vercel hoặc dịch vụ hỗ trợ Next.js:

```bash
npm install
npm run build
npm run start
```

Không cần cấu hình database hoặc biến môi trường cho bản demo hiện tại.

## Main Routes

- `/`
- `/dashboard`
- `/history`
- `/history/[id]`
- `/drafts`
- `/shortcuts`
- `/print`
- `/tools`
- `/settings`
- `/templates`
- `/pricing`
- `/getting-started`
- `/changelog`
- `/demo-checklist`
- `/demo-data`
- `/diagnostics`
- `/data`
- `/private-beta`
- `/tester-guide`
- `/privacy`
- `/terms`
- `/question-bank`
- `/tools/import-questions`
- `/tools/exam-generator`
- `/tools/worksheet-generator`
- `/tools/student-comments`
- `/tools/lesson-plan-generator`
- `/tools/matrix-generator`
- `/tools/answer-key-generator`
- `/tools/rubric-generator`
- `/tools/parent-message-generator`
- `/tools/question-bank-generator`
- `/tools/question-variant-generator`
- `/tools/exam-checker`
- `/tools/activity-generator`
- `/tools/differentiated-exercises`
- `/tools/exam-shuffler`
- `/tools/slide-outline-generator`
- `/tools/lesson-summary`
- `/tools/mindmap-outline`
- `/tools/homeroom-plan`
- `/tools/parent-meeting-minutes`
- `/tools/latex-converter`
- `/tools/latex-preview`
- `/tools/bulk-student-comments`

## Current Limitations

- Chưa có AI thật, đang dùng AI mô phỏng.
- Form công cụ có tự lưu bản nháp vào `localStorage`, có thể xem và khôi phục tại `/drafts`.
- Một số công cụ có preset “Dùng mẫu nhanh” để điền nhanh workflow giáo viên Việt Nam.
- Có mẫu tài liệu tiếng Việt dựng sẵn cho đề kiểm tra, đáp án, ma trận, giáo án, phiếu học tập và nhận xét học sinh.
- Có tìm nhanh toàn app, công cụ yêu thích, công cụ dùng gần đây và bulk actions trong lịch sử.
- Chưa có real OCR hoặc image recognition.
- Chưa có đăng nhập.
- Chưa có database.
- Chưa có thanh toán.
- Chưa có OCR, upload ảnh hoặc upload PDF.
- Trộn mã đề đang ở mức demo, giáo viên phải kiểm tra lại thứ tự câu và đáp án trước khi in.
- Lịch sử chỉ lưu trong `localStorage` của trình duyệt hiện tại.
- Nội dung do AI mô phỏng tạo ra cần được giáo viên kiểm tra trước khi sử dụng.
- Ngân hàng câu hỏi, mẫu và thư mục lịch sử chỉ lưu trong `localStorage`.
- Nhập câu hỏi chỉ hỗ trợ văn bản và CSV; không đọc PDF hoặc hình ảnh.
- Free/Pro và bảng giá hiện chỉ là mô phỏng bằng `localStorage`, không có giao dịch thật.
- Giáo viên phải kiểm tra lại mọi output trước khi sử dụng.

## Private Beta

- Giới thiệu chương trình: `/private-beta`
- Hướng dẫn tester: `/tester-guide`
- Gửi góp ý: `/feedback`
- Quyền riêng tư: `/privacy`
- Điều khoản demo: `/terms`
- Tài liệu nội bộ: `docs/PRIVATE_BETA.md`
- Checklist phát hành: `docs/RELEASE_CHECKLIST.md`

Classora không lưu feedback lên server. Form feedback chỉ tạo nội dung có định dạng và sao chép vào clipboard để tester gửi thủ công.

## Privacy & Demo Disclaimer

Dữ liệu người dùng hiện chỉ lưu trong localStorage. Bản demo không đảm bảo độ chính xác tuyệt đối, không nên dùng để xử lý dữ liệu nhạy cảm và mọi output cần được giáo viên xác minh trước khi sử dụng.

## Demo Checklist

Mở `/demo-checklist` và kiểm tra:

- Dashboard và thư mục công cụ.
- Tạo đề, ma trận, phiếu học tập và nhận xét.
- Nhập CSV nhận xét hàng loạt.
- Lưu lịch sử và xuất Word.
- Gửi góp ý sau khi thử.

## Mock Usage & Plan

- Mặc định là `Free demo` với 10 lượt tạo mỗi tháng.
- Bộ đếm được lưu theo tháng trong `localStorage`.
- Khi hết lượt, Classora chỉ hiển thị nhắc nhẹ và vẫn cho tiếp tục dùng demo.
- Có thể chuyển sang `Pro demo` tại `/pricing` hoặc `/settings`; chế độ này không giới hạn lượt mô phỏng.

## Demo Data

Mở `/demo-data` để nạp ngân hàng câu hỏi, mẫu tài liệu và cài đặt mẫu. Dữ liệu chỉ được lưu trong `localStorage` của trình duyệt hiện tại.

## Sao lưu và khôi phục dữ liệu cục bộ

Mở `/data` để xuất toàn bộ dữ liệu Classora thành file JSON, nhập lại bản sao lưu hoặc xóa từng nhóm dữ liệu. Nên xuất backup trước khi thử reset, đổi dữ liệu demo hoặc kiểm thử lớn.

Bản demo chưa có backend/database và không tự đồng bộ dữ liệu. `localStorage` gắn với trình duyệt và thiết bị hiện tại; dữ liệu có thể mất khi xóa dữ liệu trình duyệt, dùng chế độ riêng tư hoặc chuyển thiết bị.

## Bản nháp biểu mẫu và preset

Các form công cụ lõi tự lưu bản nháp sau khi giáo viên nhập dữ liệu. Mở `/drafts` để tìm, khôi phục hoặc xóa bản nháp. Bản nháp chỉ nằm trong `localStorage` của trình duyệt hiện tại và cũng được đưa vào backup JSON tại `/data`.

Một số workflow thường gặp có nút “Dùng mẫu nhanh” để điền nhanh cấu hình như kiểm tra 15 phút, kiểm tra 45 phút, ma trận tỉ lệ phổ biến, phiếu học tập và nhận xét học sinh. Giáo viên vẫn có thể sửa mọi trường sau khi áp dụng preset.

## Mẫu tài liệu tiếng Việt

Các công cụ lõi có selector “Mẫu tài liệu” với lựa chọn “Tự động”, mẫu có sẵn và mẫu cá nhân từ `/templates`. Placeholder như `{{ten_truong}}`, `{{ten_giao_vien}}`, `{{mon_hoc}}`, `{{lop}}`, `{{chu_de}}`, `{{noi_dung}}`, `{{dap_an}}`, `{{thang_diem}}`, `{{ma_tran}}` được thay đơn giản khi tạo output.

Word export, Markdown/TXT export và `/print` dùng header từ `/settings` khi có dữ liệu. Xem thêm `docs/TEMPLATES.md`.

## Smoke Test

```bash
npm run smoke
```

Script kiểm tra sự tồn tại của các route/file quan trọng mà không cần khởi động server.

## Xuất tài liệu

Tài liệu có thể được sao chép, lưu lịch sử, xuất Word, Markdown, TXT hoặc mở tại `/print` để in/lưu PDF bằng hộp thoại của trình duyệt. Trang `/history/[id]` hiển thị đầy đủ tài liệu đã lưu cùng các thao tác xuất. Xem thêm `docs/EXPORTS.md`.

## Mock AI & Future Architecture

- Classora hiện gọi các hàm trong `lib/mock-ai.ts`.
- Provider layer tương lai nằm trong `lib/ai`.
- Prompt builders tiếng Việt nằm tại `lib/ai/prompts.ts`.
- Provider mặc định luôn là `mock`; không có SDK hoặc API call trả phí.
- Xem thêm `docs/AI_READINESS.md`.

## Batch 5 Improvements

- Ngân hàng câu hỏi cục bộ: thêm, sửa, xóa, lọc, chọn và xuất Word.
- Nhập câu hỏi từ văn bản hoặc CSV, chỉnh sửa preview trước khi lưu.
- Dùng lại câu hỏi ngân hàng trong công cụ tạo đề.
- Áp dụng mẫu cá nhân với placeholder `{{ten_truong}}`, `{{ten_giao_vien}}`, `{{nam_hoc}}`, `{{mon_hoc}}`, `{{lop}}`, `{{chu_de}}`, `{{noi_dung}}`.
- Tổ chức lịch sử tài liệu theo thư mục.

## Batch 4 Improvements

- Cải thiện công cụ tạo đề kiểm tra với header, tỉ lệ mức độ, ma trận và bản đặc tả đề.
- Cải thiện ma trận đề theo bảng chủ đề, mức độ, số câu, số điểm và tỉ lệ.
- Cải thiện đáp án và thang điểm với bảng đáp án trắc nghiệm, lỗi thường gặp và gợi ý chấm linh hoạt.
- Cải thiện trộn mã đề demo với parser câu hỏi A/B/C/D và bảng đáp án theo mã.
- Cải thiện export Word với header từ cài đặt, heading, bullet-like paragraphs, font và cỡ chữ theo settings.

## Future Roadmap

- Real AI integration
- Supabase auth/database
- Payment
- OCR/PDF/image import
- School workspace
