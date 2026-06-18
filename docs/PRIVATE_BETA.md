# Classora Private Beta

## Đã sẵn sàng

- Giao diện responsive và thư mục công cụ.
- Các workflow mock dành cho giáo viên.
- Lưu lịch sử, mẫu, cài đặt và ngân hàng câu hỏi bằng localStorage.
- Tự lưu bản nháp form và khôi phục tại `/drafts` bằng localStorage.
- Tìm nhanh bằng Ctrl/Cmd + K, công cụ yêu thích và danh sách dùng gần đây bằng localStorage.
- Chọn nhiều tài liệu lịch sử để xuất Markdown/TXT, đổi thư mục hoặc xóa.
- Xuất Word cơ bản.
- Demo data, diagnostics, feedback copy-only và tester guide.

## Chưa sẵn sàng

- AI thật, tài khoản, database, thanh toán.
- OCR, đọc PDF/hình ảnh.
- Đồng bộ dữ liệu giữa thiết bị.
- Cam kết độ chính xác nội dung.

## Cách test

1. Mở `/tester-guide`.
2. Nạp dữ liệu tại `/demo-data`.
3. Xuất backup tại `/data` trước khi thay đổi hoặc reset dữ liệu lớn.
4. Thử 3-5 workflow.
5. Nhập dở một form, refresh trang, khôi phục bản nháp và xóa bản nháp tại `/drafts`.
6. Xuất và mở file Word.
7. Kiểm tra lịch sử; thử nhập backup để khôi phục dữ liệu demo.
8. Gửi góp ý tại `/feedback`.

## Ai nên test trước

- Giáo viên THCS/THPT thường xuyên soạn đề và phiếu học tập.
- Giáo viên chủ nhiệm cần viết nhận xét.
- Gia sư cần tạo tài liệu nhanh.

## Feedback cần thu thập

- Độ dễ dùng và mức độ rối của giao diện.
- Công cụ hữu ích nhất và ít hữu ích nhất.
- Cấu trúc output có phù hợp không.
- File Word có đủ dùng không.
- Lỗi thao tác, lỗi mobile và nội dung khó hiểu.

## Giới hạn đã biết

- Nội dung dùng AI mô phỏng và phải được giáo viên kiểm tra.
- Dữ liệu chỉ nằm trong localStorage.
- Xóa dữ liệu trình duyệt có thể làm mất dữ liệu.
- Backup JSON chỉ khôi phục dữ liệu Classora trên trình duyệt được nhập file; chưa có đồng bộ cloud.

## Tin nhắn mời tester

Có thể mở `/share` để sao chép lời mời và liên kết demo.

> Em đang phát triển Classora, một bộ công cụ hỗ trợ giáo viên tạo đề, phiếu học tập, nhận xét học sinh, ma trận đề và xuất Word. Bản hiện tại là demo/MVP, chưa dùng AI thật. Em muốn nhờ cô/thầy dùng thử quy trình và góp ý xem công cụ nào hữu ích nhất.

Sau khi deploy Vercel, tester nên kiểm tra dashboard, tools, Word export, print/PDF, backup localStorage, command palette và mobile. Bản demo hiện không yêu cầu biến môi trường.
