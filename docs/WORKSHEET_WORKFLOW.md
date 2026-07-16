# Phiếu học tập có cấu trúc

Route chính: `/tools/worksheet-generator`. Route tương thích `/tools/worksheet` chuyển về route chính.

## Quy trình

1. Chọn nguồn: chủ đề, giáo án, tài liệu đã xác nhận hoặc nội dung đã lưu.
2. Thiết lập mục đích, thời lượng, hình thức, phân hóa, số hoạt động và đầu ra.
3. Tạo dàn ý xác định; giáo viên sửa loại, mức độ, thứ tự trước khi xác nhận.
4. Tạo từng hoạt động, giữ hoạt động thành công nếu hoạt động khác lỗi.
5. Chỉnh sửa cấu trúc, đáp án, vùng trả lời, điểm và ghi chú giáo viên.
6. Xuất riêng Word/PDF học sinh và giáo viên; phiếu phân hóa có thể tải ZIP Word.

`Worksheet` trong `lib/worksheet/types.ts` là cấu trúc canonical cho editor, history, export và chuyển đổi tiếp theo. Bản học sinh được dựng trực tiếp từ cấu trúc và không chứa đáp án, giải thích hoặc ghi chú giáo viên.

## Nguồn và an toàn

- Slide ẩn, block chỉ dành cho giáo viên và speaker notes không được đưa vào nguồn học sinh.
- Tài liệu nhận dạng chỉ dùng block đã rà soát khi trạng thái tài liệu đã xác nhận.
- Chế độ chỉ dùng nguồn không tự bổ sung kiến thức ngoài tài liệu.
- Câu hỏi đưa vào Ngân hàng câu hỏi được lọc theo loại, quyền sở hữu hiện có và khóa nội dung chống trùng.
- Tool dùng `requireUser`, maintenance guard và RLS của bảng `documents`; không cần migration mới.

PDF dùng trang in hiện có. Nếu hình/TikZ chưa có tài sản render ổn định, Word vẫn là đầu ra chính và giáo viên được yêu cầu rà soát.
