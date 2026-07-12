# Supabase setup cho Soạn Lab

## Biến môi trường

Thêm trong Vercel Project Settings rồi redeploy:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

REGISTRATION_ENABLED=false
ADMIN_EMAIL=
TEACHER_EMAIL=

AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
AI_DAILY_LIMIT=20
AI_MAX_OUTPUT_TOKENS=4000
```

`SUPABASE_SERVICE_ROLE_KEY` chỉ dùng server-side cho trang quản trị. Không đưa key này vào frontend.

## Các bước triển khai

1. Tạo Supabase project.
2. Copy Project URL và anon key vào Vercel.
3. Chạy `supabase/schema.sql` trong Supabase SQL Editor.
4. Tạo tài khoản giáo viên trong Supabase Auth.
5. Tạo tài khoản admin trong Supabase Auth.
6. Vào bảng `profiles`, đặt `role = 'admin'` cho tài khoản admin.
7. Giữ `REGISTRATION_ENABLED=false` để trang đăng ký công khai vẫn khóa.
8. Redeploy Vercel.
9. Kiểm tra `/login`, `/dashboard`, `/history`, `/data`, `/admin`.

Nếu thiếu env Supabase, Soạn Lab tự chạy ở chế độ dữ liệu cục bộ trên trình duyệt.

## Chế độ bảo trì

Chạy migration `supabase/migrations/20260712_add_system_settings.sql` trên Supabase trước khi sử dụng nút bật/tắt tại `/admin`. Migration tạo bảng `system_settings`; tài khoản đã đăng nhập chỉ được đọc trạng thái, còn cập nhật đi qua API quản trị server-side.

Hai biến sau chỉ là fallback khi hàng cấu hình trong cơ sở dữ liệu chưa tồn tại:

```env
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=SOẠN LAB đang bảo trì để nâng cấp hệ thống. Tài khoản dùng thử tạm thời chưa thể sử dụng. Thầy cô vui lòng quay lại sau.
```

Sau khi hàng `maintenance` tồn tại, giá trị trong cơ sở dữ liệu luôn được ưu tiên. Không cần redeploy khi admin bật hoặc tắt chế độ bảo trì.
