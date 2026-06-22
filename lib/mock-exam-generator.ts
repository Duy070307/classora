import { getSubjectPack } from "@/lib/exam/subject-packs";
import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { ExamInput, QuestionDifficulty } from "@/lib/types";

const answerOrder = ["A", "B", "C", "D"] as const;

function difficultyAt(index: number, total: number, input: ExamInput): QuestionDifficulty {
  const position = ((index + 0.5) / Math.max(total, 1)) * 100;
  if (position <= input.recognitionRate) return "Nhận biết";
  if (position <= input.recognitionRate + input.understandingRate) return "Thông hiểu";
  if (position <= input.recognitionRate + input.understandingRate + input.applicationRate) return "Vận dụng";
  return "Vận dụng cao";
}

function rotateOptions(
  options: [string, string, string, string],
  answer: "A" | "B" | "C" | "D",
  index: number,
) {
  const currentAnswerIndex = answerOrder.indexOf(answer);
  const targetAnswerIndex = index % answerOrder.length;
  const offset = (targetAnswerIndex - currentAnswerIndex + answerOrder.length) % answerOrder.length;
  const rotated = offset ? [...options.slice(-offset), ...options.slice(0, -offset)] : [...options];
  return {
    options: Object.fromEntries(answerOrder.map((key, optionIndex) => [key, rotated[optionIndex]])) as Record<typeof answerOrder[number], string>,
    answer: answerOrder[targetAnswerIndex],
  };
}

function makeQuestions(input: ExamInput, part: ExamQuestion["part"], count: number): ExamQuestion[] {
  const pack = getSubjectPack(input.subject);
  return Array.from({ length: count }, (_, index) => {
    const difficulty = difficultyAt(index, count, input);
    if (part === "multiple_choice") {
      const template = pack.multipleChoice[index % pack.multipleChoice.length];
      const rotated = rotateOptions(template.options, template.answer, index);
      return {
        id: `mc-${index + 1}`,
        part,
        number: index + 1,
        stem: template.stem,
        options: rotated.options,
        answer: rotated.answer,
        explanation: template.explanation,
        score: 0.25,
        difficulty,
        topic: template.topic,
      };
    }
    if (part === "true_false") {
      const template = pack.trueFalse[index % pack.trueFalse.length];
      const labels = ["a", "b", "c", "d"] as const;
      const shift = index % 4;
      const items = labels.map((label, itemIndex) => {
        const sourceIndex = (itemIndex + shift) % 4;
        return { label, text: template.items[sourceIndex], answer: template.answers[sourceIndex] };
      });
      return {
        id: `tf-${index + 1}`,
        part,
        number: index + 1,
        stem: template.context,
        trueFalseItems: items,
        answer: items.map((item) => `${item.label} ${item.answer ? "Đúng" : "Sai"}`).join("; "),
        explanation: template.explanation,
        score: 1,
        difficulty,
        topic: template.topic,
      };
    }
    const template = pack.shortAnswer[index % pack.shortAnswer.length];
    return {
      id: `sa-${index + 1}`,
      part,
      number: index + 1,
      stem: template.stem,
      answer: template.answer,
      explanation: template.scoringNote,
      score: Number((Math.max(1, input.totalScore * 0.3) / Math.max(count, 1)).toFixed(2)),
      difficulty,
      topic: template.topic,
    };
  });
}

function renderQuestion(question: ExamQuestion) {
  const lines = [`Câu ${question.number}. ${question.stem}`];
  if (question.options) for (const key of answerOrder) lines.push(`${key}. ${question.options[key]}`);
  if (question.trueFalseItems) for (const item of question.trueFalseItems) lines.push(`${item.label}) ${item.text}`);
  return lines.join("\n");
}

function allocateScores(input: ExamInput, mcCount: number, tfCount: number) {
  const part1 = Number(Math.min(3, mcCount * 0.25).toFixed(2));
  const part2 = Number(Math.min(4, tfCount).toFixed(2));
  const part3 = Number(Math.max(0, input.totalScore - part1 - part2).toFixed(2));
  return { part1, part2, part3 };
}

export function createStructuredExam(input: ExamInput): StructuredExam {
  const pack = getSubjectPack(input.subject);
  const mc = makeQuestions(input, "multiple_choice", input.multipleChoiceCount);
  const tf = makeQuestions(input, "true_false", input.trueFalseCount);
  const short = makeQuestions(input, "short_answer", input.shortAnswerCount);
  const allQuestions = [...mc, ...tf, ...short];
  const scores = allocateScores(input, mc.length, tf.length);
  const topicRows = pack.topics
    .map((topic) => {
      const questions = allQuestions.filter((question) => question.topic === topic);
      if (!questions.length) return "";
      const byLevel = (level: QuestionDifficulty) => questions.filter((question) => question.difficulty === level).length;
      const score = questions.reduce((sum, question) => sum + question.score, 0);
      return `| ${topic} | ${byLevel("Nhận biết")} | ${byLevel("Thông hiểu")} | ${byLevel("Vận dụng")} | ${byLevel("Vận dụng cao")} | ${questions.length} | ${score.toFixed(2)} | ${Math.round(score / Math.max(input.totalScore, 1) * 100)}% |`;
    })
    .filter(Boolean)
    .join("\n");
  const specificationRows = [
    ...mc.slice(0, 4).map((question) => `| I | ${question.topic} | ${question.difficulty} | ${pack.actions[question.difficulty]} qua câu hỏi nhiều lựa chọn |`),
    ...tf.slice(0, 2).map((question) => `| II | ${question.topic} | ${question.difficulty} | Đánh giá tính đúng/sai của từng nhận định và đối chiếu dữ kiện |`),
    ...short.slice(0, 3).map((question) => `| III | ${question.topic} | ${question.difficulty} | Trình bày đáp án ngắn, kết quả hoặc luận điểm trọng tâm |`),
  ].join("\n");

  const allParts: StructuredExam["parts"] = [
    { type: "multiple_choice", title: "PHẦN I", instruction: `Thí sinh trả lời từ câu 1 đến câu ${mc.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.`, questions: mc },
    { type: "true_false", title: "PHẦN II", instruction: `Thí sinh trả lời từ câu 1 đến câu ${tf.length}. Trong mỗi ý a), b), c), d), thí sinh chọn đúng hoặc sai.`, questions: tf },
    { type: "short_answer", title: "PHẦN III", instruction: `Thí sinh trả lời từ câu 1 đến câu ${short.length}.`, questions: short },
  ];

  return {
    metadata: {
      title: `Đề kiểm tra ${input.subject} lớp ${input.grade}`,
      examStyle: input.examStyle,
      subject: input.subject,
      grade: input.grade,
      duration: input.duration,
      examCode: input.examCode.padStart(4, "0"),
      schoolName: input.schoolName,
    },
    parts: allParts.filter((part) => part.questions.length),
    teacherOnly: {
      scoringGuide: `Tổng điểm: ${input.totalScore} điểm.
- PHẦN I: ${scores.part1.toFixed(2)} điểm; mỗi câu đúng được 0,25 điểm.
- PHẦN II: ${scores.part2.toFixed(2)} điểm; chấm theo số ý đúng trong từng câu và quy định của nhà trường.
- PHẦN III: ${scores.part3.toFixed(2)} điểm; phân bổ đều hoặc theo mức độ của từng câu, đối chiếu gợi ý chấm.
Giáo viên có thể điều chỉnh điểm theo yêu cầu của nhà trường.`,
      matrix: `| Nội dung/chủ đề | Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao | Số câu | Điểm | Tỉ lệ |\n|---|---:|---:|---:|---:|---:|---:|---:|\n${topicRows}\n| Tổng cộng | - | - | - | - | ${allQuestions.length} | ${input.totalScore.toFixed(2)} | 100% |`,
      specification: `| Phần | Nội dung | Mức độ | Hành động mong đợi |\n|---|---|---|---|\n${specificationRows}`,
      notes: "Giáo viên cần rà soát chuyên môn, đáp án, thang điểm và ma trận trước khi in hoặc sử dụng chính thức.",
    },
  };
}

export function structuredExamToText(exam: StructuredExam, input: ExamInput) {
  const student = exam.parts.map((part) => `${part.title}. ${part.instruction}\n\n${part.questions.map(renderQuestion).join("\n\n")}`).join("\n\n");
  const part1 = exam.parts.find((part) => part.type === "multiple_choice")?.questions ?? [];
  const part2 = exam.parts.find((part) => part.type === "true_false")?.questions ?? [];
  const part3 = exam.parts.find((part) => part.type === "short_answer")?.questions ?? [];
  const answers1 = part1.map((question) => `| ${question.number} | ${question.answer} | ${question.explanation} |`).join("\n");
  const answers2 = part2.map((question) => {
    const values = question.trueFalseItems?.map((item) => item.answer ? "Đúng" : "Sai") ?? [];
    return `| ${question.number} | ${values.join(" | ")} |`;
  }).join("\n");
  const answers3 = part3.map((question) => `| ${question.number} | ${question.answer} | ${question.explanation} |`).join("\n");
  return `${student}

------ HẾT ------

PHẦN DÀNH CHO GIÁO VIÊN

III. ĐÁP ÁN
PHẦN I:
| Câu | Đáp án | Giải thích ngắn |
|---:|:---:|---|
${input.includeAnswers ? answers1 : "| - | Không kèm đáp án | - |"}

PHẦN II:
| Câu | a | b | c | d |
|---:|:---:|:---:|:---:|:---:|
${input.includeAnswers ? answers2 : "| - | - | - | - | - |"}

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
