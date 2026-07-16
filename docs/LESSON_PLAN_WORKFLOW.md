# Quy trình Giáo án có cấu trúc

SOẠN LAB sử dụng một `LessonPlan` canonical cho dàn ý, chỉnh sửa, lịch sử, Word/PDF và các luồng tạo tài liệu liên quan.

## Quy trình

1. Chọn nguồn: chủ đề, tài liệu đã xác nhận, nội dung đã lưu hoặc giáo án cũ.
2. Kiểm tra mục tiêu, yêu cầu cần đạt, số tiết và thành phần bài dạy.
3. Tạo dàn ý; giáo viên chỉnh giai đoạn, thời lượng, thứ tự và tiết học.
4. Xác nhận tiến trình rồi tạo từng hoạt động; hoạt động thành công được giữ khi hoạt động khác lỗi.
5. Rà soát hành động giáo viên/học sinh, sản phẩm, minh chứng, phân hóa và tài liệu liên kết.
6. Lưu history hoặc xuất Word/PDF bằng hạ tầng hiện có.

## Nguyên tắc

- Tổng thời lượng, thứ tự, coverage mục tiêu và layout được kiểm tra deterministic, không gọi AI.
- Nội dung nhận dạng chỉ được dùng khi giáo viên đã xác nhận; slide ẩn và teacher-only không đi vào nguồn.
- Tạo lại hoạt động đã sửa cần chọn tạo bản sao hoặc thay thế; lần thay thế gần nhất có thể hoàn tác.
- Cache theo hash nguồn và dàn ý hoạt động; chỉ gửi phần nguồn liên quan.
- Giáo án là bản nháp hỗ trợ giáo viên, không được tuyên bố tự động đáp ứng quy định chính thức.
- RLS/store hiện có kiểm soát dữ liệu cloud; client không quyết định `user_id` khi lưu.

## Xuất và tích hợp

- Word: rút gọn, đầy đủ, bảng giáo viên/học sinh, tiến trình và phụ lục tham chiếu.
- PDF: dùng print pipeline; với bảng rộng nên ưu tiên Word.
- Worksheet, Lesson Slides, Rubric và kiểm tra nhanh dùng model/công cụ hiện có.
