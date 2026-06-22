import type { GenericToolInput, StudentCommentInput, WorksheetInput } from "@/lib/types";

const value = (input: GenericToolInput, key: string, fallback = "") => String(input[key] ?? fallback);

export function worksheetTemplate(input: WorksheetInput, exercises: string, answers: string) {
  return `PHIẾU HỌC TẬP

I. THÔNG TIN CHUNG
- Môn học: ${input.subject}
- Lớp: ${input.grade}
- Chủ đề: ${input.topic}
- Mức độ: ${input.level}

II. MỤC TIÊU
- Kiến thức: ${input.objective || `Nắm được kiến thức trọng tâm của ${input.topic}.`}
- Kĩ năng: Đọc yêu cầu, lựa chọn kiến thức phù hợp và trình bày rõ ràng.
- Năng lực/phẩm chất: Tự học, giải quyết vấn đề, hợp tác và trách nhiệm.

III. NHẮC LẠI KIẾN THỨC
- Xác định khái niệm, dữ kiện hoặc ý chính liên quan đến ${input.topic}.
- Gạch chân từ khóa và trình bày theo trình tự hợp lí.
- Kiểm tra kết quả hoặc luận điểm trước khi hoàn thành.

IV. BÀI TẬP CƠ BẢN, VẬN DỤNG VÀ MỞ RỘNG
${exercises}

PHẦN DÀNH CHO GIÁO VIÊN

V. HƯỚNG DẪN/ĐÁP ÁN
${answers}

VI. GHI CHÚ CHO GIÁO VIÊN
Điều chỉnh số lượng, dữ kiện và mức độ bài tập theo tiến độ thực tế của lớp.

YÊU CẦU THÊM
${input.extraRequirements || "Không có yêu cầu thêm."}`;
}

export function lessonPlanTemplate(input: GenericToolInput) {
  const subject = value(input, "subject", "Toán");
  const grade = value(input, "grade", "8");
  const lesson = value(input, "lessonName", "Bài học mới");
  const activity = (number: number, name: string, objective: string, organization: string, product: string) => `HOẠT ĐỘNG ${number}: ${name}
- Mục tiêu: ${objective}
- Tổ chức thực hiện: ${organization}
- Sản phẩm dự kiến: ${product}
- Đánh giá: Quan sát quá trình, đối chiếu sản phẩm và phản hồi ngắn.`;
  return `KẾ HOẠCH BÀI DẠY

I. THÔNG TIN BÀI HỌC
- Môn học: ${subject}
- Lớp: ${grade}
- Tên bài/chủ đề: ${lesson}
- Thời lượng: ${value(input, "duration", "45 phút")}

II. MỤC TIÊU BÀI HỌC
- Kiến thức: ${value(input, "objectives", `Nắm được kiến thức trọng tâm của bài ${lesson}.`)}
- Năng lực: Tự học, giao tiếp, hợp tác và giải quyết vấn đề.
- Phẩm chất: Chăm chỉ, trách nhiệm, trung thực trong học tập.

III. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
- Phương pháp: ${value(input, "methods", "Gợi mở, thảo luận nhóm, luyện tập cá nhân")}.
- Học liệu: ${value(input, "materials", "Sách giáo khoa, bảng phụ, phiếu học tập")}.

IV. TIẾN TRÌNH DẠY HỌC
${activity(1, "MỞ ĐẦU", `Kích hoạt kiến thức nền về ${lesson}.`, "Giáo viên nêu tình huống; học sinh suy nghĩ và chia sẻ nhanh.", "Câu trả lời dự đoán hoặc bảng từ khóa.")}

${activity(2, "HÌNH THÀNH KIẾN THỨC", `Hình thành nội dung cốt lõi của ${lesson}.`, "Học sinh khai thác ví dụ hoặc ngữ liệu; giáo viên dẫn dắt và chuẩn hóa.", "Ghi chép kiến thức trọng tâm và ví dụ minh họa.")}

${activity(3, "LUYỆN TẬP", "Củng cố kiến thức và rèn kĩ năng.", "Học sinh làm bài cá nhân hoặc cặp đôi; giáo viên hỗ trợ và chữa bài.", "Bài làm có bước giải, luận điểm hoặc kết luận rõ ràng.")}

${activity(4, "VẬN DỤNG", `Liên hệ ${lesson} với tình huống mới.`, "Học sinh đề xuất cách giải quyết và trình bày sản phẩm ngắn.", "Câu trả lời vận dụng, poster hoặc bảng tổng hợp.")}

V. ĐIỀU CHỈNH SAU BÀI DẠY
- Nội dung học sinh đã nắm chắc: ........................................................
- Nội dung cần hỗ trợ thêm: .............................................................
- Điều chỉnh phương pháp, thời lượng hoặc học liệu: .....................................`;
}

export function commentTemplate(input: StudentCommentInput) {
  const name = input.studentName || "Học sinh";
  const strength = input.strengths || "có ý thức học tập và hoàn thành nhiệm vụ";
  const improvement = input.limitations || "cần chủ động ôn tập và trình bày rõ ràng hơn";
  const action = "Trong thời gian tới, em nên ôn lại kiến thức trọng tâm, thực hiện từng mục tiêu nhỏ và trao đổi khi gặp khó khăn.";
  return `NHẬN XÉT HỌC SINH

I. THÔNG TIN
- Họ và tên: ${name}
- Lớp: ${input.className || "Chưa nhập"}
- Mức học tập: ${input.performance}
- Mục đích: ${input.purpose}

II. ĐIỂM MẠNH
${name} ${input.attitude || "có thái độ học tập nghiêm túc"}. Em phát huy tốt ${strength}.

III. ĐIỂM CẦN CẢI THIỆN
Em ${improvement}. Cần ưu tiên cải thiện từng nội dung cụ thể để duy trì tiến bộ.

IV. GỢI Ý HỖ TRỢ
${action}

V. NHẬN XÉT HOÀN CHỈNH
${name} có kết quả học tập ở mức ${input.performance.toLowerCase()}, ${input.attitude || "hợp tác trong giờ học"}. Em thể hiện điểm mạnh ở ${strength}. Em cần ${improvement}. ${action}`;
}

export function rubricTemplate(input: GenericToolInput, rows: string) {
  return `RUBRIC ĐÁNH GIÁ

I. THÔNG TIN NHIỆM VỤ
- Môn học: ${value(input, "subject", "Ngữ văn")}
- Lớp: ${value(input, "grade", "7")}
- Nhiệm vụ: ${value(input, "assignmentType", "Bài viết")}
- Tổng điểm: ${value(input, "totalScore", "10")}

II. TIÊU CHÍ ĐÁNH GIÁ
Các tiêu chí tập trung vào mức độ hoàn thành nhiệm vụ, chất lượng sản phẩm và khả năng trình bày.

III. BẢNG RUBRIC
| Tiêu chí | Mức 1 | Mức 2 | Mức 3 | Mức 4 | Điểm tối đa |
|---|---|---|---|---|---:|
${rows}

IV. HƯỚNG DẪN SỬ DỤNG RUBRIC
- Đọc toàn bộ sản phẩm trước khi xác định mức đạt.
- Chọn mô tả gần nhất và ghi nhận minh chứng.
- Phản hồi một điểm mạnh, một điểm cần cải thiện và hành động tiếp theo.

V. GHI CHÚ CHO GIÁO VIÊN
Có thể điều chỉnh mô tả mức độ và trọng số theo yêu cầu nhiệm vụ.`;
}

export function parentMessageTemplate(input: GenericToolInput) {
  const student = value(input, "studentName", "học sinh");
  const main = value(input, "mainContent", "nội dung cần trao đổi");
  return `TIN NHẮN GỬI PHỤ HUYNH

I. CHỦ ĐỀ TIN NHẮN
${value(input, "situation", "Trao đổi học tập")} - ${student}, lớp ${value(input, "className", "chưa nhập")}

II. PHIÊN BẢN NGẮN
Kính gửi quý phụ huynh, giáo viên xin trao đổi về ${student}: ${main}. Mong gia đình cùng phối hợp hỗ trợ em. Xin cảm ơn quý phụ huynh.

III. PHIÊN BẢN ĐẦY ĐỦ
Kính gửi quý phụ huynh em ${student}, giáo viên xin thông tin: ${main}. Rất mong gia đình cùng trao đổi, động viên và thống nhất một việc cụ thể để hỗ trợ em. Giáo viên sẽ tiếp tục theo dõi và phản hồi khi có tiến triển. Xin trân trọng cảm ơn.

IV. LƯU Ý CHO GIÁO VIÊN
- Kiểm tra tên học sinh, thời gian, lịch kiểm tra hoặc lịch họp trước khi gửi.
- Dùng ngôn ngữ tôn trọng, mô tả sự việc cụ thể và tránh quy kết.
- Với nội dung nhạy cảm, nên trao đổi trực tiếp.`;
}
