# Classora

Classora là bộ công cụ AI dạng MVP dành cho giáo viên Việt Nam, gom các workflow soạn đề, tài liệu dạy học, nhận xét, ngân hàng câu hỏi và xuất Word vào một workspace đơn giản.

Slogan: “Soạn đề, tạo tài liệu, xuất Word trong vài phút.”

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- `docx` để xuất file `.docx`
- `localStorage` cho lịch sử tài liệu và số lượt sử dụng
- Mock AI, không cần API key

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

## Main Routes

- `/`
- `/dashboard`
- `/history`
- `/tools`
- `/settings`
- `/templates`
- `/pricing`
- `/getting-started`
- `/changelog`
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

## Mock Usage & Plan

- Mặc định là `Free demo` với 10 lượt tạo mỗi tháng.
- Bộ đếm được lưu theo tháng trong `localStorage`.
- Khi hết lượt, Classora chỉ hiển thị nhắc nhẹ và vẫn cho tiếp tục dùng demo.
- Có thể chuyển sang `Pro demo` tại `/pricing` hoặc `/settings`; chế độ này không giới hạn lượt mô phỏng.

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
