# Soạn Lab - kiểm tra phát hành

## Đã sẵn sàng

- Các workflow chính hỗ trợ giáo viên tạo bản nháp tài liệu.
- Xuất Word, Markdown, TXT và in/lưu PDF.
- Đề kiểm tra hỗ trợ cấu trúc THPTQG gồm PHẦN I trắc nghiệm, PHẦN II đúng/sai, PHẦN III trả lời ngắn và đáp án giáo viên tách riêng.
- Lịch sử, bản nháp, mẫu, ngân hàng câu hỏi và dữ liệu cục bộ bằng localStorage.
- Backup/restore JSON, command palette, favorites và recent tools.
- Trang chia sẻ, hướng dẫn và checklist kiểm tra.

## Cần kiểm tra thủ công

1. Mở `/dashboard`, `/tools`, `/privacy` và `/terms` để đối chiếu phạm vi chức năng hiện tại.
2. Mở `/tools`, dùng công cụ tạo đề và phiếu học tập.
3. Tạo bản nháp, xuất Word, in/lưu PDF và lưu lịch sử.
4. Mở lại tài liệu từ `/history` và xuất lại.
5. Xuất backup tại `/data`, thử restore và kiểm tra dữ liệu.
6. Kiểm tra mobile, command palette và các empty state.

## Nội dung nhắc giáo viên

Nội dung được tạo tự động là bản nháp hỗ trợ giáo viên. Giáo viên cần rà soát chuyên môn, đáp án, thang điểm và định dạng trước khi sử dụng.

## Checklist phát hành

- Chạy `npm run lint`, `npm run build`, `npm run smoke`.
- Kiểm tra `/tools`, `/privacy` và `/terms`; `/pricing` phải redirect về `/` trong bản thử nghiệm giáo viên.
- Test dashboard, tools, history, export, backup và mobile trên URL deploy.
- Xác nhận không có CTA công khai tới `/feedback`.
