import type { ExamQuestion } from "@/lib/exam-types";

const answerLetters = ["A", "B", "C", "D"] as const;
type AnswerLetter = typeof answerLetters[number];

export type ExamQualityValidation = { valid: true } | { valid: false; reason: string };

function normalizedOption(value: string) {
  return normalizeTeacherMathNotation(value).normalize("NFKD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase().replace(/\s+/g, " ").trim();
}

export function normalizeTeacherMathNotation(value: string) {
  let output = String(value || "")
    .replace(/\+\s*infinity\b/gi, "+∞")
    .replace(/-\s*infinity\b/gi, "−∞")
    .replace(/\binfinity\b/gi, "∞");
  let previous = "";
  while (previous !== output) {
    previous = output;
    output = output.replace(/\bsqrt\s*\(([^()]*)\)/gi, (_, expression: string) => `√(${expression.replace(/\s*([+\-*/=])\s*/g, "$1")})`);
  }
  return output.replace(/\bln\s*\(/gi, "ln(").replace(/\s+([,;)])/g, "$1");
}

export function validateMultipleChoiceOptions(question: ExamQuestion): ExamQualityValidation {
  if (!question.options || !answerLetters.every((letter) => question.options?.[letter]?.trim())) return { valid: false, reason: "missing_options" };
  if (!answerLetters.includes(question.answer.trim().toUpperCase() as AnswerLetter)) return { valid: false, reason: "invalid_correct_answer" };
  const values = answerLetters.map((letter) => normalizedOption(question.options?.[letter] || ""));
  if (new Set(values).size !== 4) return { valid: false, reason: "duplicate_options" };
  if (values.some((value) => /tat ca (?:cac )?dap an|ca [a-d] deu dung|all of the above/i.test(value))) return { valid: false, reason: "unsafe_all_answers_option" };
  return { valid: true };
}

function stemHash(value: string) {
  return [...value].reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) >>> 0, 7);
}

function stripHardcodedAnswerLetter(explanation: string) {
  return explanation
    .replace(/(đáp án|phương án)\s+[A-D](?=\s|[.,:;]|$)/gi, "$1 đúng")
    .replace(/chọn\s+[A-D](?=\s|[.,:;]|$)/gi, "chọn phương án đúng");
}

export function balanceMultipleChoiceAnswers(questions: ExamQuestion[]) {
  if (!questions.length) return questions;
  const cycle: AnswerLetter[] = ["A", "C", "B", "D"];
  const offset = stemHash(questions.map((question) => question.stem).join("|")) % 4;
  return questions.map((question, index) => {
    if (!question.options) return question;
    const current = question.answer.trim().toUpperCase() as AnswerLetter;
    if (!answerLetters.includes(current)) return question;
    const target = cycle[(index + offset) % cycle.length];
    const remainingNew = answerLetters.filter((letter) => letter !== target);
    const distractors = answerLetters.filter((letter) => letter !== current).map((letter) => question.options?.[letter] || "").sort((left, right) => normalizedOption(left).localeCompare(normalizedOption(right), "vi"));
    const rotation = stemHash(question.stem) % distractors.length;
    const rotatedDistractors = [...distractors.slice(rotation), ...distractors.slice(0, rotation)];
    const options = { A: "", B: "", C: "", D: "" } as Record<AnswerLetter, string>;
    options[target] = question.options[current];
    remainingNew.forEach((letter, itemIndex) => { options[letter] = rotatedDistractors[itemIndex]; });
    return { ...question, options, answer: target, explanation: stripHardcodedAnswerLetter(question.explanation) };
  });
}

export const preferredTrueFalsePatterns = [
  [true, false, true, false],
  [false, true, true, false],
  [true, true, false, false],
  [false, true, false, true],
  [true, false, false, true],
  [false, false, true, true],
] as const;

export function targetTrueFalsePatterns(count: number) {
  return Array.from({ length: count }, (_, index) => [...preferredTrueFalsePatterns[index % preferredTrueFalsePatterns.length]]);
}

export function balanceTrueFalsePatterns(questions: ExamQuestion[]) {
  const patterns = targetTrueFalsePatterns(questions.length);
  return questions.map((question, index) => {
    const items = question.trueFalseItems || [];
    const trueItems = items.filter((item) => item.answer);
    const falseItems = items.filter((item) => !item.answer);
    if (trueItems.length !== 2 || falseItems.length !== 2) return question;
    const target = patterns[index];
    let trueIndex = 0;
    let falseIndex = 0;
    const labels = ["a", "b", "c", "d"] as const;
    const reordered = target.map((answer, itemIndex) => {
      const source = answer ? trueItems[trueIndex++] : falseItems[falseIndex++];
      return { ...source, label: labels[itemIndex] };
    });
    return {
      ...question,
      trueFalseItems: reordered,
      answer: reordered.map((item) => `${item.label} ${item.answer ? "Đúng" : "Sai"}`).join("; "),
    };
  });
}

export function validateTrueFalseQuality(question: ExamQuestion): ExamQualityValidation {
  if (!question.trueFalseItems || question.trueFalseItems.length !== 4) return { valid: false, reason: "invalid_true_false_items" };
  const trueCount = question.trueFalseItems.filter((item) => item.answer).length;
  if (trueCount !== 2) return { valid: false, reason: "unbalanced_true_false_item" };
  return { valid: true };
}

export function normalizeNumericShortAnswer(value: string) {
  return String(value || "")
    .trim()
    .replace(/^\$|\$$/g, "")
    .replace(/^\\\(|\\\)$/g, "")
    .replace(/\\frac\s*\{\s*([+-]?\d+)\s*\}\s*\{\s*([+-]?\d+)\s*\}/g, "$1/$2")
    .replace(/\s+/g, "");
}

export function validateShortAnswerNumeric(question: ExamQuestion): ExamQualityValidation {
  const answer = normalizeNumericShortAnswer(question.answer);
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|\d+\/\d+)$/.test(answer)) return { valid: false, reason: "non_numeric_short_answer" };
  if (/\b(?:tập xác định|khoảng đồng biến|khoảng nghịch biến|chọn mệnh đề|viết phương trình|nêu nhận xét|đúng\s*\/\s*sai)\b/i.test(question.stem)) return { valid: false, reason: "non_numeric_question_type" };
  if (!/(?:tính|giá trị|bao nhiêu|số\s+(?:điểm|nghiệm|cực trị|(?:đường\s+)?tiệm cận)|tổng|hiệu|hoành độ|tung độ|hệ số|GTLN|GTNN|giá trị\s+(?:lớn nhất|nhỏ nhất)|f\s*\(|f['’]\s*\()/i.test(question.stem)) return { valid: false, reason: "missing_numeric_intent" };
  if (!question.explanation.trim() || !/\d/.test(question.explanation)) return { valid: false, reason: "numeric_answer_not_supported_by_explanation" };
  return { valid: true };
}

const missingVisualPattern = /(?:dựa\s+vào|quan\s+sát|nhìn\s+vào|xét|cho)\s+(?:đồ\s*thị|hình(?:\s+vẽ)?|bảng(?:\s+biến\s+thiên)?|biểu\s*đồ)|(?:đồ\s*thị|hình\s*vẽ|hình|bảng\s+biến\s+thiên|bảng|biểu\s*đồ)\s+(?:dưới\s+đây|sau\s+đây|sau|bên\s+dưới|bên\s+cạnh)|theo\s+biểu\s*đồ|như\s+hình\s*vẽ/i;

export function validateVisualDependency(question: Pick<ExamQuestion, "stem">): ExamQualityValidation {
  return missingVisualPattern.test(question.stem)
    ? { valid: false, reason: "missing_visual_asset" }
    : { valid: true };
}

export function normalizeExamQuestionMath(question: ExamQuestion): ExamQuestion {
  const answer = question.part === "short_answer" ? normalizeNumericShortAnswer(question.answer) : normalizeTeacherMathNotation(question.answer);
  return {
    ...question,
    stem: normalizeTeacherMathNotation(question.stem),
    answer,
    explanation: normalizeTeacherMathNotation(question.explanation),
    options: question.options ? Object.fromEntries(answerLetters.map((letter) => [letter, normalizeTeacherMathNotation(question.options?.[letter] || "")])) as Record<AnswerLetter, string> : undefined,
    trueFalseItems: question.trueFalseItems?.map((item) => ({ ...item, text: normalizeTeacherMathNotation(item.text) })),
  };
}
