# Testing Soạn Lab

## Route QA

Public routes cần mở không lỗi, không overflow ngang desktop/mobile và không có ảnh/icon hỏng:

- `/`
- `/tools`
- `/samples`
- `/getting-started`
- `/pricing`
- `/privacy`
- `/terms`
- `/system-status`
- `/share`

App routes cần kiểm tra:

- `/dashboard`
- `/history`
- `/templates`
- `/question-bank`
- `/data`
- `/settings`

Tool routes quan trọng:

- `/tools/exam-generator`
- `/tools/worksheet-generator`
- `/tools/lesson-plan-generator`
- `/tools/student-comments`
- `/tools/bulk-student-comments`
- `/tools/rubric-generator`
- `/tools/parent-message-generator`
- `/tools/import-questions`
- `/tools/image-to-latex`
- `/tools/latex-preview`

## Sample prefill

Mở `/samples` và kiểm tra từng mẫu:

- Toán 12 THPTQG → `/tools/exam-generator?sample=math-12-thptqg`
- Lịch sử 12 THPTQG → `/tools/exam-generator?sample=history-12-thptqg`
- Phiếu học tập Toán 8 → `/tools/worksheet-generator?sample=worksheet-math-8`
- Giáo án Ngữ văn 9 → `/tools/lesson-plan-generator?sample=lesson-literature-9`
- Nhận xét học sinh → `/tools/student-comments?sample=student-comment`
- Tin nhắn phụ huynh → `/tools/parent-message-generator?sample=parent-message`

Xác nhận đúng công cụ mở, field được điền, không có warning controlled/uncontrolled input, có thể tạo bản nháp và các nút export xuất hiện sau khi tạo.

## Export regression

### Đề thi

1. Tạo Toán 12 THPTQG từ mẫu.
2. Xuất Word.
3. Mở Print/PDF.
4. Lưu lịch sử.
5. Mở lại từ `/history`.
6. Xuất Word và Print/PDF lại.

Cần xác nhận:

- Không có đáp án giáo viên lẫn vào đề học sinh.
- PHẦN I/II/III hiển thị đúng.
- Bảng đáp án giáo viên, thang điểm, ma trận và bản đặc tả còn đúng.
- Không có bảng Markdown thô.

### Tài liệu ngoài đề thi

Kiểm tra Word và Print/PDF nếu có:

- Phiếu học tập.
- Kế hoạch bài dạy.
- Nhận xét học sinh.
- Rubric.
- Tin nhắn phụ huynh.

## Metadata/assets

Kiểm tra các URL:

- `/favicon.ico`
- `/icon.png`
- `/apple-icon.png`
- `/icon-192.png`
- `/icon-512.png`
- `/og-image.png`
- `/manifest.json`
- `/sitemap.xml`
- `/robots.txt`

Kiểm tra browser title, favicon, manifest JSON và OG/Twitter metadata.

## AI integration

Không API key:

1. Đặt `AI_PROVIDER=local` hoặc không đặt env.
2. Tạo đề kiểm tra, phiếu học tập và nhận xét học sinh.
3. Xác nhận nội dung tạo được, export Word/PDF còn hoạt động.

Provider thiếu key:

1. Đặt `AI_PROVIDER=openai` nhưng không đặt `OPENAI_API_KEY`.
2. Gọi tạo nội dung.
3. Xác nhận hệ thống fallback cục bộ hoặc hiển thị thông báo thân thiện, không crash.

Provider thật nếu có key:

1. Tạo `.env.local`.
2. Đặt `AI_PROVIDER=openai` hoặc `AI_PROVIDER=gemini`.
3. Tạo đề kiểm tra.
4. Lưu lịch sử và xuất Word/PDF lại.

## Ảnh công thức → LaTeX

1. Đặt `AI_PROVIDER=gemini` và cấu hình `GEMINI_API_KEY` nếu muốn kiểm thử nhận diện thật.
2. Mở `/tools/image-to-latex`.
3. Upload ảnh PNG/JPG/WEBP đã cắt gọn, dưới 5MB.
4. Xác nhận UI nhắc giáo viên cắt ảnh chỉ chứa công thức hoặc hình cần nhận diện.
5. Tạo LaTeX, copy, preview KaTeX nếu render được, tải TXT/Markdown và lưu lịch sử.
6. Với provider không phải Gemini hoặc thiếu key, xác nhận hiển thị lỗi thân thiện, không crash.

## Public wording audit

Giao diện public chính không được hiển thị tên thương hiệu cũ, CTA góp ý công khai hoặc từ ngữ phát triển nội bộ. Các route nội bộ cũ nếu còn tồn tại không được xuất hiện trong public nav, footer, sitemap hoặc command palette.

## Lệnh kiểm tra

```bash
npm run lint
npm run build
npm run smoke
```

## Supabase Auth và cloud data checks

- Không cấu hình Supabase: app build được, public pages mở được, localStorage fallback hoạt động.
- Có Supabase env: `/login` đăng nhập được bằng tài khoản giáo viên.
- `/register` hiển thị đăng ký tài khoản hiện chưa mở.
- Tài khoản giáo viên mở dashboard, samples, tools, history, templates, question bank, data, settings.
- Lưu lịch sử, mở `/history`, mở chi tiết và export Word/PDF từ lịch sử.
- Tạo mẫu cá nhân, tạo câu hỏi trong ngân hàng câu hỏi, lưu cài đặt tài liệu.
- `/data` chuyển dữ liệu từ trình duyệt lên tài khoản và không xóa dữ liệu local.
- Tài khoản admin mở `/admin`; giáo viên không có quyền admin.
- `/system-status` hiển thị AI, Supabase, auth mode, registration, database.
