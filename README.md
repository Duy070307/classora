# Soạn Lab

Soạn Lab là bộ công cụ hỗ trợ giáo viên Việt Nam soạn đề kiểm tra, tạo tài liệu giảng dạy, viết nhận xét học sinh và xuất Word/PDF nhanh hơn.

## Tính năng hiện tại

- Tool hub cho giáo viên với dashboard, thư viện công cụ, mẫu sử dụng và hướng dẫn bắt đầu.
- Tạo đề kiểm tra theo cấu trúc PHẦN I/II/III, kèm đáp án, thang điểm, ma trận và bản đặc tả.
- Xuất Word và Print/PDF theo bố cục đề thi THPTQG.
- Tạo phiếu học tập, kế hoạch bài dạy, nhận xét học sinh, rubric và tin nhắn phụ huynh.
- Mẫu sử dụng có prefill cho Toán 12 THPTQG, Lịch sử 12 THPTQG, phiếu học tập Toán 8, giáo án Ngữ văn 9, nhận xét học sinh và tin nhắn phụ huynh.
- Lưu lịch sử, mẫu cá nhân, ngân hàng câu hỏi, bản nháp biểu mẫu, công cụ yêu thích và công cụ gần đây.
- Sao lưu và khôi phục dữ liệu cục bộ bằng JSON.
- Metadata, favicon, app icons, manifest và OG image dùng asset local trong repo.
- Tích hợp tạo nội dung qua server-side AI provider tùy chọn (`local`, `openai`, `gemini`), luôn có fallback cục bộ khi thiếu API key.

## Giới hạn hiện tại

- Nội dung là bản nháp hỗ trợ giáo viên và cần giáo viên rà soát trước khi sử dụng.
- Chưa có tài khoản/đăng nhập.
- Chưa có đồng bộ cơ sở dữ liệu giữa thiết bị.
- Chưa có thanh toán.
- Chưa có OCR ảnh/PDF.
- Dữ liệu cá nhân lưu trong trình duyệt bằng `localStorage`; nếu xóa dữ liệu trình duyệt thì dữ liệu cục bộ có thể mất.

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Kiểm tra và build

```bash
npm run lint
npm run build
npm run smoke
```

## Triển khai Vercel

1. Import repository vào Vercel.
2. Giữ framework preset là Next.js.
3. Build command: `npm run build`.
4. Không cần biến môi trường bắt buộc.

Có thể đặt `NEXT_PUBLIC_APP_URL` thành domain chính thức để metadata và sitemap dùng URL production. Nếu không đặt, ứng dụng vẫn build và hoạt động.

AI provider là tùy chọn. Mặc định `AI_PROVIDER=local` và không cần API key. Xem [AI integration](docs/AI_INTEGRATION.md) để cấu hình OpenAI/Gemini trên server hoặc Vercel.

Ứng dụng không phụ thuộc đường dẫn Windows, dịch vụ trả phí hoặc ảnh hotlink bên ngoài. Logo và public assets nằm trong `public/`.

## Tài liệu

- [Kiểm thử](docs/TESTING.md)
- [Xuất tài liệu](docs/EXPORTS.md)
- [Chất lượng đầu ra](docs/OUTPUT_QUALITY.md)
- [Mẫu tài liệu](docs/DOCUMENT_TEMPLATES.md)
- [Checklist phát hành](docs/RELEASE_CHECKLIST.md)
- [Release notes](docs/RELEASE_NOTES.md)
- [AI integration](docs/AI_INTEGRATION.md)
- [Supabase setup](docs/SUPABASE_SETUP.md)
- [Auth](docs/AUTH.md)
- [Database](docs/DATABASE.md)

## Supabase Auth và cloud data

Soạn Lab hỗ trợ Supabase Auth/Postgres cho tài khoản giáo viên, role admin và lưu cloud cho lịch sử, mẫu cá nhân, ngân hàng câu hỏi, cài đặt tài liệu. Nếu chưa cấu hình Supabase, app vẫn chạy bằng localStorage trên trình duyệt.
