import assert from "node:assert/strict";
import { canonicalizeGrade, canonicalizeSubject, canonicalizeTopic, createGenerationRequestContext } from "../lib/generation/request-context";
import { findTopicNode, isTopicAllowed } from "../lib/generation/topic-taxonomy";
import { validateTopicItem } from "../lib/generation/topic-validator";

let assertions = 0;
const equal = (actual: unknown, expected: unknown, message: string) => { assert.equal(actual, expected, message); assertions += 1; };
const valid = (subject: string, grade: string, topic: string, content: string, extraRequirements = "") => validateTopicItem(
  createGenerationRequestContext({ subject, grade, topic, extraRequirements }, "exam"),
  { content, topic, subject, grade, explanation: content },
).valid;

equal(canonicalizeSubject(" Vật lý "), "Vật lí", "Chuẩn hóa Vật lý");
equal(canonicalizeSubject("vat li"), "Vật lí", "Chuẩn hóa Vật lí không dấu");
equal(canonicalizeSubject("Hoá học"), "Hóa học", "Chuẩn hóa Hóa học");
equal(canonicalizeGrade("Lớp 11 "), "11", "Chuẩn hóa lớp");
equal(canonicalizeTopic("dinh luat om"), canonicalizeTopic("Định luật Ohm"), "Chuẩn hóa typo Ohm");

equal(valid("Vật lí", "11", "Định luật Ohm", "Cho U = 12 V, R = 4 Ω. Cường độ dòng điện I qua điện trở bằng bao nhiêu? Áp dụng I = U/R."), true, "Ohm hợp lệ");
equal(valid("Vật lí", "11", "Định luật Ohm", "Một dây dẫn đặt trong từ trường chịu lực từ như thế nào?"), false, "Loại từ trường khỏi Ohm");
equal(valid("Vật lí", "11", "Định luật Ohm", "Hiện tượng cảm ứng điện từ sinh ra suất điện động."), false, "Loại cảm ứng khỏi Ohm");
equal(valid("Vật lí", "11", "Định luật Ohm", "Con lắc dao động điều hòa có chu kỳ bao nhiêu?"), false, "Loại dao động khỏi Ohm");
equal(valid("Vật lí", "11", "Định luật Ohm", "Tính xác suất chọn hai học sinh."), false, "Loại xác suất khỏi Ohm");

equal(valid("Vật lí", "10", "Ba định luật Newton", "Hợp lực F tác dụng lên vật khối lượng m gây gia tốc a theo F = ma."), true, "Newton hợp lệ");
equal(valid("Vật lí", "10", "Ba định luật Newton", "Tính công và năng lượng của vật."), false, "Loại công-năng lượng khỏi Newton");
equal(valid("Vật lí", "10", "Ba định luật Newton", "Điện trường tác dụng lực lên điện tích."), false, "Loại điện trường khỏi Newton");
equal(valid("Vật lí", "10", "Ba định luật Newton", "Tia sáng khúc xạ qua thấu kính."), false, "Loại quang học khỏi Newton");

equal(valid("Hóa học", "10", "Cấu tạo nguyên tử", "Nguyên tử gồm proton, neutron trong hạt nhân và electron; số hiệu nguyên tử bằng số proton."), true, "Cấu tạo nguyên tử hợp lệ");
equal(valid("Hóa học", "10", "Cấu tạo nguyên tử", "Cân bằng hóa học chuyển dịch theo Le Chatelier."), false, "Loại cân bằng khỏi cấu tạo nguyên tử");
equal(valid("Hóa học", "10", "Cấu tạo nguyên tử", "Polymer được tạo bởi phản ứng trùng hợp."), false, "Loại polymer khỏi cấu tạo nguyên tử");
equal(valid("Hóa học", "10", "Cấu tạo nguyên tử", "Dòng điện qua điện trở tuân theo định luật Ohm."), false, "Loại điện học khỏi Hóa");

equal(valid("Hóa học", "11", "pH", "Dung dịch acid có nồng độ ion H+ là 10^-3 M nên pH bằng 3."), true, "pH hợp lệ");
equal(valid("Hóa học", "11", "pH", "Hydrocarbon no chỉ có liên kết đơn."), false, "Loại hydrocarbon khỏi pH");
equal(valid("Hóa học", "11", "pH", "Cấu tạo nguyên tử gồm proton và electron."), false, "Loại cấu tạo nguyên tử khỏi pH");

equal(valid("Hóa học", "12", "Ester - lipid", "Chất béo là lipid; phản ứng thủy phân ester trong kiềm là xà phòng hóa."), true, "Ester-lipid hợp lệ");
equal(valid("Hóa học", "12", "Ester - lipid", "Số proton quyết định số hiệu nguyên tử."), false, "Loại cấu tạo nguyên tử khỏi ester");

const broadNode = findTopicNode("Vật lí", "11", "Dòng điện không đổi");
equal(Boolean(broadNode), true, "Nhận diện chủ đề rộng");
equal(isTopicAllowed("Dòng điện không đổi", "Định luật Ohm", broadNode, false), false, "Exact mode không dùng chủ đề con");
equal(isTopicAllowed("Dòng điện không đổi", "Định luật Ohm", broadNode, true), true, "Related mode cho phép chủ đề con");
equal(isTopicAllowed("Định luật Ohm", "Từ trường", findTopicNode("Vật lí", "11", "Định luật Ohm"), true), false, "Related mode không vượt node");

equal(valid("Vật lí", "10", "Ba định luật Newton", "Theo định luật I Newton, vật giữ quán tính.", "Chỉ tạo câu hỏi về định luật II Newton, không hỏi định luật I và III."), false, "Tôn trọng loại trừ định luật I");
equal(valid("Vật lí", "10", "Ba định luật Newton", "Theo định luật II Newton, hợp lực F = ma tạo gia tốc.", "Chỉ tạo câu hỏi về định luật II Newton, không hỏi định luật I và III."), true, "Cho phép định luật II");
equal(valid("Vật lí", "10", "Ba định luật Newton", "Một vật 2 kg chịu hợp lực 6 N, tính gia tốc theo F = ma.", "Chỉ tạo câu hỏi lý thuyết, không tính toán."), false, "Chế độ lý thuyết loại bài tính");
equal(valid("Vật lí", "10", "Ba định luật Newton", "Định luật II Newton là gì?", "Chỉ tạo bài tập tính toán."), false, "Chế độ tính toán loại câu định nghĩa");

equal(valid("Vật lí", "11", "Định luật Ohm", "Phát biểu nào sau đây đúng về nội dung bài học?"), false, "Loại placeholder chung chung");

console.log(`Topic fidelity: ${assertions}/${assertions} assertions passed.`);
