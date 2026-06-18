# Classora Templates

Classora hiện hỗ trợ hai nhóm mẫu tài liệu:

- Mẫu có sẵn: đi kèm ứng dụng, tự xuất hiện trong các công cụ phù hợp.
- Mẫu cá nhân: giáo viên tự tạo tại `/templates`, lưu trong `localStorage`.

## Mẫu có sẵn

Các mẫu tiếng Việt hiện có:

- Mẫu đề kiểm tra cơ bản
- Mẫu đáp án và thang điểm
- Mẫu ma trận đề
- Mẫu giáo án cơ bản
- Mẫu phiếu học tập
- Mẫu nhận xét học sinh

Mẫu có sẵn được dùng trong selector “Mẫu tài liệu” của các công cụ lõi như tạo đề, ma trận, đáp án, trộn mã đề, phiếu học tập, giáo án và nhận xét học sinh.

## Mẫu cá nhân

Mẫu cá nhân có thể dùng placeholder để Classora thay nội dung tự động khi tạo tài liệu. Dữ liệu chỉ lưu trên trình duyệt hiện tại.

Placeholder hỗ trợ:

```txt
{{ten_truong}} - Tên trường/trung tâm
{{ten_giao_vien}} - Tên giáo viên
{{to_bo_mon}} - Tổ/bộ môn
{{nam_hoc}} - Năm học
{{mon_hoc}} - Môn học
{{lop}} - Lớp
{{chu_de}} - Chủ đề
{{thoi_gian}} - Thời gian
{{noi_dung}} - Nội dung chính
{{dap_an}} - Đáp án
{{thang_diem}} - Thang điểm
{{ma_tran}} - Ma trận
{{ghi_chu}} - Ghi chú
```

## Cách áp dụng

- Chọn “Tự động” để giữ output mặc định.
- Chọn mẫu có sẵn để bọc nội dung bằng format tài liệu tiếng Việt.
- Chọn mẫu cá nhân để thay placeholder đơn giản.
- Nếu thiếu dữ liệu, placeholder được bỏ trống thay vì hiện chuỗi xấu.

## Giới hạn hiện tại

- Rendering template còn đơn giản, chưa có engine layout phức tạp.
- Word export ưu tiên giữ heading, dòng, tiếng Việt và font; bảng Word thật chưa được tối ưu sâu.
- Mẫu cá nhân chưa đồng bộ cloud vì app chưa có đăng nhập/database.
