import assert from "node:assert/strict";
import { normalizeAIExamOutput } from "../lib/exam/normalize-ai-exam";
import { createGenerationRequestContext } from "../lib/generation/request-context";
import { validateTopicItem } from "../lib/generation/topic-validator";
import { buildExamPrompt } from "../lib/ai/prompts";
import type { ExamInput } from "../lib/types";

const input = { schoolName: "", teacherName: "", subject: "Toán", grade: "12", bookSeries: "Kết nối tri thức", topic: "hàm số", duration: "45 phút", examType: "Trắc nghiệm", examStyle: "Kiểm tra thường", trueFalseCount: 0, shortAnswerCount: 0, examCode: "101", multipleChoiceCount: 10, essayCount: 0, totalScore: 10, level: "Trung bình", recognitionRate: 30, understandingRate: 40, applicationRate: 20, advancedRate: 10, includeAnswers: true, includeRubric: true, includeMatrix: true, includeSpecification: true, extraRequirements: "" } as ExamInput;
const question = (index: number) => ({ id: `q${index}`, stem: `Cho hàm số y=x^3-${index}x. Hàm số đồng biến trên khoảng nào?`, options: { A: "A", B: "B", C: "C", D: "D" }, correctAnswer: ["A", "B", "C", "D"][index % 4], explanation: "Xét dấu đạo hàm để tìm khoảng đồng biến.", score: 1, difficulty: index < 3 ? "Nhận biết" : index < 7 ? "Thông hiểu" : index < 9 ? "Vận dụng" : "Vận dụng cao", topic: "hàm số" });
const raw = `Kết quả:\n\`\`\`json\n${JSON.stringify({ metadata: { title: "Đề hàm số", subject: "Toán", grade: "12" }, sections: [{ type: "multiple_choice", questions: [question(0), question(1)] }, { type: "multiple_choice", questions: Array.from({ length: 8 }, (_, index) => question(index + 2)) }], teacherOnly: { scoringGuide: "Đáp án theo từng câu." } })}\n\`\`\``;
const parsed = normalizeAIExamOutput(raw, input);
assert.equal(parsed.ok, true);
if (parsed.ok) assert.equal(parsed.structuredExam.parts.flatMap((part) => part.questions).length, 10);
const directArray = normalizeAIExamOutput(`Dữ liệu: ${JSON.stringify(Array.from({ length: 10 }, (_, index) => question(index)))}`, input);
assert.equal(directArray.ok, true);
if (directArray.ok) assert.equal(directArray.structuredExam.parts[0].questions.length, 10);
const prompt = buildExamPrompt(input);
assert.match(prompt, /đủ chính xác 10 câu/i);
assert.match(prompt, /Nhận biết 3, Thông hiểu 4, Vận dụng 2, Vận dụng cao 1/);

const mathContext = createGenerationRequestContext({ subject: "Toán", grade: "12", topic: "hàm số", questionType: "Trắc nghiệm" }, "exam");
assert.equal(validateTopicItem(mathContext, { content: "Hàm số y=x^3-3x đồng biến trên khoảng nào?", options: { A: "(-∞;-1)", B: "(-1;1)", C: "(1;+∞)", D: "R" }, answer: "A", explanation: "Xét đạo hàm.", topic: "hàm số", subject: "Toán", grade: "12" }).valid, true);
const thermalContext = createGenerationRequestContext({ subject: "Vật lý", grade: "10", topic: "nhiệt học", questionType: "Trắc nghiệm" }, "exam");
assert.equal(validateTopicItem(thermalContext, { content: "Một vật nhận nhiệt lượng 8400 J. Đại lượng nào quyết định độ tăng nhiệt độ?", options: { A: "Khối lượng và nhiệt dung riêng", B: "Điện trở", C: "Từ thông", D: "Tiêu cự" }, answer: "A", explanation: "Áp dụng Q=mcΔt.", topic: "nhiệt học", subject: "Vật lí", grade: "10" }).valid, true);
const unknownContext = createGenerationRequestContext({ subject: "Vật lí", grade: "10", topic: "chuyển pha nâng cao", questionType: "Trắc nghiệm" }, "exam");
assert.equal(validateTopicItem(unknownContext, { content: "Trong quá trình nóng chảy, nhiệt độ của chất kết tinh thay đổi thế nào?", options: { A: "Không đổi", B: "Tăng", C: "Giảm", D: "Bằng 0" }, answer: "A", explanation: "Nhiệt cung cấp dùng cho chuyển pha.", topic: "chuyển pha nâng cao", subject: "Vật lí", grade: "10" }).valid, true);
console.log("Exam count/unknown topics: parser giữ 10 câu qua nhiều sections; Toán hàm số, Vật lí nhiệt và chủ đề giáo viên nhập đều đạt.");
