import assert from "node:assert/strict";
import type { ExamPartType, ExamQuestion } from "../lib/exam-types";
import { collectExamSections, isUsableExamCount } from "../lib/exam/section-generation";

const input = {
  schoolName: "THPT ND", teacherName: "", subject: "Toán", grade: "12", topic: "hàm số", duration: "45 phút",
  examType: "Kết hợp", examStyle: "THPTQG / tốt nghiệp", examCode: "0101", multipleChoiceCount: 12,
  trueFalseCount: 4, shortAnswerCount: 6, essayCount: 0, totalScore: 10,
};

const skills: Record<ExamPartType, string[]> = {
  multiple_choice: [
    "tập xác định của phân thức", "đạo hàm của đa thức", "khoảng đồng biến", "khoảng nghịch biến",
    "điểm cực đại", "điểm cực tiểu", "giá trị lớn nhất", "giá trị nhỏ nhất",
    "tiệm cận đứng", "tiệm cận ngang", "tương giao đồ thị", "bảng biến thiên",
  ],
  true_false: ["đơn điệu từ đạo hàm", "cực trị từ bảng biến thiên", "tiệm cận của phân thức", "đọc đồ thị"],
  short_answer: ["hoành độ cực trị", "tung độ giao điểm", "số đường tiệm cận", "hệ số góc tiếp tuyến", "GTLN trên đoạn", "số nghiệm tương giao"],
};
const offsets: Record<ExamPartType, number> = { multiple_choice: 0, true_false: 0, short_answer: 0 };

function makeQuestion(type: ExamPartType, index: number): ExamQuestion {
  const stem = `Bài ${index + 1}: xác định ${skills[type][index]} trong chủ đề hàm số.`;
  return {
    id: `${type}-${index + 1}`, part: type, number: index + 1, stem,
    ...(type === "multiple_choice" ? { options: { A: "Kết quả A", B: "Kết quả B", C: "Kết quả C", D: "Kết quả D" } } : {}),
    ...(type === "true_false" ? { trueFalseItems: ["a", "b", "c", "d"].map((label, itemIndex) => ({ label: label as "a" | "b" | "c" | "d", text: `Mệnh đề ${label} về ${skills[type][index]}.`, answer: itemIndex % 2 === 0 })) } : {}),
    answer: type === "multiple_choice" ? ["A", "B", "C", "D"][index % 4] : type === "true_false" ? "a Đúng; b Sai; c Đúng; d Sai" : String(index + 1),
    explanation: `Giải thích bằng ${skills[type][index]} và thu được kết quả ${index + 1}.`, score: 0.5,
    difficulty: index % 3 === 0 ? "Nhận biết" : index % 3 === 1 ? "Thông hiểu" : "Vận dụng", topic: "hàm số",
  };
}

async function main() {
  const requests: Array<{ type: ExamPartType; remaining: number; count: number }> = [];
  const collected = await collectExamSections(input, async ({ type, remaining, count, attempt }) => {
    requests.push({ type, remaining, count });
    const actualCount = type === "multiple_choice" && attempt === 0 ? 2 : count;
    const start = offsets[type];
    offsets[type] += actualCount;
    return { questions: Array.from({ length: actualCount }, (_, index) => makeQuestion(type, start + index)) };
  });

  assert.deepEqual(collected.audit.generated, { partI: 12, partII: 4, partIII: 6 });
  assert.equal(collected.audit.finalCount, 22);
  assert.equal(collected.audit.complete, true);
  assert.equal(isUsableExamCount(22, collected.audit.finalCount), true);
  const partIRequests = requests.filter((item) => item.type === "multiple_choice");
  assert.deepEqual(partIRequests.slice(0, 2).map((item) => item.count), [6, 6]);
  assert.ok(partIRequests.slice(2).every((item) => item.count <= 6));
  assert.equal(partIRequests[1].remaining, 10, "Sau lần đầu chỉ có 2 câu, pipeline phải phát hiện còn thiếu 10 câu");
  assert.equal(collected.diagnostics.finalTotal, 22);
  assert.ok(collected.diagnostics.regeneratedCount >= 10);
  console.log("Exam section pipeline: lần đầu 2/12, phát hiện thiếu 10, sinh tiếp theo chunk và lắp đủ 12/4/6 = 22 câu.");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "exam_section_pipeline_failed");
  process.exitCode = 1;
});
