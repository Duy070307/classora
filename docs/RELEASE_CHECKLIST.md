# Checklist phát hành Soạn Lab

## Public pages

- [ ] `/` mở bình thường, hero nói rõ Soạn Lab hỗ trợ giáo viên tạo bản nháp và xuất Word/PDF.
- [ ] `/tools` tìm kiếm, lọc danh mục, yêu thích và gần đây hoạt động.
- [ ] `/samples` redirect về `/tools` và không được quảng bá trong UI khách hàng.
- [ ] `/getting-started` mô tả luồng chọn công cụ → nhập thông tin → tạo bản nháp → xuất Word/PDF hoặc lưu lịch sử.
- [ ] `/privacy`, `/terms`, `/share` dùng wording chính thức.
- [ ] `/pricing` đang được ẩn trong bản thử nghiệm giáo viên, redirect về `/` và không xuất hiện trong navbar/footer/sitemap/command palette.
- [ ] Header, sidebar, footer và command palette không quảng bá route nội bộ.

## App flows

- [ ] `/dashboard`, `/history`, `/templates`, `/question-bank`, `/data`, `/settings` mở không lỗi.
- [ ] Nút “Góp ý” chỉ xuất hiện trong khu vực làm việc phù hợp, không xuất hiện trên login/register.
- [ ] `/teacher-testing-guide` mở được sau đăng nhập, có checklist dùng thử, ghi chú bản nháp và quick links.
- [ ] Dashboard có card “Dùng thử Soạn Lab trong 10 phút” trỏ tới `/teacher-testing-guide`.
- [ ] Giáo viên gửi góp ý trong app được, modal tự nhận diện trang/công cụ và không che các thao tác chính trên mobile.
- [ ] Admin mở `/admin/feedback` xem được góp ý mới nhất trước; giáo viên không truy cập được trang này.
- [ ] Lịch sử lưu, mở lại, xuất lại Word/Print được.
- [ ] Mẫu cá nhân, ngân hàng câu hỏi, backup/restore local data hoạt động.
- [ ] Ngân hàng câu hỏi có filter “Bộ sách” và “Loại nội dung”; câu hỏi mẫu Kết nối tri thức chỉ được mô tả là tham khảo, không phải nội dung chính thức SGK.
- [ ] Ngân hàng câu hỏi tách “Ngân hàng Soạn Lab” và “Ngân hàng của tôi”; giáo viên xem được câu Soạn Lab nhưng không sửa/xóa được.
- [ ] Tạo đề kiểm tra có lựa chọn nguồn câu hỏi: Soạn Lab, của tôi, cả hai, hoặc tự tạo bằng AI.
- [ ] Admin có thể chạy “Thêm câu hỏi mẫu Kết nối tri thức”; chạy lại không tạo trùng.
- [ ] Command palette, favorites và recent tools hoạt động.
- [ ] `/tools/image-to-latex` upload ảnh PNG/JPG/WEBP đã cắt gọn, trả LaTeX hoặc TikZ qua vision provider được cấu hình; copy LaTeX/TikZ, copy standalone, tải `.tex`/TXT/Markdown và lưu lịch sử hoạt động.
- [ ] `/tools/document-recognition` nhận PNG/JPG/WEBP/PDF, phân loại từng trang, giữ kết quả một phần khi trang khác lỗi và bắt buộc rà soát khối tin cậy thấp.
- [ ] PDF có lớp chữ tiếp tục dùng parser quyết định; PDF quét/hỗn hợp chỉ gọi nhận dạng hình ảnh cho trang cần thiết.
- [ ] Draft nhận dạng mở lại từ Lịch sử; đề đã xác nhận mở được Auditor, Lời giải, Mixer, Word/PDF và thêm câu vào ngân hàng cá nhân.
- [ ] Giáo viên không đọc draft của tài khoản khác; bảo trì chặn giáo viên và API nhận dạng, admin bypass vẫn hoạt động.

## Export

- [ ] Tạo đề Toán 12 THPTQG từ công cụ tạo đề, xuất Word thành công.
- [ ] Print/PDF đề THPTQG hiển thị đúng header, mã đề, PHẦN I/II/III và trang giáo viên.
- [ ] Đáp án giáo viên, thang điểm, ma trận và bản đặc tả không lẫn vào đề học sinh.
- [ ] Mở đề từ lịch sử và xuất Word/Print lại thành công.
- [ ] Phiếu học tập, giáo án, nhận xét học sinh, rubric và tin nhắn phụ huynh xuất Word được.
- [ ] Bảng rubric, ma trận và bảng đáp án là bảng thật, không lộ Markdown thô.
- [ ] Nội dung toán/logic không còn marker `**`, không có `�`/`ï¿½`, và các ký hiệu P ↔ Q, ∀, ∃, ∈, ⇒, ⇔, ≤, ≥, ≠, √, π, Δ hiển thị đọc được trong preview, Word, Print/PDF và lịch sử.
- [ ] Word export giữ công thức ở dạng text dễ chỉnh sửa, ưu tiên font toán khi phát hiện biểu thức/ký hiệu.

## Giáo án và mục tiêu bài học

- [ ] Giáo án được định vị là bản nháp tham khảo, không hứa “chuẩn 100%” hoặc dùng ngay không cần sửa.
- [ ] Có trường nhập “Yêu cầu cần đạt / chuẩn chương trình” và lựa chọn mức độ Bloom.
- [ ] Đầu ra có “Yêu cầu cần đạt tham khảo”, năng lực đặc thù, năng lực chung, phẩm chất và mục tiêu cụ thể theo Bloom.
- [ ] Mục tiêu dùng động từ đo được, tránh “hiểu/nắm được/biết được” nếu không chuyển thành hành vi quan sát được.
- [ ] Hoạt động dạy học tách hoạt động của giáo viên, hoạt động của học sinh, sản phẩm dự kiến và cách đánh giá.

## T?o n?i dung t? ??ng

- [ ] Không có API key vẫn build và tạo nội dung bằng chế độ cục bộ.
- [ ] `AI_PROVIDER=openai` hoặc `AI_PROVIDER=gemini` thiếu key sẽ fallback cục bộ, không crash.
- [ ] `/api/ai/generate` không trả API key.
- [ ] Không hiển thị provider, key, database hoặc trạng thái nội bộ trong giao diện giáo viên.

## Metadata và assets

- [ ] `/favicon.ico`, `/icon.png`, `/apple-icon.png`, `/icon-192.png`, `/icon-512.png`, `/og-image.png` load được.
- [ ] `/manifest.json` hợp lệ.
- [ ] `/sitemap.xml` chỉ có public pages và tool chính.
- [ ] `/robots.txt` disallow route nội bộ.
- [ ] Không có hotlink logo/image ngoài repo.

## Quality gates

- [ ] `npm run lint` đạt.
- [ ] `npm run build` đạt.
- [ ] `npm run smoke` đạt.
- [ ] `npm run document:recognition-test` đạt 34 kiểm tra yêu cầu và bộ 10 fixture tồn tại.
- [ ] Kiểm tra mobile khoảng 390px cho public pages và các form chính.
- [ ] Không có tên thương hiệu cũ, CTA góp ý công khai hoặc từ ngữ phát triển nội bộ trong giao diện chính.

## Giới hạn cần truyền đạt

- [ ] Nội dung là bản nháp và cần giáo viên rà soát.
- [ ] Chưa có thanh toán và OCR PDF/quét nguyên trang; Ảnh công thức → LaTeX chỉ dành cho ảnh công thức hoặc hình học đã cắt gọn.
- [ ] Dữ liệu lưu cục bộ trong trình duyệt/localStorage.

## Supabase Auth và cloud data

- [ ] Supabase env vars are configured in Vercel if cloud mode is enabled.
- [ ] `supabase/schema.sql` has been run in Supabase SQL Editor.
- [ ] Teacher test account exists in Supabase Auth.
- [ ] Admin account exists and has `profiles.role = 'admin'`.
- [ ] `/login` works.
- [ ] `/register` remains locked.
- [ ] Protected routes redirect to login when Supabase is configured and user is not signed in.
- [ ] History/templates/question bank/settings save to Supabase for logged-in users.
- [ ] `supabase/schema.sql` và migration `supabase/migrations/20260710_question_bank_scopes.sql` đã được chạy để `bank_scope='system'` hiển thị cho mọi giáo viên và `bank_scope='user'` chỉ thuộc giáo viên sở hữu.
- [ ] LocalStorage fallback still works when Supabase env is missing.
- [ ] `/data` migration copies local browser data to cloud without deleting local data.
- [ ] `supabase/schema.sql` has the `feedback` table before enabling in-app feedback in production.

## Slide bài giảng

- [ ] Bốn chế độ nguồn mở được và tài liệu quét chưa xác nhận bị chặn.
- [ ] Dàn ý chỉnh được trước khi tạo nội dung; slide lỗi không xóa slide thành công.
- [ ] PPTX học sinh không có ghi chú/đáp án ẩn; PPTX giáo viên có speaker notes.
- [ ] Văn bản, shape và bảng trong PowerPoint chỉnh sửa được; ảnh không bị kéo giãn.
- [ ] `npm run lesson:slides-test` vượt qua 30/30 trường hợp.

## Chấm bài

- [ ] `/tools/grading-assistant` yêu cầu đăng nhập và tuân thủ maintenance/admin bypass.
- [ ] Đề thiếu đáp án hoặc ánh xạ mã đề lỗi bị chặn.
- [ ] Kết quả nhận dạng thấp không tự nhận điểm cuối.
- [ ] Chấm khách quan không gọi AI; câu mở luôn cần giáo viên duyệt.
- [ ] XLSX/CSV/DOCX/PDF và phiếu học sinh không chứa dữ liệu nhận dạng nội bộ hoặc đáp án đầy đủ mặc định.
- [ ] Job lịch sử không chứa `previewUrls`, `sourceCrop`, dữ liệu ảnh hay URL công khai.
- [ ] `npm run grading:test` đạt.

## Phiếu trả lời chuẩn

- [ ] `/tools/answer-sheet` yêu cầu đăng nhập và tuân thủ maintenance/admin bypass.
- [ ] Đề lỗi cấu trúc bị chặn trước khi tạo phiếu.
- [ ] PDF A4/A5 đúng kích thước vật lý, có QR và bốn anchor, không chứa đáp án.
- [ ] Bộ mã đề giữ đúng thứ tự câu/mệnh đề và xuất PDF riêng, PDF gộp, ZIP.
- [ ] QR không chứa đáp án hoặc danh tính học sinh; QR hợp lệ không thay thế kiểm tra quyền sở hữu.
- [ ] Phiếu rõ dùng nhận diện xác định, không tiêu thụ lượt AI.
- [ ] Tô mờ, tô nhiều, gạch sửa, thiếu anchor và sai template bắt buộc rà soát hoặc bị từ chối.
- [ ] Word không hiển thị như lựa chọn xuất phiếu vì chưa bảo đảm tọa độ.
- [ ] Không có migration mới; template/layout lưu trong metadata tài liệu có RLS hiện tại.
- [ ] Đã ghi rõ trạng thái kiểm thử máy in/camera thật trong báo cáo phát hành.

## Ma trận & bảng đặc tả

- [ ] `/tools/exam-blueprint` yêu cầu đăng nhập và tuân thủ maintenance/admin bypass.
- [ ] Editor desktop/mobile không gây tràn ngang toàn trang.
- [ ] Validation xác định chặn sai tổng câu, điểm, tỉ lệ, mức độ và cấu trúc Đúng/Sai.
- [ ] Sửa đặc tả/ma trận không tự ghi đè đề hiện có.
- [ ] Suy ra từ đề và đối chiếu không làm thay đổi `StructuredExam` nguồn.
- [ ] Tạo đề tái sử dụng `FileExamGenerator` và Exam Auditor hiện có.
- [ ] XLSX có Ma trận đề, Bảng đặc tả, Tổng hợp và Đối chiếu đề khi có.
- [ ] DOCX ngang có ma trận, đặc tả, tiếng Việt và không chứa metadata nội bộ.
- [ ] Blueprint history/cloud tuân thủ RLS; không cần migration mới.
- [ ] `npm run exam:blueprint-test` đạt.

## Phiếu học tập có cấu trúc

- [ ] Route cũ `/tools/worksheet-generator` còn hoạt động; `/tools/worksheet` chuyển hướng đúng.
- [ ] Dàn ý được xác nhận trước khi tạo từng hoạt động.
- [ ] Phiếu cơ bản/tiêu chuẩn/nâng cao cùng mục tiêu nhưng không trùng nội dung.
- [ ] Bản học sinh không chứa đáp án, lời giải, teacher note hoặc metadata nội bộ.
- [ ] Bản giáo viên có đáp án, hướng dẫn và thang điểm khi bật.
- [ ] Lesson Plan, Slides, Exam, Solution và Recognition mở được worksheet với nguồn đúng.
- [ ] History/cloud giữ canonical `Worksheet`; không cần migration mới.
- [ ] Maintenance/admin bypass và Question Bank ownership đạt.
- [ ] `npm run worksheet:test` đạt 38/38, bao phủ đủ 37 yêu cầu.

### Giáo án có cấu trúc

- [ ] `/tools/lesson-plan` mở được; route cũ `/tools/lesson-plan-generator` chuyển hướng đúng.
- [ ] Bốn mode đầu vào hoạt động và tài liệu nhận dạng chưa xác nhận bị chặn.
- [ ] Dàn ý được xác nhận trước khi tạo chi tiết; thời lượng mỗi tiết kiểm tra deterministic.
- [ ] Hoạt động giữ ID ổn định, tạo lại riêng không ghi đè sửa tay im lặng.
- [ ] Báo cáo mục tiêu/minh chứng, phân hóa và bảng giáo viên/học sinh hiển thị đúng.
- [ ] Worksheet, Lesson Slides, Rubric và kiểm tra nhanh dùng công cụ hiện có.
- [ ] Word đầy đủ/rút gọn/bảng GV-HS và PDF không chứa metadata nội bộ.
- [ ] History phục hồi canonical `LessonPlan`; autosave không tạo snapshot mỗi phím.
- [ ] Maintenance chặn teacher và admin bypass vẫn hoạt động.
- [ ] `npm run lesson:plan-test` đạt 34/34.

### Đề cương ôn tập

- [ ] `/tools/review-pack` yêu cầu đăng nhập và tuân thủ maintenance/admin bypass.
- [ ] Bốn mode đầu vào hoạt động; chỉ dữ liệu chấm đã xác nhận được dùng.
- [ ] Dàn ý được giáo viên xác nhận trước khi tạo từng phần nội dung.
- [ ] `ReviewPack` tái sử dụng `WorksheetActivity`, `StructuredExam` và `ExamSolutionSet`.
- [ ] Tạo lại từng phần không ghi đè chỉnh sửa của giáo viên nếu chưa xác nhận.
- [ ] Bản học sinh không có đáp án, lời giải, ghi chú giáo viên, ID hoặc metadata nội bộ.
- [ ] Word/PDF/ZIP và các tệp công thức/luyện tập/lời giải mở được, giữ tiếng Việt và LaTeX.
- [ ] History/cloud phục hồi canonical `ReviewPack`; không cần migration mới.
- [ ] Liên kết Lesson Plan, Slides, Worksheet, Exam, Grading, Recognition và Question Bank hoạt động.
- [ ] `npm run review-pack:test` đạt 29/29.
