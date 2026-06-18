# Classora v0.5 Release Candidate

## Đã sẵn sàng

- Các workflow chính dành cho giáo viên dùng AI mô phỏng.
- Xuất Word, Markdown, TXT và in/lưu PDF.
- Lịch sử, bản nháp, mẫu, ngân hàng câu hỏi và dữ liệu demo bằng localStorage.
- Backup/restore JSON, diagnostics, command palette, favorites và recent tools.
- Trang private beta, tester guide, feedback copy-only, share và checklist release.
- Build production không cần API key, database, đăng nhập hoặc thanh toán.

## Chưa sẵn sàng

- AI thật, tài khoản, database, thanh toán, OCR và đọc PDF/hình ảnh.
- Đồng bộ dữ liệu giữa thiết bị.
- Bảo đảm output chính xác tuyệt đối hoặc Word giống 100% mẫu phức tạp.

## Cách test

1. Mở `/release-candidate` và đặt lại checklist.
2. Nạp mẫu tại `/demo-data`, sau đó thử 3-5 công cụ cốt lõi.
3. Kiểm tra Word, print/PDF, Markdown, TXT và lịch sử.
4. Xuất backup tại `/data`, thử restore và kiểm tra dữ liệu.
5. Kiểm tra mobile, command palette và các empty state.
6. Gửi góp ý tại `/feedback`.

## Nội dung gửi tester

> Em đang phát triển Classora, một bộ công cụ hỗ trợ giáo viên tạo đề, ma trận đề, phiếu học tập, nhận xét học sinh và xuất Word. Bản hiện tại là MVP/demo, chưa dùng AI thật và chưa thu phí. Em muốn nhờ cô/thầy test thử quy trình sử dụng, đặc biệt là giao diện, xuất Word và các công cụ nào thực sự hữu ích.

Có thể sao chép tin nhắn và link trực tiếp tại `/share`.

## Checklist phát hành

- Chạy `npm run lint`, `npm run build`, `npm run smoke`.
- Kiểm tra `/diagnostics`, `/known-issues` và `/release-candidate`.
- Test dashboard, tools, history, export, backup và mobile trên URL deploy.
- Xác nhận cảnh báo AI mô phỏng và giới hạn dữ liệu hiển thị rõ.

## Luồng private beta đề xuất

Gửi `/share` → tester đọc `/known-issues` → làm theo `/tester-guide` → thử công cụ → xuất tài liệu → gửi `/feedback`.
