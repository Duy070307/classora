import type { QuestionDifficulty, QuestionItem, QuestionType } from "@/lib/types";

type SeedTopic = {
  subject: "Vật lí" | "Hóa học";
  grade: string;
  topics: string[];
};

const groups: SeedTopic[] = [
  {
    subject: "Vật lí",
    grade: "10",
    topics: [
      "Chuyển động thẳng",
      "Gia tốc",
      "Lực và chuyển động",
      "Ba định luật Newton",
      "Công và năng lượng",
      "Động lượng",
      "Chuyển động tròn",
      "Áp suất chất lỏng",
      "Biến dạng của vật rắn",
    ],
  },
  {
    subject: "Vật lí",
    grade: "11",
    topics: [
      "Điện trường",
      "Cường độ điện trường",
      "Điện thế",
      "Dòng điện không đổi",
      "Định luật Ohm",
      "Điện năng và công suất điện",
      "Từ trường",
      "Cảm ứng điện từ",
      "Khúc xạ ánh sáng",
    ],
  },
  {
    subject: "Vật lí",
    grade: "12",
    topics: [
      "Dao động điều hòa",
      "Sóng cơ",
      "Sóng điện từ",
      "Dòng điện xoay chiều",
      "Giao thoa ánh sáng",
      "Lượng tử ánh sáng",
      "Hạt nhân nguyên tử",
      "Ứng dụng vật lí hiện đại",
    ],
  },
  {
    subject: "Hóa học",
    grade: "10",
    topics: [
      "Cấu tạo nguyên tử",
      "Bảng tuần hoàn",
      "Liên kết hóa học",
      "Phản ứng oxi hóa - khử",
      "Tốc độ phản ứng",
      "Enthalpy và năng lượng phản ứng",
      "Halogen",
    ],
  },
  {
    subject: "Hóa học",
    grade: "11",
    topics: [
      "Cân bằng hóa học",
      "Acid - base",
      "pH",
      "Nitrogen và hợp chất",
      "Sulfur và hợp chất",
      "Đại cương hóa học hữu cơ",
      "Hydrocarbon",
      "Dẫn xuất halogen",
    ],
  },
  {
    subject: "Hóa học",
    grade: "12",
    topics: [
      "Ester - lipid",
      "Carbohydrate",
      "Amine - amino acid - protein",
      "Polymer",
      "Đại cương kim loại",
      "Pin điện hóa và ăn mòn kim loại",
      "Kim loại kiềm, kiềm thổ, nhôm",
      "Sắt và hợp chất",
    ],
  },
];

const difficulties: QuestionDifficulty[] = ["Nhận biết", "Thông hiểu", "Vận dụng"];
const types: QuestionType[] = ["Trắc nghiệm", "Đúng/Sai", "Trả lời ngắn", "Tự luận"];

function hexHash(text: string) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function seedId(subject: string, grade: string, topic: string, index: number) {
  const a = hexHash(`${subject}-${grade}`);
  const b = hexHash(topic);
  const c = hexHash(`${topic}-${index}`);
  return `${a.slice(0, 8)}-${b.slice(0, 4)}-4${b.slice(4, 7)}-8${c.slice(0, 3)}-${c}${a.slice(0, 4)}`;
}

function multipleChoice(subject: string, topic: string) {
  const isPhysics = subject === "Vật lí";
  return {
    question: `Trong chủ đề ${topic}, yêu cầu nào phù hợp nhất để kiểm tra kiến thức nền của học sinh?`,
    options: {
      A: "Nhận biết khái niệm, đại lượng hoặc dấu hiệu bản chất.",
      B: "Ghi nhớ một đoạn văn dài mà không cần hiểu ý nghĩa.",
      C: "Bỏ qua điều kiện áp dụng của kiến thức.",
      D: "Chỉ nêu kết quả cuối cùng, không cần giải thích.",
    },
    answer: "A",
    explanation: isPhysics
      ? `Câu hỏi lý thuyết Vật lí nên hướng tới bản chất hiện tượng, đại lượng và điều kiện áp dụng trong chủ đề ${topic}.`
      : `Câu hỏi lý thuyết Hóa học nên hướng tới bản chất cấu tạo, tính chất, quy luật hoặc hiện tượng trong chủ đề ${topic}.`,
  };
}

function trueFalse(subject: string, topic: string) {
  const isPhysics = subject === "Vật lí";
  return {
    question: `Đúng hay sai: Khi học ${topic}, học sinh cần phân biệt khái niệm cốt lõi với ví dụ minh họa và nêu được điều kiện áp dụng.`,
    answer: "Đúng",
    explanation: isPhysics
      ? "Phân biệt khái niệm, hiện tượng và điều kiện áp dụng giúp tránh nhầm lẫn khi giải thích tình huống Vật lí."
      : "Phân biệt khái niệm, bản chất phản ứng hoặc quy luật giúp tránh học thuộc máy móc trong Hóa học.",
  };
}

function shortAnswer(subject: string, topic: string) {
  return {
    question: `Nêu một dấu hiệu quan trọng giúp nhận biết hoặc giải thích nội dung ${topic}.`,
    answer: subject === "Vật lí"
      ? "Học sinh nêu được dấu hiệu gắn với hiện tượng, đại lượng, mối quan hệ hoặc điều kiện áp dụng của chủ đề."
      : "Học sinh nêu được dấu hiệu gắn với cấu tạo, tính chất, sự biến đổi chất hoặc điều kiện phản ứng của chủ đề.",
    explanation: `Đây là câu trả lời ngắn để kiểm tra mức độ nắm ý chính của chủ đề ${topic}; giáo viên cần điều chỉnh theo bài học cụ thể.`,
  };
}

function essay(subject: string, topic: string) {
  return {
    question: `Giải thích ngắn gọn vì sao khi học ${topic}, học sinh không nên chỉ ghi nhớ công thức/kết luận mà cần hiểu bản chất.`,
    answer: subject === "Vật lí"
      ? "Vì hiểu bản chất giúp xác định đúng hiện tượng, chọn đúng định luật hoặc mối liên hệ giữa các đại lượng trong tình huống mới."
      : "Vì hiểu bản chất giúp dự đoán tính chất, nhận diện kiểu phản ứng và giải thích hiện tượng thay vì học thuộc rời rạc.",
    explanation: "Câu hỏi hướng tới thông hiểu và vận dụng nhẹ, phù hợp làm câu hỏi tham khảo để giáo viên chỉnh sửa.",
  };
}

function buildQuestion(group: SeedTopic, topic: string, index: number): QuestionItem {
  const type = types[index % types.length];
  const difficulty = difficulties[index % difficulties.length];
  const base: {
    question: string;
    answer: string;
    explanation: string;
    options?: Record<string, string>;
  } =
    type === "Trắc nghiệm"
      ? multipleChoice(group.subject, topic)
      : type === "Đúng/Sai"
        ? trueFalse(group.subject, topic)
        : type === "Trả lời ngắn"
          ? shortAnswer(group.subject, topic)
          : essay(group.subject, topic);

  return {
    id: seedId(group.subject, group.grade, topic, index),
    subject: group.subject,
    grade: group.grade,
    topic,
    question: base.question,
    type,
    difficulty,
    options: base.options || null,
    answer: base.answer,
    explanation: base.explanation,
    createdAt: new Date("2026-07-10T00:00:00.000Z").toISOString(),
    metadata: {
      bookSeries: "Kết nối tri thức",
      sourceType: "tham khảo",
      contentType: "Lý thuyết",
      generatedBy: "Soạn Lab seed",
      needsReview: true,
      seedKey: `${group.subject}-${group.grade}-${topic}-${type}`,
    },
  };
}

export function getKnttTheorySeedQuestions(): QuestionItem[] {
  return groups.flatMap((group) => {
    const repeated = [...group.topics, ...group.topics.slice(0, Math.max(0, 18 - group.topics.length))];
    return repeated.slice(0, 18).map((topic, index) => buildQuestion(group, topic, index));
  });
}
