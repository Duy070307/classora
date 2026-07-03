# Testing Soạn Lab

## Kiểm tra thủ công

- Onboarding: mở `/getting-started`, kiểm tra đủ luồng chọn công cụ → nhập thông tin → tạo và rà soát bản nháp → xuất Word/PDF hoặc lưu lịch sử.
- Mẫu sử dụng: mở `/samples`, kiểm tra đủ 6 mẫu và mỗi CTA dẫn đến đúng công cụ tương ứng.
- Điều hướng mẫu: kiểm tra liên kết “Mẫu sử dụng” trên landing page, dashboard, trang công cụ, hướng dẫn bắt đầu, trang chia sẻ và footer.
- Trạng thái hệ thống: mở `/system-status`, xác nhận các chức năng đang hoạt động và các chức năng chưa mở được trình bày rõ ràng.
- Tài liệu ngoài đề thi: tạo phiếu học tập, kế hoạch bài dạy, nhận xét học sinh, rubric và tin nhắn phụ huynh; kiểm tra đủ phần và không có bảng Markdown thô.
- Word tài liệu chung: xác nhận tiêu đề, bullet, khoảng cách và bảng rubric được xuất thành bảng thật.
- Print/PDF tài liệu chung: xác nhận nền trắng, không có app chrome, bảng rõ ràng và không áp dụng header THPTQG.
- Lịch sử tài liệu chung: lưu phiếu học tập, mở lại và xuất Word/Print lần nữa.
- Chất lượng theo môn: tạo Toán 12 THPTQG và Lịch sử 12 THPTQG; kiểm tra câu hỏi, đáp án và giải thích đúng đặc trưng môn.
- Cấu trúc nội dung: xác nhận PHẦN I/II/III đầy đủ, đáp án PHẦN I không dồn vào một lựa chọn và PHẦN II có Đúng/Sai đan xen.
- Tài liệu giáo viên: kiểm tra bảng đáp án ba phần, gợi ý chấm PHẦN III, thang điểm, ma trận và bản đặc tả.
- Hồi quy xuất: xuất Word, Print/PDF, lưu lịch sử, mở lại tài liệu và xuất lần nữa.
- Dashboard: thẻ hướng dẫn, lối tắt, dữ liệu cá nhân và tài liệu gần đây.
- Tools directory: tìm kiếm, category và liên kết tool.
- Exam generator: dữ liệu mẫu, generate, copy, save và generate again.
- Word đề thi THPTQG: kiểm tra mã đề bốn chữ số, đường phân cách, PHẦN I/II/III và lựa chọn ngắn dạng 2x2.
- PDF/Print THPTQG: tạo đề, chọn In/Lưu PDF và xác nhận `/print` có header hai cột, candidate row, mã đề, đường phân cách và font Times New Roman.
- History: tìm kiếm, filter folder, xem, copy, export và delete.
- Question bank: thêm, sửa, xóa, lọc, chọn và export.
- Templates: thêm mẫu, placeholder và áp dụng trong tool.
- Settings: lưu/reset header tài liệu.
- Quản lý dữ liệu: xuất backup trước khi kiểm thử lớn; nhập lại file để khôi phục dữ liệu.
- Bản nháp biểu mẫu: nhập một form, refresh trang, xác nhận bản nháp có thể khôi phục, xóa bản nháp và kiểm tra bản nháp xuất hiện tại `/drafts`.
- Tìm nhanh: mở bằng nút “Tìm nhanh” và Ctrl/Cmd + K; thử tìm tool, trang, dùng Enter và Esc.
- Yêu thích/gần đây: thêm/bỏ ngôi sao, kiểm tra dashboard và bộ lọc `/tools`.
- Lịch sử hàng loạt: chọn nhiều tài liệu, xuất Markdown/TXT, đổi thư mục và xóa có xác nhận.
- Backup: xác nhận favorites và recent tools được xuất/khôi phục.
- Reset dữ liệu: kiểm tra riêng từng nút xóa, hộp xác nhận và nút xóa toàn bộ.
- Mobile: kiểm tra landing, dashboard, form, preview, bảng và sidebar.
- Production shell: kiểm tra favicon, manifest, metadata, trang 404 và error boundary có thông báo tiếng Việt.
- Chia sẻ: mở `/share`, sao chép đúng tin nhắn giới thiệu và URL hiện tại.
- Sau deploy: test dashboard, tools, Word export, print/PDF, backup localStorage, command palette và mobile.

## Lệnh kiểm tra

```bash
npm run lint
npm run build
npm run smoke
```
