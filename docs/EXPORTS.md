# Xuất tài liệu trong Soạn Lab

Soạn Lab hỗ trợ giáo viên tạo bản nháp và xuất tài liệu bằng các định dạng quen thuộc.

## Định dạng hiện có

- **Word (`.docx`)**: dùng cho đề kiểm tra, phiếu học tập, giáo án, nhận xét, rubric và tài liệu giáo viên.
- **Print/PDF**: mở route `/print`, sau đó dùng hộp thoại in của trình duyệt để in hoặc lưu PDF.
- **Markdown (`.md`)**: dùng khi cần lưu nội dung dạng văn bản có cấu trúc.
- **TXT (`.txt`)**: dùng khi cần bản plain text UTF-8.

Tài liệu trong `/history` có thể mở lại và xuất lại.

## Đề kiểm tra THPTQG

Tài liệu từ công cụ **Tạo đề kiểm tra** dùng formatter riêng khi xuất Word/Print:

- Khổ A4, font Times New Roman, bố cục gọn theo phong cách đề thi.
- Header hai cột, dòng thông tin thí sinh, số báo danh và mã đề.
- PHẦN I/II/III được tách rõ.
- PHẦN I dùng câu trắc nghiệm A/B/C/D.
- PHẦN II dùng đúng/sai với các ý a), b), c), d).
- PHẦN III dùng câu trả lời ngắn.
- Đáp án giáo viên, gợi ý chấm, thang điểm, ma trận và bản đặc tả nằm trong phần giáo viên riêng.
- Đề đã lưu trong lịch sử vẫn dùng formatter này khi xuất lại.

Giáo viên cần mở file Word hoặc Print Preview để rà soát số trang, ngắt trang, mã đề, đáp án và nội dung chuyên môn trước khi dùng chính thức.

## Tài liệu ngoài đề thi

Các tài liệu như phiếu học tập, giáo án, nhận xét học sinh, rubric và tin nhắn phụ huynh dùng template tài liệu giáo viên:

- Có tiêu đề và thông tin chung rõ ràng.
- Bullet, heading và khoảng cách được dựng lại trong Word.
- Bảng rubric, ma trận và bảng hướng dẫn được chuyển thành bảng thật.
- Print/PDF dùng nền trắng, không kèm app chrome.

## Giới hạn

- PDF được tạo qua trình duyệt, không phải engine PDF phía server.
- Kết quả in có thể khác nhẹ giữa Chrome, Edge, Firefox và thiết lập máy in.
- Nội dung rất dài hoặc bảng phức tạp có thể cần giáo viên chỉnh lại trước khi in.
- Nội dung là bản nháp hỗ trợ giáo viên, không thay thế bước rà soát chuyên môn.
