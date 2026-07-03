# Soạn Lab - hướng dẫn kiểm tra nội bộ

Tài liệu này lưu lại các bước kiểm tra cũ dưới dạng quy trình nội bộ. Trải nghiệm công khai không quảng bá trang thu góp ý.

## Đã sẵn sàng

- Giao diện responsive và thư mục công cụ.
- Các workflow hỗ trợ giáo viên tạo bản nháp.
- Lưu lịch sử, mẫu, cài đặt và ngân hàng câu hỏi bằng localStorage.
- Tự lưu bản nháp form và khôi phục tại `/drafts`.
- Tìm nhanh bằng Ctrl/Cmd + K, công cụ yêu thích và danh sách dùng gần đây.
- Xuất Word, Print/PDF, Markdown và TXT.
- Trang mẫu sử dụng, chia sẻ, hướng dẫn và trạng thái hệ thống.

## Cách kiểm tra

1. Mở `/getting-started`.
2. Mở `/samples` và thử ít nhất 3 mẫu.
3. Tạo bản nháp từ đề kiểm tra, phiếu học tập và nhận xét học sinh.
4. Xuất và mở file Word.
5. In hoặc lưu PDF.
6. Lưu lịch sử, mở lại và xuất lại.
7. Xuất backup tại `/data` trước khi reset dữ liệu lớn.

## Tiêu chí rà soát

- Form nhập liệu dễ hiểu.
- Nội dung đầu ra là bản nháp có thể chỉnh sửa.
- File Word/PDF dùng được cho quy trình giáo viên.
- Nội dung có nhắc giáo viên rà soát trước khi sử dụng.
- Không có CTA công khai tới `/feedback`.

## Giới hạn đã biết

- Dữ liệu chỉ nằm trong localStorage.
- Xóa dữ liệu trình duyệt có thể làm mất dữ liệu.
- Backup JSON chỉ khôi phục dữ liệu Soạn Lab trên trình duyệt được nhập file; chưa có đồng bộ cloud.
