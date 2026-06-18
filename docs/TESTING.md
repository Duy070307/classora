# Testing Classora

## Kiểm tra thủ công

- Dashboard: plan, usage, lối tắt và tài liệu gần đây.
- Tools directory: tìm kiếm, category và liên kết tool.
- Exam generator: dữ liệu mẫu, generate, copy, save và generate again.
- Word export: mở `.docx`, kiểm tra tiếng Việt, title, line break và settings header.
- History: tìm kiếm, filter folder, xem, copy, export và delete.
- Question bank: thêm, sửa, xóa, lọc, chọn và export.
- Templates: thêm mẫu, placeholder và áp dụng trong tool.
- Settings: lưu/reset header tài liệu và đổi Free/Pro demo.
- Demo data: nạp từng nhóm, nạp tất cả và xóa.
- Diagnostics: số liệu khớp localStorage và provider là `mock`.
- Quản lý dữ liệu: xuất backup trước khi kiểm thử lớn; nhập lại file để khôi phục dữ liệu demo.
- Reset dữ liệu: kiểm tra riêng từng nút xóa, hộp xác nhận và nút xóa toàn bộ.
- Mobile: kiểm tra landing, dashboard, form, preview, bảng và sidebar.
- Vercel: build thành công, route không 404 và app chạy không cần env.

## Lệnh kiểm tra

```bash
npm run lint
npm run build
npm run smoke
```
