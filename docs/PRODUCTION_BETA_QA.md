# Production Beta QA — SOẠN LAB

- Ngày kiểm tra: 11/07/2026
- Domain production: `https://soanlab.ducduytran.shop`
- Viewport mobile: 390 × 844
- Phạm vi: public production + local runtime + kiểm thử tự động. Không dùng tài khoản/mật khẩu thật trong tài liệu này.
- Quy ước: **Đạt**, **Đạt tự động**, **Chờ tài khoản**, **Chờ deploy**, **Chưa chạy**.

## 1. Route checklist

| Route | Production GET | Mobile 390px | Kết quả thực tế |
|---|---:|---:|---|
| `/` | 200 | Không tràn ngang | Đạt |
| `/login` | 200, có form đăng nhập | Không tràn ngang | Đạt; không còn HTTP 405 |
| `/register` | 200, đăng ký vẫn khóa | Không tràn ngang | Đạt |
| `/dang-ky-dung-thu` | 200 | Không tràn ngang | Đạt |
| `/tools` | 200 | Không tràn ngang | Đạt |
| `/dashboard` | Chuyển `/login?next=%2Fdashboard` khi chưa đăng nhập | Không tràn ngang | Đạt |
| `/question-bank` | Chuyển login khi chưa đăng nhập | Không tràn ngang tại trang login | Đạt kiểm soát truy cập |
| `/tikz-bank` | Chuyển login khi chưa đăng nhập | Không tràn ngang tại trang login | Đạt kiểm soát truy cập |
| `/history` | Chuyển login khi chưa đăng nhập | Không tràn ngang tại trang login | Đạt kiểm soát truy cập |
| `/tools/exam-generator` | Chuyển login khi chưa đăng nhập | Không tràn ngang tại trang login | Đạt kiểm soát truy cập |
| `/tools/worksheet-generator` | Chuyển login khi chưa đăng nhập | Không tràn ngang tại trang login | Đạt kiểm soát truy cập |
| `/tools/lesson-plan-generator` | Chuyển login khi chưa đăng nhập | Không tràn ngang tại trang login | Đạt kiểm soát truy cập |
| `/tools/image-to-latex` | Chuyển login khi chưa đăng nhập | Không tràn ngang tại trang login | Đạt kiểm soát truy cập |
| `/tools/3d-animation` | Chuyển login khi chưa đăng nhập | Không tràn ngang tại trang login | Đạt kiểm soát truy cập |
| `/admin` | Chuyển login khi chưa đăng nhập | Không tràn ngang tại trang login | Đạt kiểm soát truy cập |
| `/admin/feedback` | Chuyển login khi chưa đăng nhập | Không tràn ngang tại trang login | Đạt kiểm soát truy cập |
| `/admin/beta-requests` | Chuyển login khi chưa đăng nhập | Không tràn ngang tại trang login | Đạt kiểm soát truy cập |

Không phát hiện trang trắng, error boundary hoặc lỗi console trong lượt duyệt route local. Production không chuyển về localhost.

## 2. Topic-fidelity matrix

| Trường hợp | Kiểm tra | Kết quả |
|---|---|---|
| Vật lí 11 — Định luật Ohm | U, I, R hợp lệ; từ trường/cảm ứng/dao động/xác suất bị loại | Đạt tự động |
| Vật lí 10 — chỉ định luật II Newton | F = ma hợp lệ; quán tính và lực–phản lực bị loại theo yêu cầu | Đạt tự động |
| Vật lí 10 — chỉ lý thuyết | Câu có tính toán/số liệu bị loại | Đạt tự động |
| Vật lí 10 — chỉ tính toán | Câu hỏi định nghĩa thuần túy bị loại | Đạt tự động |
| Hóa học 10 — Cấu tạo nguyên tử | proton/neutron/electron hợp lệ; cân bằng/polymer/điện học bị loại | Đạt tự động |
| Hóa học 12 — Ester–lipid | ester/chất béo/thủy phân/xà phòng hóa hợp lệ; cấu tạo nguyên tử/điện học bị loại | Đạt tự động |
| Toán 12 — Xác suất, system bank | Không lấy Vật lí/Hóa học, không dùng fallback ngoài chủ đề | Đạt tự động |
| Đổi Toán sang Vật lí | Effect xóa document cũ khi bộ lọc thay đổi | Đạt kiểm tra mã/build; chờ tài khoản để thao tác UI production |

Tổng: 32/32 assertion topic fidelity và 8/8 assertion question-bank filtering đạt.

## 3. Teacher workflow matrix

| Luồng | Kết quả thực tế |
|---|---|
| Login/logout teacher | Login page production đạt; cần tài khoản teacher QA để kiểm tra phiên đầy đủ |
| System question visibility | RLS cho phép system + own; test filter đạt; chờ tài khoản production để kiểm tra dữ liệu thật |
| Personal question isolation | RLS giới hạn `user_id = auth.uid()`; kiểm tra security đạt |
| Chỉnh sửa/xóa system row | UI chặn; RLS chặn update/delete với teacher |
| Tạo/sửa/xóa own row | Luồng mã và RLS đạt; chờ tài khoản production để thao tác dữ liệu thật |
| Combined bank source | 8/8 assertion filtering đạt |
| Feedback | API yêu cầu đăng nhập khi cloud hoạt động; modal giữ lỗi trong trang; chờ tài khoản production để gửi bản ghi thật |
| History reopen | JSON round-trip giữ nguyên `structuredExam`, source metadata và request context — đạt tự động |

## 4. Admin workflow matrix

| Luồng | Kết quả thực tế |
|---|---|
| Public/teacher access admin API | Public nhận 401; page dùng `requireAdmin` hoặc kiểm tra role — đạt |
| Beta request list/approve/reject/note | API kiểm tra role, UUID, payload và trả lỗi thân thiện; chờ tài khoản admin production để thao tác bản ghi thật |
| Counters update | Component cập nhật từ response đã validate; chờ test production có tài khoản |
| Feedback newest first | Query `created_at desc`; chờ tài khoản admin để xác nhận dữ liệu thật |
| TikZ JSON/ZIP import | Manifest, raw array, ZIP root và ZIP một cấp: 60/60 — đạt tự động |
| TikZ duplicate/unsafe | Duplicate được xử lý; `write18`, path traversal và lệnh đọc/ghi bị chặn — đạt tự động |

## 5. Beta registration

| Kiểm tra | Kết quả |
|---|---|
| Trường bắt buộc | 5 trường required được browser validation chặn khi trống — đạt |
| Payload rỗng vào API | HTTP 400, thông báo “Vui lòng nhập họ và tên.” — đạt |
| Duplicate email | Có kiểm tra trước khi insert và xử lý unique code `23505`; chờ test bản ghi production để xác nhận end-to-end |
| Success state | Có xử lý UI/API; chưa tạo dữ liệu QA trên production để tránh làm bẩn danh sách thật |

## 6. Export và history

| Kiểm tra | Kết quả |
|---|---|
| DOCX đề có tiếng Việt | Đạt tự động |
| A/B/C/D | Đạt tự động |
| Đáp án và lời giải | Đạt sau khi bổ sung fallback từ `structuredExam` |
| Đúng môn/lớp/chủ đề | Đạt tự động với Vật lí 11 — Ohm |
| Không raw JSON/markdown fence | Đạt tự động |
| Không nội dung ngoài chủ đề | Đạt tự động |
| History giữ source/request context | Đạt tự động |
| PDF/Print tương tác thật | Chờ tài khoản production và thao tác hộp thoại in của trình duyệt |
| Worksheet/lesson plan Word/PDF | Build và pipeline chung đạt; chờ tài khoản production để kiểm tra file tải thật |

Lỗi đã sửa trong batch: khi lịch sử còn `structuredExam` nhưng text thiếu đúng tiêu đề đáp án, DOCX trước đây có thể bỏ bảng đáp án/lời giải. Bộ xuất giờ dùng dữ liệu cấu trúc đã lưu làm fallback, không tái tạo câu hỏi.

## 7. Mobile 390px

- 17 route public/protected kiểm tra local: không tràn ngang.
- 7 route public/protected kiểm tra trực tiếp trên production: không tràn ngang.
- Beta notice modal vừa viewport và không gây overflow.
- Nút góp ý được nâng lên `bottom-20` trên mobile để tránh che nhóm thao tác cuối trang; desktop giữ vị trí cũ.
- Các bảng ngân hàng vẫn cần tài khoản production để kiểm tra thao tác cuộn với dữ liệu thật.

## 8. Security checklist

| Kiểm tra | Kết quả |
|---|---|
| Service-role/OpenAI/Gemini key trong 89 client files | Không phát hiện — đạt |
| RLS documents/question bank/TikZ/feedback/beta requests | Có policy — đạt static audit |
| Public đọc TikZ bank | HTTP 401 — đạt runtime |
| Public gọi admin beta update | HTTP 401 — đạt runtime |
| Public gọi AI generation/3D | Đã harden trả HTTP 401 khi auth được cấu hình — chờ deploy |
| Teacher sửa system rows | UI + RLS chặn |
| Upload image | PNG/JPEG/WEBP, tối đa 5 MB |
| Question import | Extension allowlist, tối đa 5 MB |
| TikZ import | JSON 5 MB, ZIP 8 MB, path traversal/lệnh nguy hiểm bị chặn, không compile server-side |
| TikZ cá nhân | Đã dùng chung bộ chặn lệnh nguy hiểm — đạt test |
| Public status endpoint | Production cũ đang lộ cấu hình; code mới chỉ trả trạng thái chung — **phải deploy** |

## 9. Lỗi production tìm thấy và đã sửa

1. `/api/ai/generate` production công khai tên nhà cung cấp, key-configured flags và giới hạn nội bộ.
2. `/api/auth/me` dùng tên hạ tầng trong contract công khai.
3. AI generation và 3D API có thể bị gọi trực tiếp khi chưa đăng nhập dù UI đã được bảo vệ.
4. TikZ cá nhân chưa dùng bộ chặn nguy hiểm như import admin.
5. DOCX fallback từ history có thể thiếu bảng đáp án/lời giải.
6. Nút góp ý mobile có nguy cơ che thao tác ở cuối viewport.
7. Response tạo nội dung/nhận diện ảnh còn mang metadata provider/model nội bộ; response công khai mới đã được whitelist trường an toàn.

## 10. Kiểm tra phát hành bắt buộc sau deploy

1. Deploy commit QA mới.
2. Xác nhận `/api/ai/generate` không còn provider/key flags và `/api/auth/me` không còn tên hạ tầng.
3. Đăng nhập teacher QA: chạy A–H, question bank, TikZ cá nhân, feedback, history, Word/PDF.
4. Đăng nhập admin QA: beta approve/reject/note, feedback và TikZ import preview.
5. Xác nhận teacher không vào được ba trang admin.
6. Kiểm tra logout trở về cùng domain production.

## 11. Known limitations / launch blockers

- **Blocker:** phải deploy commit hardening trước khi quảng bá công khai vì production hiện tại còn lộ trạng thái cấu hình nội bộ.
- Cần một tài khoản teacher QA và admin QA để hoàn thành các thao tác ghi dữ liệu production; không lưu credential trong repo/tài liệu.
- PDF/Print phụ thuộc hộp thoại trình duyệt nên chưa được kiểm tra tải file tự động trong lượt này.
- Rate limit đăng ký dùng thử là giới hạn nhẹ theo instance, không phải cơ chế chống abuse phân tán.
- Cảnh báo Next.js về quy ước `middleware` bị deprecated không làm build thất bại nhưng nên chuyển sang `proxy` ở batch bảo trì riêng.
