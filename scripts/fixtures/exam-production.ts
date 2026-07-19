import type { ExamPartType, ExamQuestion, StructuredExam } from "../../lib/exam-types";

const labels = ["A", "B", "C", "D"] as const;
const mcqTopics = [
  "tập xác định", "đạo hàm", "đồng biến", "nghịch biến", "cực đại", "cực tiểu",
  "giá trị lớn nhất", "giá trị nhỏ nhất", "tiệm cận đứng", "tiệm cận ngang", "tương giao", "tọa độ trong không gian",
];

function base(part: ExamPartType, number: number, stem: string, answer: string, score: number): ExamQuestion {
  return { id: `${part}-${number}`, part, number, stem, answer, explanation: `Lập luận độc lập cho câu ${number}, kết quả là ${answer}.`, score, difficulty: number <= 7 ? "Nhận biết" : number <= 15 ? "Thông hiểu" : number <= 20 ? "Vận dụng" : "Vận dụng cao", topic: "Hàm số và tọa độ Oxyz" };
}

export function math12ProductionExam(): StructuredExam {
  const multipleChoice = mcqTopics.map((topic, index) => {
    const number = index + 1; const answer = labels[index % 4];
    const stem = index === 11 ? "Trong không gian Oxyz, mặt cầu có phương trình $(x-2)^2+(y+3)^2+(z-1)^2=25$. Bán kính bằng bao nhiêu?" : `Câu hỏi ${number} kiểm tra ${topic} của hàm số f_${number}(x)=x^3-${number}x+1.`;
    return { ...base("multiple_choice", number, stem, answer, 0.25), options: { A: `${number}`, B: `${number + 1}`, C: `${number + 2}`, D: `${number + 3}` } };
  });
  const patterns = [[true, true, false, false], [true, false, false, true], [false, true, true, false], [false, false, true, true]];
  const trueFalseContexts = ["hàm bậc ba h(x)=x^3-3x", "hàm phân thức h(x)=(x+1)/(x-2)", "hàm mũ h(x)=2^x", "hàm logarit h(x)=ln(x)"];
  const trueFalse = patterns.map((pattern, index) => {
    const number = index + 1;
    const items = pattern.map((answer, itemIndex) => ({ id: `true_false-${number}:statement-${itemIndex + 1}`, label: (["a", "b", "c", "d"] as const)[itemIndex], text: `Mệnh đề ${itemIndex + 1} về ${trueFalseContexts[index]} và tính chất ${["tập xác định", "đạo hàm", "cực trị", "giới hạn"][itemIndex]}.`, answer }));
    return { ...base("true_false", number, `Xét ${trueFalseContexts[index]} và các mệnh đề sau.`, items.map((item) => `${item.label} ${item.answer ? "Đúng" : "Sai"}`).join("; "), 1), trueFalseItems: items };
  });
  const shortTasks = [
    ["Tính 3+2?", "3+2=5", 5],
    ["Tính 25% của 24.", "25% của 24 bằng 6", 6],
    ["Tính giá trị lũy thừa 2^3.", "2^3=8", 8],
    ["Tính trung bình cộng của 6 và 12.", "(6+12)/2=9", 9],
    ["Tính khoảng cách giữa hai điểm (0;0) và (6;8).", "Khoảng cách bằng 10", 10],
    ["Tính căn bậc hai số học của 121.", "√121=11", 11],
  ] as const;
  const shortAnswer = shortTasks.map(([stem, explanation, value], index) => ({ ...base("short_answer", index + 1, stem, String(value), 0.5), explanation }));
  return {
    metadata: { title: "Đề Toán 12 tổng hợp", examStyle: "THPTQG / tốt nghiệp", subject: "Toán", grade: "12", duration: "90 phút", examCode: "0101", totalScore: 10, requestedSectionCounts: { partI: 12, partII: 4, partIII: 6 }, requestedCognitiveRates: { recognition: 30, understanding: 40, application: 20, advanced: 10 } },
    parts: [
      { type: "multiple_choice", title: "PHẦN I", instruction: "Chọn một phương án.", questions: multipleChoice },
      { type: "true_false", title: "PHẦN II", instruction: "Chọn đúng hoặc sai.", questions: trueFalse },
      { type: "short_answer", title: "PHẦN III", instruction: "Trả lời ngắn.", questions: shortAnswer },
    ],
    teacherOnly: { scoringGuide: "Chấm theo đáp án từng câu.", matrix: "12 trắc nghiệm; 4 đúng/sai; 6 trả lời ngắn.", specification: "Đề tổng hợp Hàm số và Oxyz.", notes: "Giáo viên rà soát trước khi sử dụng." },
  };
}

function subjectFixture(subject: string, stem: string, answer: string, sourceMetadata?: Record<string, unknown>): StructuredExam {
  const question = { ...base("short_answer", 1, stem, answer, 10), id: `${subject}-1`, topic: subject, sourceMetadata };
  return { metadata: { title: `Đề ${subject}`, examStyle: "Kiểm tra thường", subject, grade: "10", duration: "15 phút", examCode: "0101", totalScore: 10, requestedSectionCounts: { partI: 0, partII: 0, partIII: 1 } }, parts: [{ type: "short_answer", title: "PHẦN III", instruction: "Trả lời ngắn.", questions: [question] }], teacherOnly: { scoringGuide: answer, matrix: "Một câu.", specification: "Kiểm tra ngắn.", notes: "Rà soát." } };
}

export const physicsFixture = () => subjectFixture("Vật lí", "Một điện trở 5 Ω có dòng điện 2 A. Tính hiệu điện thế theo U=RI (V).", "10 V");
export const chemistryFixture = () => subjectFixture("Hóa học", "Tính số mol của 18 g H2O, biết M(H2O)=18 g/mol.", "1 mol");
export const literatureFixture = () => subjectFixture("Ngữ văn", "Dựa vào đoạn văn trên, nêu một thông điệp chính.", "Trân trọng tri thức.", { passage: "Tri thức giúp con người hiểu mình, hiểu thế giới và sống có trách nhiệm." });
export const englishFixture = () => subjectFixture("Tiếng Anh", "According to the passage above, what helps students learn effectively?", "Regular practice.", { readingPassage: "Regular practice helps students learn effectively and remember new knowledge." });
