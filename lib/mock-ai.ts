import type { ExamInput, StudentCommentInput, WorksheetInput } from "@/lib/types";

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
