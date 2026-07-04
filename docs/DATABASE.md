# Cloud database trong Soạn Lab

Schema nằm ở `supabase/schema.sql`.

Bảng chính:

- `profiles`: hồ sơ và role người dùng.
- `documents`: lịch sử tài liệu đã lưu.
- `templates`: mẫu cá nhân.
- `question_bank`: ngân hàng câu hỏi.
- `user_settings`: cài đặt tài liệu.

RLS được bật để giáo viên chỉ thao tác dữ liệu của chính mình. Admin có thể xem dữ liệu qua trang `/admin` khi server có `SUPABASE_SERVICE_ROLE_KEY`.

Fallback:

- Nếu Supabase chưa cấu hình hoặc người dùng chưa đăng nhập trong môi trường local fallback, app vẫn dùng localStorage.
- `/data` có nút chuyển dữ liệu từ trình duyệt lên tài khoản. Thao tác này không xóa dữ liệu local.
