export type GenerationSource = "system" | "user" | "both" | "ai" | "local";

export type GenerationRequestContext = {
  subject: string;
  canonicalSubject: string;
  grade: string;
  topic: string;
  canonicalTopic: string;
  subtopics: string[];
  excludedTopics: string[];
  questionType: string;
  questionCount: number;
  bookSeries: string;
  source: GenerationSource;
  allowAiSupplement: boolean;
  allowRelatedTopics: boolean;
  difficultyDistribution: Record<string, number>;
  toolType: string;
  userPrompt: string;
  language: "vi";
};

export function comparisonText(value: unknown) {
  return String(value ?? "").normalize("NFC").trim().toLocaleLowerCase("vi-VN").replace(/\s+/g, " ");
}

export function searchText(value: unknown) {
  return comparisonText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

export function canonicalizeSubject(value: unknown) {
  const key = searchText(value);
  const aliases: Record<string, string> = {
    "vat ly": "Vật lí", "vat li": "Vật lí", "vật lý": "Vật lí", "vật lí": "Vật lí",
    "hoa hoc": "Hóa học", "hoá học": "Hóa học", "hóa học": "Hóa học",
    "toan": "Toán", "ngu van": "Ngữ văn", "lich su": "Lịch sử", "dia li": "Địa lí", "dia ly": "Địa lí",
  };
  return aliases[key] ?? String(value ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
}

export function canonicalizeGrade(value: unknown) {
  const normalized = comparisonText(value).replace(/^lớp\s*/i, "").replace(/^lop\s*/i, "");
  const number = normalized.match(/\d{1,2}/)?.[0];
  return number ?? normalized;
}

export function canonicalizeTopic(value: unknown) {
  return searchText(value).replace(/\bohm\b/g, "ohm").replace(/\bom\b/g, "ohm");
}

export function createGenerationRequestContext(input: Record<string, unknown>, toolType = "generic"): GenerationRequestContext {
  const subject = canonicalizeSubject(input.subject);
  const topic = String(input.topic ?? input.lessonName ?? input.assignmentType ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
  const userPrompt = String(input.extraRequirements ?? input.userPrompt ?? "").trim();
  const derivedExclusions: string[] = [];
  if (/không hỏi\s+định luật i\s+và\s+iii/i.test(userPrompt)) derivedExclusions.push("định luật I Newton", "định luật III Newton", "quán tính", "lực và phản lực");
  if (/chỉ.*lý thuyết|chỉ.*lí thuyết/i.test(userPrompt)) derivedExclusions.push("bài tập tính toán");
  if (/chỉ.*tính toán/i.test(userPrompt)) derivedExclusions.push("câu hỏi định nghĩa thuần túy");
  return {
    subject,
    canonicalSubject: searchText(subject),
    grade: canonicalizeGrade(input.grade),
    topic,
    canonicalTopic: canonicalizeTopic(topic),
    subtopics: Array.isArray(input.subtopics) ? input.subtopics.map(String) : [],
    excludedTopics: [...(Array.isArray(input.excludedTopics) ? input.excludedTopics.map(String) : []), ...derivedExclusions],
    questionType: String(input.questionType ?? input.examType ?? "").trim(),
    questionCount: Number(input.questionCount ?? input.multipleChoiceCount ?? input.exerciseCount ?? 0) || 0,
    bookSeries: String(input.bookSeries ?? "").trim(),
    source: (["system", "user", "both", "ai", "local"].includes(String(input.source)) ? String(input.source) : "ai") as GenerationSource,
    allowAiSupplement: input.allowAiSupplement === true,
    allowRelatedTopics: input.allowRelatedTopics === true,
    difficultyDistribution: typeof input.difficultyDistribution === "object" && input.difficultyDistribution ? input.difficultyDistribution as Record<string, number> : {},
    toolType,
    userPrompt,
    language: "vi",
  };
}
