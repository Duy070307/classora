import {
  generateLessonPlan,
  generateParentMessage,
  generateRubric,
  generateStudentComments,
  generateWorksheet,
} from "@/lib/mock-ai";
import { generateExam } from "@/lib/mock-ai";
import { createStructuredExam } from "@/lib/mock-exam-generator";
import { refineOutput } from "@/lib/ai/refine-output";
import type { AIProvider, AIRequest, AIResponse } from "@/lib/ai/types";
import type { ExamInput, GenericToolInput, StudentCommentInput, WorksheetInput } from "@/lib/types";

const reviewNote = "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức.";

function asGeneric(input: Record<string, unknown>): GenericToolInput {
  return input as GenericToolInput;
}

function textTitle(tool: string) {
  const titles: Record<string, string> = {
    exam: "Đề kiểm tra",
    worksheet: "Phiếu học tập",
    "lesson-plan": "Kế hoạch bài dạy",
    "student-comments": "Nhận xét học sinh",
    "bulk-student-comments": "Nhận xét học sinh hàng loạt",
    rubric: "Rubric đánh giá",
    "parent-message": "Tin nhắn phụ huynh",
  };
  return titles[tool] ?? "Tài liệu";
}

function generateBulkFallback(input: Record<string, unknown>) {
  const rowsText = String(input.rows || input.csv || input.students || "");
  const lines = rowsText.split(/\r?\n/).filter(Boolean);
  const body = lines.length
    ? lines.map((line, index) => `Học sinh ${index + 1}: ${line}\n- Điểm mạnh: Giáo viên bổ sung theo quan sát thực tế.\n- Cần cải thiện: Giáo viên rà soát và điều chỉnh.\n- Nhận xét: Em có tinh thần học tập tích cực và cần tiếp tục rèn luyện đều đặn.`).join("\n\n")
    : "Giáo viên nhập danh sách học sinh để tạo nhận xét hàng loạt.";
  return `NHẬN XÉT HỌC SINH HÀNG LOẠT\n\n${body}\n\nNội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức.`;
}

export const localProvider: AIProvider = {
  name: "local",
  isConfigured: () => true,
  async generate(request: AIRequest): Promise<AIResponse> {
    if (request.action && request.currentContent) {
      return {
        ok: true,
        provider: "local",
        title: textTitle(request.tool),
        content: refineOutput(request.currentContent, request.action),
        warnings: [reviewNote],
      };
    }

    let content: string;
    let structuredExam;
    switch (request.tool) {
      case "exam":
      case "exam-generator":
        content = await generateExam(request.input as unknown as ExamInput);
        structuredExam = createStructuredExam(request.input as unknown as ExamInput);
        break;
      case "worksheet":
      case "worksheet-generator":
        content = await generateWorksheet(request.input as unknown as WorksheetInput);
        break;
      case "lesson-plan":
      case "lesson-plan-generator":
        content = await generateLessonPlan(asGeneric(request.input));
        break;
      case "student-comments":
        content = await generateStudentComments(request.input as unknown as StudentCommentInput);
        break;
      case "bulk-student-comments":
        content = generateBulkFallback(request.input);
        break;
      case "rubric":
      case "rubric-generator":
        content = await generateRubric(asGeneric(request.input));
        break;
      case "parent-message":
      case "parent-message-generator":
        content = await generateParentMessage(asGeneric(request.input));
        break;
      default:
        content = request.currentContent || request.prompt;
    }

    return {
      ok: true,
      provider: "local",
      title: textTitle(request.tool),
      content,
      structuredExam,
      warnings: [reviewNote],
    };
  },
};
