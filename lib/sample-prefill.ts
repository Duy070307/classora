import type { ExamInput, GenericToolInput, StudentCommentInput, WorksheetInput } from "@/lib/types";

export const sampleLinks = {
  math12Thptqg: "/tools/exam-generator?sample=math-12-thptqg",
  history12Thptqg: "/tools/exam-generator?sample=history-12-thptqg",
  worksheetMath8: "/tools/worksheet-generator?sample=worksheet-math-8",
  lessonLiterature9: "/tools/lesson-plan-generator?sample=lesson-literature-9",
  studentComment: "/tools/student-comments?sample=student-comment",
  parentMessage: "/tools/parent-message-generator?sample=parent-message"
} as const;

const supportedSampleIds = new Set([
  "math-12-thptqg",
  "history-12-thptqg",
  "worksheet-math-8",
  "lesson-literature-9",
  "student-comment",
  "parent-message"
]);

export function getSampleId(params: URLSearchParams) {
  const sample = params.get("sample")?.trim() ?? "";
  return supportedSampleIds.has(sample) ? sample : "";
}

export function getCurrentSampleId() {
  if (typeof window === "undefined") return "";
  return getSampleId(new URLSearchParams(window.location.search));
}

export function mergeDefined<T extends Record<string, unknown>>(base: T, values: Partial<T>) {
  return Object.fromEntries(
    Object.entries({ ...base, ...values }).map(([key, value]) => [key, value ?? base[key]])
  ) as T;
}

export function getExamSamplePrefill(sampleId: string): Partial<ExamInput> | null {
  if (sampleId === "math-12-thptqg") {
    return {
      subject: "Toán",
      grade: "12",
      examType: "Kết hợp" as ExamInput["examType"],
      examStyle: "THPTQG / tốt nghiệp" as ExamInput["examStyle"],
      duration: "90 phút",
      examCode: "0101",
      topic: "Hàm số, mũ - logarit, tích phân, xác suất, hình học không gian",
      multipleChoiceCount: 12,
      trueFalseCount: 4,
      shortAnswerCount: 6,
      essayCount: 0,
      totalScore: 10,
      recognitionRate: 30,
      understandingRate: 40,
      applicationRate: 20,
      advancedRate: 10,
      includeAnswers: true,
      includeRubric: true,
      includeMatrix: true,
      includeSpecification: true,
      extraRequirements: "Tạo đề theo cấu trúc ba phần, nội dung là bản nháp cần giáo viên rà soát."
    };
  }
  if (sampleId === "history-12-thptqg") {
    return {
      subject: "Lịch sử",
      grade: "12",
      examType: "Kết hợp" as ExamInput["examType"],
      examStyle: "THPTQG / tốt nghiệp" as ExamInput["examStyle"],
      duration: "50 phút",
      examCode: "0101",
      topic: "Việt Nam giai đoạn 1919-1975, Đổi mới",
      multipleChoiceCount: 12,
      trueFalseCount: 4,
      shortAnswerCount: 4,
      essayCount: 0,
      totalScore: 10,
      recognitionRate: 35,
      understandingRate: 35,
      applicationRate: 20,
      advancedRate: 10,
      includeAnswers: true,
      includeRubric: true,
      includeMatrix: true,
      includeSpecification: true,
      extraRequirements: "Ưu tiên mốc thời gian, sự kiện tiêu biểu và câu hỏi vận dụng bối cảnh."
    };
  }
  return null;
}

export function getWorksheetSamplePrefill(sampleId: string): Partial<WorksheetInput> | null {
  if (sampleId !== "worksheet-math-8") return null;
  return {
    subject: "Toán",
    grade: "8",
    topic: "Phương trình bậc nhất một ẩn",
    objective: "Nhận biết dạng phương trình, giải phương trình, vận dụng vào bài toán thực tế.",
    exerciseCount: 6,
    level: "Vừa" as WorksheetInput["level"],
    includeAnswers: true,
    style: "Dễ hiểu" as WorksheetInput["style"],
    extraRequirements: "Sắp xếp bài tập từ cơ bản đến vận dụng, có đáp án để giáo viên rà soát."
  };
}

export function getStudentCommentSamplePrefill(sampleId: string): Partial<StudentCommentInput> | null {
  if (sampleId !== "student-comment") return null;
  return {
    studentName: "Minh Anh",
    className: "8A1",
    role: "Giáo viên chủ nhiệm" as StudentCommentInput["role"],
    performance: "Khá" as StudentCommentInput["performance"],
    attitude: "chăm chỉ, hoàn thành nhiệm vụ học tập và hợp tác tốt trong giờ học",
    strengths: "chăm chỉ, hoàn thành nhiệm vụ",
    limitations: "cần trình bày bài rõ ràng hơn",
    tone: "Nhẹ nhàng" as StudentCommentInput["tone"],
    purpose: "Nhận xét cuối kỳ" as StudentCommentInput["purpose"]
  };
}

export function getGenericSamplePrefill(sampleId: string, href: string): Partial<GenericToolInput> | null {
  if (href === "/tools/lesson-plan-generator" && sampleId === "lesson-literature-9") {
    return {
      subject: "Ngữ văn",
      grade: "9",
      lessonName: "Nghị luận xã hội",
      duration: "45 phút",
      objectives: "Nhận biết vấn đề nghị luận, lập dàn ý, viết đoạn văn nghị luận.",
      methods: "Thảo luận nhóm, luyện tập cá nhân",
      materials: "Sách giáo khoa, bảng phụ, phiếu học tập",
      extraRequirements: "Bản nháp cần giáo viên rà soát trước khi sử dụng trên lớp."
    };
  }
  if (href === "/tools/parent-message-generator" && sampleId === "parent-message") {
    return {
      studentName: "học sinh",
      className: "8A1",
      situation: "Nhắc học bài",
      mainContent: "thông báo lịch kiểm tra và đề nghị phụ huynh nhắc học sinh ôn tập",
      tone: "Trang trọng"
    };
  }
  return null;
}
