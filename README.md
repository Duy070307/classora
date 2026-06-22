# Soạn Lab

Soạn Lab là bộ công cụ hỗ trợ giáo viên Việt Nam soạn đề, tạo tài liệu, viết nhận xét học sinh và xuất Word/PDF nhanh hơn.

## Tính năng hiện tại

- Tạo đề kiểm tra theo cấu trúc PHẦN I/II/III, đáp án, thang điểm, ma trận và bản đặc tả.
- Xuất Word và Print/PDF theo bố cục đề thi THPTQG.
- Tạo phiếu học tập, kế hoạch bài dạy, rubric, nhận xét học sinh và tin nhắn phụ huynh.
- Lưu lịch sử, mẫu tài liệu, ngân hàng câu hỏi, bản nháp biểu mẫu, công cụ yêu thích và gần đây.
- Sao lưu và khôi phục dữ liệu cục bộ bằng JSON.
- Xuất Word, Print/PDF, Markdown và TXT.

## Kiến trúc

- Next.js App Router, React, TypeScript và Tailwind CSS.
- Thư viện `docx` để tạo file Word.
- Nội dung được tạo cục bộ từ các bộ mẫu theo môn và loại tài liệu.
- Dữ liệu cá nhân lưu trong `localStorage` của trình duyệt.
- Hiện chưa có tài khoản, cơ sở dữ liệu, thanh toán hoặc OCR.

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
npm run start
```

## Triển khai Vercel

1. Import repository vào Vercel.
2. Giữ framework preset là Next.js.
3. Build command: `npm run build`.
4. Không cần biến môi trường bắt buộc.

Có thể đặt `NEXT_PUBLIC_APP_URL` thành domain chính thức để metadata và sitemap sử dụng URL production. Nếu không đặt, ứng dụng vẫn build và hoạt động.

Ứng dụng không phụ thuộc đường dẫn Windows, dịch vụ trả phí hoặc ảnh hotlink bên ngoài. Logo nằm trong `public/brand`.

## Hỗ trợ xuất tài liệu

- Đề thi: Word và Print/PDF theo bố cục THPTQG, kèm trang giáo viên.
- Tài liệu giáo viên: Word và Print/PDF với tiêu đề, bullet và bảng thật.
- Tất cả tài liệu: Markdown và TXT.
- Tài liệu đã lưu tại `/history` có thể mở và xuất lại.

## Giới hạn hiện tại

- Nội dung là bản nháp hỗ trợ soạn tài liệu và cần giáo viên rà soát chuyên môn.
- Dữ liệu chưa đồng bộ giữa thiết bị và có thể mất nếu xóa dữ liệu trình duyệt.
- Chưa có đăng nhập, cơ sở dữ liệu, thanh toán, OCR ảnh/PDF hoặc tạo hình phức tạp.
- Bản in có thể khác nhau nhẹ giữa các trình duyệt; cần xem Print Preview trước khi sử dụng.

## Tài liệu

- [Kiểm thử](docs/TESTING.md)
- [Xuất tài liệu](docs/EXPORTS.md)
- [Chất lượng đầu ra](docs/OUTPUT_QUALITY.md)
- [Mẫu tài liệu](docs/DOCUMENT_TEMPLATES.md)
- [Checklist phát hành](docs/RELEASE_CHECKLIST.md)
- [Lộ trình](docs/ROADMAP.md)
