import type { ExamInput, GenericToolInput, StudentCommentInput, WorksheetInput } from "@/lib/types";

const warning = "Lưu ý: Nội dung do AI tạo, giáo viên nên kiểm tra lại trước khi sử dụng.";

const wait = (ms = 900) => new Promise((resolve) => setTimeout(resolve, ms));

function limitedCount(value: number, fallback: number, max: number) {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(Math.round(value), max);
}

export async function generateExam(input: ExamInput): Promise<string> {
  await wait();
  const mcCount = limitedCount(input.multipleChoiceCount, 6, 12);
  const essayCount = limitedCount(input.essayCount, 2, 5);
  const mcQuestions = Array.from({ length: mcCount }, (_, index) => {
    const n = index + 1;
    return `${n}. Khi học chủ đề "${input.topic}", bước nào sau đây giúp học sinh giải quyết bài tập chính xác nhất?
A. Đọc kỹ yêu cầu, xác định kiến thức cần dùng rồi trình bày theo từng bước.
B. Chọn ngay đáp án quen thuộc mà không cần kiểm tra dữ kiện.
C. Chỉ ghi kết quả cuối cùng, bỏ qua phần lập luận.
D. Học thuộc định nghĩa nhưng không vận dụng vào tình huống.`;
  }).join("\n\n");
  const essayQuestions = Array.from({ length: essayCount }, (_, index) => {
    const n = index + 1;
    return `${n}. Vận dụng kiến thức về ${input.topic} để giải quyết một bài toán/tình huống trong chương trình ${input.subject} lớp ${input.grade}. Trình bày đầy đủ các bước, nêu kết luận và giải thích vì sao cách làm phù hợp.`;
  }).join("\n\n");

  return `HEADER
Trường: ............................................................
Họ và tên học sinh: ................................................
Lớp: ${input.grade}        Ngày kiểm tra: ........../........../..........

ĐỀ KIỂM TRA ${input.subject.toUpperCase()} - LỚP ${input.grade}
Chủ đề/chương: ${input.topic}
Thời gian làm bài: ${input.duration}
Loại đề: ${input.examType}
Mức độ: ${input.level}
Tổng điểm: ${input.totalScore}

I. TRẮC NGHIỆM
Khoanh tròn vào chữ cái đứng trước đáp án đúng nhất.

${mcCount > 0 ? mcQuestions : "Không yêu cầu phần trắc nghiệm."}

II. TỰ LUẬN
Học sinh trình bày bài làm rõ ràng, đủ bước và có kết luận.

${essayCount > 0 ? essayQuestions : "Không yêu cầu phần tự luận."}

III. ĐÁP ÁN
${input.includeAnswers ? `Trắc nghiệm: ${Array.from({ length: mcCount }, (_, index) => `${index + 1}A`).join(", ")}.
Tự luận: Học sinh xác định đúng kiến thức trọng tâm của chủ đề ${input.topic}, lập luận hợp lý, trình bày mạch lạc và có kết luận phù hợp.` : "Giáo viên chưa chọn tạo đáp án."}

IV. THANG ĐIỂM
${input.includeRubric ? `Phần trắc nghiệm: ${mcCount > 0 ? `mỗi câu đúng được ${(input.totalScore * 0.4 / mcCount).toFixed(2)} điểm, tổng khoảng 40% số điểm.` : "không có."}
Phần tự luận: đúng kiến thức trọng tâm 50%, lập luận và vận dụng 30%, trình bày/kết luận 20%.
Giáo viên có thể điều chỉnh tỉ lệ điểm theo phân phối chương trình của lớp.` : "Giáo viên chưa chọn tạo thang điểm."}

V. MA TRẬN ĐỀ ĐƠN GIẢN
${input.includeMatrix ? `- Nhận biết: khoảng 30% số câu, kiểm tra khái niệm và dấu hiệu cơ bản của ${input.topic}.
- Thông hiểu: khoảng 40% số câu, yêu cầu giải thích, phân loại hoặc lựa chọn cách làm.
- Vận dụng: khoảng 30% số câu, gắn với bài tập tổng hợp hoặc tình huống thực tế.
- Năng lực hướng tới: tự học, giải quyết vấn đề, trình bày lập luận.` : "Giáo viên chưa chọn tạo ma trận đề."}

YÊU CẦU THÊM
${input.extraRequirements || "Không có yêu cầu thêm."}

${warning}`;
}

export async function generateWorksheet(input: WorksheetInput): Promise<string> {
  await wait();
  const count = limitedCount(input.exerciseCount, 5, 8);
  const exercises = Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return `${n}. Dựa vào kiến thức về "${input.topic}", hoàn thành yêu cầu sau: phân tích dữ kiện, lựa chọn kiến thức phù hợp và trình bày câu trả lời bằng lời văn/bước giải rõ ràng.

Chỗ trống cho học sinh làm:
................................................................................
................................................................................
................................................................................`;
  }).join("\n\n");

  return `PHIẾU HỌC TẬP ${input.subject.toUpperCase()} - LỚP ${input.grade}
Chủ đề: ${input.topic}
Mức độ: ${input.level}
Phong cách: ${input.style}

I. MỤC TIÊU
${input.objective || `Sau hoạt động này, học sinh nhận biết được kiến thức chính của chủ đề ${input.topic}, biết vận dụng vào bài tập và trình bày câu trả lời rõ ràng.`}

II. KIẾN THỨC CẦN NHỚ
- Xác định đúng khái niệm, dữ kiện hoặc ý chính liên quan đến ${input.topic}.
- Khi làm bài, cần đọc kỹ yêu cầu, gạch chân dữ kiện quan trọng và trình bày theo trình tự hợp lý.
- Với câu hỏi vận dụng, cần giải thích vì sao chọn cách làm hoặc câu trả lời đó.

III. BÀI TẬP
${exercises}

IV. ĐÁP ÁN GỢI Ý
${input.includeAnswers ? `1-${count}. Câu trả lời cần bám sát kiến thức ${input.topic}, có đủ bước phân tích, vận dụng và kết luận. Giáo viên có thể bổ sung đáp án chi tiết theo nội dung đã dạy trên lớp.` : "Giáo viên chưa chọn tạo đáp án."}

YÊU CẦU THÊM
${input.extraRequirements || "Không có yêu cầu thêm."}

${warning}`;
}

export async function generateStudentComments(input: StudentCommentInput): Promise<string> {
  await wait();
  const name = input.studentName || "học sinh";
  const attitude = input.attitude || "có thái độ học tập nghiêm túc và hợp tác trong giờ học";
  const strengths = input.strengths || "biết lắng nghe, tiếp thu góp ý và hoàn thành nhiệm vụ được giao";
  const limitations = input.limitations || "cần chủ động ôn tập và mạnh dạn trình bày ý kiến hơn";

  return `NHẬN XÉT HỌC SINH: ${name}
Lớp: ${input.className || "chưa nhập"}
Vai trò: ${input.role}
Mức học tập: ${input.performance}
Giọng văn mong muốn: ${input.tone}
Mục đích: ${input.purpose}

I. NGẮN GỌN
${name} có kết quả học tập ở mức ${input.performance.toLowerCase()}. Em ${attitude}. Em phát huy tốt điểm mạnh là ${strengths}; trong thời gian tới cần chú ý ${limitations}.

II. TRANG TRỌNG
Trong quá trình học tập và rèn luyện, ${name} thể hiện tinh thần học tập ${input.performance.toLowerCase()} so với yêu cầu của lớp. Em có ưu điểm nổi bật là ${strengths}. Bên cạnh đó, em cần tiếp tục rèn luyện ở điểm ${limitations} để kết quả học tập ổn định và tiến bộ hơn trong giai đoạn tiếp theo.

III. THÂN THIỆN GỬI PHỤ HUYNH
Kính gửi quý phụ huynh, thời gian vừa qua ${name} đã có nhiều cố gắng trong học tập. Em ${attitude} và có điểm mạnh là ${strengths}. Gia đình có thể đồng hành thêm bằng cách nhắc em ${limitations}, giúp em tự tin và tiến bộ bền vững hơn.

${warning}`;
}

const textValue = (input: GenericToolInput, key: string, fallback = "") => String(input[key] ?? fallback);
const numberValue = (input: GenericToolInput, key: string, fallback = 1) => Number(input[key] ?? fallback);
const boolValue = (input: GenericToolInput, key: string) => Boolean(input[key]);
const listValue = (input: GenericToolInput, key: string) => Array.isArray(input[key]) ? (input[key] as string[]) : [];

export async function generateLessonPlan(input: GenericToolInput): Promise<string> {
  await wait();
  const subject = textValue(input, "subject", "Toán");
  const grade = textValue(input, "grade", "8");
  const lesson = textValue(input, "lessonName", "Bài học mới");
  return `GIÁO ÁN ${subject.toUpperCase()} - LỚP ${grade}
Tên bài học: ${lesson}
Thời lượng: ${textValue(input, "duration", "45 phút")}

I. MỤC TIÊU
${textValue(input, "objectives", `Học sinh nắm được kiến thức trọng tâm của bài ${lesson}, biết vận dụng vào tình huống học tập và trình bày được kết quả bằng ngôn ngữ của mình.`)}

II. CHUẨN BỊ
- Phương pháp dạy học: ${textValue(input, "methods", "gợi mở, thảo luận nhóm, luyện tập cá nhân")}.
- Thiết bị học liệu: ${textValue(input, "materials", "sách giáo khoa, bảng phụ, phiếu học tập, máy chiếu nếu có")}.

III. TIẾN TRÌNH DẠY HỌC
1. Hoạt động mở đầu
Giáo viên nêu tình huống gần gũi liên quan đến ${lesson}, yêu cầu học sinh dự đoán cách giải quyết và chia sẻ nhanh trong 2-3 phút.

2. Hoạt động hình thành kiến thức
Giáo viên tổ chức cho học sinh đọc thông tin, quan sát ví dụ mẫu, rút ra kiến thức chính. Học sinh ghi vở các khái niệm/công thức/ý chính cần nhớ.

3. Hoạt động luyện tập
Học sinh làm bài tập ngắn theo cá nhân hoặc cặp đôi. Giáo viên quan sát, hỗ trợ nhóm còn lúng túng và gọi một số em trình bày lời giải.

4. Hoạt động vận dụng
Học sinh giải quyết một tình huống thực tế hoặc bài tập mở rộng có liên hệ với nội dung ${lesson}. Có thể giao hoàn thiện ở nhà nếu thiếu thời gian.

IV. ĐÁNH GIÁ CUỐI BÀI
- Kiểm tra nhanh 2 câu hỏi trọng tâm.
- Nhận xét mức độ tham gia của học sinh.
- Giao nhiệm vụ ôn tập và chuẩn bị bài tiếp theo.

YÊU CẦU THÊM
${textValue(input, "extraRequirements", "Không có yêu cầu thêm.")}

${warning}`;
}

export async function generateMatrix(input: GenericToolInput): Promise<string> {
  await wait();
  const subject = textValue(input, "subject", "Ngữ văn");
  const grade = textValue(input, "grade", "6");
  const topic = textValue(input, "topic", "Chủ đề kiểm tra");
  const totalQuestions = limitedCount(numberValue(input, "questionCount", 12), 12, 60);
  const totalScore = numberValue(input, "totalScore", 10);
  const levels = [
    ["Nhận biết", numberValue(input, "recognitionRate", 30)],
    ["Thông hiểu", numberValue(input, "understandingRate", 40)],
    ["Vận dụng", numberValue(input, "applicationRate", 20)],
    ["Vận dụng cao", numberValue(input, "advancedRate", 10)]
  ] as const;
  const rows = levels.map(([label, rate]) => {
    const questions = Math.max(1, Math.round((totalQuestions * rate) / 100));
    const score = ((totalScore * rate) / 100).toFixed(1);
    return `| ${label} | ${rate}% | ${questions} câu | ${score} điểm |`;
  }).join("\n");

  return `MA TRẬN ĐỀ ${subject.toUpperCase()} - LỚP ${grade}
Chủ đề/chương: ${topic}
Thời gian kiểm tra: ${textValue(input, "duration", "45 phút")}
Tổng điểm: ${totalScore}
Số câu: ${totalQuestions}

I. BẢNG MA TRẬN ĐỀ
| Mức độ | Tỉ lệ | Số câu gợi ý | Điểm gợi ý |
|---|---:|---:|---:|
${rows}

II. BẢNG PHÂN BỔ CÂU HỎI
- Câu 1-${Math.max(1, Math.round(totalQuestions * 0.3))}: nhận biết kiến thức cơ bản của ${topic}.
- Nhóm câu tiếp theo: kiểm tra khả năng giải thích, phân tích và lựa chọn cách làm.
- Câu cuối: vận dụng kiến thức vào tình huống hoặc bài tập tổng hợp.

III. GỢI Ý SỐ CÂU THEO MỨC ĐỘ
Nên giữ câu nhận biết ngắn, câu thông hiểu có dữ kiện rõ, câu vận dụng yêu cầu học sinh trình bày lập luận.

IV. GỢI Ý THANG ĐIỂM
Phân bổ điểm theo tỉ lệ mức độ, ưu tiên chấm rõ phần lập luận và kết luận ở câu vận dụng.

GHI CHÚ
${textValue(input, "notes", "Có thể điều chỉnh tỉ lệ theo năng lực lớp và phân phối chương trình.")}

${warning}`;
}

export async function generateAnswerKey(input: GenericToolInput): Promise<string> {
  await wait();
  return `ĐÁP ÁN VÀ THANG ĐIỂM
Môn học: ${textValue(input, "subject", "Toán")}
Lớp: ${textValue(input, "grade", "8")}
Tổng điểm: ${textValue(input, "totalScore", "10")}
Kiểu đáp án: ${textValue(input, "answerStyle", "Chi tiết")}

I. NỘI DUNG ĐỀ BÀI
${textValue(input, "examContent", "Giáo viên dán nội dung đề bài tại đây.")}

II. ĐÁP ÁN
- Xác định đúng yêu cầu của đề bài.
- Trình bày được kiến thức trọng tâm.
- Kết luận đúng, phù hợp dữ kiện.

III. LỜI GIẢI
1. Đọc kỹ đề và gạch chân dữ kiện quan trọng.
2. Chọn kiến thức/công thức/luận điểm phù hợp.
3. Trình bày lời giải theo từng bước, tránh nhảy bước.
4. Kiểm tra lại kết quả và ghi kết luận.

IV. THANG ĐIỂM
- Hiểu đúng đề: 20%.
- Vận dụng kiến thức chính xác: 40%.
- Lập luận/trình bày: 25%.
- Kết luận và kiểm tra kết quả: 15%.

V. LƯU Ý KHI CHẤM
Chấp nhận cách giải khác nếu hợp lý, đúng bản chất kiến thức và có kết quả phù hợp.

YÊU CẦU THÊM
${textValue(input, "extraRequirements", "Không có yêu cầu thêm.")}

${warning}`;
}

export async function generateRubric(input: GenericToolInput): Promise<string> {
  await wait();
  const criteria = textValue(input, "criteria", "Nội dung, trình bày, hợp tác, sáng tạo")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const totalScore = numberValue(input, "totalScore", 10);
  const perCriterion = (totalScore / Math.max(1, criteria.length)).toFixed(1);
  const rows = criteria.map((criterion) => `| ${criterion} | Xuất sắc: đầy đủ, chính xác, sáng tạo | Tốt: đúng yêu cầu chính | Đạt: hoàn thành cơ bản | Cần cố gắng: thiếu hoặc sai nhiều | ${perCriterion} |`).join("\n");

  return `RUBRIC CHẤM BÀI
Môn học: ${textValue(input, "subject", "Ngữ văn")}
Lớp: ${textValue(input, "grade", "7")}
Loại bài: ${textValue(input, "assignmentType", "Bài viết")}
Tổng điểm: ${totalScore}
Số mức đánh giá: ${textValue(input, "levelCount", "4")}

I. BẢNG RUBRIC
| Tiêu chí | Xuất sắc | Tốt | Đạt | Cần cố gắng | Điểm |
|---|---|---|---|---|---:|
${rows}

II. GỢI Ý NHẬN XÉT
- Nêu rõ điểm mạnh nổi bật của học sinh.
- Chỉ ra một điểm cần cải thiện cụ thể.
- Đề xuất hành động tiếp theo để học sinh tiến bộ.

YÊU CẦU THÊM
${textValue(input, "extraRequirements", "Không có yêu cầu thêm.")}

${warning}`;
}

export async function generateParentMessage(input: GenericToolInput): Promise<string> {
  await wait();
  const student = textValue(input, "studentName", "học sinh");
  const context = textValue(input, "situation", "Báo tiến bộ");
  const main = textValue(input, "mainContent", "nội dung cần trao đổi với phụ huynh");
  return `TIN NHẮN GỬI PHỤ HUYNH - ${student}
Lớp: ${textValue(input, "className", "chưa nhập")}
Tình huống: ${context}
Giọng văn: ${textValue(input, "tone", "Nhẹ nhàng")}

I. TIN NHẮN NGẮN
Kính gửi quý phụ huynh, giáo viên xin trao đổi nhanh về ${student}: ${main}. Mong gia đình phối hợp hỗ trợ em trong thời gian tới. Xin cảm ơn quý phụ huynh.

II. TIN NHẮN TRANG TRỌNG
Kính gửi quý phụ huynh em ${student}, trong quá trình theo dõi học tập và rèn luyện, giáo viên muốn thông tin tới gia đình nội dung sau: ${main}. Rất mong quý phụ huynh cùng phối hợp để em có sự tiến bộ ổn định hơn.

III. TIN NHẮN THÂN THIỆN
Chào anh/chị, em xin trao đổi một chút về tình hình của ${student}. Hiện tại ${main}. Nhờ gia đình cùng nhắc nhở và động viên em thêm nhé. Em cảm ơn anh/chị.

IV. LƯU Ý CÁCH GỬI
Nên gửi vào thời điểm phụ huynh dễ đọc tin, dùng ngôn ngữ tôn trọng, tránh quy kết và luôn kèm hướng phối hợp cụ thể.

${warning}`;
}

export async function generateQuestionBank(input: GenericToolInput): Promise<string> {
  await wait();
  const count = limitedCount(numberValue(input, "questionCount", 10), 10, 30);
  const includeAnswers = boolValue(input, "includeAnswers");
  const topic = textValue(input, "topic", "Chủ đề ôn tập");
  const questions = Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return `${n}. [${textValue(input, "level", "Trộn nhiều mức độ")}] ${textValue(input, "questionType", "Trắc nghiệm")} về ${topic}: Hãy giải thích hoặc lựa chọn phương án đúng dựa trên kiến thức đã học.${includeAnswers ? `\nĐáp án gợi ý: Học sinh cần nêu đúng ý chính của ${topic} và trình bày rõ căn cứ.` : ""}`;
  }).join("\n\n");

  return `NGÂN HÀNG CÂU HỎI
Môn học: ${textValue(input, "subject", "Toán")}
Lớp: ${textValue(input, "grade", "6")}
Chủ đề: ${topic}
Loại câu hỏi: ${textValue(input, "questionType", "Trắc nghiệm")}
Số lượng: ${count}

I. DANH SÁCH CÂU HỎI
${questions}

II. GỢI Ý SỬ DỤNG
- Dùng câu dễ để khởi động hoặc kiểm tra nhanh.
- Dùng câu trung bình/khó cho luyện tập và ôn tập cuối chủ đề.
- Có thể chọn ngẫu nhiên 5-10 câu để tạo đề ngắn.

${warning}`;
}

export async function generateQuestionVariants(input: GenericToolInput): Promise<string> {
  await wait();
  const count = limitedCount(numberValue(input, "variantCount", 4), 4, 12);
  const original = textValue(input, "originalQuestion", "Câu hỏi gốc chưa nhập.");
  const variants = Array.from({ length: count }, (_, index) => `${index + 1}. Biến thể ${index + 1}: ${original} Yêu cầu học sinh giải quyết trong bối cảnh mới số ${index + 1}, vẫn giữ cùng chuẩn kiến thức.${boolValue(input, "includeAnswers") ? "\nĐáp án/lời giải: Giữ logic như câu gốc, thay dữ kiện tương ứng và kiểm tra kết quả cuối." : ""}`).join("\n\n");

  return `BIẾN THỂ CÂU HỎI
Môn học: ${textValue(input, "subject", "Toán")}
Lớp: ${textValue(input, "grade", "7")}
Mức thay đổi: ${textValue(input, "changeLevel", "Đổi ngữ cảnh")}

I. CÂU HỎI GỐC
${original}

II. CÁC BIẾN THỂ CÂU HỎI
${variants}

III. GHI CHÚ MỨC ĐỘ
Các biến thể giữ cùng mục tiêu đánh giá, giáo viên cần kiểm tra lại số liệu và đáp án trước khi dùng trong đề chính thức.

${warning}`;
}

export async function checkExam(input: GenericToolInput): Promise<string> {
  await wait();
  const checks = listValue(input, "checks").join(", ") || "Lỗi chính tả, câu hỏi mơ hồ, tổng điểm";
  return `KIỂM TRA LỖI ĐỀ
Môn học: ${textValue(input, "subject", "Toán")}
Lớp: ${textValue(input, "grade", "8")}
Nội dung kiểm tra: ${checks}

I. DANH SÁCH LỖI PHÁT HIỆN
1. Mức độ trung bình: Một số câu cần làm rõ động từ yêu cầu như “trình bày”, “giải thích”, “chứng minh”.
2. Mức độ nhẹ: Nên thống nhất cách ghi điểm và số thứ tự câu hỏi.
3. Mức độ cần kiểm tra: Tổng điểm cần đối chiếu lại với thang điểm chi tiết.

II. GỢI Ý SỬA
- Bổ sung dữ kiện cho câu hỏi còn mơ hồ.
- Tách câu hỏi dài thành các ý nhỏ.
- Ghi rõ số điểm từng phần.

III. BẢN ĐỀ ĐÃ CHỈNH SỬA GỢI Ý
${textValue(input, "examContent", "Dán nội dung đề kiểm tra tại đây.")}

Gợi ý: Giáo viên rà lại câu chữ, thêm thang điểm rõ hơn và kiểm tra độ khó theo năng lực lớp.

${warning}`;
}

export async function generateClassActivity(input: GenericToolInput): Promise<string> {
  await wait();
  const topic = textValue(input, "topic", "Chủ đề bài học");
  return `HOẠT ĐỘNG LỚP HỌC
Tên hoạt động: Trạm khám phá ${topic}
Môn học: ${textValue(input, "subject", "Khoa học")}
Lớp: ${textValue(input, "grade", "6")}
Sĩ số: ${textValue(input, "classSize", "40")}
Thời lượng: ${textValue(input, "duration", "15 phút")}
Hình thức: ${textValue(input, "format", "Nhóm")}

I. MỤC TIÊU
${textValue(input, "objective", `Học sinh củng cố kiến thức về ${topic}, hợp tác với bạn và trình bày được kết quả thảo luận.`)}

II. CÁCH TỔ CHỨC
Giáo viên chia lớp thành các nhóm nhỏ, giao nhiệm vụ rõ ràng và quy định thời gian hoàn thành. Mỗi nhóm ghi kết quả vào phiếu hoặc bảng nhóm.

III. LUẬT CHƠI/NHIỆM VỤ
- Mỗi nhóm đọc tình huống, thảo luận và thống nhất câu trả lời.
- Đại diện nhóm trình bày trong 1 phút.
- Nhóm khác đặt câu hỏi hoặc bổ sung.

IV. SẢN PHẨM HỌC SINH CẦN TẠO
Phiếu trả lời ngắn, sơ đồ ý chính hoặc bảng tổng hợp kết quả.

V. CÁCH ĐÁNH GIÁ
Đánh giá theo mức độ đúng kiến thức, khả năng hợp tác, cách trình bày và sự tham gia của từng thành viên.

${warning}`;
}

export async function generateDifferentiatedExercises(input: GenericToolInput): Promise<string> {
  await wait();
  const count = limitedCount(numberValue(input, "exerciseCount", 2), 2, 6);
  const topic = textValue(input, "topic", "Chủ đề luyện tập");
  const block = (level: string) => Array.from({ length: count }, (_, index) => `${index + 1}. [${level}] Bài tập về ${topic}: học sinh đọc yêu cầu, xác định kiến thức cần dùng và trình bày lời giải rõ ràng.${boolValue(input, "includeAnswers") ? "\nĐáp án gợi ý: Bám sát kiến thức trọng tâm, có đủ bước giải và kết luận." : ""}`).join("\n\n");

  return `BÀI TẬP PHÂN HÓA
Môn học: ${textValue(input, "subject", "Toán")}
Lớp: ${textValue(input, "grade", "7")}
Chủ đề: ${topic}
Số bài mỗi mức: ${count}

I. BÀI TẬP MỨC CƠ BẢN
${block("Cơ bản")}

II. BÀI TẬP MỨC VỪA
${block("Vừa")}

III. BÀI TẬP MỨC NÂNG CAO
${block("Nâng cao")}

IV. GỢI Ý GIAO BÀI
- Nhóm cần hỗ trợ: làm mức cơ bản trước, sau đó chọn 1 bài mức vừa.
- Nhóm đạt yêu cầu: làm mức vừa và thử 1 bài nâng cao.
- Nhóm khá giỏi: ưu tiên mức nâng cao và giải thích cách làm cho bạn.

${warning}`;
}

function parseQuestionBlocks(raw: string) {
  const blocks = raw
    .split(/(?=Câu\s+\d+\.|Cau\s+\d+\.)/i)
    .map((item) => item.trim())
    .filter(Boolean);
  return blocks.length ? blocks : ["Câu 1. Nội dung câu hỏi mẫu\nA. Phương án A\nB. Phương án B\nC. Phương án C\nD. Phương án D\nĐáp án: A"];
}

export async function shuffleExam(input: GenericToolInput): Promise<string> {
  await wait();
  const codeCount = limitedCount(numberValue(input, "codeCount", 4), 4, 8);
  const questions = parseQuestionBlocks(textValue(input, "questions", ""));
  const codes = Array.from({ length: codeCount }, (_, index) => 101 + index);
  const codeSections = codes.map((code, codeIndex) => {
    const ordered = boolValue(input, "shuffleQuestions") ? [...questions].sort((a, b) => ((a.length + codeIndex) % 3) - ((b.length + codeIndex) % 3)) : questions;
    const answerRows = ordered.map((_, index) => `${index + 1}${["A", "B", "C", "D"][(index + codeIndex) % 4]}`).join(", ");
    return `MÃ ĐỀ ${code}
${ordered.map((question, index) => `${index + 1}. ${question.replace(/^Câu\s+\d+\.\s*/i, "")}`).join("\n\n")}

Bảng đáp án mã ${code}: ${answerRows}`;
  }).join("\n\n");

  return `TRỘN MÃ ĐỀ
Tên đề kiểm tra: ${textValue(input, "examName", "Đề kiểm tra")}
Môn học: ${textValue(input, "subject", "Toán")}
Lớp: ${textValue(input, "grade", "8")}
Số mã đề: ${codeCount}
Trộn thứ tự câu: ${boolValue(input, "shuffleQuestions") ? "Có" : "Không"}
Trộn đáp án A/B/C/D: ${boolValue(input, "shuffleAnswers") ? "Có" : "Không"}

I. DANH SÁCH MÃ ĐỀ
${codes.map((code) => `- Mã đề ${code}`).join("\n")}

II. NỘI DUNG CÁC MÃ ĐỀ
${codeSections}

III. LƯU Ý
Bản demo chỉ mô phỏng trộn đề, giáo viên cần kiểm tra lại thứ tự câu, đáp án và định dạng trước khi dùng chính thức.

GHI CHÚ
${textValue(input, "notes", "Không có ghi chú thêm.")}

${warning}`;
}

export async function generateSlideOutline(input: GenericToolInput): Promise<string> {
  await wait();
  const count = limitedCount(numberValue(input, "slideCount", 8), 8, 20);
  const lesson = textValue(input, "lessonName", "Bài học");
  const slides = Array.from({ length: count }, (_, index) => `${index + 1}. Slide ${index + 1}: ${index === 0 ? `Khởi động bài ${lesson}` : index === count - 1 ? "Củng cố và kiểm tra nhanh" : `Ý chính ${index} của bài ${lesson}`}
- Bullet: nêu vấn đề trọng tâm, ví dụ minh họa và câu hỏi dẫn dắt.
- Minh họa: hình ảnh/sơ đồ liên quan đến nội dung bài.
- Tương tác: hỏi nhanh, thảo luận cặp đôi hoặc mini quiz.`).join("\n\n");

  return `DÀN Ý SLIDE BÀI GIẢNG
Môn học: ${textValue(input, "subject", "Sinh học")}
Lớp: ${textValue(input, "grade", "7")}
Tên bài học: ${lesson}
Thời lượng: ${textValue(input, "duration", "45 phút")}
Phong cách: ${textValue(input, "style", "Sinh động")}

I. DANH SÁCH SLIDE
${slides}

II. GỢI Ý CÂU HỎI KIỂM TRA NHANH
- Em nhớ được khái niệm nào quan trọng nhất?
- Ví dụ nào trong bài có thể liên hệ thực tế?
- Còn phần nào em cần giáo viên giải thích thêm?

NỘI DUNG CHÍNH
${textValue(input, "mainContent", "Chưa nhập nội dung chính.")}

YÊU CẦU THÊM
${textValue(input, "extraRequirements", "Không có yêu cầu thêm.")}

${warning}`;
}

export async function generateLessonSummary(input: GenericToolInput): Promise<string> {
  await wait();
  const topic = textValue(input, "topic", "Bài học");
  return `TÓM TẮT BÀI HỌC
Môn học: ${textValue(input, "subject", "Địa lí")}
Lớp: ${textValue(input, "grade", "6")}
Bài/chủ đề: ${topic}
Độ dài: ${textValue(input, "length", "Vừa")}
Đối tượng: ${textValue(input, "audience", "Học sinh trung bình")}

I. TÓM TẮT KIẾN THỨC TRỌNG TÂM
${topic} gồm các ý chính: khái niệm cơ bản, đặc điểm nổi bật, ví dụ minh họa và cách vận dụng vào bài tập hoặc tình huống thực tế.

II. TỪ KHÓA CẦN NHỚ
- Khái niệm chính
- Dấu hiệu nhận biết
- Ví dụ thực tế
- Cách trình bày câu trả lời

III. VÍ DỤ MINH HỌA
Giáo viên có thể dùng một tình huống gần gũi với học sinh để giải thích ${topic}, sau đó yêu cầu học sinh tự nêu thêm ví dụ.

${boolValue(input, "includeQuestions") ? `IV. CÂU HỎI ÔN TẬP
1. Nêu khái niệm chính của bài.
2. Cho một ví dụ minh họa.
3. Giải thích vì sao ví dụ đó phù hợp với kiến thức đã học.` : ""}

V. GỢI Ý CÁCH HỌC
Đọc lại vở ghi, gạch chân từ khóa, tự đặt 3 câu hỏi ngắn và thử giải thích lại bài bằng lời của mình.

NỘI DUNG BÀI HỌC GỐC
${textValue(input, "lessonContent", "Chưa nhập nội dung bài học.")}

${warning}`;
}

export async function generateMindmapOutline(input: GenericToolInput): Promise<string> {
  await wait();
  const branches = limitedCount(numberValue(input, "branchCount", 5), 5, 10);
  const topic = textValue(input, "centralTopic", "Chủ đề trung tâm");
  const branchText = Array.from({ length: branches }, (_, index) => `Nhánh ${index + 1}: Ý chính ${index + 1}
- Nhánh phụ: khái niệm, ví dụ, dấu hiệu nhận biết.
- Từ khóa: ${topic.toLowerCase()}-${index + 1}
${boolValue(input, "includeExamples") ? "- Ví dụ: liên hệ một tình huống quen thuộc trong lớp học hoặc đời sống." : ""}`).join("\n\n");

  return `SƠ ĐỒ TƯ DUY DẠNG OUTLINE
Môn học: ${textValue(input, "subject", "Ngữ văn")}
Lớp: ${textValue(input, "grade", "6")}
Chủ đề trung tâm: ${topic}
Phong cách: ${textValue(input, "style", "Dễ nhớ")}

I. CHỦ ĐỀ TRUNG TÂM
${topic}

II. CÁC NHÁNH CHÍNH
${branchText}

III. GỢI Ý TRÌNH BÀY
Viết chủ đề ở giữa trang, dùng màu khác nhau cho từng nhánh chính, mỗi nhánh chỉ nên có từ khóa ngắn và ví dụ dễ nhớ. Nếu làm slide, dùng bố cục radial hoặc bảng 2 cột.

NỘI DUNG CHÍNH
${textValue(input, "mainContent", "Chưa nhập nội dung chính.")}

${warning}`;
}

export async function generateHomeroomPlan(input: GenericToolInput): Promise<string> {
  await wait();
  return `KẾ HOẠCH CHỦ NHIỆM
Lớp: ${textValue(input, "className", "7A1")}
Tuần/tháng: ${textValue(input, "period", "Tuần 1")}

I. MỤC TIÊU
${textValue(input, "mainGoal", "Ổn định nề nếp, theo dõi học tập và tăng cường phối hợp với phụ huynh.")}

II. TÌNH HÌNH LỚP
${textValue(input, "classSituation", "Lớp cơ bản ổn định, một số học sinh cần được nhắc nhở về chuẩn bị bài.")}

III. NỘI DUNG CÔNG VIỆC
- Theo dõi chuyên cần, nề nếp, việc chuẩn bị bài.
- Trao đổi với giáo viên bộ môn về học sinh cần hỗ trợ.
- Nhắc lớp thực hiện nội quy và kế hoạch tuần.

IV. BIỆN PHÁP THỰC HIỆN
- Giao ban cán sự lớp đầu tuần.
- Ghi nhận tiến bộ và nhắc nhở riêng học sinh vi phạm.
- Liên hệ phụ huynh khi cần phối hợp.

V. PHÂN CÔNG
- Lớp trưởng: tổng hợp tình hình nề nếp.
- Tổ trưởng: theo dõi bài tập và vệ sinh.
- Giáo viên chủ nhiệm: đánh giá, phản hồi, phối hợp phụ huynh.

VI. ĐÁNH GIÁ CUỐI KỲ/TUẦN
Đánh giá theo chuyên cần, học tập, nề nếp, tinh thần hợp tác và mức độ hoàn thành mục tiêu.

VII. GHI CHÚ PHỐI HỢP PHỤ HUYNH
${textValue(input, "notes", "Trao đổi nhẹ nhàng, cụ thể, ưu tiên hướng hỗ trợ học sinh tiến bộ.")}

VẤN ĐỀ CẦN THEO DÕI
${textValue(input, "issues", "Chưa nhập.")}

HOẠT ĐỘNG DỰ KIẾN
${textValue(input, "activities", "Sinh hoạt lớp, tuyên dương, nhắc nhở nề nếp.")}

${warning}`;
}

export async function generateParentMeetingMinutes(input: GenericToolInput): Promise<string> {
  await wait();
  return `BIÊN BẢN HỌP PHỤ HUYNH
Lớp: ${textValue(input, "className", "7A1")}
Thời gian họp: ${textValue(input, "meetingTime", "19:30 ngày ...")}
Địa điểm: ${textValue(input, "location", "Phòng học lớp")}
Giáo viên chủ nhiệm: ${textValue(input, "homeroomTeacher", "Chưa nhập")}

I. THÀNH PHẦN THAM DỰ
- Giáo viên chủ nhiệm.
- Đại diện phụ huynh lớp.
- Số phụ huynh tham dự: ${textValue(input, "parentCount", "chưa nhập")}.

II. NỘI DUNG CUỘC HỌP
${textValue(input, "mainContent", "Thông tin tình hình học tập, rèn luyện và kế hoạch phối hợp trong thời gian tới.")}

III. CÁC KHOẢN CẦN THỐNG NHẤT
${textValue(input, "agreements", "Các khoản đóng góp hoặc nội dung phối hợp được trao đổi công khai, minh bạch.")}

IV. Ý KIẾN TRAO ĐỔI
${textValue(input, "parentOpinions", "Phụ huynh trao đổi, góp ý và thống nhất phương hướng hỗ trợ học sinh.")}

V. KẾT LUẬN
${textValue(input, "conclusion", "Cuộc họp thống nhất các nội dung chính và cam kết phối hợp giữa gia đình và nhà trường.")}

VI. CAM KẾT/PHỐI HỢP
Gia đình phối hợp nhắc nhở học sinh học tập, rèn luyện nề nếp; giáo viên chủ nhiệm thường xuyên thông tin khi có vấn đề cần hỗ trợ.

VII. CHỮ KÝ ĐẠI DIỆN
Giáo viên chủ nhiệm: ............................
Đại diện phụ huynh: .............................

${warning}`;
}

export async function convertTextToLatex(input: GenericToolInput): Promise<string> {
  await wait();
  const raw = textValue(input, "formulaText", "a/b + sqrt(x)");
  const latex = raw
    .replace(/sqrt\((.*?)\)/gi, "\\sqrt{$1}")
    .replace(/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/g, "\\frac{$1}{$2}")
    .replace(/\^(\w+)/g, "^{$1}")
    .replace(/\bpi\b/gi, "\\pi");
  const outputType = textValue(input, "outputType", "Cả hai");

  return `CHUYỂN CÔNG THỨC SANG LATEX
Môn học: ${textValue(input, "subject", "Toán")}
Kiểu output: ${outputType}

I. LATEX INLINE
\\(${latex}\\)

II. LATEX DISPLAY
\\[
${latex}
\\]

III. GIẢI THÍCH KÝ HIỆU
- \\frac{a}{b}: phân số a trên b.
- \\sqrt{x}: căn bậc hai của x.
- ^{n}: lũy thừa n.

YÊU CẦU THÊM
${textValue(input, "extraRequirements", "Không có yêu cầu thêm.")}

Lưu ý: Công cụ này không dùng OCR, chỉ chuyển công thức dạng text đã nhập thành LaTeX mô phỏng.

${warning}`;
}
