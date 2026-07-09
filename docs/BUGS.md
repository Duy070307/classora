# Bugs and known limitations

## Đã xử lý cho đợt teacher testing

- Ký hiệu toán/logic bị lỗi khi preview/export: đã thêm chuẩn hóa phổ biến và font toán trong Word.
- Markdown `**...**` lộ trong output: đã thêm sanitizer dùng chung.
- Giáo án nghe quá “chính thức”: đã đổi wording sang bản nháp tham khảo và thêm ghi chú rà soát.
- Mục tiêu giáo án chưa theo Bloom: đã cập nhật prompt, fallback và form nhập liệu.
- Route demo/QA cũ: đã redirect khỏi giao diện giáo viên.

## Giới hạn còn lại

- Nội dung tạo tự động vẫn có thể sai chuyên môn, đáp án, định dạng hoặc cách diễn đạt.
- Công thức phức tạp vẫn nên được giáo viên kiểm tra lại trong Word sau khi mở file.
- Nhận diện ảnh công thức/hình học phụ thuộc chất lượng ảnh đã cắt gọn; chưa phải OCR PDF nguyên trang.
- TikZ và mô phỏng 3D là bản nháp hỗ trợ minh họa, không đảm bảo chính xác tuyệt đối về vị trí, tỉ lệ hoặc chuyển động.
- AI-assisted question import chỉ hỗ trợ giáo viên rà soát trước khi lưu; không nên tự động nhập toàn bộ nếu dữ liệu chưa chắc chắn.
