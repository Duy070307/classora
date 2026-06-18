# Classora Private Beta

## Đã sẵn sàng

- Giao diện responsive và thư mục công cụ.
- Các workflow mock dành cho giáo viên.
- Lưu lịch sử, mẫu, cài đặt và ngân hàng câu hỏi bằng localStorage.
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
5. Xuất và mở file Word.
6. Kiểm tra lịch sử; thử nhập backup để khôi phục dữ liệu demo.
7. Gửi góp ý tại `/feedback`.

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

> Em đang phát triển Classora, một bộ công cụ hỗ trợ giáo viên tạo đề, phiếu học tập, nhận xét học sinh và xuất Word. Bản này đang là demo, chưa dùng AI thật. Em muốn nhờ cô/thầy test thử giao diện và quy trình sử dụng, đặc biệt là phần xuất Word và các công cụ có thực sự hữu ích không.
