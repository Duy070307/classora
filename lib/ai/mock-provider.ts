import {
  checkExam, generateAnswerKey, generateExam, generateLessonPlan, generateMatrix,
  generateStudentComments, generateWorksheet
} from "@/lib/mock-ai";
import type { ExamInput, GenericToolInput, StudentCommentInput, WorksheetInput } from "@/lib/types";
import type { AIProvider } from "@/lib/ai/types";

export const mockProvider: AIProvider = {
  name: "mock",
  async generate(request) {
    const generators: Record<string, () => Promise<string>> = {
      exam: () => generateExam(request.input as ExamInput),
      worksheet: () => generateWorksheet(request.input as WorksheetInput),
      "student-comments": () => generateStudentComments(request.input as StudentCommentInput),
      matrix: () => generateMatrix(request.input as GenericToolInput),
      "answer-key": () => generateAnswerKey(request.input as GenericToolInput),
      "exam-checker": () => checkExam(request.input as GenericToolInput),
      "lesson-plan": () => generateLessonPlan(request.input as GenericToolInput)
    };
    const generate = generators[request.tool];
    if (!generate) throw new Error(`Mock provider chưa hỗ trợ tool: ${request.tool}`);
    return {
      title: `Classora mock - ${request.tool}`,
      content: await generate(),
      warnings: ["Nội dung hiện được tạo bằng AI mô phỏng trong bản demo. Giáo viên cần kiểm tra lại trước khi sử dụng."]
    };
  }
};
