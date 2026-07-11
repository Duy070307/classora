import type { ExamQuestion } from "@/lib/exam-types";
import type { QuestionItem } from "@/lib/types";

export function normalizeQuestionText(value: string) {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("vi-VN").replace(/[^a-z0-9]+/g, " ").trim();
}

function nearDuplicate(left: string, right: string) {
  const a = new Set(left.split(" ").filter((token) => token.length > 2));
  const b = new Set(right.split(" ").filter((token) => token.length > 2));
  if (!a.size || !b.size) return false;
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / Math.max(a.size, b.size) >= 0.9;
}

export function uniqueBankQuestions(items: QuestionItem[]) {
  const ids = new Set<string>();
  const stems = new Set<string>();
  return items.filter((item) => {
    const stem = normalizeQuestionText(item.question);
    if (!stem || ids.has(item.id) || stems.has(stem)) return false;
    ids.add(item.id); stems.add(stem); return true;
  });
}

export function uniqueSupplementQuestions(items: ExamQuestion[], bankStems: string[], limit: number) {
  const seen = bankStems.map(normalizeQuestionText);
  return items.filter((item) => {
    const stem = normalizeQuestionText(item.stem);
    if (!stem || seen.some((existing) => existing === stem || nearDuplicate(existing, stem))) return false;
    seen.push(stem); return true;
  }).slice(0, limit);
}

export function bankSourceCounts(items: QuestionItem[]) {
  return items.reduce((counts, item) => {
    if (item.bankScope === "system" || item.metadata?.generatedBy === "Soạn Lab seed") counts.system += 1;
    else counts.personal += 1;
    return counts;
  }, { system: 0, personal: 0 });
}

export function buildSupplementStatus(requestedCount: number, bankCount: number, aiCount: number, bankOnly: boolean) {
  const finalCount = bankCount + aiCount;
  const isPartial = finalCount < requestedCount;
  const warnings: string[] = [];
  if (bankOnly && isPartial) warnings.push(`Ngân hàng hiện có ${bankCount}/${requestedCount} câu phù hợp. Chế độ ‘Chỉ sử dụng câu hỏi có sẵn’ đang được bật.`);
  else if (isPartial && finalCount > 0) warnings.push(`SOẠN LAB đã tạo được ${finalCount}/${requestedCount} câu bám sát chủ đề. ${requestedCount - finalCount} câu chưa đạt yêu cầu nên đã được loại.`);
  if (isPartial && aiCount > 0) warnings.push("SOẠN LAB đã loại một số câu chưa bám sát chủ đề và chỉ giữ lại nội dung phù hợp.");
  return { requestedCount, finalCount, bankCount, aiSupplementCount: aiCount, isPartial, warnings };
}

export function missingDifficultyInstruction(requested: number, rates: Record<string, number>, bank: QuestionItem[]) {
  const labels = ["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"];
  const keys = ["recognition", "understanding", "application", "advanced"];
  const missing = labels.map((label, index) => {
    const target = Math.round(requested * (rates[keys[index]] || 0) / 100);
    const present = bank.filter((item) => item.difficulty === label).length;
    return `${label}: ${Math.max(0, target - present)}`;
  });
  return `Phân bố mức độ còn thiếu (ưu tiên độ đúng chủ đề trước): ${missing.join(", ")}.`;
}
