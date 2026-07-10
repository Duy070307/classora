import assert from "node:assert/strict";
import { filterStrictBankQuestions } from "../lib/exam/question-bank-filter";
import type { QuestionItem } from "../lib/types";

const make = (id: string, subject: string, grade: string, topic: string, bankScope: "system" | "user" = "system"): QuestionItem => ({
  id, subject, grade, topic, bankScope, question: `Câu ${id}`, type: "Trắc nghiệm", difficulty: "Nhận biết",
  options: { A: "1", B: "2", C: "3", D: "4" }, answer: "A", explanation: "", createdAt: new Date(0).toISOString(),
});

const rows = [
  ...Array.from({ length: 8 }, (_, index) => make(`ohm-${index}`, index % 2 ? "Vật lý" : "Vật lí", "11", "Dòng điện không đổi - Định luật Ohm")),
  ...Array.from({ length: 5 }, (_, index) => make(`newton-${index}`, "Vật lí", "10", "Ba định luật Newton")),
  make("math", "Toán", "11", "Phương trình"),
  make("chemistry", "Hóa học", "11", "Cấu tạo nguyên tử"),
  make("personal", "Vật lí", "11", "Định luật Ohm", "user"),
];

const filter = (subject: string, grade: string, topic: string, source: "system" | "user" | "both" = "system") =>
  filterStrictBankQuestions(rows, { subject, grade, topic, source });

assert.equal(filter("Vật lí", "11", "Định luật Ohm").length, 8, "Vật lý/Vật lí phải tương đương");
assert.ok(filter("Vật lí", "11", "Định luật Ohm").every((item) => !item.id.startsWith("math")), "Không được trộn Toán");
assert.equal(filter("Vật lí", "10", "Ba định luật Newton").length, 5, "Phải lọc đúng Vật lí 10 Newton");
assert.equal(filter("Toán", "11", "Xác suất").length, 0, "Không thay câu môn khác khi Toán trống");
assert.equal(filter("Vật lí", "11", "Định luật Ohm", "user").length, 1, "Nguồn cá nhân chỉ lấy câu cá nhân");
assert.equal(filter("Vật lí", "11", "Định luật Ohm", "both").length, 9, "Cả hai phải kết hợp đúng hai nguồn");
assert.equal(filter("Vật lí", "11", "Dao động điều hòa").length, 0, "Không dùng chủ đề không liên quan");
assert.equal(filter("Vật lí", "11", "Định luật Ohm").slice(0, 20).length, 8, "Yêu cầu 20 câu vẫn chỉ báo 8 câu phù hợp");

console.log("Exam bank filter: 8/8 assertions passed.");
