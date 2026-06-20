# Testing Soạn Lab

Release candidate hiện tại: **v0.5 RC**. Dùng `/release-candidate` để lưu trạng thái QA thủ công và `/known-issues` để đối chiếu giới hạn đã công bố.

## Kiểm tra thủ công

- Dashboard: plan, usage, lối tắt và tài liệu gần đây.
- Tools directory: tìm kiếm, category và liên kết tool.
- Exam generator: dữ liệu mẫu, generate, copy, save và generate again.
- Word export: mở `.docx`, kiểm tra tiếng Việt, title, line break và settings header.
- Word đề thi: kiểm tra header hai cột, dòng thông tin thí sinh, hộp mã đề, số câu, các lựa chọn A–D và font Times New Roman.
- Word đề thi: xác nhận đáp án/hướng dẫn chấm/ma trận bắt đầu ở trang giáo viên riêng và file mở bình thường trong Microsoft Word.
- Lịch sử đề thi: lưu đề, mở `/history/[id]`, xuất lại và xác nhận vẫn dùng bố cục đề thi chính thức.
- History: tìm kiếm, filter folder, xem, copy, export và delete.
- Question bank: thêm, sửa, xóa, lọc, chọn và export.
- Templates: thêm mẫu, placeholder và áp dụng trong tool.
- Settings: lưu/reset header tài liệu và đổi Free/Pro demo.
- Demo data: nạp từng nhóm, nạp tất cả và xóa.
- Diagnostics: số liệu khớp localStorage và provider là `mock`.
- Quản lý dữ liệu: xuất backup trước khi kiểm thử lớn; nhập lại file để khôi phục dữ liệu demo.
- Bản nháp biểu mẫu: nhập một form, refresh trang, xác nhận bản nháp có thể khôi phục, xóa bản nháp và kiểm tra bản nháp xuất hiện tại `/drafts`.
- Backup bản nháp: xuất backup tại `/data`, xóa bản nháp, nhập lại backup và kiểm tra bản nháp được khôi phục nếu dữ liệu backup có drafts.
- Tìm nhanh: mở bằng nút “Tìm nhanh” và Ctrl/Cmd + K; thử tìm tool, trang, dùng Enter và Esc.
- Yêu thích/gần đây: thêm/bỏ ngôi sao, kiểm tra dashboard và bộ lọc `/tools`.
- Lịch sử hàng loạt: chọn nhiều tài liệu, xuất Markdown/TXT, đổi thư mục và xóa có xác nhận.
- Backup: xác nhận favorites và recent tools được xuất/khôi phục.
- Reset dữ liệu: kiểm tra riêng từng nút xóa, hộp xác nhận và nút xóa toàn bộ.
- Mobile: kiểm tra landing, dashboard, form, preview, bảng và sidebar.
- Vercel: build thành công, route không 404 và app chạy không cần env.
- Production shell: kiểm tra favicon, manifest, metadata, trang 404 và error boundary có thông báo tiếng Việt.
- Chia sẻ: mở `/share`, sao chép đúng tin nhắn demo và URL hiện tại.
- Release candidate: tick checklist, refresh để xác nhận localStorage, kiểm tra progress và đặt lại.
- Known issues: kiểm tra nội dung không tuyên bố AI thật, thanh toán thật hoặc độ chính xác tuyệt đối.
- Sau deploy: test dashboard, tools, Word export, print/PDF, backup localStorage, command palette và mobile.

## Lệnh kiểm tra

```bash
npm run lint
npm run build
npm run smoke
```
