import type { ExamPartType, ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { QuestionDifficulty } from "@/lib/types";
import { findExamDuplicates } from "@/lib/exam/duplicate-detection";
import { duplicateExamQuestionIds } from "@/lib/exam/identity";
import { validateVisualDependency } from "@/lib/exam/exam-quality";
import {
  EXAM_AUDIT_VERSION,
  type ExamAuditConfig,
  type ExamAuditIssue,
  type ExamAuditResult,
  type SemanticAuditFinding,
} from "@/lib/exam-audit/types";

const letters = ["A", "B", "C", "D"] as const;
const sectionLabels: Record<ExamPartType, string> = {
  multiple_choice: "PHẦN I",
  true_false: "PHẦN II",
  short_answer: "PHẦN III",
};
const difficultyLabels: QuestionDifficulty[] = ["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"];

export function normalizeAuditText(value: string, stripNumbers = false) {
  let result = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\\(?:left|right|mathrm|text|displaystyle)/g, "")
    .replace(/[^a-z0-9+\-*/^=<>]/g, " ");
  if (stripNumbers) result = result.replace(/\d+(?:[.,]\d+)?/g, "#");
  return result.replace(/\s+/g, " ").trim();
}

export function examContentHash(exam: StructuredExam) {
  const input = JSON.stringify(exam);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `exam-${(hash >>> 0).toString(16)}`;
}

function issueId(code: string, questionId?: string, suffix = "") {
  return `${code}:${questionId || "exam"}${suffix ? `:${suffix}` : ""}`;
}

function tokens(value: string, stripNumbers = false) {
  return new Set(normalizeAuditText(value, stripNumbers).split(" ").filter((token) => token.length > 1 && !["cho", "biet", "hay", "tinh", "cau", "phat", "bieu"].includes(token)));
}

function similarity(left: string, right: string, stripNumbers = false) {
  const a = tokens(left, stripNumbers);
  const b = tokens(right, stripNumbers);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((item) => b.has(item)).length;
  return intersection / (a.size + b.size - intersection);
}

function bracesBalanced(value: string) {
  let balance = 0;
  for (const char of value) {
    if (char === "{") balance += 1;
    if (char === "}") balance -= 1;
    if (balance < 0) return false;
  }
  return balance === 0;
}

function notationProblems(value: string) {
  return /\bsqrt\s*\(|\binfinity\b|(^|[^<])<=|>=|\bpi\b|\$\$\$|\$[^$]*$/i.test(value)
    || !bracesBalanced(value)
    || /\\frac\s*\{[^}]*\}(?!\s*\{)/.test(value);
}

function numericAnswer(value: string) {
  return String(value || "")
    .trim()
    .replace(/^\$|\$$/g, "")
    .replace(/^\\\(|\\\)$/g, "")
    .replace(/\\frac\s*\{\s*([+-]?\d+)\s*\}\s*\{\s*([+-]?\d+)\s*\}/g, "$1/$2")
    .replace(/\s+/g, "");
}

export function isValidNumericShortAnswer(value: string) {
  return /^[+-]?(?:\d+(?:[.,]\d+)?|\d+\/\d+)$/.test(numericAnswer(value));
}

function parseNumeric(value: string) {
  const normalized = numericAnswer(value).replace(",", ".");
  if (/^[+-]?\d+\/\d+$/.test(normalized)) {
    const [numerator, denominator] = normalized.split("/").map(Number);
    return denominator ? numerator / denominator : null;
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function simpleExpressionValue(stem: string) {
  const match = stem.match(/(?:tính|giá trị của)\s+([+\-]?\d+(?:[.,]\d+)?(?:\s*[+\-*/]\s*[+\-]?\d+(?:[.,]\d+)?){1,5})(?:\s|\?|$)/i);
  if (!match) return null;
  const expression = match[1].replace(/,/g, ".").replace(/\s+/g, "");
  const values = expression.match(/\d+(?:\.\d+)?|[+\-*/]/g);
  if (!values || values.join("") !== expression) return null;
  const numbers: number[] = [];
  const operators: string[] = [];
  const precedence = (operator: string) => operator === "*" || operator === "/" ? 2 : 1;
  const apply = () => {
    const right = numbers.pop();
    const left = numbers.pop();
    const operator = operators.pop();
    if (left === undefined || right === undefined || !operator) return false;
    if (operator === "+") numbers.push(left + right);
    else if (operator === "-") numbers.push(left - right);
    else if (operator === "*") numbers.push(left * right);
    else if (right !== 0) numbers.push(left / right);
    else return false;
    return true;
  };
  let expectNumber = true;
  let unarySign = 1;
  for (const token of values) {
    if (/^\d/.test(token) && expectNumber) {
      numbers.push(unarySign * Number(token));
      unarySign = 1;
      expectNumber = false;
    } else if ((token === "+" || token === "-") && expectNumber) {
      unarySign = token === "-" ? -unarySign : unarySign;
    } else if (/^[+\-*/]$/.test(token) && !expectNumber) {
      while (operators.length && precedence(operators.at(-1) || "") >= precedence(token)) if (!apply()) return null;
      operators.push(token);
      expectNumber = true;
    } else return null;
  }
  while (operators.length) if (!apply()) return null;
  return numbers.length === 1 && Number.isFinite(numbers[0]) ? numbers[0] : null;
}

function expectedCounts(exam: StructuredExam, config: ExamAuditConfig) {
  if (config.expectedSectionCounts) return config.expectedSectionCounts;
  if (exam.metadata.requestedSectionCounts) return exam.metadata.requestedSectionCounts;
  if (/THPTQG|tốt nghiệp/i.test(exam.metadata.examStyle)) return { partI: 12, partII: 4, partIII: 6 };
  return undefined;
}

function pushQuestionIssue(
  issues: ExamAuditIssue[],
  question: ExamQuestion,
  code: string,
  severity: ExamAuditIssue["severity"],
  title: string,
  description: string,
  suggestedFix: string,
  options: Partial<Pick<ExamAuditIssue, "canAutoFix" | "fixKind" | "confidence" | "currentValue" | "proposedValue">> = {},
) {
  issues.push({
    id: issueId(code, question.id), code, severity, questionId: question.id, questionNumber: question.number,
    section: sectionLabels[question.part], title, description, suggestedFix, canAutoFix: false, ...options,
  });
}

function auditQuestionBasics(question: ExamQuestion, issues: ExamAuditIssue[]) {
  if (!question.stem.trim()) pushQuestionIssue(issues, question, "missing_prompt", "error", "Thiếu nội dung câu hỏi", "Câu hỏi chưa có đề bài.", "Bổ sung nội dung câu hỏi trước khi xuất file.");
  if (!question.answer.trim()) pushQuestionIssue(issues, question, "missing_answer", "error", "Thiếu đáp án", "Câu hỏi chưa có đáp án trong khóa dành cho giáo viên.", "Nhập đáp án và kiểm tra lại với đề bài.");
  if (!Number.isFinite(question.score) || question.score <= 0) pushQuestionIssue(issues, question, "missing_score", "error", "Thiếu điểm", "Câu hỏi chưa được gán điểm hợp lệ.", "Nhập điểm hoặc dùng chức năng cân lại tổng điểm.", { canAutoFix: true, fixKind: "round_scores" });
  const combined = [question.stem, question.answer, question.explanation, ...Object.values(question.options || {}), ...(question.trueFalseItems || []).map((item) => item.text)].join("\n");
  if (notationProblems(combined)) pushQuestionIssue(issues, question, "malformed_notation", "warning", "Ký hiệu toán học cần chuẩn hóa", "Phát hiện cú pháp như sqrt(...), infinity, <=, >= hoặc dấu LaTeX chưa cân bằng.", "Xem trước và chuẩn hóa ký hiệu mà không đổi ý nghĩa câu hỏi.", { canAutoFix: true, fixKind: "normalize_notation", currentValue: combined.slice(0, 500) });
  if (/\s{2,}|[ \t]+\n/.test(combined)) pushQuestionIssue(issues, question, "duplicate_whitespace", "info", "Khoảng trắng chưa gọn", "Nội dung có khoảng trắng lặp hoặc khoảng trắng thừa cuối dòng.", "Chuẩn hóa khoảng trắng.", { canAutoFix: true, fixKind: "normalize_notation" });
  const dependency = validateVisualDependency(question);
  if (!dependency.valid) pushQuestionIssue(issues, question, "missing_visual", "error", "Thiếu nội dung được tham chiếu", dependency.reason === "missing_passage_asset" ? "Câu hỏi tham chiếu đoạn văn hoặc bài đọc nhưng nội dung nguồn chưa được đính kèm." : dependency.reason === "missing_table_asset" ? "Câu hỏi tham chiếu bảng nhưng dữ liệu bảng chưa được đính kèm." : "Câu hỏi tham chiếu đến hình hoặc biểu đồ nhưng chưa có dữ liệu trực quan.", "Đính kèm đúng hình, bảng hoặc đoạn đọc; hoặc sửa lại câu hỏi. Không tự tạo dữ liệu còn thiếu.");
  if (/phương án nhiễu|nội dung câu hỏi|điền nội dung|placeholder|lorem ipsum|\[chèn[^\]]*\]/i.test(combined)) pushQuestionIssue(issues, question, "placeholder_content", "error", "Còn nội dung giữ chỗ", "Câu hỏi hoặc phương án còn văn bản mẫu chưa thể dùng cho học sinh.", "Thay toàn bộ nội dung giữ chỗ bằng dữ liệu hoàn chỉnh.");
  if (/\.{3,}|_{3,}|\[điền[^\]]*\]/i.test(question.stem)) pushQuestionIssue(issues, question, "missing_data", "warning", "Có dữ liệu chưa hoàn chỉnh", "Đề bài còn chỗ trống hoặc ký hiệu giữ chỗ nên có thể chưa đủ dữ liệu để giải.", "Bổ sung dữ liệu và điều kiện còn thiếu.", { confidence: "high" });
}

function auditMultipleChoice(questions: ExamQuestion[], issues: ExamAuditIssue[], requireFourOptions: boolean) {
  const answerSequence: string[] = [];
  questions.forEach((question) => {
    const options = question.options;
    const values = letters.map((letter) => options?.[letter]?.trim() || "");
    if (requireFourOptions && (!options || values.some((value) => !value))) {
      pushQuestionIssue(issues, question, "invalid_option_count", "error", "Chưa đủ bốn phương án", "Câu trắc nghiệm cần đúng bốn phương án A, B, C, D và không có phương án rỗng.", "Bổ sung hoặc sửa phương án bị thiếu.");
    }
    const normalized = values.filter(Boolean).map((value) => normalizeAuditText(value));
    if (normalized.length && new Set(normalized).size !== normalized.length) pushQuestionIssue(issues, question, "duplicate_options", "error", "Phương án bị trùng", "Có ít nhất hai phương án có nội dung giống nhau.", "Sửa phương án nhiễu; không tự thay nội dung vì có thể đổi kiến thức.");
    const answer = question.answer.trim().toUpperCase();
    if (answer) {
      if (!letters.includes(answer as typeof letters[number])) {
        const matching = values.findIndex((value) => normalizeAuditText(value) === normalizeAuditText(question.answer));
        pushQuestionIssue(issues, question, "answer_not_option", "error", "Đáp án không khớp phương án", matching >= 0 ? `Đáp án đang ghi bằng nội dung thay vì nhãn ${letters[matching]}.` : "Đáp án không phải A/B/C/D và không khớp phương án nào.", "Chọn đúng một nhãn A, B, C hoặc D.");
      } else answerSequence.push(answer);
    }
    const lengths = values.filter(Boolean).map((value) => value.length);
    if (lengths.length === 4 && Math.max(...lengths) > Math.max(12, Math.min(...lengths) * 4)) pushQuestionIssue(issues, question, "distractor_length_imbalance", "warning", "Độ dài phương án chênh lệch lớn", "Một phương án dài nổi bật so với các phương án còn lại, có thể vô tình gợi ý đáp án.", "Rà soát để các phương án có mức chi tiết tương đương.", { confidence: "medium" });
    for (let left = 0; left < values.length; left += 1) for (let right = left + 1; right < values.length; right += 1) {
      if (values[left].length > 15 && similarity(values[left], values[right]) > 0.9 && normalizeAuditText(values[left]) !== normalizeAuditText(values[right])) {
        pushQuestionIssue(issues, question, "similar_distractors", "warning", "Phương án nhiễu quá giống nhau", `Phương án ${letters[left]} và ${letters[right]} gần như giống nhau.`, "Kiểm tra xem hai phương án có thực sự phân biệt được hay không.", { confidence: "medium" });
        left = values.length;
        break;
      }
    }
    if (values.some((value) => /(?:đáp án đúng|chính xác là|vì vậy chọn|tất cả các đáp án trên)/i.test(value))) pushQuestionIssue(issues, question, "answer_clue", "warning", "Phương án có dấu hiệu lộ đáp án", "Một phương án chứa cụm từ có thể gợi ý trực tiếp đáp án.", "Viết lại phương án theo cách trung tính.");
  });

  if (answerSequence.length >= 4) {
    const counts = Object.fromEntries(letters.map((letter) => [letter, answerSequence.filter((answer) => answer === letter).length])) as Record<typeof letters[number], number>;
    const ideal = answerSequence.length / 4;
    const tolerance = answerSequence.length === 12 ? 0 : Math.max(1, Math.ceil(answerSequence.length * 0.15));
    if (letters.some((letter) => Math.abs(counts[letter] - ideal) > tolerance)) issues.push({
      id: issueId("unbalanced_mcq_answers"), code: "unbalanced_mcq_answers", severity: "warning", section: sectionLabels.multiple_choice,
      title: "Phân bố đáp án A/B/C/D chưa cân bằng", description: `Hiện tại: A=${counts.A}, B=${counts.B}, C=${counts.C}, D=${counts.D}.`,
      suggestedFix: "Có thể đổi vị trí phương án và cập nhật khóa đáp án, không thay nội dung toán học.", canAutoFix: true, fixKind: "rebalance_options",
    });
    let streak = 1;
    for (let index = 1; index < answerSequence.length; index += 1) {
      streak = answerSequence[index] === answerSequence[index - 1] ? streak + 1 : 1;
      if (streak >= 4) {
        issues.push({ id: issueId("long_answer_streak", undefined, String(index)), code: "long_answer_streak", severity: "warning", section: sectionLabels.multiple_choice, title: "Chuỗi đáp án giống nhau kéo dài", description: `Có ít nhất ${streak} câu liên tiếp cùng đáp án ${answerSequence[index]}.`, suggestedFix: "Rà soát hoặc đổi vị trí phương án an toàn.", canAutoFix: true, fixKind: "rebalance_options" });
        break;
      }
    }
  }
}

function auditTrueFalse(questions: ExamQuestion[], issues: ExamAuditIssue[]) {
  const patterns = new Map<string, string[]>();
  let trueCount = 0;
  let statementCount = 0;
  questions.forEach((question) => {
    const items = question.trueFalseItems || [];
    if (items.length !== 4) pushQuestionIssue(issues, question, "invalid_true_false_count", "error", "Sai số lượng mệnh đề", `Câu đúng/sai đang có ${items.length}/4 mệnh đề.`, "Bổ sung hoặc loại mệnh đề để có đúng bốn ý.");
    if (items.some((item) => !item.text.trim())) pushQuestionIssue(issues, question, "empty_true_false_statement", "error", "Mệnh đề đúng/sai bị rỗng", "Có mệnh đề chưa có nội dung.", "Bổ sung nội dung mệnh đề.");
    const normalized = items.map((item) => normalizeAuditText(item.text)).filter(Boolean);
    if (new Set(normalized).size !== normalized.length) pushQuestionIssue(issues, question, "duplicate_true_false_statement", "error", "Mệnh đề đúng/sai bị lặp", "Có hai mệnh đề giống nhau trong cùng câu.", "Sửa mệnh đề lặp; không tự sinh khẳng định mới.");
    const pattern = items.map((item) => item.answer ? "Đ" : "S").join("");
    trueCount += items.filter((item) => item.answer).length;
    statementCount += items.length;
    if (items.length === 4 && (items.every((item) => item.answer) || items.every((item) => !item.answer))) pushQuestionIssue(issues, question, "uniform_true_false", "warning", "Tất cả mệnh đề cùng đáp án", "Bốn mệnh đề đều Đúng hoặc đều Sai, cần kiểm tra xem có chủ ý hay không.", "Giáo viên xác nhận nội dung; không tự đổi giá trị đúng/sai.");
    if (["ĐSĐS", "SĐSĐ"].includes(pattern)) pushQuestionIssue(issues, question, "robotic_true_false_pattern", "warning", "Mẫu đúng/sai lặp máy móc", `Khóa đáp án có mẫu ${pattern}.`, "Có thể sắp xếp lại mệnh đề và cập nhật khóa nếu mỗi câu có đủ hai Đúng, hai Sai.", { canAutoFix: items.filter((item) => item.answer).length === 2, fixKind: "rebalance_true_false" });
    if (items.length === 4) patterns.set(pattern, [...(patterns.get(pattern) || []), question.id]);
    const keyItems = (question.answer.match(/(?:Đúng|Sai|Đ|S)/gi) || []).length;
    if (question.answer.trim() && keyItems > 0 && keyItems !== items.length) pushQuestionIssue(issues, question, "true_false_key_length", "error", "Khóa đúng/sai không khớp", `Khóa đáp án có ${keyItems} giá trị nhưng câu có ${items.length} mệnh đề.`, "Cập nhật khóa đáp án theo đủ các ý a, b, c, d.");
  });
  for (const [pattern, ids] of patterns) if (ids.length > 1) issues.push({ id: issueId("duplicate_true_false_pattern", undefined, pattern), code: "duplicate_true_false_pattern", severity: "warning", section: sectionLabels.true_false, title: "Trùng mẫu đáp án đúng/sai", description: `${ids.length} câu cùng dùng mẫu ${pattern}.`, suggestedFix: "Xem xét sắp xếp lại mệnh đề nếu không làm thay đổi nội dung.", canAutoFix: true, fixKind: "rebalance_true_false" });
  if (statementCount >= 8 && Math.abs(trueCount - (statementCount - trueCount)) > Math.max(2, statementCount * 0.25)) issues.push({ id: issueId("unbalanced_true_false"), code: "unbalanced_true_false", severity: "warning", section: sectionLabels.true_false, title: "Tỉ lệ Đúng/Sai lệch nhiều", description: `Tổng ${statementCount} mệnh đề gồm ${trueCount} Đúng và ${statementCount - trueCount} Sai.`, suggestedFix: "Rà soát kiến thức; chỉ sắp xếp lại không thể thay đổi tỉ lệ này.", canAutoFix: false });
}

function auditShortAnswers(questions: ExamQuestion[], issues: ExamAuditIssue[], numericOnly: boolean) {
  questions.forEach((question) => {
    if (numericOnly && question.answer.trim() && !isValidNumericShortAnswer(question.answer)) pushQuestionIssue(issues, question, "invalid_numeric_answer", "error", "Đáp án trả lời ngắn không đúng dạng số", `Đáp án “${question.answer}” không phải số nguyên, số thập phân hoặc phân số đơn.`, "Đổi về đáp án số duy nhất nếu đề yêu cầu nhập số; nếu không, giáo viên cần xác nhận loại câu hỏi.");
    const expected = simpleExpressionValue(question.stem);
    const actual = parseNumeric(question.answer);
    if (expected !== null && actual !== null && Math.abs(expected - actual) > 1e-8) pushQuestionIssue(issues, question, "verified_answer_mismatch", "error", "Đáp án không khớp phép tính", `Kiểm tra độc lập phép tính đơn giản cho kết quả ${expected}, nhưng khóa đang ghi ${question.answer}.`, "Xem thay đổi và chỉ sửa đáp án sau khi giáo viên xác nhận.", { canAutoFix: true, fixKind: "correct_answer", confidence: "high", currentValue: question.answer, proposedValue: String(expected) });
  });
}

function auditDuplicates(exam: StructuredExam, issues: ExamAuditIssue[]) {
  const questions = new Map(exam.parts.flatMap((part) => part.questions).map((question) => [question.id, question]));
  findExamDuplicates(exam).forEach((finding) => {
    const first = questions.get(finding.firstQuestionId); const second = questions.get(finding.secondQuestionId);
    if (!first || !second) return;
    const blocking = finding.confidence === "exact" || finding.confidence === "high";
    const code = finding.confidence === "exact" ? "duplicate_question" : finding.confidence === "high" ? "near_duplicate_question" : "possible_similarity";
    issues.push({ id: issueId(code, second.id, first.id), code, severity: blocking ? "error" : "warning", questionId: second.id, questionNumber: second.number, section: sectionLabels[second.part], title: finding.confidence === "exact" ? "Câu hỏi bị trùng" : finding.confidence === "high" ? "Câu hỏi gần trùng với độ tin cậy cao" : "Hai câu có thể tương tự", description: `${sectionLabels[first.part]} Câu ${first.number} và ${sectionLabels[second.part]} Câu ${second.number} được phát hiện theo tiêu chí ${finding.reason}.`, suggestedFix: "Giáo viên rà soát và chỉ thay câu khi nội dung thực sự trùng; không tự xóa cảnh báo mức có thể tương tự.", canAutoFix: false, confidence: finding.confidence === "possible" ? "medium" : "high" });
  });
}

function auditCognitiveDistribution(exam: StructuredExam, config: ExamAuditConfig, issues: ExamAuditIssue[]) {
  const rates = config.requestedCognitiveRates || exam.metadata.requestedCognitiveRates;
  if (!rates) return;
  const questions = exam.parts.flatMap((part) => part.questions);
  if (!questions.length) return;
  const actual = Object.fromEntries(difficultyLabels.map((label) => [label, questions.filter((question) => (question.cognitiveLevel || question.difficulty) === label).length])) as Record<QuestionDifficulty, number>;
  const requestedRates = [rates.recognition, rates.understanding, rates.application, rates.advanced];
  difficultyLabels.forEach((label, index) => {
    const requested = Math.round(questions.length * requestedRates[index] / 100);
    if (Math.abs(actual[label] - requested) > 1) issues.push({ id: issueId("cognitive_distribution", undefined, String(index)), code: "cognitive_distribution", severity: "warning", title: `Phân bố ${label.toLowerCase()} lệch yêu cầu`, description: `Yêu cầu khoảng ${requested} câu; nhãn hiện tại có ${actual[label]} câu. Phân loại mức độ chỉ mang tính hỗ trợ.`, suggestedFix: "Giáo viên rà soát nhãn mức độ và điều chỉnh câu hỏi nếu cần.", canAutoFix: false, confidence: "medium", aiAssisted: true });
  });
}

export function auditStructuredExam(exam: StructuredExam, config: ExamAuditConfig = {}, semanticFindings: SemanticAuditFinding[] = []): ExamAuditResult {
  const startedAt = Date.now();
  const issues: ExamAuditIssue[] = [];
  const counts = expectedCounts(exam, config);
  const partsByType = new Map<ExamPartType, StructuredExam["parts"]>();
  exam.parts.forEach((part) => {
    if (!["multiple_choice", "true_false", "short_answer"].includes(part.type)) {
      issues.push({ id: issueId("unsupported_question_type", undefined, String(part.type)), code: "unsupported_question_type", severity: "error", section: part.title, title: "Loại câu hỏi chưa được hỗ trợ", description: `Phần “${part.title}” dùng loại câu hỏi chưa nhận diện được.`, suggestedFix: "Chuyển câu hỏi về trắc nghiệm, đúng/sai hoặc trả lời ngắn.", canAutoFix: false });
      return;
    }
    partsByType.set(part.type, [...(partsByType.get(part.type) || []), part]);
  });
  const expectedByType: Record<ExamPartType, number> | undefined = counts ? { multiple_choice: counts.partI, true_false: counts.partII, short_answer: counts.partIII } : undefined;

  duplicateExamQuestionIds(exam).forEach((id) => issues.push({ id: issueId("duplicate_question_id", id), code: "duplicate_question_id", severity: "error", title: "Mã câu hỏi bị trùng", description: `Mã ổn định “${id}” xuất hiện nhiều lần hoặc bị trống.`, suggestedFix: "Cấp lại mã duy nhất cho câu bị xung đột trước khi lưu hoặc xuất.", canAutoFix: false }));

  if (expectedByType) {
    const expectedSectionCount = Object.values(expectedByType).filter((count) => count > 0).length;
    const actualSectionCount = ([...partsByType.entries()] as [ExamPartType, StructuredExam["parts"]][]).filter(([type, parts]) => parts.some((part) => part.questions.length) && expectedByType[type] > 0).length;
    if (actualSectionCount !== expectedSectionCount) issues.push({ id: issueId("section_count_mismatch"), code: "section_count_mismatch", severity: "error", title: "Sai số phần của đề", description: `Yêu cầu ${expectedSectionCount} phần nhưng nhận diện được ${actualSectionCount} phần có câu hỏi.`, suggestedFix: "Bổ sung đúng các phần theo cấu trúc đã chọn.", canAutoFix: false });
  }

  for (const [type, parts] of partsByType) {
    if (parts.length > 1) issues.push({ id: issueId("duplicate_section", undefined, type), code: "duplicate_section", severity: "error", section: sectionLabels[type], title: "Phần đề bị lặp", description: `${sectionLabels[type]} xuất hiện ${parts.length} lần.`, suggestedFix: "Gộp các câu vào một phần duy nhất trước khi xuất.", canAutoFix: false });
  }

  for (const type of Object.keys(sectionLabels) as ExamPartType[]) {
    const questions = exam.parts.filter((part) => part.type === type).flatMap((part) => part.questions);
    const requested = expectedByType?.[type];
    if (requested !== undefined && questions.length !== requested) issues.push({ id: issueId("question_count_mismatch", undefined, type), code: "question_count_mismatch", severity: "error", section: sectionLabels[type], title: `Sai số câu ${sectionLabels[type]}`, description: `Yêu cầu ${requested} câu nhưng hiện có ${questions.length} câu.`, suggestedFix: questions.length < requested ? `Bổ sung ${requested - questions.length} câu đúng loại.` : `Rà soát ${questions.length - requested} câu vượt yêu cầu.`, canAutoFix: false });
    const seen = new Set<number>();
    questions.forEach((question, index) => {
      if (!Number.isInteger(question.number) || question.number < 1 || seen.has(question.number)) pushQuestionIssue(issues, question, "invalid_question_number", "error", "Số câu bị thiếu hoặc trùng", `Vị trí ${index + 1} trong ${sectionLabels[type]} có số câu không hợp lệ hoặc bị trùng.`, "Đánh số lại tuần tự trong phần.", { canAutoFix: true, fixKind: "renumber" });
      else if (question.number !== index + 1) pushQuestionIssue(issues, question, "question_number_gap", "warning", "Số câu không liên tục", `Sau Câu ${index} lại là Câu ${question.number}.`, "Đánh số lại tuần tự trong phần.", { canAutoFix: true, fixKind: "renumber" });
      seen.add(question.number);
      auditQuestionBasics(question, issues);
    });
    if (type === "multiple_choice") auditMultipleChoice(questions, issues, config.requireFourOptions !== false);
    if (type === "true_false") auditTrueFalse(questions, issues);
    if (type === "short_answer") auditShortAnswers(questions, issues, config.numericShortAnswers ?? /THPTQG|tốt nghiệp/i.test(exam.metadata.examStyle));
  }

  const allQuestions = exam.parts.flatMap((part) => part.questions);
  const actualTotal = allQuestions.reduce((sum, question) => sum + (Number.isFinite(question.score) ? question.score : 0), 0);
  const requestedTotal = config.totalScore ?? exam.metadata.totalScore;
  if (requestedTotal !== undefined && Math.abs(actualTotal - requestedTotal) > 0.01) issues.push({ id: issueId("total_score_mismatch"), code: "total_score_mismatch", severity: "error", title: "Tổng điểm không khớp", description: `Tổng điểm câu hỏi là ${Number(actualTotal.toFixed(3))}, trong khi cấu hình là ${requestedTotal}.`, suggestedFix: "Cân lại điểm theo tỉ lệ hiện có và sửa sai số làm tròn.", canAutoFix: allQuestions.length > 0, fixKind: "round_scores", currentValue: String(actualTotal), proposedValue: String(requestedTotal) });
  auditDuplicates(exam, issues);
  auditCognitiveDistribution(exam, config, issues);

  semanticFindings.forEach((finding) => {
    const question = allQuestions.find((item) => item.id === finding.questionId);
    issues.push({ id: issueId(finding.code, finding.questionId, "semantic"), code: finding.code, severity: finding.severity, questionId: finding.questionId, questionNumber: question?.number, section: question ? sectionLabels[question.part] : undefined, title: finding.title, description: `Cần giáo viên xác nhận: ${finding.description}`, suggestedFix: finding.suggestedFix, canAutoFix: false, confidence: finding.confidence, aiAssisted: true });
  });

  const accepted = new Set(config.acceptedWarningIds || []);
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning" && !accepted.has(issue.id)).length;
  const infoCount = issues.filter((issue) => issue.severity === "info").length;
  const readiness = errorCount ? "failed" : warningCount ? "review" : "ready";
  return {
    exam,
    issues,
    summary: {
      totalQuestions: allQuestions.length,
      errorCount,
      warningCount,
      infoCount,
      readiness,
      readinessLabel: readiness === "failed" ? "Chưa đạt" : readiness === "review" ? "Cần rà soát" : "Sẵn sàng xuất",
      contentHash: examContentHash(exam),
      durationMs: Date.now() - startedAt,
      deterministicIssueCount: issues.filter((issue) => !issue.aiAssisted).length,
      aiReviewedQuestionCount: new Set(semanticFindings.map((item) => item.questionId)).size,
    },
    auditedAt: new Date().toISOString(),
    auditVersion: EXAM_AUDIT_VERSION,
  };
}
