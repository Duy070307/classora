import type { ExamPartType, ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { GeneratedDocument, QuestionDifficulty } from "@/lib/types";
import { structuredExamToText } from "@/lib/mock-exam-generator";

const partTitles: Record<ExamPartType, string> = {
  multiple_choice: "PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN",
  true_false: "PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG/SAI",
  short_answer: "PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN",
};

const partInstructions: Record<ExamPartType, string> = {
  multiple_choice: "Thí sinh chỉ chọn một phương án đúng trong mỗi câu.",
  true_false: "Trong mỗi ý a), b), c), d), thí sinh chọn đúng hoặc sai.",
  short_answer: "Thí sinh ghi đáp án ngắn gọn theo yêu cầu.",
};

function clean(value: unknown) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim() : "";
}

function difficulty(value: string): QuestionDifficulty {
  if (["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"].includes(value)) return value as QuestionDifficulty;
  return "Thông hiểu";
}

function detectPart(line: string, current: ExamPartType): ExamPartType {
  if (/PHẦN\s*I(?!I)|TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN/i.test(line)) return "multiple_choice";
  if (/PHẦN\s*II(?!I)|ĐÚNG\s*\/?\s*SAI/i.test(line)) return "true_false";
  if (/PHẦN\s*III|TRẢ LỜI NGẮN/i.test(line)) return "short_answer";
  return current;
}

function answerMaps(text: string) {
  const result = new Map<string, string>();
  const teacher = text.split(/(?:ĐÁP ÁN|HƯỚNG DẪN CHẤM|PHẦN DÀNH CHO GIÁO VIÊN)/i).slice(1).join("\n");
  for (const match of teacher.matchAll(/(?:Câu\s*)?(\d+)\s*[.):-]\s*([A-D]|Đúng|Sai|[+-]?(?:\d+(?:[.,]\d+)?|\d+\/\d+))/gi)) {
    result.set(match[1], match[2]);
  }
  return result;
}

export function parseExamText(text: string, metadata: Partial<StructuredExam["metadata"]> = {}) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
  const studentText = normalized.split(/(?:PHẦN DÀNH CHO GIÁO VIÊN|ĐÁP ÁN(?:\s+VÀ\s+THANG\s+ĐIỂM)?)/i)[0];
  const answers = answerMaps(normalized);
  const lines = studentText.split("\n");
  const buckets: Record<ExamPartType, ExamQuestion[]> = { multiple_choice: [], true_false: [], short_answer: [] };
  let currentPart: ExamPartType = "multiple_choice";
  let current: { part: ExamPartType; number: number; lines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const body = current.lines.join("\n").trim();
    const options = Object.fromEntries((["A", "B", "C", "D"] as const).map((letter) => [
      letter,
      clean(body.match(new RegExp(`(?:^|\\n)\\s*${letter}[.)]\\s*([^\\n]+)`, "i"))?.[1]),
    ])) as Record<"A" | "B" | "C" | "D", string>;
    const subItems = Array.from(body.matchAll(/(?:^|\n)\s*([a-d])[.)]\s*([^\n]+)/gi)).map((match) => ({
      label: match[1].toLowerCase() as "a" | "b" | "c" | "d",
      text: clean(match[2]),
      answer: /(?:đúng|true)$/i.test(match[2]),
    }));
    let stem = body
      .replace(/(?:^|\n)\s*[A-D][.)]\s*[^\n]+/gi, "")
      .replace(/(?:^|\n)\s*[a-d][.)]\s*[^\n]+/gi, "")
      .trim();
    stem = stem.replace(/^Câu\s*\d+\s*[.):-]?\s*/i, "").trim();
    const answer = answers.get(String(current.number)) || clean(body.match(/(?:Đáp án|ĐA)\s*[:：]\s*([^\n]+)/i)?.[1]);
    const question: ExamQuestion = {
      id: `import-${current.part}-${current.number}-${buckets[current.part].length + 1}`,
      part: current.part,
      number: current.number,
      stem,
      options: current.part === "multiple_choice" ? options : undefined,
      trueFalseItems: current.part === "true_false" ? subItems.slice(0, 4) : undefined,
      answer,
      explanation: "",
      score: 0,
      difficulty: "Thông hiểu",
      topic: "",
    };
    buckets[current.part].push(question);
    current = null;
  };

  for (const line of lines) {
    const detected = detectPart(line, currentPart);
    if (detected !== currentPart || /^\s*PHẦN\s+(?:I|II|III)\b/i.test(line)) {
      flush();
      currentPart = detected;
      continue;
    }
    const question = line.match(/^\s*Câu\s*(\d+)\s*[.):-]?\s*(.*)$/i);
    if (question) {
      flush();
      current = { part: currentPart, number: Number(question[1]), lines: [question[2]] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();

  const title = clean(metadata.title) || clean(normalized.match(/^(?:ĐỀ|BÀI)\s+(?:KIỂM TRA|THI)[^\n]*/im)?.[0]) || "Đề kiểm tra nhập từ tài liệu";
  const parts = (Object.keys(buckets) as ExamPartType[])
    .filter((type) => buckets[type].length)
    .map((type) => ({ type, title: partTitles[type], instruction: partInstructions[type], questions: buckets[type] }));
  const warnings = parts.length && parts.some((part) => part.questions.some((question) => !question.stem || !question.answer))
    ? ["SOẠN LAB chưa đọc chắc chắn toàn bộ cấu trúc của file. Thầy cô vui lòng kiểm tra bản xem trước."]
    : [];
  return {
    exam: {
      metadata: {
        title,
        examStyle: clean(metadata.examStyle) || "Đề nhập để kiểm tra",
        subject: clean(metadata.subject),
        grade: clean(metadata.grade),
        duration: clean(metadata.duration),
        examCode: clean(metadata.examCode) || "0101",
        ...metadata,
        importWarnings: warnings,
      },
      parts,
      teacherOnly: { scoringGuide: "", matrix: "", specification: "", notes: warnings.join("\n") },
    } satisfies StructuredExam,
    warnings,
    confidence: warnings.length ? "low" as const : "medium" as const,
  };
}

export function normalizeExamDocument(document: GeneratedDocument): GeneratedDocument {
  if (document.structuredExam) return document;
  const parsed = parseExamText(document.content, {
    title: document.title,
    subject: document.examMeta?.subject,
    grade: document.examMeta?.grade,
    duration: document.examMeta?.duration,
    examCode: document.examMeta?.examCode,
    examStyle: document.examMeta?.examStyle,
  });
  return { ...document, structuredExam: parsed.exam };
}

export function documentWithExam(document: GeneratedDocument, exam: StructuredExam): GeneratedDocument {
  const input = {
    schoolName: document.examMeta?.schoolName || exam.metadata.schoolName || "",
    teacherName: document.examMeta?.teacherName || "",
    subject: document.examMeta?.subject || exam.metadata.subject,
    grade: document.examMeta?.grade || exam.metadata.grade,
    bookSeries: "",
    topic: document.examMeta?.topic || "",
    duration: document.examMeta?.duration || exam.metadata.duration,
    examType: (exam.metadata.examType || "Kết hợp") as "Kết hợp",
    examStyle: (exam.metadata.examStyle || "Kiểm tra thường") as "Kiểm tra thường",
    trueFalseCount: exam.parts.find((part) => part.type === "true_false")?.questions.length || 0,
    shortAnswerCount: exam.parts.find((part) => part.type === "short_answer")?.questions.length || 0,
    examCode: document.examMeta?.examCode || exam.metadata.examCode,
    multipleChoiceCount: exam.parts.find((part) => part.type === "multiple_choice")?.questions.length || 0,
    essayCount: 0,
    totalScore: exam.metadata.totalScore || 10,
    level: "Trung bình" as const,
    recognitionRate: 25,
    understandingRate: 35,
    applicationRate: 30,
    advancedRate: 10,
    includeAnswers: true,
    includeRubric: true,
    includeMatrix: true,
    includeSpecification: true,
    extraRequirements: "",
  };
  return { ...document, structuredExam: exam, content: structuredExamToText(exam, input) };
}

export function normalizeQuestionDifficulty(value: string) {
  return difficulty(value);
}
