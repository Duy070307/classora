import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { BlueprintQuestionType, BlueprintSpecificationRow, BlueprintTopic, ExamBlueprint } from "@/lib/exam-source/types";
import type { GeneratedDocument } from "@/lib/types";

export type CognitiveKey = "recognition" | "comprehension" | "application" | "advancedApplication";
export type ComparisonStatus = "match" | "slight" | "mismatch" | "needs_confirmation";

export type BlueprintComparisonRow = {
  criterion: string;
  expected: string | number;
  actual: string | number;
  difference: string;
  status: ComparisonStatus;
};

export type BlueprintTopicComparison = {
  topic: string;
  expected: Record<CognitiveKey, number>;
  actual: Record<CognitiveKey, number>;
  status: ComparisonStatus;
};

export type BlueprintComparison = {
  rows: BlueprintComparisonRow[];
  topics: BlueprintTopicComparison[];
  overall: ComparisonStatus;
  comparedAt: string;
};

const cognitionKeys: CognitiveKey[] = ["recognition", "comprehension", "application", "advancedApplication"];
const emptyCounts = (): Record<CognitiveKey, number> => ({ recognition: 0, comprehension: 0, application: 0, advancedApplication: 0 });
const sumCounts = (topic: BlueprintTopic) => cognitionKeys.reduce((sum, key) => sum + Number(topic.counts[key] || 0), 0);
const round = (value: number) => Number(value.toFixed(2));
const id = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function cognitiveFromQuestion(question: ExamQuestion): CognitiveKey | null {
  const value = String(question.difficulty || "").toLocaleLowerCase("vi");
  if (value.includes("vận dụng cao")) return "advancedApplication";
  if (value.includes("vận dụng")) return "application";
  if (value.includes("thông hiểu")) return "comprehension";
  if (value.includes("nhận biết")) return "recognition";
  return null;
}

function questionTypeFromPart(part: ExamQuestion["part"]): Exclude<BlueprintQuestionType, "mixed"> {
  if (part === "true_false") return "true_false";
  if (part === "short_answer") return "short_answer";
  return "multiple_choice";
}

export function createBlankExamBlueprint(input: Partial<Pick<ExamBlueprint, "title" | "subject" | "grade" | "textbookSeries" | "examType" | "durationMinutes" | "totalScore">> = {}): ExamBlueprint {
  const now = new Date().toISOString();
  const topic: BlueprintTopic = { id: id(), topic: "Chủ đề 1", counts: { recognition: 6, comprehension: 7, application: 6, advancedApplication: 3 }, totalQuestions: 22, totalScore: 10, percentage: 100, questionTypes: ["multiple_choice", "true_false", "short_answer"], learningOutcomes: [] };
  const blueprint: ExamBlueprint = {
    id: id(), title: input.title || "Ma trận đề kiểm tra", sourceType: "matrix", subject: input.subject || "Toán", grade: input.grade || "12", textbookSeries: input.textbookSeries || "", examType: input.examType || "Kiểm tra", durationMinutes: input.durationMinutes || 90, totalScore: input.totalScore || 10,
    sections: [
      { id: id(), title: "PHẦN I. Trắc nghiệm nhiều lựa chọn", questionType: "multiple_choice", questionCount: 12, score: 3 },
      { id: id(), title: "PHẦN II. Đúng/Sai", questionType: "true_false", questionCount: 4, score: 4, statementsPerQuestion: 4 },
      { id: id(), title: "PHẦN III. Trả lời ngắn", questionType: "short_answer", questionCount: 6, score: 3 },
    ],
    topicDistribution: [topic], cognitiveDistribution: { ...topic.counts }, instructions: [], constraints: [], bankMode: "ai_new", confidence: { overall: 1, fields: {} }, warnings: [],
    metadata: { sourceType: "manual", createdAt: now, updatedAt: now },
  };
  blueprint.specificationRows = deriveSpecificationRows(blueprint);
  return blueprint;
}

export function normalizeWorkflowBlueprint(source: ExamBlueprint): ExamBlueprint {
  const now = new Date().toISOString();
  const blueprint: ExamBlueprint = {
    ...source,
    id: source.id || id(),
    title: source.title || `Ma trận ${source.subject || "đề kiểm tra"} ${source.grade || ""}`.trim(),
    sections: source.sections.map((section) => ({ ...section, id: section.id || id() })),
    topicDistribution: source.topicDistribution.map((topic) => ({ ...topic, id: topic.id || id(), counts: { ...topic.counts }, learningOutcomes: [...(topic.learningOutcomes || [])] })),
    metadata: source.metadata || { sourceType: source.sourceType === "previous_exam" ? "existing_exam" : source.sourceType === "matrix" || source.sourceType === "specification" ? "uploaded_matrix" : "manual", createdAt: now, updatedAt: now },
  };
  blueprint.specificationRows = source.specificationRows?.map((row) => ({ ...row, id: row.id || id() })) || deriveSpecificationRows(blueprint);
  return blueprint;
}

export function deriveSpecificationRows(blueprint: ExamBlueprint): BlueprintSpecificationRow[] {
  const fallbackType = blueprint.sections.find((section) => section.questionType !== "mixed")?.questionType;
  return blueprint.topicDistribution.flatMap((topic) => cognitionKeys.flatMap((level) => {
    const count = Number(topic.counts[level] || 0);
    if (!count) return [];
    const type = (topic.questionTypes?.find((value) => ["multiple_choice", "true_false", "short_answer", "essay"].includes(value)) || fallbackType || "multiple_choice") as Exclude<BlueprintQuestionType, "mixed">;
    const topicQuestions = Number(topic.totalQuestions ?? sumCounts(topic)) || 1;
    const score = round((Number(topic.totalScore || 0) * count) / topicQuestions);
    return [{ id: id(), topicId: topic.id, topic: topic.topic, knowledgeUnit: topic.subtopic || topic.knowledgeContent || "", learningOutcome: topic.learningOutcomes?.join("; ") || "Giáo viên bổ sung yêu cầu cần đạt", cognitiveLevel: level, questionType: type, questionCount: count, score, percentage: round((Number(topic.percentage || 0) * count) / topicQuestions), note: topic.notes, teacherConfirmed: false }];
  }));
}

export function specificationMatrixImpact(blueprint: ExamBlueprint, rows: BlueprintSpecificationRow[]) {
  const matrixQuestions = blueprint.topicDistribution.reduce((sum, topic) => sum + Number(topic.totalQuestions ?? sumCounts(topic)), 0);
  const matrixScore = round(blueprint.topicDistribution.reduce((sum, topic) => sum + Number(topic.totalScore || 0), 0));
  const specificationQuestions = rows.reduce((sum, row) => sum + Number(row.questionCount || 0), 0);
  const specificationScore = round(rows.reduce((sum, row) => sum + Number(row.score || 0), 0));
  return { changed: matrixQuestions !== specificationQuestions || Math.abs(matrixScore - specificationScore) > 0.01, matrixQuestions, specificationQuestions, matrixScore, specificationScore };
}

export function applySpecificationToMatrix(blueprint: ExamBlueprint, rows: BlueprintSpecificationRow[]): ExamBlueprint {
  const topics = blueprint.topicDistribution.map((topic) => {
    const related = rows.filter((row) => row.topicId === topic.id || row.topic === topic.topic);
    const counts = emptyCounts(); related.forEach((row) => { counts[row.cognitiveLevel] += Number(row.questionCount || 0); });
    return { ...topic, counts, totalQuestions: related.reduce((sum, row) => sum + Number(row.questionCount || 0), 0), totalScore: round(related.reduce((sum, row) => sum + Number(row.score || 0), 0)), percentage: round(related.reduce((sum, row) => sum + Number(row.percentage || 0), 0)), learningOutcomes: [...new Set(related.map((row) => row.learningOutcome).filter(Boolean))] };
  });
  return { ...blueprint, topicDistribution: topics, cognitiveDistribution: cognitionFromTopics(topics), specificationRows: rows, metadata: blueprint.metadata ? { ...blueprint.metadata, updatedAt: new Date().toISOString() } : blueprint.metadata };
}

export function cognitionFromTopics(topics: BlueprintTopic[]) {
  const result = emptyCounts(); topics.forEach((topic) => cognitionKeys.forEach((key) => { result[key] += Number(topic.counts[key] || 0); }));
  return result;
}

export function blueprintFromExam(exam: StructuredExam, sourceExamId?: string): ExamBlueprint {
  const now = new Date().toISOString();
  const grouped = new Map<string, BlueprintTopic>();
  for (const question of exam.parts.flatMap((part) => part.questions)) {
    const topicName = question.topic?.trim() || "Chưa xác định chủ đề";
    const topic = grouped.get(topicName) || { id: id(), topic: topicName, counts: emptyCounts(), totalQuestions: 0, totalScore: 0, percentage: 0, questionTypes: [], learningOutcomes: [] };
    const level = cognitiveFromQuestion(question);
    if (level) topic.counts[level] = Number(topic.counts[level] || 0) + 1;
    topic.totalQuestions = Number(topic.totalQuestions || 0) + 1; topic.totalScore = round(Number(topic.totalScore || 0) + Number(question.score || 0));
    topic.questionTypes = [...new Set([...(topic.questionTypes || []), questionTypeFromPart(question.part)])]; grouped.set(topicName, topic);
  }
  const topics = [...grouped.values()].map((topic) => ({ ...topic, percentage: exam.metadata.totalScore ? round(Number(topic.totalScore || 0) / exam.metadata.totalScore * 100) : 0 }));
  const blueprint: ExamBlueprint = {
    id: id(), title: `Ma trận suy ra từ ${exam.metadata.title}`, sourceType: "previous_exam", sourceName: exam.metadata.title, subject: exam.metadata.subject, grade: exam.metadata.grade, examType: exam.metadata.examStyle, durationMinutes: Number(String(exam.metadata.duration).match(/\d+/)?.[0] || 0), totalScore: exam.metadata.totalScore,
    sections: exam.parts.map((part) => ({ id: id(), title: part.title, questionType: part.type, questionCount: part.questions.length, score: round(part.questions.reduce((sum, question) => sum + Number(question.score || 0), 0)), ...(part.type === "true_false" ? { statementsPerQuestion: part.questions[0]?.trueFalseItems?.length || 4 } : {}) })),
    topicDistribution: topics, cognitiveDistribution: cognitionFromTopics(topics), confidence: { overall: topics.some((topic) => topic.topic === "Chưa xác định chủ đề") ? 0.65 : 0.92, fields: {} }, warnings: topics.some((topic) => topic.topic === "Chưa xác định chủ đề") ? [{ code: "topic_needs_review", message: "Một số câu chưa có chủ đề; giáo viên cần phân loại.", severity: "warning" }] : [],
    metadata: { sourceType: "existing_exam", sourceExamId, createdAt: now, updatedAt: now, linkedExamHash: examStructureHash(exam) },
  };
  blueprint.specificationRows = deriveSpecificationRows(blueprint);
  return blueprint;
}

export function examStructureHash(exam: StructuredExam) {
  const text = JSON.stringify(exam.parts.map((part) => [part.type, part.questions.map((question) => [question.id, question.topic, question.difficulty, question.score])]));
  let hash = 2166136261; for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16);
}

function statusForDifference(difference: number, slightThreshold = 1): ComparisonStatus { return difference === 0 ? "match" : Math.abs(difference) <= slightThreshold ? "slight" : "mismatch"; }
function statusRank(status: ComparisonStatus) { return status === "mismatch" ? 3 : status === "needs_confirmation" ? 2 : status === "slight" ? 1 : 0; }

export function compareBlueprintWithExam(blueprint: ExamBlueprint, exam: StructuredExam): BlueprintComparison {
  const expectedQuestions = blueprint.sections.reduce((sum, section) => sum + Number(section.questionCount || 0), 0);
  const actualQuestions = exam.parts.reduce((sum, part) => sum + part.questions.length, 0);
  const expectedScore = Number(blueprint.totalScore || 0); const actualScore = round(exam.parts.flatMap((part) => part.questions).reduce((sum, question) => sum + Number(question.score || 0), 0));
  const actualByType = new Map(exam.parts.map((part) => [part.type, part.questions.length]));
  const sectionMismatch = blueprint.sections.reduce((sum, section) => sum + Math.abs(section.questionCount - Number(actualByType.get(section.questionType === "essay" ? "short_answer" : section.questionType as "multiple_choice" | "true_false" | "short_answer") || 0)), 0);
  const derived = blueprintFromExam(exam); const expectedCognition = cognitionFromTopics(blueprint.topicDistribution); const actualCognition = cognitionFromTopics(derived.topicDistribution);
  const cognitiveDifference = cognitionKeys.reduce((sum, key) => sum + Math.abs(expectedCognition[key] - actualCognition[key]), 0);
  const rows: BlueprintComparisonRow[] = [
    { criterion: "Số câu", expected: expectedQuestions, actual: actualQuestions, difference: String(actualQuestions - expectedQuestions), status: statusForDifference(actualQuestions - expectedQuestions) },
    { criterion: "Tổng điểm", expected: expectedScore, actual: actualScore, difference: String(round(actualScore - expectedScore)), status: statusForDifference(round(actualScore - expectedScore), 0.25) },
    { criterion: "Dạng câu hỏi", expected: blueprint.sections.map((section) => `${section.title}: ${section.questionCount}`).join("; "), actual: exam.parts.map((part) => `${part.title}: ${part.questions.length}`).join("; "), difference: sectionMismatch ? `Lệch ${sectionMismatch}` : "0", status: statusForDifference(sectionMismatch) },
    { criterion: "Mức độ nhận thức", expected: cognitionKeys.map((key) => expectedCognition[key]).join("/"), actual: cognitionKeys.map((key) => actualCognition[key]).join("/"), difference: cognitiveDifference ? `Lệch ${cognitiveDifference}` : "0", status: derived.warnings.some((warning) => warning.code === "topic_needs_review") ? "needs_confirmation" : statusForDifference(cognitiveDifference) },
  ];
  const topicNames = [...new Set([...blueprint.topicDistribution.map((topic) => topic.topic), ...derived.topicDistribution.map((topic) => topic.topic)])];
  const topics = topicNames.map((topicName) => {
    const expected = { ...emptyCounts(), ...(blueprint.topicDistribution.find((topic) => topic.topic === topicName)?.counts || {}) } as Record<CognitiveKey, number>;
    const actual = { ...emptyCounts(), ...(derived.topicDistribution.find((topic) => topic.topic === topicName)?.counts || {}) } as Record<CognitiveKey, number>;
    const difference = cognitionKeys.reduce((sum, key) => sum + Math.abs(Number(expected[key] || 0) - Number(actual[key] || 0)), 0);
    return { topic: topicName, expected, actual, status: topicName === "Chưa xác định chủ đề" ? "needs_confirmation" as const : statusForDifference(difference) };
  });
  rows.push({ criterion: "Chủ đề", expected: blueprint.topicDistribution.length, actual: derived.topicDistribution.length, difference: topics.some((topic) => topic.status !== "match") ? "Có chênh lệch" : "0", status: topics.reduce<ComparisonStatus>((result, topic) => statusRank(topic.status) > statusRank(result) ? topic.status : result, "match") });
  const overall = [...rows.map((row) => row.status), ...topics.map((topic) => topic.status)].reduce<ComparisonStatus>((result, status) => statusRank(status) > statusRank(result) ? status : result, "match");
  return { rows, topics, overall, comparedAt: new Date().toISOString() };
}

export function suggestCognitiveLevel(text: string): { level: CognitiveKey; reason: string; confidence: "high" | "medium" | "low" } {
  const normalized = text.toLocaleLowerCase("vi");
  if (/chứng minh|đánh giá|thiết kế|đề xuất|tổng hợp/.test(normalized)) return { level: "advancedApplication", reason: "Yêu cầu tạo lập, đánh giá hoặc chứng minh trong tình huống phức hợp.", confidence: "medium" };
  if (/vận dụng|giải quyết|tính toán|thực hiện|áp dụng/.test(normalized)) return { level: "application", reason: "Yêu cầu áp dụng kiến thức để thực hiện nhiệm vụ.", confidence: "medium" };
  if (/giải thích|so sánh|phân tích|mô tả|phân biệt/.test(normalized)) return { level: "comprehension", reason: "Động từ yêu cầu diễn giải hoặc phân tích ý nghĩa.", confidence: "medium" };
  return { level: "recognition", reason: "Chưa thấy động từ thể hiện yêu cầu vận dụng cao hơn; giáo viên cần xác nhận.", confidence: "low" };
}

export function blueprintToDocument(blueprint: ExamBlueprint, comparison?: BlueprintComparison): GeneratedDocument {
  const rows = blueprint.topicDistribution.map((topic, index) => `${index + 1}. ${topic.topic}: ${sumCounts(topic)} câu, ${topic.totalScore || 0} điểm, ${topic.percentage || 0}%`);
  return { id: blueprint.id || id(), title: blueprint.title || "Ma trận đề", type: "matrix", createdAt: blueprint.metadata?.createdAt || new Date().toISOString(), folder: "Đề kiểm tra", content: `MA TRẬN & BẢNG ĐẶC TẢ\nMôn: ${blueprint.subject || ""}\nKhối: ${blueprint.grade || ""}\nThời gian: ${blueprint.durationMinutes || 0} phút\nTổng điểm: ${blueprint.totalScore || 0}\n\n${rows.join("\n")}${comparison ? `\n\nĐỐI CHIẾU: ${comparison.overall}` : ""}`, examBlueprint: blueprint };
}
