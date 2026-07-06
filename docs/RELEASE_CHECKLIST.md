# Checklist phát hành Soạn Lab

## Public pages

- [ ] `/` mở bình thường, hero nói rõ Soạn Lab hỗ trợ giáo viên tạo bản nháp và xuất Word/PDF.
- [ ] `/tools` tìm kiếm, lọc danh mục, yêu thích và gần đây hoạt động.
- [ ] `/samples` có đủ 6 mẫu sử dụng và mỗi CTA mở đúng công cụ.
- [ ] `/getting-started` mô tả luồng chọn công cụ → nhập thông tin → tạo bản nháp → xuất Word/PDF hoặc lưu lịch sử.
- [ ] `/pricing`, `/privacy`, `/terms`, `/share` dùng wording chính thức.
- [ ] Header, sidebar, footer và command palette không quảng bá route nội bộ.

## App flows

- [ ] `/dashboard`, `/history`, `/templates`, `/question-bank`, `/data`, `/settings` mở không lỗi.
- [ ] Lịch sử lưu, mở lại, xuất lại Word/Print được.
- [ ] Mẫu cá nhân, ngân hàng câu hỏi, backup/restore local data hoạt động.
- [ ] Command palette, favorites và recent tools hoạt động.
- [ ] `/tools/image-to-latex` upload ảnh PNG/JPG/WEBP đã cắt gọn, trả LaTeX hoặc TikZ qua Gemini khi được cấu hình; copy LaTeX/TikZ, copy standalone, tải `.tex`/TXT/Markdown và lưu lịch sử hoạt động.

## Export

- [ ] Tạo đề Toán 12 THPTQG từ mẫu, xuất Word thành công.
- [ ] Print/PDF đề THPTQG hiển thị đúng header, mã đề, PHẦN I/II/III và trang giáo viên.
- [ ] Đáp án giáo viên, thang điểm, ma trận và bản đặc tả không lẫn vào đề học sinh.
- [ ] Mở đề từ lịch sử và xuất Word/Print lại thành công.
- [ ] Phiếu học tập, giáo án, nhận xét học sinh, rubric và tin nhắn phụ huynh xuất Word được.
- [ ] Bảng rubric, ma trận và bảng đáp án là bảng thật, không lộ Markdown thô.

## T?o n?i dung t? ??ng

- [ ] Không có API key vẫn build và tạo nội dung bằng chế độ cục bộ.
- [ ] `AI_PROVIDER=openai` hoặc `AI_PROVIDER=gemini` thiếu key sẽ fallback cục bộ, không crash.
- [ ] `/api/ai/generate` không trả API key.
- [ ] Không hiển thị provider, key, database hoặc trạng thái nội bộ trong giao diện giáo viên.

## Metadata và assets

- [ ] `/favicon.ico`, `/icon.png`, `/apple-icon.png`, `/icon-192.png`, `/icon-512.png`, `/og-image.png` load được.
- [ ] `/manifest.json` hợp lệ.
- [ ] `/sitemap.xml` chỉ có public pages và tool chính.
- [ ] `/robots.txt` disallow route nội bộ.
- [ ] Không có hotlink logo/image ngoài repo.

## Quality gates

- [ ] `npm run lint` đạt.
- [ ] `npm run build` đạt.
- [ ] `npm run smoke` đạt.
- [ ] Kiểm tra mobile khoảng 390px cho public pages và các form chính.
- [ ] Không có tên thương hiệu cũ, CTA góp ý công khai hoặc từ ngữ phát triển nội bộ trong giao diện chính.

## Giới hạn cần truyền đạt

- [ ] Nội dung là bản nháp và cần giáo viên rà soát.
- [ ] Chưa có thanh toán và OCR PDF/quét nguyên trang; Ảnh công thức → LaTeX chỉ dành cho ảnh công thức hoặc hình học đã cắt gọn.
- [ ] Dữ liệu lưu cục bộ trong trình duyệt/localStorage.

## Supabase Auth và cloud data

- [ ] Supabase env vars are configured in Vercel if cloud mode is enabled.
- [ ] `supabase/schema.sql` has been run in Supabase SQL Editor.
- [ ] Teacher test account exists in Supabase Auth.
- [ ] Admin account exists and has `profiles.role = 'admin'`.
- [ ] `/login` works.
- [ ] `/register` remains locked.
- [ ] Protected routes redirect to login when Supabase is configured and user is not signed in.
- [ ] History/templates/question bank/settings save to Supabase for logged-in users.
- [ ] LocalStorage fallback still works when Supabase env is missing.
- [ ] `/data` migration copies local browser data to cloud without deleting local data.
