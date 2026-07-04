import type { AIRefinementAction } from "@/lib/ai/types";

const reviewNote =
  "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức.";

const baseRules = `Yêu cầu chung:
- Trả lời bằng tiếng Việt.
- Viết theo giọng chuyên nghiệp, thân thiện với giáo viên Việt Nam.
- Tạo nội dung có cấu trúc rõ ràng, dễ copy sang Word.
- Không yêu cầu nhập dữ liệu cá nhân nhạy cảm của học sinh.
- Không tạo đoạn văn bản có bản quyền quá dài.
- Không cam kết độ chính xác tuyệt đối.
- Cuối nội dung chỉ nhắc ngắn gọn: "${reviewNote}"`;

function formatInput(input: unknown) {
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

function prompt(task: string, input: unknown, structure: string) {
  return `Bạn là trợ lý soạn tài liệu cho giáo viên Việt Nam.
Nhiệm vụ: ${task}

Dữ liệu đầu vào:
${formatInput(input)}

Cấu trúc mong muốn:
${structure}

${baseRules}`;
}

export function buildExamPrompt(input: unknown) {
  return prompt(
    "Soạn đề kiểm tra theo đặc trưng môn học",
    input,
    `Nếu đề theo phong cách THPTQG/tốt nghiệp:
- PHẦN I: câu trắc nghiệm A/B/C/D.
- PHẦN II: câu đúng/sai với bốn ý a), b), c), d).
- PHẦN III: câu trả lời ngắn.
- Tách rõ BẢN DÀNH CHO HỌC SINH và PHẦN DÀNH CHO GIÁO VIÊN.
- Phần giáo viên có đáp án, gợi ý chấm, thang điểm, ma trận và bản đặc tả.
- Không đưa đáp án giáo viên vào đề học sinh.

Ưu tiên trả JSON hợp lệ với dạng:
{
  "title": "...",
  "content": "Markdown đầy đủ để hiển thị",
  "structuredExam": { "student": { ... }, "teacher": { ... } }
}
Nếu không chắc cấu trúc JSON, trả Markdown sạch.`
  );
}

export function buildWorksheetPrompt(input: unknown) {
  return prompt(
    "Soạn phiếu học tập",
    input,
    `PHIẾU HỌC TẬP
- Thông tin bài học.
- Mục tiêu.
- Kiến thức cần nhớ.
- Bài tập cơ bản.
- Bài tập vận dụng.
- Hướng dẫn/đáp án dành cho giáo viên.`
  );
}

export function buildLessonPlanPrompt(input: unknown) {
  return prompt(
    "Soạn kế hoạch bài dạy",
    input,
    `KẾ HOẠCH BÀI DẠY
- Thông tin bài học.
- Mục tiêu.
- Học liệu.
- Tiến trình hoạt động: mở đầu, hình thành kiến thức, luyện tập, vận dụng.
- Đánh giá.
- Điều chỉnh sau bài dạy.`
  );
}

export function buildStudentCommentsPrompt(input: unknown) {
  return prompt(
    "Viết nhận xét học sinh",
    input,
    `- Điểm mạnh.
- Điểm cần cải thiện.
- Hành động tiếp theo.
- Nhận xét hoàn chỉnh.
- Có thể thêm phiên bản ngắn, trang trọng và thân thiện gửi phụ huynh.`
  );
}

export function buildBulkStudentCommentsPrompt(input: unknown) {
  return prompt(
    "Viết nhận xét học sinh hàng loạt",
    input,
    `- Mỗi học sinh có nhận xét riêng.
- Ngôn ngữ tự nhiên, tích cực, không phán xét.
- Có điểm mạnh, điểm cần cải thiện và gợi ý hành động tiếp theo.`
  );
}

export function buildParentMessagePrompt(input: unknown) {
  return prompt(
    "Soạn tin nhắn gửi phụ huynh",
    input,
    `- Phiên bản ngắn.
- Phiên bản đầy đủ.
- Giọng văn lịch sự, rõ ràng, tôn trọng.
- Tránh quy kết hoặc gây áp lực không cần thiết.`
  );
}

export function buildRubricPrompt(input: unknown) {
  return prompt(
    "Tạo rubric đánh giá",
    input,
    `- Thông tin nhiệm vụ.
- Bảng tiêu chí, mức đánh giá và điểm.
- Hướng dẫn chấm.
- Gợi ý nhận xét.
Hãy dùng bảng Markdown sạch để hệ thống chuyển thành bảng Word/PDF.`
  );
}

export function buildGenericPrompt(tool: string, input: unknown) {
  return prompt(tool, input, "Các phần có tiêu đề rõ ràng, nội dung ngắn gọn, dễ kiểm tra và dễ xuất Word/PDF.");
}

const refinementInstructions: Record<AIRefinementAction, string> = {
  regenerate: "Tạo lại một phiên bản khác nhưng giữ mục tiêu và dữ liệu đầu vào.",
  shorter: "Rút gọn nội dung, giữ ý chính.",
  "more-detailed": "Bổ sung chi tiết, ví dụ và hướng dẫn hữu ích.",
  simpler: "Diễn đạt dễ hiểu hơn, dùng câu ngắn và từ ngữ phổ thông.",
  "more-formal": "Điều chỉnh sang văn phong trang trọng, chuẩn mực.",
  easier: "Giảm độ khó, phù hợp học sinh cần hỗ trợ.",
  harder: "Tăng độ khó và mức vận dụng nhưng vẫn bám sát dữ liệu đầu vào.",
};

export function buildPrompt(tool: string, input: unknown, action?: AIRefinementAction, currentContent?: string) {
  const builders: Record<string, (value: unknown) => string> = {
    exam: buildExamPrompt,
    "exam-generator": buildExamPrompt,
    worksheet: buildWorksheetPrompt,
    "worksheet-generator": buildWorksheetPrompt,
    "lesson-plan": buildLessonPlanPrompt,
    "lesson-plan-generator": buildLessonPlanPrompt,
    "student-comments": buildStudentCommentsPrompt,
    "bulk-student-comments": buildBulkStudentCommentsPrompt,
    rubric: buildRubricPrompt,
    "rubric-generator": buildRubricPrompt,
    "parent-message": buildParentMessagePrompt,
    "parent-message-generator": buildParentMessagePrompt,
  };
  const base = (builders[tool] ?? ((value) => buildGenericPrompt(tool, value)))(input);
  if (!action) return base;
  return `${base}

Yêu cầu tinh chỉnh: ${refinementInstructions[action]}
Nội dung hiện tại:
${currentContent || "(chưa có; hãy tạo mới từ dữ liệu đầu vào)"}`;
}
