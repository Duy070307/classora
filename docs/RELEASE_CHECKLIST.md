# Release Checklist

Phiên bản: **v0.5 RC**. Checklist tương tác nằm tại `/release-candidate`; giới hạn công khai nằm tại `/known-issues`.

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run smoke`
- [ ] Test trên desktop
- [ ] Test trên mobile
- [ ] Test Word export
- [ ] Test localStorage history
- [ ] Test tự lưu bản nháp form, khôi phục sau refresh và xóa tại `/drafts`
- [ ] Test preset “Dùng mẫu nhanh” trên exam, worksheet, student comments và matrix
- [ ] Test command palette bằng nút, Ctrl/Cmd + K, Enter và Esc
- [ ] Test thêm/bỏ công cụ yêu thích và bộ lọc Gần đây
- [ ] Test bulk actions lịch sử: chọn, bundle Markdown/TXT, đổi thư mục, xóa
- [ ] Kiểm tra backup/restore favorites và recent tools
- [ ] Test feedback copy
- [ ] Test demo data
- [ ] Xuất backup JSON trước khi kiểm thử reset
- [ ] Nhập backup và kiểm tra dữ liệu được khôi phục
- [ ] Kiểm tra backup JSON có thể khôi phục bản nháp biểu mẫu
- [ ] Test từng nút reset và xác nhận xóa toàn bộ thật cẩn thận
- [ ] Kiểm tra founder section
- [ ] Kiểm tra privacy/terms links
- [ ] Kiểm tra Vercel deployment
- [ ] Kiểm tra `/share`, sao chép tin nhắn và liên kết demo
- [ ] Kiểm tra manifest, favicon, `robots.txt` và `sitemap.xml`
- [ ] Sau deploy: test dashboard, tools, Word export, print/PDF, backup localStorage, command palette và mobile
- [ ] Xác nhận app chạy không cần env; `.env.example` chỉ dành cho AI tương lai
- [ ] Kiểm tra checklist `/release-candidate` lưu và reset bằng localStorage
- [ ] Kiểm tra `/known-issues` và các link từ footer, private beta, tester guide
- [ ] Kiểm tra feedback có loại góp ý, nguồn trang, timestamp và thông tin trình duyệt
