# Xuất tài liệu trong Soạn Lab

Soạn Lab hỗ trợ nhiều định dạng xuất mà không cần dịch vụ trả phí:

- **Word (`.docx`)**: dùng cài đặt tên trường, giáo viên, tổ/bộ môn, năm học, font và cỡ chữ.
- **In / Lưu PDF**: mở route `/print`, sau đó dùng hộp thoại in của trình duyệt và chọn “Save as PDF”.
- **Markdown (`.md`)**: giữ tiêu đề, nội dung và xuống dòng để tái sử dụng trong trình soạn thảo.
- **TXT (`.txt`)**: file văn bản UTF-8 đơn giản, giữ tiếng Việt và thông tin tài liệu.

Trang chi tiết `/history/[id]` cung cấp đầy đủ thao tác xuất cho tài liệu đã lưu.

## Xuất Word dạng đề thi THPTQG

Tài liệu tạo từ công cụ **Tạo đề kiểm tra** tự động dùng bố cục đề thi Việt Nam khi xuất Word:

- Khổ A4 dọc, font Times New Roman và nhịp chữ gọn theo phong cách đề thi THPTQG.
- Header hai cột gồm Sở/Trường và Đề thi thử/Kỳ thi tốt nghiệp THPT/Môn/Thời gian.
- Dòng họ tên, số báo danh và hộp mã đề bốn chữ số nằm cùng hàng, có đường phân cách mảnh.
- Hỗ trợ định dạng PHẦN I/II/III; output cũ được ánh xạ trắc nghiệm vào PHẦN I và tự luận vào PHẦN III.
- Lựa chọn ngắn được xếp bảng 2x2; lựa chọn dài tự động xuống dòng.
- Footer trang học sinh có `Mã đề 0101` và trường động `Trang X/Y`.
- Đáp án, hướng dẫn chấm, ma trận và bản đặc tả bắt đầu ở trang dành cho giáo viên.
- Đề đã lưu trong lịch sử vẫn dùng đúng formatter này khi xuất lại.

Giáo viên cần mở file bằng Microsoft Word hoặc phần mềm tương thích, rà soát nội dung, số trang, mã đề và ngắt trang trước khi in chính thức.

## Giới hạn hiện tại

- PDF được tạo qua chức năng in của trình duyệt, không phải bộ dựng PDF phía server.
- Bố cục có thể khác nhau giữa Chrome, Edge, Firefox và thiết lập máy in.
- Bảng phức tạp hoặc nội dung rất dài có thể cần chỉnh trước khi in.
- Giáo viên phải rà soát nội dung và bản in trước khi sử dụng.
- Số trang trong header hiện là dòng gợi ý; footer dùng trường số trang động của Word.
- Bảng đáp án và ma trận được dựng từ nội dung mô phỏng; tài liệu có cấu trúc tùy chỉnh quá khác có thể dùng định dạng văn bản dự phòng.
- Hình/biểu đồ thật chưa được tạo; marker dạng `[Hình vẽ]` được thay bằng hộp minh họa.
