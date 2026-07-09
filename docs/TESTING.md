# Testing Soạn Lab

## Route QA

Public routes cần mở không lỗi, không overflow ngang desktop/mobile và không có ảnh/icon hỏng:

- `/`
- `/tools`
- `/getting-started`
- `/privacy`
- `/terms`
- `/share`

App routes cần kiểm tra:

- `/dashboard`
- `/history`
- `/templates`
- `/question-bank`
- `/data`
- `/settings`

Tool routes quan trọng:

- `/tools/exam-generator`
- `/tools/worksheet-generator`
- `/tools/lesson-plan-generator`
- `/tools/student-comments`
- `/tools/bulk-student-comments`
- `/tools/rubric-generator`
- `/tools/parent-message-generator`
- `/tools/import-questions`
- `/tools/image-to-latex`
- `/tools/latex-preview`

## Công cụ và prefill nội bộ

`/samples` là route ẩn legacy và phải redirect về `/tools`. Giao diện khách hàng không được quảng bá thư viện mẫu công khai.

Nếu kiểm tra query prefill nội bộ, mở trực tiếp URL công cụ có tham số prefill và xác nhận đúng công cụ mở, field được điền, không có warning controlled/uncontrolled input, có thể tạo bản nháp và các nút export xuất hiện sau khi tạo.

## Export regression

### Nội dung có công thức/toán/ký hiệu logic

Tạo hoặc dán nội dung kiểm thử:

- Mệnh đề tương đương: P ↔ Q đúng khi P và Q cùng đúng hoặc cùng sai.
- Với mọi x ∈ X, P(x) đúng.
- Tồn tại x ∈ X sao cho P(x) đúng.
- P ⇒ Q và P ⇔ Q.
- x^2 > 0; a^2 + b^2 = c^2; Δ = b^2 - 4ac; x = (-b ± √Δ) / 2a.
- U = I.R; P = U.I; F = m.a; v = s/t.

Cần xác nhận ở preview, Word, Print/PDF, TXT/Markdown và lịch sử mở lại:

- Không còn marker `**...**` hoặc markdown fence thô.
- Không có ký tự `�`/`ï¿½`.
- Các ký hiệu ∀, ∃, ∈, ⇒, ⇔, ↔, ≤, ≥, ≠, √, π, Δ đọc được.
- Trong Word, công thức được giữ dạng text dễ chỉnh sửa, ưu tiên font toán như Cambria Math khi phù hợp.

### Đề thi

1. Tạo Toán 12 THPTQG từ công cụ tạo đề.
2. Xuất Word.
3. Mở Print/PDF.
4. Lưu lịch sử.
5. Mở lại từ `/history`.
6. Xuất Word và Print/PDF lại.

Cần xác nhận:

- Không có đáp án giáo viên lẫn vào đề học sinh.
- PHẦN I/II/III hiển thị đúng.
- Bảng đáp án giáo viên, thang điểm, ma trận và bản đặc tả còn đúng.
- Không có bảng Markdown thô.

### Tài liệu ngoài đề thi

Kiểm tra Word và Print/PDF nếu có:

- Phiếu học tập.
- Kế hoạch bài dạy.
- Nhận xét học sinh.
- Rubric.
- Tin nhắn phụ huynh.

Với giáo án:

- Nội dung phải nói rõ đây là bản nháp tham khảo, cần giáo viên rà soát.
- Có mục “Yêu cầu cần đạt tham khảo”.
- Mục tiêu theo Bloom dùng động từ đo được như nêu được, mô tả được, vận dụng được, phân tích được, nhận xét được.
- Hoạt động của giáo viên và học sinh được tách riêng.
- Có sản phẩm dự kiến, cách đánh giá và ghi chú rà soát chuyên môn.

## Metadata/assets

Kiểm tra các URL:

- `/favicon.ico`
- `/icon.png`
- `/apple-icon.png`
- `/icon-192.png`
- `/icon-512.png`
- `/og-image.png`
- `/manifest.json`
- `/sitemap.xml`
- `/robots.txt`

Kiểm tra browser title, favicon, manifest JSON và OG/Twitter metadata.

## AI integration

Không API key:

1. Đặt `AI_PROVIDER=local` hoặc không đặt env.
2. Tạo đề kiểm tra, phiếu học tập và nhận xét học sinh.
3. Xác nhận nội dung tạo được, export Word/PDF còn hoạt động.

Provider thiếu key:

1. Đặt `AI_PROVIDER=openai` nhưng không đặt `OPENAI_API_KEY`.
2. Gọi tạo nội dung.
3. Xác nhận hệ thống fallback cục bộ hoặc hiển thị thông báo thân thiện, không crash.

Provider thật nếu có key:

1. Tạo `.env.local`.
2. Đặt `AI_PROVIDER=openai` hoặc `AI_PROVIDER=gemini`.
3. Tạo đề kiểm tra.
4. Lưu lịch sử và xuất Word/PDF lại.

## Ảnh công thức → LaTeX

1. Đặt `AI_PROVIDER=gemini` và cấu hình `GEMINI_API_KEY` nếu muốn kiểm thử nhận diện thật.
2. Mở `/tools/image-to-latex`.
3. Upload ảnh PNG/JPG/WEBP đã cắt gọn, dưới 5MB.
4. Xác nhận UI nhắc giáo viên cắt ảnh chỉ chứa công thức hoặc hình cần nhận diện.
5. Chọn “Công thức → LaTeX”, tạo LaTeX, copy, preview KaTeX nếu render được, tải TXT/Markdown và lưu lịch sử.
6. Chọn “Hình học → TikZ”, xác nhận nút chuyển thành TikZ, output “Mã TikZ/LaTeX”, ghi chú độ chính xác và khung “Bản xem trước hình vẽ” hiển thị mã TikZ/standalone.
7. Với provider không phải Gemini hoặc thiếu key, xác nhận hiển thị lỗi thân thiện, không crash.

Ảnh hình học cần thử:

- Tam giác ABC đơn giản.
- Tam giác có đường cao AH vuông góc BC.
- Đường tròn tâm O có nhãn bán kính.
- Hình có nét đứt.
- Hình có ký hiệu góc vuông.
- Hình có nhãn điểm và số đo.
- Hình mờ/khó đọc.
- Ảnh có chữ thừa quanh hình.

Kỳ vọng: geometry mode trả mã TikZ, không hiển thị JSON thô, không giải bài toán, giữ nhãn nhìn thấy được, có nét đứt/ký hiệu góc vuông khi ảnh có, tải TXT/Markdown/TEX hoạt động, lưu lịch sử hoạt động và formula mode vẫn tạo LaTeX như trước.

## Public wording audit

Giao diện public chính không được hiển thị tên thương hiệu cũ, CTA góp ý công khai hoặc từ ngữ phát triển nội bộ. Các route nội bộ cũ nếu còn tồn tại không được xuất hiện trong public nav, footer, sitemap hoặc command palette.

## Pricing hidden during teacher testing

- Navbar, footer, command palette và app sidebar không hiển thị “Bảng giá”, nâng cấp, gói trả phí hoặc thanh toán.
- `/pricing` redirect về `/`.
- `/sitemap.xml` không liệt kê `/pricing`.

## Lệnh kiểm tra

```bash
npm run lint
npm run build
npm run smoke
```

## Supabase Auth và cloud data checks

- Không cấu hình Supabase: app build được, public pages mở được, localStorage fallback hoạt động.
- Có Supabase env: `/login` đăng nhập được bằng tài khoản giáo viên.
- `/register` hiển thị đăng ký tài khoản hiện chưa mở.
- Tài khoản giáo viên mở dashboard, tools, history, templates, question bank, data, settings.
- Lưu lịch sử, mở `/history`, mở chi tiết và export Word/PDF từ lịch sử.
- Tạo mẫu cá nhân, tạo câu hỏi trong ngân hàng câu hỏi, lưu cài đặt tài liệu.
- `/data` chuyển dữ liệu từ trình duyệt lên tài khoản và không xóa dữ liệu local.
- Tài khoản admin mở `/admin`; giáo viên không có quyền admin.
- `/system-status` chuyển về dashboard và không hiển thị thông tin kỹ thuật cho giáo viên.

## Ngân hàng câu hỏi Kết nối tri thức

Admin:

1. Đăng nhập bằng tài khoản admin.
2. Mở `/question-bank`.
3. Bấm “Thêm câu hỏi mẫu Kết nối tri thức”.
4. Xác nhận thông báo “Đã thêm X câu hỏi mẫu. Bỏ qua Y câu hỏi đã tồn tại.”
5. Bấm lại lần nữa và xác nhận câu trùng được bỏ qua.
6. Kiểm tra bảng `question_bank`: metadata có `bookSeries: "Kết nối tri thức"`, `sourceType: "tham khảo"`, `contentType: "Lý thuyết"`, `needsReview: true`.

Teacher:

1. Đăng nhập bằng tài khoản giáo viên.
2. Mở `/question-bank`.
3. Lọc môn Vật lí/Hóa học, lớp 10/11/12, bộ sách “Kết nối tri thức”, loại nội dung “Lý thuyết”.
4. Xác nhận câu hỏi mẫu hiển thị như dữ liệu tham khảo, không gọi là câu hỏi chính thức của SGK.
5. Mở `/tools/exam-generator`, chọn Vật lí 10, chủ đề “Ba định luật Newton”, bộ sách “Kết nối tri thức”, bật “Lấy câu hỏi từ ngân hàng câu hỏi” và tạo đề.
6. Xác nhận đề có ghi chú bản nháp tham khảo, xuất Word/PDF vẫn hoạt động.

## In-app teacher feedback

Teacher:

1. Đăng nhập bằng tài khoản giáo viên.
2. Mở dashboard và xác nhận card “Dùng thử Soạn Lab trong 10 phút” hiển thị.
3. Bấm “Xem hướng dẫn dùng thử” và xác nhận `/teacher-testing-guide` mở được.
4. Kiểm tra checklist, ghi chú bản nháp, câu hỏi góp ý và các quick link.
5. Xác nhận nút “Góp ý” xuất hiện ở góc dưới bên phải, và nút “Gửi góp ý” trong guide mở cùng modal.
6. Gửi góp ý với loại góp ý, mức độ hài lòng và nội dung.
7. Mở công cụ tạo đề hoặc Ảnh công thức → LaTeX/TikZ, mở lại modal và xác nhận công cụ/trang được tự nhận diện.
8. Kiểm tra mobile khoảng 390px: guide page đọc được, card stack dọc, nút không tràn, modal vừa màn hình.
9. Xác nhận giáo viên không truy cập được `/admin/feedback`.

Admin:

1. Đăng nhập bằng tài khoản admin.
2. Mở `/admin/feedback`.
3. Xác nhận góp ý mới nhất hiển thị trước, có loại góp ý, công cụ, rating, nội dung, liên hệ và đường dẫn trang.
4. Xác nhận giao diện không hiển thị thông tin kỹ thuật nội bộ hoặc khóa dịch vụ.
