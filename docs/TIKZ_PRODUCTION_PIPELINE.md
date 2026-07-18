# Quy trình TikZ production

SOẠN LAB dùng một nguồn dữ liệu chuẩn duy nhất là `TikzDiagramDraft`: ảnh nguồn → tiền xử lý → mô hình ngữ nghĩa → giáo viên chỉnh sửa → SVG/TikZ xác định → giáo viên xác nhận → chèn tài liệu.

## Lưu ảnh nguồn riêng tư

Ảnh nguồn và tài sản dẫn xuất được lưu trong bucket riêng tư `tikz-assets`. API chỉ dựng đường dẫn từ người dùng đang đăng nhập và mã tài sản ngẫu nhiên; client không nhận đường dẫn storage. GET/POST/DELETE đều kiểm tra phiên, MIME, kích thước và quyền sở hữu. Khi xóa, API từ chối xóa tài sản còn được tài liệu khác tham chiếu.

Migration cần áp dụng thủ công trước khi bật lưu cloud:

`supabase/migrations/20260718_add_private_tikz_assets.sql`

Không áp dụng migration này từ ứng dụng hoặc trong quá trình build.

## Renderer và compiler

- SVG ngữ nghĩa luôn được dựng từ cùng objects/relationships/coordinates với bộ tạo TikZ.
- PNG được raster hóa từ SVG xác nhận, không lấy từ ảnh chụp màn hình tạm.
- TeX compiler là tùy chọn. Server chỉ phát hiện `pdflatex`, `lualatex`, `xelatex`, chạy không shell, không shell escape, có timeout và thư mục tạm.
- Nếu không có compiler, UI phải nói rõ chưa kiểm tra bằng TeX; SVG và TEX vẫn dùng được.

## Chèn tài liệu và phiên bản

Chỉ `ConfirmedDiagramAsset` mới được chèn. Exam, Question Bank, Worksheet, Lesson Plan, Lesson Slides, Review Pack và Answer Solutions giữ tham chiếu phiên bản đã xác nhận. Chỉnh sửa sau khi chèn tạo phiên bản mới; tài liệu cũ không tự đổi.

DOCX và PPTX dùng PNG độ phân giải cao khi pipeline hiện tại chưa bảo đảm SVG. PDF/Print dùng tài sản đã xác nhận qua trình duyệt. Nội dung học sinh không chứa confidence, diagnostics, log compiler hoặc metadata ảnh nguồn.

## Giới hạn đã biết

- Migration phải được áp dụng lên Supabase trước khi persistence cloud hoạt động.
- `perspectiveCorrection` hiện phát hiện/cắt biên và deskew an toàn; chưa có phép biến đổi homography bốn điểm hoàn chỉnh.
- Source crop theo object trong UI hiện là vùng phóng đại gần đúng khi source box không có tọa độ chính xác.
- Khả năng biên dịch PDF phụ thuộc TeX có sẵn trong runtime; Vercel không bị bắt buộc cài TeX.
- Fixture hiện được đánh dấu synthetic; không được dùng để tuyên bố độ chính xác ảnh điện thoại thực tế.
