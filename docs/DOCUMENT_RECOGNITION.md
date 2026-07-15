# Đọc đề từ ảnh/PDF

`/tools/document-recognition` là luồng nhập đề giấy, ảnh chụp, PDF quét và PDF hỗn hợp vào mô hình `StructuredExam` hiện có.

## Luồng xử lý

1. Trình duyệt xác thực phần mở rộng, MIME, chữ ký file, dung lượng và số trang.
2. PDF.js đọc lớp chữ của từng trang và phân loại `text_layer`, `scanned_image`, `mixed`, `empty` hoặc `unreadable`.
3. Trang có lớp chữ dùng parser quyết định hiện có. Chỉ trang quét/hỗn hợp mới được render thành ảnh và gửi tới API nhận dạng.
4. Kết quả được lưu thành các khối có loại, hộp giới hạn, thứ tự đọc, quan hệ câu hỏi và độ tin cậy.
5. Giáo viên chỉnh chữ/LaTeX/bảng, gộp/tách/sắp xếp/gắn khối, loại trang hoặc xác nhận nội dung chưa chắc chắn.
6. Sau khi vượt qua kiểm tra chặn, kết quả được chuẩn hóa thành `StructuredExam`, chạy Exam Auditor và dùng chung cho preview, lịch sử, lời giải, trộn mã, Word/PDF và ngân hàng câu hỏi.

## Giới hạn và bảo mật

- Ảnh PNG/JPG/JPEG/WEBP tối đa 10 MB; PDF tối đa 40 MB và 30 trang. HEIC và PDF có mật khẩu chưa hỗ trợ.
- API yêu cầu phiên đăng nhập khi cloud auth được cấu hình, kiểm tra bảo trì trước khi gọi nhận dạng và không nhận `user_id` từ client.
- Draft cloud dùng RLS hiện có; ảnh gốc dung lượng lớn không được lưu lâu dài hay đưa vào public asset.
- Kết quả theo trang được cache cục bộ bằng hash. Một trang lỗi không xóa các trang đã thành công.
- Tiền xử lý v1 sửa EXIF, phát hiện biên trang sáng khi nền đủ tương phản, cho xoay 90 độ, chuẩn hóa kích thước/độ tương phản và phát hiện trang trắng. Căn nghiêng/phối cảnh tự động nâng cao chưa thay thế bước cắt ảnh thủ công.
- Nhận dạng chữ viết tay, công thức mờ, bảng phức tạp và hình nhỏ là best effort; khối độ tin cậy thấp bắt buộc giáo viên xác nhận.
- Bộ fixture tổng hợp chỉ dùng hồi quy quyết định, không chứng minh độ chính xác ảnh thực tế.

## Kiểm thử

```bash
npm run document:recognition-test
npm run lint
npm run build
npm run test
npm run smoke
```

Bộ fixture nằm tại `tests/fixtures/document-recognition`. Có thể tái tạo bằng `node scripts/create-document-recognition-fixtures.mjs`.
