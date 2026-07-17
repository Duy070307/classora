import type { GeneratedDocument } from "@/lib/types";
import type { Rubric, RubricCriterion, RubricDescriptor, RubricInputMode, RubricLevel, RubricType } from "@/lib/rubric/types";

export function rubricId(prefix = "rubric") {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const DEFAULT_LEVELS: RubricLevel[] = [
  { id: "level-4", label: "Xuất sắc", score: 4, order: 1 },
  { id: "level-3", label: "Tốt", score: 3, order: 2 },
  { id: "level-2", label: "Đạt", score: 2, order: 3 },
  { id: "level-1", label: "Cần cố gắng", score: 1, order: 4 },
];

function descriptor(criterion: string, level: RubricLevel): RubricDescriptor {
  const phrases: Record<number, string> = {
    4: `Thể hiện ${criterion.toLocaleLowerCase("vi")} đầy đủ, chính xác và có minh chứng rõ ràng.`,
    3: `Thể hiện ${criterion.toLocaleLowerCase("vi")} khá đầy đủ; còn một vài thiếu sót nhỏ.`,
    2: `Thể hiện được yêu cầu cơ bản về ${criterion.toLocaleLowerCase("vi")} nhưng minh chứng chưa nhất quán.`,
    1: `Chưa thể hiện rõ ${criterion.toLocaleLowerCase("vi")}; cần bổ sung và chỉnh sửa đáng kể.`,
  };
  return { id: rubricId("descriptor"), levelId: level.id, text: phrases[Math.round(level.score)] || `Mức ${level.label} đối với ${criterion}.` };
}

export function makeCriterion(title: string, order: number, levels = DEFAULT_LEVELS, weight = 25): RubricCriterion {
  const maxLevel = Math.max(...levels.map((level) => level.score), 1);
  return {
    id: rubricId("criterion"), title, weight, maxScore: maxLevel, objectiveIds: [], order,
    descriptors: levels.map((level) => descriptor(title, level)),
  };
}

export function createRubricDraft(input: Partial<Rubric> & { inputMode?: RubricInputMode } = {}): Rubric {
  const now = new Date().toISOString();
  const levels = input.levels?.length ? input.levels : structuredClone(DEFAULT_LEVELS);
  const criteria = input.criteria?.length ? input.criteria : ["Độ chính xác nội dung", "Thực hiện nhiệm vụ", "Chất lượng sản phẩm", "Trình bày và hợp tác"].map((title, index) => makeCriterion(title, index + 1, levels));
  return normalizeRubric({
    id: input.id || rubricId(), title: input.title || "Rubric đánh giá", subject: input.subject || "", grade: input.grade || "",
    assignmentType: input.assignmentType || "Sản phẩm học tập", instructions: input.instructions || "Đối chiếu minh chứng với từng tiêu chí và xác nhận điểm trước khi công bố.",
    rubricType: input.rubricType || "analytic", inputMode: input.inputMode || "manual", totalScore: input.totalScore || 10,
    objectives: input.objectives || [], levels, criteria,
    metadata: { createdAt: input.metadata?.createdAt || now, updatedAt: now, version: "1.0", ...input.metadata },
  });
}

export function normalizeRubric(raw: Rubric): Rubric {
  const levels = (raw.levels || []).map((level, index) => ({ ...level, id: level.id || rubricId("level"), label: level.label || `Mức ${index + 1}`, score: Number.isFinite(level.score) ? level.score : 0, order: index + 1 }));
  const criteria = (raw.criteria || []).map((criterion, index) => ({
    ...criterion, id: criterion.id || rubricId("criterion"), title: criterion.title || `Tiêu chí ${index + 1}`,
    order: index + 1, weight: Number.isFinite(criterion.weight) ? criterion.weight : 0,
    maxScore: Number.isFinite(criterion.maxScore) ? criterion.maxScore : Math.max(...levels.map((item) => item.score), 0),
    objectiveIds: Array.isArray(criterion.objectiveIds) ? criterion.objectiveIds : [],
    descriptors: levels.map((level) => criterion.descriptors?.find((item) => item.levelId === level.id) || descriptor(criterion.title || `Tiêu chí ${index + 1}`, level)),
  }));
  return { ...raw, title: raw.title || "Rubric đánh giá", totalScore: Number.isFinite(raw.totalScore) && raw.totalScore > 0 ? raw.totalScore : 10, levels, criteria, metadata: { ...raw.metadata, version: "1.0", updatedAt: new Date().toISOString() } };
}

export function createRubricOutline(input: { title?: string; subject?: string; grade?: string; assignmentType?: string; rubricType?: RubricType; criteriaText?: string; objectives?: string[]; inputMode?: RubricInputMode; totalScore?: number }): Rubric {
  const objectives = (input.objectives || []).filter(Boolean).map((text) => ({ id: rubricId("objective"), text }));
  const names = (input.criteriaText || "").split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean);
  let rubric = createRubricDraft({ ...input, objectives, criteria: [] });
  if (input.rubricType === "checklist") rubric = { ...rubric, levels: [{ id: "check-met", label: "Đạt", score: 1, order: 1 }, { id: "check-partial", label: "Có một phần", score: .5, order: 2 }, { id: "check-not-met", label: "Chưa đạt", score: 0, order: 3 }, { id: "check-na", label: "Không áp dụng", score: 0, order: 4 }] };
  const requested = names.length ? names : ["Độ chính xác nội dung", "Mức độ hoàn thành", "Chất lượng sản phẩm", "Trình bày"];
  const titles = input.rubricType === "holistic" ? [requested.join("; ") || "Mức độ hoàn thành tổng thể"] : requested;
  return normalizeRubric({ ...rubric, totalScore: input.totalScore || rubric.totalScore, criteria: titles.map((title, index) => ({ ...makeCriterion(title, index + 1, rubric.levels, 100 / titles.length), maxScore: input.rubricType === "point_based" ? (input.totalScore || rubric.totalScore) / titles.length : Math.max(...rubric.levels.map((item) => item.score), 1), objectiveIds: objectives[index] ? [objectives[index].id] : [] })) });
}

function legacyCriteria(content: string) {
  const lines = content.split(/\r?\n/).map((line) => line.replace(/^[-*#\d.\s|]+/, "").trim()).filter(Boolean);
  return lines.filter((line) => /tiêu chí|nội dung|trình bày|hợp tác|sản phẩm|chính xác/i.test(line)).slice(0, 8);
}

export function rubricFromDocument(document: GeneratedDocument): Rubric {
  if (document.rubric) return normalizeRubric(document.rubric);
  const names = legacyCriteria(document.content);
  return createRubricOutline({ title: document.title, criteriaText: names.join("\n"), inputMode: "saved" });
}

export function rubricFromSource(document: GeneratedDocument, sourceActivityId?: string): Rubric {
  if (document.lessonPlan) {
    const activities = document.lessonPlan.periods.flatMap((period) => period.activities);
    const selected = activities.find((item) => item.id === sourceActivityId) || activities[0];
    const objectives = document.lessonPlan.objectives.filter((objective) => !selected || selected.objectiveIds.includes(objective.id)).map((objective) => objective.content);
    return createRubricOutline({ title: `Rubric - ${selected?.title || document.lessonPlan.title}`, subject: document.lessonPlan.subject, grade: document.lessonPlan.grade, assignmentType: selected?.expectedProduct || selected?.title || "Hoạt động học tập", criteriaText: selected?.assessmentCriteria, objectives, inputMode: "lesson_plan" });
  }
  if (document.worksheet) {
    const activity = document.worksheet.activities.find((item) => item.id === sourceActivityId) || document.worksheet.activities[0];
    return createRubricOutline({ title: `Rubric - ${activity?.title || document.worksheet.title}`, subject: document.worksheet.subject, grade: document.worksheet.grade, assignmentType: activity?.expectedOutput || activity?.title || "Phiếu học tập", criteriaText: activity?.rubric?.map((item) => item.criterion).join("\n"), objectives: [activity?.learningOutcome, ...(document.worksheet.objectives || [])].filter(Boolean) as string[], inputMode: "worksheet" });
  }
  return rubricFromDocument(document);
}

export function changeLevelCount(rubric: Rubric, count: number): Rubric {
  const safeCount = Math.max(2, Math.min(6, count));
  const labels = safeCount === 3 ? ["Tốt", "Đạt", "Cần cố gắng"] : safeCount === 4 ? ["Xuất sắc", "Tốt", "Đạt", "Cần cố gắng"] : Array.from({ length: safeCount }, (_, index) => `Mức ${safeCount - index}`);
  const levels = labels.map((label, index) => ({ id: rubric.levels[index]?.id || rubricId("level"), label, score: safeCount - index, order: index + 1 }));
  return normalizeRubric({ ...rubric, levels, criteria: rubric.criteria.map((criterion) => ({ ...criterion, descriptors: levels.map((level) => criterion.descriptors.find((item) => item.levelId === level.id) || descriptor(criterion.title, level)) })) });
}

export function rubricToDocument(rubric: Rubric, audience: "teacher" | "student" | "self" | "peer" = "teacher"): GeneratedDocument {
  return { id: rubric.id, title: rubric.title, type: "rubric", content: rubricToText(rubric, audience), createdAt: rubric.metadata.createdAt, rubric, folder: "Khác" };
}

export function rubricToText(rubric: Rubric, audience: "teacher" | "student" | "self" | "peer" = "teacher") {
  const heading = audience === "teacher" ? "RUBRIC ĐÁNH GIÁ - BẢN GIÁO VIÊN" : audience === "peer" ? "PHIẾU ĐÁNH GIÁ ĐỒNG ĐẲNG" : audience === "self" ? "PHIẾU TỰ ĐÁNH GIÁ" : "RUBRIC DÀNH CHO HỌC SINH";
  const header = [heading, rubric.title, rubric.subject && `Môn: ${rubric.subject}`, rubric.grade && `Khối: ${rubric.grade}`, `Tổng điểm: ${rubric.totalScore}`].filter(Boolean).join("\n");
  const tableHeader = `| Tiêu chí | Trọng số | ${rubric.levels.map((level) => `${level.label} (${level.score})`).join(" | ")} |`;
  const divider = `| ${["---", "---", ...rubric.levels.map(() => "---")].join(" | ")} |`;
  const rows = rubric.criteria.map((criterion) => `| ${criterion.title} | ${Math.round(criterion.weight * 100) / 100}% | ${rubric.levels.map((level) => criterion.descriptors.find((item) => item.levelId === level.id)?.text || "—").join(" | ")} |`);
  const notes = audience === "teacher" ? rubric.criteria.filter((item) => item.evidence).map((item) => `- Minh chứng ${item.title}: ${item.evidence}`).join("\n") : "";
  return [header, rubric.instructions, tableHeader, divider, ...rows, notes, "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần rà soát trước khi sử dụng chính thức."].filter(Boolean).join("\n\n");
}
