# Phiếu trả lời SOẠN LAB

## Mục tiêu

`/tools/answer-sheet` tạo phiếu trả lời có bố cục xác định để giáo viên in, học sinh điền và tải ảnh trở lại công cụ Chấm bài. Phiếu chuẩn giúp phần khách quan dùng nhận diện bubble thay vì nhận diện ngữ nghĩa tổng quát.

## Nguồn và cấu trúc

- Đề có cấu trúc, đề đã kiểm tra, một mã đề hoặc toàn bộ bộ mã đề.
- Chế độ thủ công khi chưa có đề; giáo viên phải chọn đáp án phù hợp khi chấm.
- Trắc nghiệm A/B/C/D, đúng/sai theo từng mệnh đề, trả lời ngắn tự do/có cấu trúc và vùng tự luận tùy chọn.
- Một `AnswerSheetTemplate` và `AnswerSheetLayout` duy nhất được dùng cho preview, PDF, lịch sử và recognition map.

## QR và quyền riêng tư

QR chỉ chứa phiên bản, template ID, tham chiếu đề, mã đề, số trang và checksum. QR không chứa đáp án, tên/mã học sinh, email, URL lưu trữ hoặc thông tin dịch vụ. Checksum hiện dùng để phát hiện sai hỏng, không phải chữ ký mật mã. Quyền truy cập vẫn được kiểm tra bằng phiên đăng nhập và `user_id` của bản ghi tài liệu trên máy chủ.

## PDF và Word

PDF là định dạng chính. Nội dung chữ, đường, bubble và anchor được vẽ dạng vector; QR được tạo cục bộ và nhúng sắc nét. Khổ giấy dùng kích thước vật lý A4/A5. Word không được cung cấp trong phiên bản này vì DOCX có thể tái bố cục và làm lệch tọa độ nhận diện.

## Nhận diện

Ảnh PNG/JPEG/WEBP được kiểm tra đăng nhập và bảo trì trước khi xử lý. Máy chủ đọc QR, xác minh template thuộc giáo viên, căn theo anchor, dùng độ phủ mực và nền cục bộ để phân loại `blank`, `selected`, `faint_selected`, `crossed_out`, `multiple_selected`, `unclear` hoặc `damaged`. Các câu trung bình/thấp luôn cần giáo viên rà soát.

Không gọi AI cho bubble rõ, tính điểm, ánh xạ câu hoặc xuất PDF. Nhận diện tổng quát hiện có chỉ dành cho bài thường, câu viết tay và trường hợp phiếu hỏng nặng.

## Giới hạn

- Checksum không phải chữ ký mật mã vì batch này không thêm secret mới.
- Phiếu hai bản trên A4 cần được cắt theo đường nét đứt trước khi chụp/quét.
- Nhận dạng tên và câu trả lời ngắn viết tay vẫn là gợi ý.
- Chưa xác minh bằng máy in và camera thật; fixtures hiện dùng ảnh render, xoay, tạo bóng và biến dạng phối cảnh tổng hợp.
- Không lưu ảnh nguồn trong lịch sử; ảnh chỉ tồn tại trong phiên rà soát hiện tại.
