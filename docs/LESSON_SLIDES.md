# Slide bài giảng và PowerPoint

## Luồng sử dụng

`/tools/lesson-slides` dùng một mô hình `SlideDeck` duy nhất cho dàn ý, editor, lịch sử và xuất PowerPoint. Giáo viên chọn một trong bốn nguồn: nhập chủ đề, giáo án, tài liệu DOCX/PDF/PPTX/TXT hoặc nội dung đã lưu.

Quy trình có hai bước rõ ràng:

1. Tạo và chỉnh dàn ý; thao tác này không gọi AI cho cả bộ slide.
2. Sau khi xác nhận, nội dung được tạo lần lượt từng slide. Slide thành công được giữ nguyên nếu slide khác thất bại.

Nội dung là bản nháp. Giáo viên cần kiểm tra kiến thức, công thức, đáp án, hình ảnh và mật độ chữ trước khi trình chiếu.

## Editor và theme

Editor có danh sách slide, canvas tỷ lệ 16:9 hoặc 4:3 và bảng thuộc tính. Các khối hỗ trợ gồm văn bản, bullet, công thức LaTeX, bảng, câu hỏi, quy trình, callout, ảnh và TikZ. Năm theme dùng font phổ biến có hỗ trợ tiếng Việt.

TikZ phải có tài sản SVG/PNG đã kết xuất trước khi xuất file; mã TikZ nguồn vẫn được giữ trong `SlideDeck`. Công thức giữ LaTeX và dùng ảnh SVG độ phân giải độc lập khi PowerPoint không có phương trình native.

## Xuất PowerPoint

PptxGenJS tạo `.pptx` thật:

- văn bản, shape và bảng có thể chỉnh sửa;
- ảnh giữ tỷ lệ;
- đúng tỷ lệ 16:9 hoặc 4:3;
- bản học sinh loại ghi chú giáo viên, khối teacher-only và đáp án không chọn hiện ngay;
- bản giáo viên chứa speaker notes, đáp án và gợi ý giảng dạy.

Xuất file đi qua API có xác thực và kiểm tra bảo trì. Không có provider, model, prompt, dữ liệu chẩn đoán hoặc khóa API trong file.

PDF slide chưa được xuất trực tiếp vì dự án chưa có bộ chuyển PowerPoint sang PDF đủ tin cậy. PPTX là định dạng chính trong phiên bản này.

## Hiệu năng, lịch sử và bảo mật

- Cache nội dung theo hash dàn ý slide và hash nguồn.
- Không gọi AI để tính bố cục hoặc xuất PowerPoint.
- Autosave được debounce, không tạo snapshot cho mỗi lần gõ.
- Tài liệu cloud tiếp tục chịu RLS hiện có; API không nhận `user_id` từ client.
- Giáo viên bị chặn khi bảo trì; admin dùng chính sách bypass hiện có.

## Kiểm thử

Chạy `npm run lesson:slides-test` để kiểm tra 30 tình huống gồm outline, ID/thứ tự, mật độ, công thức/TikZ/bảng/ảnh, tách bản học sinh–giáo viên, cấu trúc PPTX, tiếng Việt, nguồn PPTX, bảo trì và không lộ bí mật.
