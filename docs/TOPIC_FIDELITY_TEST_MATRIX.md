# Ma trận kiểm thử độ bám chủ đề

Điền cột **Kết quả thực tế** khi chạy kiểm thử thủ công trên môi trường cần phát hành. Mọi nội dung tạo ra là bản nháp và cần giáo viên rà soát.

| # | Đầu vào | Khái niệm được phép | Khái niệm bị cấm | Kết quả mong đợi | Kết quả thực tế |
|---:|---|---|---|---|---|
| 1 | Vật lí 10 · Chuyển động thẳng | quãng đường, vận tốc | điện trường, hóa học | Chỉ câu chuyển động thẳng | Chưa chạy |
| 2 | Vật lí 10 · Gia tốc | gia tốc, vận tốc | quang học | Chỉ câu gia tốc | Chưa chạy |
| 3 | Vật lí 10 · Ba định luật Newton · 5 câu | lực, khối lượng, gia tốc | điện, quang | Đúng 5 câu Newton nếu đủ | Chưa chạy |
| 4 | Newton · 20 câu · AI bổ sung tắt | Newton | chủ đề khác | Trả số câu hợp lệ hiện có | Chưa chạy |
| 5 | Newton · 10 câu · AI bổ sung bật | Newton | công-năng lượng, điện | Chỉ câu hợp lệ; cảnh báo nếu thiếu | Chưa chạy |
| 6 | Newton · chỉ định luật II | F=ma | quán tính, lực-phản lực | Không có định luật I/III | Chưa chạy |
| 7 | Newton · chỉ lý thuyết | phát biểu định luật | bài tính số | Không có bài tính | Chưa chạy |
| 8 | Newton · chỉ tính toán | F, m, a, số liệu | câu định nghĩa thuần túy | Bài tập tính toán | Chưa chạy |
| 9 | Vật lí 10 · Công và năng lượng | công, động năng, thế năng | điện trường | Không lẫn điện học | Chưa chạy |
| 10 | Vật lí 10 · Động lượng | động lượng, va chạm | phản ứng hóa học | Không lẫn Hóa | Chưa chạy |
| 11 | Vật lí 11 · Định luật Ohm · hệ thống · 5 câu | U, I, R | từ trường, cảm ứng, Toán | Chỉ câu Ohm | Chưa chạy |
| 12 | `dinh luat om` | U, I, R | chủ đề khác | Khớp Định luật Ohm | Chưa chạy |
| 13 | `Vật lý` 11 · Ohm | U, I, R | chủ đề khác | Chuẩn hóa thành Vật lí | Chưa chạy |
| 14 | Dòng điện không đổi · exact on | dòng điện không đổi | tự mở rộng topic con | Không tự lấy topic con | Chưa chạy |
| 15 | Dòng điện không đổi · related on | Ohm, công suất điện | từ trường | Có thể dùng topic con và công bố | Chưa chạy |
| 16 | Vật lí 11 · Từ trường | cảm ứng từ, lực từ | Ohm, dao động | Không lẫn Ohm | Chưa chạy |
| 17 | Vật lí 11 · Khúc xạ ánh sáng | chiết suất, tia tới | dòng điện | Không lẫn điện học | Chưa chạy |
| 18 | Vật lí 12 · Dao động điều hòa | biên độ, chu kỳ | hóa học | Chỉ dao động | Chưa chạy |
| 19 | Vật lí 12 · Hạt nhân nguyên tử | phóng xạ, hạt nhân | polymer | Không lẫn Hóa | Chưa chạy |
| 20 | Hóa học 10 · Cấu tạo nguyên tử · 10 câu | proton, neutron, electron, đồng vị | cân bằng, hữu cơ, điện | Chỉ cấu tạo nguyên tử | Chưa chạy |
| 21 | Hóa học 10 · Cấu tạo nguyên tử · thiếu câu | cấu tạo nguyên tử | topic khác | Trả ít hơn thay vì lấp | Chưa chạy |
| 22 | Hóa học 10 · Liên kết hóa học | liên kết | dòng điện, xác suất | Không lẫn môn | Chưa chạy |
| 23 | Hóa học 11 · pH | H+, OH-, acid/base | hydrocarbon, polymer | Chỉ pH | Chưa chạy |
| 24 | Hóa học 11 · Hydrocarbon | hydrocarbon | pH, điện | Không lẫn pH | Chưa chạy |
| 25 | Hóa học 12 · Ester - lipid · 10 câu | ester, chất béo, thủy phân | nguyên tử, điện | Chỉ ester-lipid | Chưa chạy |
| 26 | Hóa học 12 · Polymer | polymer | xác suất, dao động | Không lẫn môn | Chưa chạy |
| 27 | Toán 12 · Xác suất · hệ thống · AI tắt | xác suất | Vật lí, Hóa, demo | Báo ngân hàng trống | Chưa chạy |
| 28 | Tạo Toán rồi đổi sang Vật lí | chỉ dữ liệu Vật lí mới | kết quả Toán cũ | Kết quả cũ bị xóa | Chưa chạy |
| 29 | Xuất Word/PDF đề Ohm đã kiểm tra | đúng 5 câu hợp lệ | câu bị validator loại | File trùng nội dung xem trước | Chưa chạy |
| 30 | Lưu/mở lịch sử đề Newton | đúng subject/grade/topic và nội dung | tái tạo hoặc thay câu | Mở nguyên văn, không tái sinh | Chưa chạy |

## Tiêu chí đạt chung

- Không có câu hỏi, phương án, đáp án, lời giải, mục tiêu hoặc hoạt động ngoài chủ đề.
- Khi thiếu nội dung, trả ít hơn hoặc báo rõ; không dùng dữ liệu mẫu và không đổi môn/lớp/chủ đề.
- Word, PDF và lịch sử chỉ sử dụng nội dung đã vượt qua kiểm tra.
- Không hiển thị điểm relevance, nhà cung cấp hay thông tin hạ tầng cho giáo viên.
