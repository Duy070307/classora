import {
  checkExam, generateAnswerKey, generateExam, generateLessonPlan, generateMatrix,
  generateStudentComments, generateWorksheet, shuffleExam
} from "@/lib/mock-ai";
import type { ExamInput, GenericToolInput, StudentCommentInput, WorksheetInput } from "@/lib/types";
import type { AIProvider } from "@/lib/ai/types";
import { refineOutput } from "@/lib/ai/refine-output";

export const AI_DEMO_WARNING = "Nội dung hiện được tạo bằng AI mô phỏng trong bản demo. Giáo viên cần kiểm tra lại trước khi sử dụng.";

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
      "lesson-plan": () => generateLessonPlan(request.input as GenericToolInput),
      "exam-shuffler": () => shuffleExam(request.input as GenericToolInput)
    };
    const generate = generators[request.tool];
    if (!generate && !(request.action && request.currentContent)) {
      throw new Error(`Mock provider chưa hỗ trợ tool: ${request.tool}`);
    }
    const content = request.action && request.currentContent
      ? refineOutput(request.currentContent, request.action)
      : await generate!();
    return {
      title: `Classora mock - ${request.tool}`,
      content,
      warnings: [AI_DEMO_WARNING],
      provider: "mock"
    };
  }
};
