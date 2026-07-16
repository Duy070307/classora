# Ma trận & bảng đặc tả

Route giáo viên: `/tools/exam-blueprint`.

## Luồng chính

- Tạo ma trận mới và kiểm tra tổng số câu, điểm, tỉ lệ, mức độ nhận thức.
- Tạo bảng đặc tả liên kết với từng chủ đề; chỉnh đặc tả không tự ghi đè ma trận.
- Suy ra ma trận từ `StructuredExam` mà không thay đổi đề nguồn.
- Đối chiếu số câu, điểm, dạng câu, chủ đề và mức độ nhận thức.
- Chuyển blueprint đã xác nhận sang pipeline `FileExamGenerator` hiện có.
- Xuất `.xlsx` chỉnh sửa được và `.docx` ngang; PDF chưa được cung cấp vì bảng rộng chưa có pipeline ổn định.

## Dữ liệu và quyền sở hữu

`ExamBlueprint` trong `lib/exam-source/types.ts` là mô hình canonical cho editor, đặc tả, generation, history, comparison và export. Blueprint lưu qua bảng `exam_blueprints` hiện có và tài liệu history; RLS gắn dữ liệu với `auth.uid()`.

Không có API AI riêng. Gợi ý mức độ trong phiên bản này dựa trên động từ hành động, luôn cần giáo viên xác nhận. Các phép tính tổng, validation, comparison và export đều xác định.

## Đồng bộ an toàn

- Sửa ma trận không sửa đề đã có.
- Sửa bảng đặc tả chỉ hiện tác động; giáo viên phải xác nhận trước khi đồng bộ ngược.
- Đối chiếu không xóa, chuyển hoặc tái tạo câu hỏi.
- Tạo đề chỉ bắt đầu sau khi validation hợp lệ và giáo viên xác nhận.
