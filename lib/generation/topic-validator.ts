import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { GenerationRequestContext } from "@/lib/generation/request-context";
import { canonicalizeGrade, canonicalizeSubject, canonicalizeTopic, searchText } from "@/lib/generation/request-context";
import { findTopicNode } from "@/lib/generation/topic-taxonomy";

export type TopicValidationItem = {
  content: string;
  options?: Record<string, string>;
  answer?: string;
  explanation?: string;
  topic?: string;
  subject?: string;
  grade?: string;
  questionType?: string;
  id?: string;
};

export type RejectedTopicItem = { item: TopicValidationItem; reasons: string[]; relevanceScore: number };

const genericPlaceholderPatterns = [
  /trong chủ đề .+ yêu cầu nào phù hợp nhất/i,
  /phát biểu nào sau đây đúng về nội dung bài học/i,
  /kiến thức nào thuộc chủ đề này/i,
  /theo bài học,? đáp án nào đúng/i,
];

function termPresent(text: string, term: string) {
  const haystack = searchText(text);
  const needle = searchText(term);
  if (needle.length <= 3 && /^[a-z0-9]+$/.test(needle)) return new RegExp(`(?:^|\\s)${needle}(?:$|\\s|[.,;:!?=()])`, "i").test(haystack);
  return haystack.includes(needle);
}

export function validateTopicItem(context: GenerationRequestContext, item: TopicValidationItem) {
  const reasons: string[] = [];
  const node = findTopicNode(context.subject, context.grade, context.topic);
  const combined = [item.content, Object.values(item.options || {}).join(" "), item.answer, item.explanation].filter(Boolean).join(" ");
  let score = 0.45;

  if (item.subject && canonicalizeSubject(item.subject) !== context.subject) reasons.push("Sai môn học");
  else score += 0.1;
  if (item.grade && canonicalizeGrade(item.grade) !== context.grade) reasons.push("Sai lớp");
  else score += 0.1;
  if (item.topic) {
    const actual = canonicalizeTopic(item.topic);
    const expected = context.canonicalTopic;
    if (actual === expected || actual.includes(expected) || expected.includes(actual)) score += 0.15;
    else if (!context.allowRelatedTopics) reasons.push("Sai chủ đề khai báo");
  }

  if (genericPlaceholderPatterns.some((pattern) => pattern.test(combined))) reasons.push("Câu hỏi chung chung, không kiểm tra kiến thức cụ thể");
  const explicitExclusions = context.excludedTopics.filter((term) => termPresent(combined, term));
  if (explicitExclusions.length) {
    score -= Math.min(0.7, explicitExclusions.length * 0.35);
    reasons.push(`Vi phạm phạm vi giáo viên loại trừ: ${explicitExclusions.join(", ")}`);
  }
  if (/chỉ.*lý thuyết|chỉ.*lí thuyết/i.test(context.userPrompt) && /\b(tính|tính toán|bao nhiêu)\b|\d+\s*(v|a|ω|n|kg|m\/s)/i.test(combined)) {
    reasons.push("Yêu cầu chỉ lý thuyết nhưng nội dung có bài tính toán");
  }
  if (/chỉ.*tính toán/i.test(context.userPrompt) && /(là gì|nêu định nghĩa|phát biểu định nghĩa|khái niệm nào)/i.test(combined)) {
    reasons.push("Yêu cầu bài tập tính toán nhưng nội dung là câu định nghĩa thuần túy");
  }
  if (node) {
    const allowedMatches = node.allowedTerms.filter((term) => termPresent(combined, term));
    const relatedMatches = (node.relatedTerms || []).filter((term) => termPresent(combined, term));
    const forbiddenMatches = node.forbiddenTerms.filter((term) => termPresent(combined, term));
    const declaredTopicMatches = Boolean(item.topic && canonicalizeTopic(item.topic) === context.canonicalTopic);
    const allowDeclaredFunctionTopic = context.subject === "Toán" && context.grade === "12" && context.canonicalTopic === canonicalizeTopic("hàm số") && declaredTopicMatches;
    score += Math.min(0.25, allowedMatches.length * 0.13);
    score += Math.min(0.05, relatedMatches.length * 0.025);
    score -= Math.min(0.7, forbiddenMatches.length * 0.35);
    if (!allowedMatches.length && !allowDeclaredFunctionTopic) reasons.push("Không có khái niệm cốt lõi của chủ đề");
    if (forbiddenMatches.length) reasons.push(`Có khái niệm ngoài phạm vi: ${forbiddenMatches.join(", ")}`);
  } else if (termPresent(combined, context.topic)) {
    score += 0.25;
  } else if (item.topic && canonicalizeTopic(item.topic) === context.canonicalTopic) {
    score += 0.15;
  } else {
    const teacherTerms = searchText(context.topic).split(/\s+/).filter((term) => term.length >= 3);
    const matchedTerms = teacherTerms.filter((term) => searchText(combined).includes(term));
    const obviouslyUnrelated = context.subject === "Vật lí"
      ? ["xác suất", "đạo hàm", "ester", "pH", "phản ứng hóa học"].filter((term) => termPresent(combined, term))
      : context.subject === "Toán"
        ? ["định luật newton", "định luật ohm", "phản ứng hóa học", "nhiệt lượng"].filter((term) => termPresent(combined, term))
        : [];
    if (matchedTerms.length) score += Math.min(0.25, matchedTerms.length * 0.12);
    else if (obviouslyUnrelated.length) reasons.push(`Nội dung rõ ràng ngoài môn/chủ đề: ${obviouslyUnrelated.join(", ")}`);
    else if (item.topic && canonicalizeTopic(item.topic) === context.canonicalTopic) score += 0.15;
    else reasons.push("Không xác định được liên hệ với chủ đề giáo viên nhập");
  }

  if (/trắc nghiệm/i.test(context.questionType)) {
    if (!item.options || !["A", "B", "C", "D"].every((key) => item.options?.[key]?.trim())) reasons.push("Thiếu phương án A/B/C/D");
    if (!item.answer || !["A", "B", "C", "D"].includes(item.answer.trim().toUpperCase())) reasons.push("Đáp án trắc nghiệm không hợp lệ");
  }
  score = Math.max(0, Math.min(1, score));
  if (score < 0.75) reasons.push("Độ liên quan dưới ngưỡng an toàn");
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)], relevanceScore: score };
}

export function validateTopicItems(context: GenerationRequestContext, items: TopicValidationItem[]) {
  const validItems: TopicValidationItem[] = [];
  const rejectedItems: RejectedTopicItem[] = [];
  for (const item of items) {
    const result = validateTopicItem(context, item);
    if (result.valid) validItems.push(item);
    else rejectedItems.push({ item, reasons: result.reasons, relevanceScore: result.relevanceScore });
  }
  return {
    validItems,
    rejectedItems,
    warnings: rejectedItems.length ? [`Đã loại ${rejectedItems.length} nội dung không bám sát chủ đề.`] : [],
    relevanceScore: items.length ? validItems.length / items.length : 0,
  };
}

export function validateGeneratedTopicText(context: GenerationRequestContext, content: string) {
  if (!context.topic) return { valid: true, reasons: [] as string[], relevanceScore: 1 };
  return validateTopicItem(context, { content, topic: context.topic, subject: context.subject, grade: context.grade });
}

function examQuestionToItem(question: ExamQuestion, subject: string, grade: string): TopicValidationItem {
  const statementText = question.trueFalseItems?.map((item) => `${item.label}) ${item.text}`).join(" ") || "";
  return { id: question.id, content: [question.stem, statementText].filter(Boolean).join(" "), options: question.options, answer: question.answer, explanation: question.explanation, topic: question.topic, subject, grade, questionType: question.part };
}

export function filterStructuredExamByTopic(exam: StructuredExam, context: GenerationRequestContext) {
  const rejected: RejectedTopicItem[] = [];
  const parts = exam.parts.map((part) => ({
    ...part,
    questions: part.questions.filter((question) => {
      const item = examQuestionToItem(question, exam.metadata.subject, exam.metadata.grade);
      const result = validateTopicItem({ ...context, questionType: part.type === "multiple_choice" ? "Trắc nghiệm" : context.questionType }, item);
      if (!result.valid) rejected.push({ item, reasons: result.reasons, relevanceScore: result.relevanceScore });
      return result.valid;
    }).map((question, index) => ({ ...question, number: index + 1 })),
  })).filter((part) => part.questions.length);
  return { exam: { ...exam, parts }, rejected, validCount: parts.reduce((sum, part) => sum + part.questions.length, 0) };
}
