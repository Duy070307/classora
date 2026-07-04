# Checklist phát hành Soạn Lab

## Public pages

- [ ] `/` mở bình thường, hero nói rõ Soạn Lab hỗ trợ giáo viên tạo bản nháp và xuất Word/PDF.
- [ ] `/tools` tìm kiếm, lọc danh mục, yêu thích và gần đây hoạt động.
- [ ] `/samples` có đủ 6 mẫu sử dụng và mỗi CTA mở đúng công cụ.
- [ ] `/getting-started` mô tả luồng chọn công cụ → nhập thông tin → tạo bản nháp → xuất Word/PDF hoặc lưu lịch sử.
- [ ] `/pricing`, `/privacy`, `/terms`, `/system-status`, `/share` dùng wording chính thức.
- [ ] Header, sidebar, footer và command palette không quảng bá route nội bộ.

## App flows

- [ ] `/dashboard`, `/history`, `/templates`, `/question-bank`, `/data`, `/settings` mở không lỗi.
- [ ] Lịch sử lưu, mở lại, xuất lại Word/Print được.
- [ ] Mẫu cá nhân, ngân hàng câu hỏi, backup/restore local data hoạt động.
- [ ] Command palette, favorites và recent tools hoạt động.

## Export

- [ ] Tạo đề Toán 12 THPTQG từ mẫu, xuất Word thành công.
- [ ] Print/PDF đề THPTQG hiển thị đúng header, mã đề, PHẦN I/II/III và trang giáo viên.
- [ ] Đáp án giáo viên, thang điểm, ma trận và bản đặc tả không lẫn vào đề học sinh.
- [ ] Mở đề từ lịch sử và xuất Word/Print lại thành công.
- [ ] Phiếu học tập, giáo án, nhận xét học sinh, rubric và tin nhắn phụ huynh xuất Word được.
- [ ] Bảng rubric, ma trận và bảng đáp án là bảng thật, không lộ Markdown thô.

## AI provider

- [ ] Không có API key vẫn build và tạo nội dung bằng chế độ cục bộ.
- [ ] `AI_PROVIDER=openai` hoặc `AI_PROVIDER=gemini` thiếu key sẽ fallback cục bộ, không crash.
- [ ] `/api/ai/generate` không trả API key.
- [ ] `/system-status` hiển thị provider, trạng thái key và giới hạn ngày mà không lộ secret.

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
- [ ] Chưa có tài khoản, đồng bộ dữ liệu, thanh toán và OCR.
- [ ] Dữ liệu lưu cục bộ trong trình duyệt/localStorage.
