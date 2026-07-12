import assert from "node:assert/strict";
import type { ExamQuestion } from "../lib/exam-types";
import { balanceMultipleChoiceAnswers, balanceTrueFalsePatterns, normalizeTeacherMathNotation, validateMultipleChoiceOptions, validateShortAnswerNumeric, validateVisualDependency } from "../lib/exam/exam-quality";

function baseQuestion(part: ExamQuestion["part"], index: number): ExamQuestion {
  return {
    id: `${part}-${index}`, part, number: index + 1, stem: `Câu ${index + 1} về hàm số y=x^3-${index + 1}x.`,
    answer: "1", explanation: `Tính toán thu được kết quả ${index + 1}.`, score: 0.5,
    difficulty: "Thông hiểu", topic: "hàm số",
  };
}

const mc = Array.from({ length: 12 }, (_, index) => ({
  ...baseQuestion("multiple_choice", index),
  options: { A: `Giá trị đúng ${index}`, B: `Nhiễu B ${index}`, C: `Nhiễu C ${index}`, D: `Nhiễu D ${index}` },
  answer: "A", explanation: `Đáp án A vì phép tính ${index + 1}.`,
}));
const correctContents = mc.map((question) => question.options[question.answer as "A"]);
const balancedMc = balanceMultipleChoiceAnswers(mc);
assert.deepEqual(balanceMultipleChoiceAnswers(balancedMc), balancedMc, "Cân bằng options phải ổn định khi sanitize chạy lại");
const distribution = Object.fromEntries(["A", "B", "C", "D"].map((letter) => [letter, balancedMc.filter((question) => question.answer === letter).length]));
assert.deepEqual(distribution, { A: 3, B: 3, C: 3, D: 3 });
balancedMc.forEach((question, index) => {
  assert.equal(question.options?.[question.answer as "A"], correctContents[index], "Nội dung đáp án đúng phải được giữ khi đổi vị trí options");
  assert.doesNotMatch(question.explanation, /đáp án\s+[A-D]/i);
});
let longestStreak = 1;
let currentStreak = 1;
for (let index = 1; index < balancedMc.length; index += 1) {
  currentStreak = balancedMc[index].answer === balancedMc[index - 1].answer ? currentStreak + 1 : 1;
  longestStreak = Math.max(longestStreak, currentStreak);
}
assert.ok(longestStreak <= 3);
assert.equal(validateMultipleChoiceOptions({ ...mc[0], options: { A: "1", B: "1", C: "2", D: "3" } }).valid, false);
assert.equal(validateMultipleChoiceOptions({ ...mc[0], options: { A: "1", B: "2", C: "3", D: "Tất cả các đáp án trên" } }).valid, false);

const tf = Array.from({ length: 4 }, (_, index) => ({
  ...baseQuestion("true_false", index),
  stem: `Xét bốn khẳng định đại số ở trường hợp ${index + 1}.`,
  trueFalseItems: ["a", "b", "c", "d"].map((label, itemIndex) => ({ label: label as "a" | "b" | "c" | "d", text: `Khẳng định ${label} của trường hợp ${index + 1}.`, answer: itemIndex % 2 === 0 })),
  answer: "a Đúng; b Sai; c Đúng; d Sai",
}));
const balancedTf = balanceTrueFalsePatterns(tf);
const patterns = balancedTf.map((question) => question.trueFalseItems?.map((item) => item.answer ? "Đ" : "S").join("") || "");
assert.equal(new Set(patterns).size, 4);
assert.equal(balancedTf.flatMap((question) => question.trueFalseItems || []).filter((item) => item.answer).length, 8);
assert.equal(balancedTf.flatMap((question) => question.trueFalseItems || []).filter((item) => !item.answer).length, 8);
balancedTf.forEach((question) => assert.equal(question.answer, question.trueFalseItems?.map((item) => `${item.label} ${item.answer ? "Đúng" : "Sai"}`).join("; ")));

const numericQuestion = (answer: string, stem = "Tính giá trị f(2).") => ({ ...baseQuestion("short_answer", 0), answer, stem, explanation: `Thay số và thu được kết quả ${answer.replace(/\D/g, "") || "3"}.` });
for (const answer of ["3", "-2", "1.5", "3/2"]) assert.equal(validateShortAnswerNumeric(numericQuestion(answer)).valid, true, `Phải nhận đáp án ${answer}`);
for (const answer of ["(1; +∞)", "(-∞; 2)", "x = 1", "không tồn tại", "A"]) assert.equal(validateShortAnswerNumeric(numericQuestion(answer)).valid, false, `Phải loại đáp án ${answer}`);
assert.equal(validateShortAnswerNumeric(numericQuestion("3", "Tìm tập xác định của hàm số.")).valid, false);

assert.equal(validateVisualDependency({ stem: "Dựa vào đồ thị dưới đây, hàm số đồng biến trên khoảng nào?" }).valid, false);
assert.equal(validateVisualDependency({ stem: "Cho bảng biến thiên sau, hãy xác định cực trị." }).valid, false);
assert.equal(validateVisualDependency({ stem: "Cho hàm số y=(2x-1)/(x+1) có đồ thị (C). Khẳng định nào đúng?" }).valid, true);

const normalizedMath = normalizeTeacherMathNotation("sqrt(2x + 3) + ln(x - 1), x tiến tới +infinity hoặc -infinity");
assert.equal(normalizedMath, "√(2x+3) + ln(x - 1), x tiến tới +∞ hoặc −∞");
assert.doesNotMatch(normalizedMath, /sqrt|infinity/i);

console.log("Exam quality: MCQ cân bằng 3/3/3/3, TF 8/8 với 4 mẫu khác nhau, short-answer numeric, visual dependency và math notation đều đạt.");
