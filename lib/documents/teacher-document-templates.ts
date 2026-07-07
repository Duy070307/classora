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
  const requirement = value(input, "curriculumRequirement", `Gợi ý yêu cầu cần đạt tham khảo: học sinh trình bày được kiến thức trọng tâm của bài ${lesson} và vận dụng được vào nhiệm vụ học tập phù hợp.`);
  const bloomLevel = value(input, "bloomLevel", "Đầy đủ theo Bloom");
  const activity = (number: number, name: string, objective: string, teacher: string, student: string, product: string) => `HOẠT ĐỘNG ${number}: ${name}
- Mục tiêu hoạt động: ${objective}
- Thời lượng: ${number === 1 ? "5 phút" : number === 5 ? "5 phút" : "10-15 phút"}
- Hoạt động của giáo viên: ${teacher}
- Hoạt động của học sinh: ${student}
- Sản phẩm dự kiến: ${product}
- Cách đánh giá: Quan sát quá trình, đối chiếu sản phẩm và phản hồi ngắn.`;
  return `KẾ HOẠCH BÀI DẠY

I. THÔNG TIN BÀI HỌC
- Môn học: ${subject}
- Lớp: ${grade}
- Tên bài/chủ đề: ${lesson}
- Thời lượng: ${value(input, "duration", "45 phút")}
- Định hướng sử dụng: Giáo án được tạo là bản nháp tham khảo. Thầy cô cần điều chỉnh theo lớp học, chương trình và yêu cầu chuyên môn.

II. MỤC TIÊU BÀI HỌC
- Yêu cầu cần đạt tham khảo: ${requirement}
- Năng lực đặc thù: Trình bày được kiến thức trọng tâm của bài; vận dụng được kiến thức để giải quyết nhiệm vụ học tập phù hợp với môn ${subject}.
- Năng lực chung: Tự học, giao tiếp, hợp tác và giải quyết vấn đề.
- Phẩm chất: Chăm chỉ, trách nhiệm, trung thực trong học tập.
- Mục tiêu cụ thể theo thang Bloom (${bloomLevel}):
  1. Nêu được các khái niệm hoặc dữ kiện chính liên quan đến ${lesson}.
  2. Mô tả được mối quan hệ giữa các nội dung trọng tâm của bài học.
  3. Vận dụng được kiến thức vào bài tập hoặc tình huống quen thuộc.
  4. Phân tích được một ví dụ/tình huống để chỉ ra kiến thức cần dùng.
  5. Nhận xét được cách giải quyết hoặc sản phẩm học tập của bản thân/nhóm.

III. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
- Phương pháp: ${value(input, "methods", "Gợi mở, thảo luận nhóm, luyện tập cá nhân")}.
- Học liệu: ${value(input, "materials", "Sách giáo khoa, bảng phụ, phiếu học tập")}.

IV. TIẾN TRÌNH DẠY HỌC
${activity(1, "KHỞI ĐỘNG", `Kích hoạt kiến thức nền về ${lesson}.`, "Nêu tình huống gợi mở, đặt câu hỏi ngắn và định hướng nhiệm vụ.", "Suy nghĩ cá nhân, chia sẻ dự đoán hoặc kinh nghiệm liên quan.", "Câu trả lời dự đoán hoặc bảng từ khóa.")}

${activity(2, "HÌNH THÀNH KIẾN THỨC", `Trình bày và giải thích được nội dung cốt lõi của ${lesson}.`, "Tổ chức khai thác ví dụ/ngữ liệu, đặt câu hỏi dẫn dắt và chuẩn hóa kiến thức.", "Quan sát, thảo luận, ghi chép và trả lời câu hỏi gợi mở.", "Ghi chép kiến thức trọng tâm và ví dụ minh họa.")}

${activity(3, "LUYỆN TẬP", "Củng cố kiến thức và rèn kĩ năng.", "Giao bài tập/nhiệm vụ theo mức độ, hỗ trợ học sinh gặp khó khăn và chữa lỗi thường gặp.", "Làm bài cá nhân hoặc cặp đôi, đối chiếu kết quả và giải thích cách làm.", "Bài làm có bước giải, luận điểm hoặc kết luận rõ ràng.")}

${activity(4, "VẬN DỤNG", `Liên hệ ${lesson} với tình huống mới.`, "Đưa tình huống thực tế hoặc nhiệm vụ mở, hướng dẫn tiêu chí sản phẩm.", "Đề xuất cách giải quyết và trình bày sản phẩm ngắn.", "Câu trả lời vận dụng, poster hoặc bảng tổng hợp.")}

${activity(5, "CỦNG CỐ/DẶN DÒ", "Hệ thống hóa kiến thức và định hướng tự học.", "Tóm tắt điểm chính, giao nhiệm vụ về nhà hoặc câu hỏi tự kiểm tra.", "Nêu lại kiến thức trọng tâm và ghi nhiệm vụ học tập tiếp theo.", "Bảng tóm tắt/câu trả lời củng cố.")}

V. LƯU Ý CHUYÊN MÔN
- Các điểm dễ nhầm: giáo viên cần rà soát lại thuật ngữ, ví dụ, số liệu và yêu cầu bài tập.
- Gợi ý điều chỉnh: tăng/giảm số nhiệm vụ theo năng lực lớp học.
- Lưu ý an toàn: nếu có thí nghiệm hoặc thiết bị, cần kiểm tra điều kiện an toàn trước giờ học.

VI. GHI CHÚ RÀ SOÁT
Giáo viên cần kiểm tra lại tính chính xác, đáp án, số liệu, thí nghiệm và yêu cầu chương trình trước khi sử dụng chính thức.`;
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
