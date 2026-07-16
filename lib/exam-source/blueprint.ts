import type { ExamInput } from "@/lib/types";
import type { ExamPartType, StructuredExam } from "@/lib/exam-types";
import type { BlueprintQuestionType, BlueprintSection, BlueprintTopic, BlueprintValidation, BlueprintWarning, ExamBlueprint, ExamSourceType, ExtractedTable, ParsedExamSource } from "@/lib/exam-source/types";

function numberFrom(value: unknown) {
  const match = String(value ?? "").replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase().replace(/\s+/g, " ").trim();
}

function sectionDefaults(source: ParsedExamSource): BlueprintSection[] {
  if (source.previousExam?.parts.length) return source.previousExam.parts.map((part, index) => ({
    id: `section-${index + 1}`,
    title: part.title || `Phần ${index + 1}`,
    questionType: part.type,
    questionCount: part.questions.length,
    score: Number(part.questions.reduce((sum, question) => sum + Math.max(0, question.score || 0), 0).toFixed(2)),
    ...(part.type === "true_false" ? { statementsPerQuestion: 4 } : {}),
  }));
  const text = normalize(source.text);
  const values = [
    { type: "multiple_choice" as const, title: "PHẦN I. Trắc nghiệm nhiều lựa chọn", patterns: [/phan i\b[^\n]*?(\d+)\s*cau/, /(?:tnkq|trac nghiem)[^\n]{0,40}?(\d+)\s*cau/] },
    { type: "true_false" as const, title: "PHẦN II. Trắc nghiệm Đúng/Sai", patterns: [/phan ii\b[^\n]*?(\d+)\s*cau/, /dung\s*\/?\s*sai[^\n]{0,40}?(\d+)\s*cau/] },
    { type: "short_answer" as const, title: "PHẦN III. Trả lời ngắn", patterns: [/phan iii\b[^\n]*?(\d+)\s*cau/, /tra loi ngan[^\n]{0,40}?(\d+)\s*cau/] },
  ];
  const sections = values.flatMap(({ type, title, patterns }, index) => {
    const count = patterns.map((pattern) => numberFrom(text.match(pattern)?.[1])).find(Boolean) || 0;
    return count ? [{ id: `section-${index + 1}`, title, questionType: type, questionCount: count, score: 0, ...(type === "true_false" ? { statementsPerQuestion: 4 } : {}) }] : [];
  });
  if (sections.length) return sections;
  const total = numberFrom(text.match(/tong\s*so\s*cau[^\d]{0,10}(\d+)/)?.[1] || text.match(/so\s*cau[^\d]{0,10}(\d+)/)?.[1]);
  return total ? [{ id: "section-1", title: "Phần câu hỏi", questionType: "mixed", questionCount: total, score: 0 }] : [];
}

function findHeaderIndex(rows: string[][]) {
  let best = { index: 0, score: -1 };
  rows.slice(0, 12).forEach((row, index) => {
    const text = normalize(row.join(" "));
    const score = ["chu de", "noi dung", "nhan biet", "thong hieu", "van dung", "so cau", "so diem", "ti le", "yeu cau can dat"].filter((key) => text.includes(key)).length;
    if (score > best.score) best = { index, score };
  });
  return best;
}

function topicsFromTable(table: ExtractedTable): BlueprintTopic[] {
  const { index, score } = findHeaderIndex(table.rows);
  if (score < 2) return [];
  const headers = table.rows[index].map(normalize);
  const column = (patterns: RegExp[]) => headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)));
  const topicIndex = column([/chu de/, /^noi dung$/, /don vi kien thuc/]);
  if (topicIndex < 0) return [];
  const recognition = column([/nhan biet/]);
  const comprehension = column([/thong hieu/]);
  const application = column([/^van dung$/]);
  const advanced = column([/van dung cao/]);
  const total = column([/tong.*cau/, /^so cau/]);
  const scoreIndex = column([/so diem/, /^diem$/]);
  const percentage = column([/ti le/, /%/]);
  const outcome = column([/yeu cau can dat/, /muc do danh gia/, /mo ta/]);
  return table.rows.slice(index + 1).flatMap((row) => {
    const topic = String(row[topicIndex] || "").trim();
    if (!topic || /tong|cong/iu.test(topic)) return [];
    const counts = {
      recognition: recognition >= 0 ? numberFrom(row[recognition]) : undefined,
      comprehension: comprehension >= 0 ? numberFrom(row[comprehension]) : undefined,
      application: application >= 0 ? numberFrom(row[application]) : undefined,
      advancedApplication: advanced >= 0 ? numberFrom(row[advanced]) : undefined,
    };
    const countSum = Object.values(counts).reduce<number>((sum, value) => sum + (value || 0), 0);
    return [{
      topic,
      counts,
      totalQuestions: total >= 0 ? numberFrom(row[total]) : countSum || undefined,
      totalScore: scoreIndex >= 0 ? numberFrom(row[scoreIndex]) : undefined,
      percentage: percentage >= 0 ? numberFrom(row[percentage]) : undefined,
      learningOutcomes: outcome >= 0 && row[outcome]?.trim() ? [row[outcome].trim()] : [],
      questionTypes: row.map((cell, cellIndex) => cellIndex !== topicIndex && /tnkq|đúng|sai|trả lời ngắn|tự luận/iu.test(cell) ? cell.trim() : "").filter(Boolean),
    } satisfies BlueprintTopic];
  });
}

function inferSubject(text: string) {
  return text.match(/(?:môn|mon)\s*[:\-]?\s*([^\n|]{2,30})/iu)?.[1]?.trim() || "";
}

function inferGrade(text: string) {
  return text.match(/(?:lớp|lop|khối|khoi)\s*[:\-]?\s*(\d{1,2})/iu)?.[1] || "";
}

function inferDuration(text: string) {
  return numberFrom(text.match(/(?:thời gian(?: làm bài)?|thoi gian)[^\d]{0,15}(\d{1,3})\s*(?:phút|phut)/iu)?.[1]);
}

function extractLessonTopics(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/^\s*(?:\d+(?:\.\d+)*|[-•])\s*[.)-]?\s*/, "").trim()).filter((line) => line.length >= 4 && line.length <= 120);
  const likely = lines.filter((line) => /^(?:bài|chương|chủ đề|nội dung|khái niệm|định nghĩa|công thức|mục tiêu)/iu.test(line));
  return [...new Set((likely.length ? likely : lines.slice(0, 8)).map((line) => line.replace(/^(?:bài|chương|chủ đề|nội dung)\s*\d*\s*[:.-]?\s*/iu, "")))].slice(0, 12);
}

export function createExamBlueprint(source: ParsedExamSource, selectedType?: ExamSourceType): ExamBlueprint {
  const sourceType = selectedType && selectedType !== "unknown" ? selectedType : source.sourceType;
  const tablesByRelevance = [...source.tables].sort((left, right) => findHeaderIndex(right.rows).score - findHeaderIndex(left.rows).score);
  let topics = tablesByRelevance.flatMap(topicsFromTable);
  if (!topics.length && sourceType === "lesson_material") topics = extractLessonTopics(source.text).map((topic) => ({ topic, counts: {} }));
  if (!topics.length && source.previousExam) {
    const grouped = new Map<string, BlueprintTopic>();
    source.previousExam.parts.flatMap((part) => part.questions).forEach((question) => {
      const name = question.topic?.trim() || "Nội dung theo đề kiểm tra cũ";
      const topic = grouped.get(name) || { topic: name, counts: {}, totalQuestions: 0, totalScore: 0, questionTypes: [] };
      const difficulty = String(question.difficulty || "").toLocaleLowerCase("vi");
      const level = difficulty.includes("vận dụng cao") ? "advancedApplication" : difficulty.includes("vận dụng") ? "application" : difficulty.includes("thông hiểu") ? "comprehension" : "recognition";
      topic.counts[level] = Number(topic.counts[level] || 0) + 1;
      topic.totalQuestions = Number(topic.totalQuestions || 0) + 1;
      topic.totalScore = Number((Number(topic.totalScore || 0) + Number(question.score || 0)).toFixed(2));
      topic.questionTypes = [...new Set([...(topic.questionTypes || []), question.part])];
      grouped.set(name, topic);
    });
    topics = [...grouped.values()].map((topic) => ({ ...topic, percentage: source.previousExam!.metadata.totalScore ? Number((Number(topic.totalScore || 0) / source.previousExam!.metadata.totalScore * 100).toFixed(2)) : 0 }));
  }
  const sections = sectionDefaults(source);
  const text = source.text;
  const totalScore = numberFrom(text.match(/(?:tổng\s*điểm|thang\s*điểm)[^\d]{0,20}(\d+(?:[,.]\d+)?)/iu)?.[1]) || source.previousExam?.metadata.totalScore || 10;
  const cognition = topics.reduce((result, topic) => ({
    recognition: (result.recognition || 0) + (topic.counts.recognition || 0),
    comprehension: (result.comprehension || 0) + (topic.counts.comprehension || 0),
    application: (result.application || 0) + (topic.counts.application || 0),
    advancedApplication: (result.advancedApplication || 0) + (topic.counts.advancedApplication || 0),
  }), { recognition: 0, comprehension: 0, application: 0, advancedApplication: 0 });
  const overall = sourceType === "unknown" ? Math.min(source.detectionConfidence, 0.49) : Math.min(0.96, source.detectionConfidence + (sections.length ? 0.08 : 0) + (topics.length ? 0.08 : 0));
  const warnings: BlueprintWarning[] = source.warnings.map((message, index) => ({ code: `source_warning_${index + 1}`, message, severity: "warning" }));
  if (sourceType === "unknown") warnings.push({ code: "source_type_unknown", message: "SOẠN LAB chưa xác định chắc chắn loại nguồn. Thầy cô vui lòng chọn loại tài liệu trước khi tạo đề.", field: "sourceType", severity: "error" });
  const blueprint: ExamBlueprint = {
    sourceType,
    sourceName: source.fileName,
    sourceContentHash: source.contentHash,
    subject: source.previousExam?.metadata.subject || inferSubject(text),
    grade: source.previousExam?.metadata.grade || inferGrade(text),
    examType: sourceType === "previous_exam" ? source.previousExam?.metadata.examStyle || "Kiểm tra" : "Kiểm tra",
    durationMinutes: inferDuration(text) || numberFrom(source.previousExam?.metadata.duration),
    totalScore,
    sections,
    topicDistribution: topics,
    cognitiveDistribution: cognition,
    instructions: [],
    constraints: sourceType === "lesson_material" ? ["Chỉ sử dụng kiến thức trong tài liệu"] : [],
    confidence: { overall, fields: { sourceType: source.detectionConfidence, sections: sections.length ? 0.82 : 0.25, topics: topics.length ? 0.74 : 0.2, subject: inferSubject(text) ? 0.8 : 0.3, grade: inferGrade(text) ? 0.8 : 0.3 } },
    warnings,
  };
  return blueprint;
}

export function validateExamBlueprint(blueprint: ExamBlueprint): BlueprintValidation {
  const errors = [] as BlueprintValidation["errors"];
  const warnings = [] as BlueprintValidation["warnings"];
  const sectionQuestions = blueprint.sections.reduce((sum, section) => sum + Number(section.questionCount || 0), 0);
  const sectionScore = Number(blueprint.sections.reduce((sum, section) => sum + Number(section.score || 0), 0).toFixed(2));
  const topicQuestions = blueprint.topicDistribution.reduce((sum, topic) => sum + Number(topic.totalQuestions ?? Object.values(topic.counts).reduce<number>((current, value) => current + (value || 0), 0)), 0);
  const topicPercentage = Number(blueprint.topicDistribution.reduce((sum, topic) => sum + Number(topic.percentage || 0), 0).toFixed(2));
  const allNumbers = [blueprint.totalScore || 0, ...blueprint.sections.flatMap((section) => [section.questionCount, section.score]), ...blueprint.topicDistribution.flatMap((topic) => [topic.totalQuestions || 0, topic.totalScore || 0, topic.percentage || 0, ...Object.values(topic.counts).map((value) => value || 0)])];
  if (allNumbers.some((value) => value < 0)) errors.push({ code: "negative_value", message: "Cấu trúc có giá trị âm. Vui lòng kiểm tra số câu, điểm và tỉ lệ.", severity: "error" });
  if ([...blueprint.sections.map((section) => section.questionCount), ...blueprint.topicDistribution.flatMap((topic) => [topic.totalQuestions ?? 0, ...Object.values(topic.counts).map((value) => value ?? 0)])].some((value) => !Number.isInteger(value))) errors.push({ code: "fractional_question_count", message: "Số câu phải là số nguyên, không thể dùng giá trị thập phân.", severity: "error" });
  if (!blueprint.sourceType || blueprint.sourceType === "unknown") errors.push({ code: "source_type_required", message: "Vui lòng chọn đúng loại nguồn trước khi tạo đề.", field: "sourceType", severity: "error" });
  if (!blueprint.sections.length || sectionQuestions <= 0) errors.push({ code: "invalid_question_total", message: "Tổng số câu phải lớn hơn 0.", field: "sections", severity: "error" });
  if (!blueprint.totalScore || blueprint.totalScore <= 0) errors.push({ code: "invalid_total_score", message: "Tổng điểm phải lớn hơn 0.", field: "totalScore", severity: "error" });
  if (!blueprint.topicDistribution.length) errors.push({ code: "topic_required", message: "Cần có ít nhất một chủ đề trước khi tạo đề.", field: "topicDistribution", severity: "error" });
  if (topicQuestions > 0 && topicQuestions !== sectionQuestions) errors.push({ code: "question_total_conflict", message: `Ma trận ghi ${sectionQuestions} câu nhưng tổng các chủ đề là ${topicQuestions} câu.`, severity: "error", suggestion: `Điều chỉnh tổng chủ đề về ${sectionQuestions} câu.` });
  if (sectionScore > 0 && blueprint.totalScore && Math.abs(sectionScore - blueprint.totalScore) > 0.01) errors.push({ code: "score_total_conflict", message: `Tổng điểm các phần là ${sectionScore} nhưng tổng điểm đề là ${blueprint.totalScore}.`, severity: "error" });
  const topicScore = Number(blueprint.topicDistribution.reduce((sum, topic) => sum + Number(topic.totalScore || 0), 0).toFixed(2));
  if (topicScore > 0 && blueprint.totalScore && Math.abs(topicScore - blueprint.totalScore) > 0.01) errors.push({ code: "topic_score_conflict", message: `Tổng điểm các chủ đề là ${topicScore} nhưng tổng điểm bài kiểm tra là ${blueprint.totalScore}.`, severity: "error" });
  const cognitiveTotal = Object.values(blueprint.cognitiveDistribution).reduce<number>((sum, value) => sum + (value || 0), 0);
  if (cognitiveTotal > sectionQuestions && cognitiveTotal <= 100 && sectionQuestions < 50) warnings.push({ code: "cognitive_may_be_percentage", message: "Phân bố mức độ có thể đang được ghi theo phần trăm. Thầy cô vui lòng kiểm tra.", severity: "warning" });
  else if (cognitiveTotal > sectionQuestions) errors.push({ code: "cognitive_total_conflict", message: "Tổng số câu theo mức độ nhận thức vượt quá tổng số câu của đề.", severity: "error" });
  else if (cognitiveTotal > 0 && cognitiveTotal !== sectionQuestions) errors.push({ code: "cognitive_total_conflict", message: `Tổng số câu theo mức độ nhận thức là ${cognitiveTotal} nhưng cấu trúc đề có ${sectionQuestions} câu.`, severity: "error" });
  const topicCognition = blueprint.topicDistribution.reduce((result, topic) => ({ recognition: result.recognition + Number(topic.counts.recognition || 0), comprehension: result.comprehension + Number(topic.counts.comprehension || 0), application: result.application + Number(topic.counts.application || 0), advancedApplication: result.advancedApplication + Number(topic.counts.advancedApplication || 0) }), { recognition: 0, comprehension: 0, application: 0, advancedApplication: 0 });
  if ((["recognition", "comprehension", "application", "advancedApplication"] as const).some((key) => Number(blueprint.cognitiveDistribution[key] || 0) !== topicCognition[key])) errors.push({ code: "cognitive_distribution_conflict", message: "Phân bố nhận thức tổng hợp chưa khớp với các chủ đề trong ma trận.", severity: "error" });
  if (topicPercentage > 0) {
    if (topicPercentage >= 99 && topicPercentage <= 101) {
      if (topicPercentage !== 100) warnings.push({ code: "percentage_rounding", message: `Tổng tỉ lệ là ${topicPercentage}%. Sai lệch nhỏ do làm tròn được chấp nhận.`, severity: "warning" });
    } else errors.push({ code: "percentage_total_conflict", message: `Tổng tỉ lệ chủ đề là ${topicPercentage}%, chưa khớp 100%.`, severity: "error" });
  }
  blueprint.sections.forEach((section) => {
    if (!["multiple_choice", "true_false", "short_answer", "essay", "mixed"].includes(section.questionType)) errors.push({ code: `unsupported_question_type_${section.id}`, message: `${section.title} có dạng câu hỏi chưa được hỗ trợ.`, severity: "error" });
    if (section.questionType === "true_false" && section.statementsPerQuestion !== 4) errors.push({ code: `invalid_true_false_${section.id}`, message: `${section.title} cần có 4 mệnh đề cho mỗi câu Đúng/Sai.`, severity: "error" });
  });
  blueprint.topicDistribution.forEach((topic, index) => {
    if (Object.values(topic.counts).reduce<number>((sum, value) => sum + Number(value || 0), 0) <= 0) errors.push({ code: `topic_allocation_required_${index}`, message: `Chủ đề “${topic.topic || index + 1}” chưa có phân bổ câu hỏi.`, severity: "error" });
  });
  return { valid: errors.length === 0, errors, warnings, totals: { sectionQuestions, topicQuestions, sectionScore, topicPercentage } };
}

function sectionCount(blueprint: ExamBlueprint, types: BlueprintQuestionType[]) {
  return blueprint.sections.filter((section) => types.includes(section.questionType)).reduce((sum, section) => sum + section.questionCount, 0);
}

export function blueprintToExamInput(blueprint: ExamBlueprint, overrides: Partial<ExamInput> = {}): ExamInput {
  const totalQuestions = blueprint.sections.reduce((sum, section) => sum + section.questionCount, 0);
  const cognitive = blueprint.cognitiveDistribution;
  const cognitiveTotal = Object.values(cognitive).reduce<number>((sum, value) => sum + (value || 0), 0);
  const rate = (value: number | undefined, fallback: number) => cognitiveTotal > 0 ? Math.round((Number(value || 0) / cognitiveTotal) * 100) : fallback;
  const topics = blueprint.topicDistribution.map((topic) => topic.topic).filter(Boolean).join(", ");
  return {
    schoolName: "", teacherName: "", subject: blueprint.subject || "", grade: blueprint.grade || "", bookSeries: blueprint.textbookSeries || "",
    topic: topics, duration: blueprint.durationMinutes ? `${blueprint.durationMinutes} phút` : "45 phút", examType: "Kết hợp", examStyle: /THPTQG|tốt nghiệp/iu.test(blueprint.examType || "") ? "THPTQG / tốt nghiệp" : "Kiểm tra thường",
    multipleChoiceCount: sectionCount(blueprint, ["multiple_choice", "mixed"]), trueFalseCount: sectionCount(blueprint, ["true_false"]), shortAnswerCount: sectionCount(blueprint, ["short_answer", "essay"]), essayCount: 0,
    examCode: "0101", totalScore: blueprint.totalScore || 10, level: "Trung bình",
    recognitionRate: rate(cognitive.recognition, 30), understandingRate: rate(cognitive.comprehension, 40), applicationRate: rate(cognitive.application, 20), advancedRate: rate(cognitive.advancedApplication, 10),
    includeAnswers: true, includeRubric: true, includeMatrix: true, includeSpecification: true,
    extraRequirements: `Bám đúng blueprint đã xác nhận gồm ${totalQuestions} câu. Phân bố chủ đề: ${blueprint.topicDistribution.map((topic) => `${topic.topic} (${topic.totalQuestions || Object.values(topic.counts).reduce<number>((sum, value) => sum + (value || 0), 0)} câu)`).join("; ")}.`,
    ...overrides,
  };
}

export function blueprintFromStructuredExam(exam: StructuredExam, sourceName = "Đề cũ"): ExamBlueprint {
  const source = { fileName: sourceName, extension: "", text: "", tables: [], sourceType: "previous_exam" as const, detectionConfidence: 0.9, detectionScores: { matrix: 0, specification: 0, previous_exam: 10, lesson_material: 0, unknown: 0 }, warnings: [], contentHash: "", previousExam: exam };
  return createExamBlueprint(source, "previous_exam");
}

export function examPartTypeForBlueprint(type: BlueprintQuestionType): ExamPartType {
  if (type === "true_false") return "true_false";
  if (type === "short_answer" || type === "essay") return "short_answer";
  return "multiple_choice";
}
