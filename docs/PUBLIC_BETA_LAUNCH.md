# Public beta launch checklist

Production URL: `https://soanlab.ducduytran.shop`

Soạn Lab đang ở bản thử nghiệm dành cho giáo viên. Không hứa hẹn nội dung chính xác tuyệt đối; mọi nội dung tạo tự động là bản nháp tham khảo và cần giáo viên rà soát.

## Tài khoản kiểm thử

- Tài khoản giáo viên: `<teacher-test-email>`
- Mật khẩu: không ghi mật khẩu thật trong tài liệu này.
- Tài khoản admin: `<admin-test-email>`
- Mật khẩu: không ghi mật khẩu thật trong tài liệu này.

## Trước khi đăng lên Facebook

- Mở `/login`, xác nhận không còn lỗi 405.
- Đăng nhập giáo viên, mở dashboard.
- Bấm một mẫu “Dùng thử nhanh”.
- Tạo thử đề kiểm tra.
- Xuất Word và PDF/Print.
- Lưu lịch sử, mở lại tài liệu.
- Mở Ngân hàng câu hỏi, xác nhận thấy “Ngân hàng Soạn Lab” và “Ngân hàng của tôi” tách riêng.
- Gửi góp ý bằng nút “Góp ý”.
- Đăng nhập admin và kiểm tra `/admin/feedback`.
- Đăng xuất, xác nhận không redirect về localhost.
- Kiểm tra mobile: landing, login, dashboard, exam generator, feedback modal.

## Những điều không nên hứa công khai

- Không nói nội dung chính xác 100%.
- Không nói thay thế giáo viên.
- Không nói có bản quyền/chính thức theo sách giáo khoa nếu chưa được xác minh.
- Không nhắc giá, thanh toán hoặc gói trả phí trong giai đoạn này.
- Không công bố API key, service role key, mật khẩu test hoặc thông tin nội bộ.

## Known limitations

- Nội dung tạo tự động có thể sai chuyên môn, đáp án, định dạng hoặc cách diễn đạt.
- Ngân hàng câu hỏi mẫu chỉ là dữ liệu tham khảo ban đầu.
- 3D simulation là beta, dùng để minh họa chứ không phải mô hình kỹ thuật chính xác.
- Image to LaTeX/TikZ hoạt động tốt nhất khi ảnh được cắt gọn và rõ nét.

## Cách xem feedback

1. Đăng nhập bằng tài khoản admin.
2. Mở `/admin/feedback`.
3. Ưu tiên xử lý các lỗi: đăng nhập, xuất Word/PDF, câu hỏi sai đáp án, form khó dùng.
4. Tổng hợp góp ý theo công cụ để quyết định batch tiếp theo.

## Gợi ý bài đăng Facebook

Chào thầy cô, em đang thử nghiệm Soạn Lab — một bộ công cụ hỗ trợ giáo viên tạo bản nháp tài liệu dạy học nhanh hơn.

Hiện Soạn Lab có thể hỗ trợ:

- Tạo đề kiểm tra, đáp án, thang điểm, ma trận.
- Tạo phiếu học tập, giáo án, nhận xét học sinh.
- Quản lý ngân hàng câu hỏi cá nhân và tham khảo câu hỏi mẫu.
- Xuất Word/PDF để thầy cô chỉnh sửa lại.
- Chuyển ảnh công thức sang LaTeX/TikZ và tạo mô phỏng 3D đơn giản.

Đây là bản beta nên nội dung có thể còn sai sót. Em rất mong thầy cô dùng thử, xuất thử file Word/PDF và gửi góp ý để Soạn Lab hoàn thiện hơn.

Link dùng thử: https://soanlab.ducduytran.shop

Lưu ý: Nội dung tạo tự động chỉ là bản nháp tham khảo, thầy cô cần kiểm tra lại trước khi sử dụng chính thức.
