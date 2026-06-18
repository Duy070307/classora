import type { AIRefinementAction } from "@/lib/ai/types";

const rules = `Yêu cầu chung:
- Trả lời bằng tiếng Việt và dùng Markdown sạch.
- Chia nội dung thành các phần rõ ràng; dùng bảng khi phù hợp.
- Không tự khẳng định quy định, chuẩn chính thức hoặc thông tin pháp lý nếu không có nguồn.
- Không bịa dữ kiện còn thiếu; ghi rõ phần giáo viên cần bổ sung.
- Cuối tài liệu nhắc giáo viên kiểm tra lại trước khi sử dụng.`;

function prompt(tool: string, input: unknown, structure: string) {
  return `Bạn là trợ lý soạn tài liệu cho giáo viên Việt Nam.
Nhiệm vụ: ${tool}.
Dữ liệu đầu vào: ${JSON.stringify(input, null, 2)}
Cấu trúc mong muốn: ${structure}

${rules}`;
}

export const buildExamPrompt = (input: unknown) => prompt("Soạn đề kiểm tra", input, "Header, hướng dẫn, trắc nghiệm, tự luận, đáp án, thang điểm, ma trận và bản đặc tả.");
export const buildWorksheetPrompt = (input: unknown) => prompt("Soạn phiếu học tập", input, "Mục tiêu, kiến thức cần nhớ, bài tập, chỗ làm bài và đáp án.");
export const buildStudentCommentsPrompt = (input: unknown) => prompt("Viết nhận xét học sinh", input, "Ba phiên bản: ngắn gọn, trang trọng và thân thiện gửi phụ huynh.");
export const buildMatrixPrompt = (input: unknown) => prompt("Tạo ma trận đề", input, "Bảng chủ đề, mức độ, số câu, số điểm, tỉ lệ và yêu cầu cần đạt.");
export const buildAnswerKeyPrompt = (input: unknown) => prompt("Tạo đáp án và thang điểm", input, "Đáp án, lời giải, bảng điểm, lỗi thường gặp và lưu ý chấm.");
export const buildExamCheckerPrompt = (input: unknown) => prompt("Rà soát đề kiểm tra", input, "Vấn đề phát hiện, mức độ ảnh hưởng, gợi ý sửa và các mục cần giáo viên xác minh.");
export const buildLessonPlanPrompt = (input: unknown) => prompt("Soạn giáo án", input, "Mục tiêu, chuẩn bị, tiến trình hoạt động, đánh giá và nhiệm vụ sau bài.");

const refinementInstructions: Record<AIRefinementAction, string> = {
  regenerate: "Tạo lại một phiên bản khác nhưng giữ nguyên mục tiêu và dữ liệu đầu vào.",
  shorter: "Rút gọn nội dung, giữ lại ý quan trọng và cấu trúc cần thiết.",
  "more-detailed": "Bổ sung giải thích, ví dụ và chi tiết hữu ích.",
  simpler: "Diễn đạt dễ hiểu hơn, dùng câu ngắn và từ ngữ phổ thông.",
  "more-formal": "Điều chỉnh sang văn phong trang trọng, chuẩn mực.",
  easier: "Giảm độ khó của câu hỏi/nhiệm vụ, phù hợp học sinh cần hỗ trợ.",
  harder: "Tăng độ khó và mức vận dụng nhưng vẫn bám sát dữ liệu đầu vào."
};

export function buildPrompt(tool: string, input: unknown, action?: AIRefinementAction, currentContent?: string) {
  const builders: Record<string, (value: unknown) => string> = {
    exam: buildExamPrompt, worksheet: buildWorksheetPrompt, "student-comments": buildStudentCommentsPrompt,
    matrix: buildMatrixPrompt, "answer-key": buildAnswerKeyPrompt, "exam-checker": buildExamCheckerPrompt,
    "lesson-plan": buildLessonPlanPrompt
  };
  const base = (builders[tool] ?? ((value) => prompt(tool, value, "Các phần có tiêu đề rõ ràng và nội dung dễ kiểm tra.")))(input);
  if (!action) return base;
  return `${base}

Yêu cầu tinh chỉnh: ${refinementInstructions[action]}
Nội dung hiện tại:
${currentContent || "(chưa có; hãy tạo mới từ dữ liệu đầu vào)"}`;
}
