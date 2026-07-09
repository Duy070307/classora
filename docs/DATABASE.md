# Cloud database trong Soạn Lab

Schema nằm ở `supabase/schema.sql`.

Bảng chính:

- `profiles`: hồ sơ và role người dùng.
- `documents`: lịch sử tài liệu đã lưu.
- `templates`: mẫu cá nhân.
- `question_bank`: ngân hàng câu hỏi. `bank_scope = 'system'` là câu hỏi mẫu Soạn Lab dùng chung, giáo viên chỉ đọc; `bank_scope = 'user'` là câu hỏi riêng của từng giáo viên.
- `user_settings`: cài đặt tài liệu.

RLS được bật để giáo viên đọc được câu hỏi mẫu Soạn Lab và chỉ thao tác dữ liệu riêng của chính mình. Admin có thể xem dữ liệu qua trang `/admin` khi server có `SUPABASE_SERVICE_ROLE_KEY`.

Migration production cho Batch 80 nằm ở `supabase/migrations/20260710_question_bank_scopes.sql`.

Fallback:

- Nếu Supabase chưa cấu hình hoặc người dùng chưa đăng nhập trong môi trường local fallback, app vẫn dùng localStorage.
- `/data` có nút chuyển dữ liệu từ trình duyệt lên tài khoản. Thao tác này không xóa dữ liệu local.
