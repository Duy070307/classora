import assert from "node:assert/strict";
import { buildSupplementStatus, uniqueBankQuestions, uniqueSupplementQuestions } from "../lib/exam/bank-supplement";
import type { ExamQuestion } from "../lib/exam-types";
import type { QuestionItem } from "../lib/types";

const bankQuestion = (id: string, question: string): QuestionItem => ({ id, question, subject: "Vật lí", grade: "11", topic: "Định luật Ohm", type: "Trắc nghiệm", difficulty: "Nhận biết", answer: "A", explanation: "Giải thích", createdAt: "2026-01-01", options: { A: "1", B: "2", C: "3", D: "4" }, bankScope: "system" });
const aiQuestion = (stem: string): ExamQuestion => ({ id: stem, part: "multiple_choice", number: 1, stem, options: { A: "1", B: "2", C: "3", D: "4" }, answer: "A", explanation: "Giải thích", score: 1, difficulty: "Nhận biết", topic: "Định luật Ohm" });

assert.deepEqual(buildSupplementStatus(10, 4, 6, false), { requestedCount: 10, finalCount: 10, bankCount: 4, aiSupplementCount: 6, isPartial: false, warnings: [] });
assert.equal(buildSupplementStatus(10, 0, 10, false).finalCount, 10);
const bankOnly = buildSupplementStatus(10, 4, 0, true);
assert.equal(bankOnly.isPartial, true);
assert.match(bankOnly.warnings[0], /4\/10/);
const partial = buildSupplementStatus(10, 4, 5, false);
assert.equal(partial.finalCount, 9);
assert.equal(partial.isPartial, true);
assert.match(partial.warnings[0], /9\/10/);
assert.equal(uniqueBankQuestions([bankQuestion("1", "Cường độ dòng điện là gì?"), bankQuestion("1", "Câu trùng ID"), bankQuestion("2", "Cường độ dòng điện là gì?")]).length, 1);
assert.equal(uniqueSupplementQuestions([aiQuestion("Cường độ dòng điện là gì?"), aiQuestion("Phát biểu định luật Ohm"), aiQuestion("Phát biểu định luật Ohm")], ["Cường độ dòng điện là gì?"], 6).length, 1);
console.log("Bank AI supplement: 4+6, 0+10, bank-only 4/10, partial 9/10 và chống trùng đều đạt.");
