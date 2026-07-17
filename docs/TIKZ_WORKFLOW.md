# Quy trình TikZ trong SOẠN LAB

SOẠN LAB dùng một quy trình duy nhất tại `/tools/image-to-latex?mode=geometry` cho ảnh hình học, mô tả hình, mã TikZ có sẵn và mẫu từ Ngân hàng TikZ. Không có công cụ TikZ thứ hai.

## Mô hình dữ liệu

`TikzDiagramDraft` là nguồn dữ liệu canonical cho:

- nguồn ảnh hoặc mã cũ;
- phân loại hình và độ tin cậy;
- đối tượng có ID ổn định;
- quan hệ hình học độc lập;
- TikZ được dựng deterministic;
- kiểm tra cú pháp, semantic, bố cục và so sánh;
- chỉnh sửa của giáo viên;
- dữ liệu History.

Bản ghi cũ chỉ có `tikz_code`, `content` hoặc `standaloneLatex` được chuyển qua adapter tương thích và không bị xóa.

## Xử lý và dựng hình

Ảnh PNG/JPG/WEBP tối đa 10 MB được kiểm tra MIME, phần mở rộng và tính hợp lệ. Pipeline Sharp sửa EXIF orientation, xoay theo lựa chọn, chuẩn hóa độ phân giải, grayscale/contrast và sharpening nhẹ. Kết quả được cache trong bộ nhớ theo hash ảnh cùng thiết lập; ảnh nguồn không được tạo URL công khai.

AI chỉ hỗ trợ phân loại và nhận diện thành phần từ ảnh. Mã cuối được chuẩn hóa hoặc dựng lại từ đối tượng semantic. Các thao tác đổi nhãn, di chuyển điểm, đổi kiểu cạnh và thêm dấu vuông góc cập nhật model trước rồi mới dựng TikZ.

## Preview và export

Preview SVG và PNG được dựng deterministic từ model semantic. Có thể tải:

- snippet `.tex`;
- standalone `.tex`;
- SVG;
- PNG độ phân giải cao;
- ZIP gồm TEX, standalone TEX, SVG, PNG và README.

Môi trường hiện tại chưa tích hợp TeX compiler cô lập. Vì vậy preview SVG/PNG và kiểm tra cú pháp không được mô tả là “biên dịch LaTeX thành công”; PDF TikZ chỉ nên bật khi có compiler sandbox đáp ứng timeout, giới hạn tài nguyên, không shell escape và dọn thư mục tạm.

## An toàn

Pipeline từ chối `write18`, `openin`, `openout`, `read`, include/input tệp, path traversal, URL từ xa, externalization và Lua execution. API render yêu cầu phiên đăng nhập khi hệ thống auth được cấu hình, kiểm tra maintenance ở server và không tin `user_id` từ client.

## Giới hạn chất lượng

Biên dịch thành công và đúng semantic là hai kiểm tra khác nhau. Hình có confidence thấp, thiếu đối tượng, thiếu quan hệ hoặc thuộc lớp chưa hỗ trợ phải giữ trạng thái cần rà soát. Ảnh nguồn luôn được giữ để giáo viên đối chiếu; hệ thống không tự thay hình trong tài liệu khi chưa được giáo viên xác nhận.
