# Chấm bài

`/tools/grading-assistant` là không gian chấm bài có giáo viên kiểm soát cuối cùng. Luồng gồm: chọn đề/đáp án, tải bài, nhận dạng, kiểm tra nhận dạng, chấm điểm, giáo viên rà soát, xác nhận và xuất.

## Nguồn đề

- Đề có `StructuredExam` trong lịch sử.
- Đề đã kiểm tra hoặc có bộ lời giải/đáp án.
- Bộ mã đề từ Exam Mixer; từng bài phải có mã đề đã xác nhận.
- Rubric trong lịch sử cho bài tự luận độc lập.
- Đáp án dán thủ công theo dạng `1: A`.

Đề thiếu cấu trúc, ID câu hỏi, đáp án hoặc thang điểm bị chặn. Đề chưa xác minh có cảnh báo và giáo viên chịu trách nhiệm khi tiếp tục.

## Bài làm và nhận dạng

- Hỗ trợ PNG, JPG/JPEG, WEBP, PDF, DOCX, TXT và ZIP an toàn.
- Giới hạn 100 bài, 30 trang mỗi bài, 10 MB mỗi ảnh, 40 MB mỗi PDF và 200 MB mỗi bộ.
- PDF/ảnh dùng lại pipeline chuẩn hóa trang hiện có; DOCX/TXT dùng lớp chữ.
- Kết quả độ tin cậy thấp, nhiều lựa chọn, tẩy xóa hoặc mã đề chưa rõ luôn chờ giáo viên xác nhận.
- Ảnh nguồn chỉ dùng trong phiên rà soát. Lịch sử loại `previewUrls` và `sourceCrop` trước khi lưu.

## Chấm điểm

Trắc nghiệm, Đúng/Sai và trả lời số được chấm xác định, không gọi AI. Bộ máy hỗ trợ dấu phẩy thập phân, phân số tương đương, dung sai, đơn vị, nhiều đáp án được giáo viên chấp nhận, quy tắc làm tròn và loại câu lỗi.

Câu trả lời mở/rubric chỉ nhận điểm gợi ý. Giáo viên phải bấm duyệt từng gợi ý và xác nhận từng bài. Mọi chỉnh điểm lưu giá trị trước/sau, thời gian và lý do. Đổi đáp án có thể chấm lại riêng câu bị ảnh hưởng; điểm đã xác nhận trở lại trạng thái chờ rà soát.

## Xuất và riêng tư

- Bảng điểm XLSX và CSV UTF-8.
- Báo cáo DOCX và PDF qua luồng In/lưu PDF hiện có.
- ZIP phiếu kết quả của các bài đã xác nhận.
- Phiếu học sinh mặc định không lộ đáp án đầy đủ, dữ liệu độ tin cậy, vùng ảnh, thông tin nhận dạng hay thông tin hạ tầng.

Grading job được lưu dưới loại lịch sử `Bộ bài đã chấm` trong bảng `documents`, vì vậy không cần migration mới và tiếp tục dùng RLS sở hữu hiện có. Không truyền `user_id` từ client và không tạo URL công khai cho bài học sinh.

## Giới hạn v1

- Chất lượng chữ viết tay phụ thuộc độ rõ của ảnh và luôn cần kiểm tra trực quan.
- Không lưu ảnh/PDF nguồn vào lịch sử; mở lại job vẫn có điểm và câu trả lời nhưng không còn ảnh crop.
- PDF báo cáo dùng hộp thoại in của trình duyệt.
- Rubric không có dòng `Tổng điểm` rõ ràng cần giáo viên tự đối chiếu tổng điểm.

Chạy kiểm thử lõi bằng `npm run grading:test`.
