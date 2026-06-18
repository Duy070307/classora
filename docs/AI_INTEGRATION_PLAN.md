# Kế hoạch tích hợp AI

## Trạng thái hiện tại

Soạn Lab hiện chỉ dùng Mock AI và dữ liệu localStorage. Ứng dụng chạy cục bộ không cần biến môi trường, API key, database hay tài khoản đăng nhập.

Route `POST /api/ai/generate` tạo nội dung mô phỏng phía server và hỗ trợ các hành động tinh chỉnh đầu ra. Route này chưa gọi dịch vụ AI trả phí.

## Tích hợp AI thật trong tương lai

- Giữ giao tiếp với nhà cung cấp AI ở server-side.
- Chọn provider bằng cấu hình máy chủ; frontend chỉ gọi route nội bộ.
- Không bao giờ đưa hoặc cho phép nhập API key trong frontend.
- Chuẩn hóa lỗi, timeout, logging và cơ chế fallback về Mock AI.
- Kiểm thử prompt và output trước khi mở cho người dùng thật.

## Điều kiện trước khi dùng công khai

Phải bổ sung xác thực người dùng và rate limit trước khi cho phép sử dụng AI thật công khai. Cũng cần theo dõi chi phí, chống lạm dụng và chính sách lưu trữ dữ liệu phù hợp.

## Cảnh báo chuẩn

> Nội dung hiện được tạo bằng AI mô phỏng trong bản demo. Giáo viên cần kiểm tra lại trước khi sử dụng.
