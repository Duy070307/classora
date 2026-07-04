# Auth trong Soạn Lab

Soạn Lab dùng Supabase Auth khi `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` được cấu hình.

- `/login`: đăng nhập email/mật khẩu.
- `/register`: luôn hiển thị thông báo đăng ký chưa mở trong giai đoạn đầu.
- `/api/auth/logout`: đăng xuất.
- `/api/auth/me`: trả về user an toàn, không trả secret.
- Middleware bảo vệ dashboard, tools, samples, history, templates, question bank, data, settings, print và admin khi Supabase đã cấu hình.

Role:

- `teacher`: tài khoản giáo viên.
- `admin`: quản trị viên, đặt thủ công trong bảng `profiles`.

Không dùng service role key ở client. Tài khoản test giáo viên/admin được tạo trong Supabase Dashboard.
