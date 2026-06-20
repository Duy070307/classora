import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { ExamInput, QuestionDifficulty } from "@/lib/types";

const subjectBanks: Record<string, string[]> = {
  "toán": ["hàm số và đồ thị", "đạo hàm", "phương trình", "hình học không gian", "xác suất", "nguyên hàm và tích phân"],
  "ngữ văn": ["đọc hiểu văn bản", "biện pháp tu từ", "nhân vật văn học", "nghị luận xã hội", "nghị luận văn học"],
  "tiếng anh": ["từ vựng theo ngữ cảnh", "thì của động từ", "mệnh đề quan hệ", "đọc hiểu", "giao tiếp"],
  "lịch sử": ["bối cảnh lịch sử", "nguyên nhân sự kiện", "diễn biến", "kết quả và ý nghĩa", "bài học kinh nghiệm"],
  "địa lí": ["dân số", "vùng kinh tế", "cơ cấu ngành", "điều kiện tự nhiên", "phân tích số liệu"],
  "vật lí": ["chuyển động", "điện học", "dao động", "quang học", "năng lượng"],
  "hóa học": ["cấu tạo chất", "phản ứng hóa học", "dung dịch", "hóa hữu cơ", "tính toán theo phương trình"],
  "sinh học": ["di truyền", "tế bào", "sinh thái", "tiến hóa", "sinh lí học"]
};

function normalizedSubject(subject: string) {
  const value = subject.trim().toLowerCase();
  return Object.keys(subjectBanks).find((key) => value.includes(key)) || "toán";
}

function difficultyAt(index: number, total: number, input: ExamInput): QuestionDifficulty {
  const position = ((index + 0.5) / Math.max(total, 1)) * 100;
  if (position <= input.recognitionRate) return "Nhận biết";
  if (position <= input.recognitionRate + input.understandingRate) return "Thông hiểu";
  if (position <= input.recognitionRate + input.understandingRate + input.applicationRate) return "Vận dụng";
  return "Vận dụng cao";
}

function stemFor(subject: string, focus: string, topic: string, difficulty: QuestionDifficulty, index: number) {
  const n = index + 1;
  const templates: Record<string, string> = {
    "toán": `${difficulty === "Nhận biết" ? "Xác định" : difficulty === "Thông hiểu" ? "Chọn nhận định đúng về" : "Vận dụng kiến thức về"} ${focus} trong chủ đề ${topic} để giải quyết yêu cầu số ${n}.`,
    "ngữ văn": `Đọc ngữ liệu giả định về ${topic} và xác định ${focus} phù hợp nhất với yêu cầu ${difficulty.toLowerCase()}.`,
    "tiếng anh": `Choose the best answer about ${focus} in the context of "${topic}" (question ${n}).`,
    "lịch sử": `Nhận định nào phản ánh đúng ${focus} của nội dung ${topic}?`,
    "địa lí": `Dựa vào kiến thức về ${topic}, nhận xét nào đúng nhất khi phân tích ${focus}?`,
    "vật lí": `Trong tình huống thuộc chủ đề ${topic}, phát biểu nào đúng về ${focus}?`,
    "hóa học": `Xét nội dung ${topic}, kết luận nào phù hợp nhất về ${focus}?`,
    "sinh học": `Trong chủ đề ${topic}, nhận định nào đúng về ${focus}?`
  };
  return templates[subject];
}

function makeQuestions(input: ExamInput, part: ExamQuestion["part"], count: number): ExamQuestion[] {
  const subject = normalizedSubject(input.subject);
  const focuses = subjectBanks[subject];
  return Array.from({ length: count }, (_, index) => {
    const difficulty = difficultyAt(index, count, input);
    const focus = focuses[index % focuses.length];
    const stem = stemFor(subject, focus, input.topic, difficulty, index);
    const score = part === "multiple_choice" ? 0.25 : part === "true_false" ? 1 : Number((Math.max(1, input.totalScore * 0.3) / Math.max(count, 1)).toFixed(2));
    if (part === "multiple_choice") return {
      id: `mc-${index + 1}`, part, number: index + 1, stem,
      options: {
        A: `Phương án phù hợp với kiến thức trọng tâm về ${focus}.`,
        B: `Phương án nhầm lẫn giữa khái niệm và hệ quả của ${focus}.`,
        C: `Phương án chỉ đúng trong một điều kiện chưa được nêu.`,
        D: `Phương án không liên quan trực tiếp đến yêu cầu câu hỏi.`
      },
      answer: "A", explanation: `Đáp án A bám sát yêu cầu và kiến thức ${focus}.`, score, difficulty, topic: focus
    };
    if (part === "true_false") {
      const labels = ["a", "b", "c", "d"] as const;
      return {
        id: `tf-${index + 1}`, part, number: index + 1, stem: `Cho thông tin về ${focus} trong chủ đề ${input.topic}. Hãy đánh giá các nhận định sau:`,
        trueFalseItems: labels.map((label, itemIndex) => ({ label, text: itemIndex % 2 === 0 ? `Nhận định này mô tả đúng một đặc điểm cơ bản của ${focus}.` : `Nhận định này khái quát quá mức và thiếu điều kiện cần thiết.`, answer: itemIndex % 2 === 0 })),
        answer: "a Đúng; b Sai; c Đúng; d Sai", explanation: `Đối chiếu từng ý với khái niệm và điều kiện áp dụng của ${focus}.`, score, difficulty, topic: focus
      };
    }
    return {
      id: `sa-${index + 1}`, part, number: index + 1,
      stem: `${difficulty === "Vận dụng cao" ? "Phân tích và đề xuất cách giải quyết" : "Trình bày ngắn gọn cách xử lí"} một tình huống liên quan đến ${focus} trong chủ đề ${input.topic}.`,
      answer: `Câu trả lời cần nêu đúng ${focus}, có lập luận và kết luận phù hợp.`,
      explanation: `Chấm theo kiến thức trọng tâm, cách vận dụng và tính rõ ràng của kết luận.`, score, difficulty, topic: focus
    };
  });
}

function renderQuestion(question: ExamQuestion) {
  const lines = [`Câu ${question.number}. ${question.stem}`];
  if (question.options) for (const key of ["A", "B", "C", "D"] as const) lines.push(`${key}. ${question.options[key]}`);
  if (question.trueFalseItems) for (const item of question.trueFalseItems) lines.push(`${item.label}) ${item.text}`);
  return lines.join("\n");
}

export function createStructuredExam(input: ExamInput): StructuredExam {
  const mc = makeQuestions(input, "multiple_choice", input.multipleChoiceCount);
  const tf = makeQuestions(input, "true_false", input.trueFalseCount);
  const short = makeQuestions(input, "short_answer", input.shortAnswerCount);
  const total = mc.length + tf.length + short.length;
  const matrixRows = ["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"].map((level) => {
    const questions = [...mc, ...tf, ...short].filter((question) => question.difficulty === level);
    return `| ${input.topic} | ${level} | ${questions.length} | ${questions.reduce((sum, question) => sum + question.score, 0).toFixed(2)} | ${total ? Math.round(questions.length / total * 100) : 0}% |`;
  }).join("\n");
  const allParts: StructuredExam["parts"] = [
    { type: "multiple_choice", title: "PHẦN I", instruction: `Thí sinh trả lời từ câu 1 đến câu ${mc.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.`, questions: mc },
    { type: "true_false", title: "PHẦN II", instruction: `Thí sinh trả lời từ câu 1 đến câu ${tf.length}. Trong mỗi ý a), b), c), d), thí sinh chọn đúng hoặc sai.`, questions: tf },
    { type: "short_answer", title: "PHẦN III", instruction: `Thí sinh trả lời từ câu 1 đến câu ${short.length}.`, questions: short }
  ];
  const parts = allParts.filter((part) => part.questions.length);
  return {
    metadata: { title: `Đề kiểm tra ${input.subject} lớp ${input.grade}`, examStyle: input.examStyle, subject: input.subject, grade: input.grade, duration: input.duration, examCode: input.examCode.padStart(4, "0"), schoolName: input.schoolName },
    parts,
    teacherOnly: {
      scoringGuide: `Gợi ý phân bổ 10 điểm: PHẦN I ${Math.min(3, mc.length * 0.25).toFixed(2)} điểm; PHẦN II ${Math.min(4, tf.length).toFixed(2)} điểm; PHẦN III phân bổ phần điểm còn lại. Giáo viên có thể điều chỉnh trước khi dùng.`,
      matrix: `| Nội dung/chủ đề | Mức độ | Số câu | Điểm gợi ý | Tỉ lệ |\n|---|---:|---:|---:|---:|\n${matrixRows}`,
      specification: `| Phần | Nội dung | Năng lực/mức độ | Hành động mong đợi |\n|---|---|---|---|\n| I | ${input.topic} | Nhận biết - Vận dụng | Chọn phương án đúng |\n| II | ${input.topic} | Thông hiểu - Vận dụng | Đánh giá từng nhận định |\n| III | ${input.topic} | Vận dụng - Vận dụng cao | Trình bày đáp án ngắn và lập luận |`,
      notes: "Bản mock cần giáo viên kiểm tra tính chính xác chuyên môn, đáp án và phân bổ điểm trước khi sử dụng."
    }
  };
}

export function structuredExamToText(exam: StructuredExam, input: ExamInput) {
  const student = exam.parts.map((part) => `${part.title}. ${part.instruction}\n\n${part.questions.map(renderQuestion).join("\n\n")}`).join("\n\n");
  const part1 = exam.parts.find((part) => part.type === "multiple_choice")?.questions ?? [];
  const part2 = exam.parts.find((part) => part.type === "true_false")?.questions ?? [];
  const part3 = exam.parts.find((part) => part.type === "short_answer")?.questions ?? [];
  const answers1 = part1.map((question) => `${question.number}. ${question.answer}`).join("; ");
  const answers2 = part2.map((question) => `${question.number}. ${question.answer}`).join("\n");
  const answers3 = part3.map((question) => `| ${question.number} | ${question.answer} | ${question.explanation} |`).join("\n");
  return `${student}

------ HẾT ------

PHẦN DÀNH CHO GIÁO VIÊN

III. ĐÁP ÁN
Trắc nghiệm: ${input.includeAnswers ? answers1 : "Không kèm đáp án."}

PHẦN II:
${input.includeAnswers ? answers2 : "Không kèm đáp án."}

PHẦN III:
| Câu | Đáp án ngắn | Gợi ý chấm |
|---:|---|---|
${input.includeAnswers ? answers3 : "| - | Không kèm đáp án | - |"}

IV. THANG ĐIỂM
${input.includeRubric ? exam.teacherOnly.scoringGuide : "Không kèm hướng dẫn chấm."}

V. MA TRẬN ĐỀ
${input.includeMatrix ? exam.teacherOnly.matrix : "Không kèm ma trận."}

VI. BẢN ĐẶC TẢ ĐỀ
${input.includeSpecification ? exam.teacherOnly.specification : "Không kèm bản đặc tả."}

GHI CHÚ GIÁO VIÊN
${exam.teacherOnly.notes}`;
}
