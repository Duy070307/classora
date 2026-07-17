import type { QuestionBankItem, QuestionFilters, QuestionSort, SmartSetConfig, SmartSetResult } from "@/lib/question-bank-core/types";
import { normalizeQuestionText } from "@/lib/question-bank-core/audit";

const difficultyOrder = { "Nhận biết": 0, "Thông hiểu": 1, "Vận dụng": 2, "Vận dụng cao": 3 } as const;
const qualityOrder = { invalid: 0, needs_review: 1, valid: 2 } as const;

export function filterQuestions(items: QuestionBankItem[], filters: QuestionFilters, sort: QuestionSort = "newest") {
  const query = normalizeQuestionText(filters.query || "");
  const output = items.filter((item) => {
    const searchable = normalizeQuestionText([item.prompt, item.answer, item.explanation, item.subject, item.grade, item.topic, item.subtopic, item.tags.join(" ")].join(" "));
    return (!query || searchable.includes(query))
      && (!filters.scope || filters.scope === "all" || item.scope === filters.scope)
      && (!filters.subject || item.subject === filters.subject)
      && (!filters.grade || item.grade === filters.grade)
      && (!filters.topic || item.topic === filters.topic)
      && (!filters.subtopic || item.subtopic === filters.subtopic)
      && (!filters.type || item.type === filters.type)
      && (!filters.difficulty || item.difficulty === filters.difficulty)
      && (!filters.cognitiveLevel || item.cognitiveLevel === filters.cognitiveLevel)
      && (!filters.bookSeries || item.bookSeries === filters.bookSeries)
      && (!filters.quality || item.quality.status === filters.quality)
      && (!filters.source || item.source.type === filters.source)
      && (!filters.usage || filters.usage === "all" || (filters.usage === "used" ? item.usage.count > 0 : item.usage.count === 0));
  });
  return output.sort((a, b) => {
    if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
    if (sort === "most_used") return b.usage.count - a.usage.count || b.createdAt.localeCompare(a.createdAt);
    if (sort === "least_used") return a.usage.count - b.usage.count || b.createdAt.localeCompare(a.createdAt);
    if (sort === "difficulty") return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty] || a.prompt.localeCompare(b.prompt, "vi");
    if (sort === "topic") return a.topic.localeCompare(b.topic, "vi") || a.prompt.localeCompare(b.prompt, "vi");
    if (sort === "quality") return qualityOrder[a.quality.status] - qualityOrder[b.quality.status] || a.prompt.localeCompare(b.prompt, "vi");
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function seededScore(seed: string, id: string) {
  let hash = 2166136261;
  for (const char of `${seed}:${id}`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

export function buildSmartSet(items: QuestionBankItem[], config: SmartSetConfig): SmartSetResult {
  const threshold = config.excludeRecentlyUsedDays ? Date.now() - config.excludeRecentlyUsedDays * 86_400_000 : 0;
  const available = items.filter((item) => item.quality.status !== "invalid"
    && (!config.subject || item.subject === config.subject) && (!config.grade || item.grade === config.grade)
    && (!config.topics.length || config.topics.includes(item.topic)) && (!config.types.length || config.types.includes(item.type))
    && (!config.includeTags?.length || config.includeTags.every((tag) => item.tags.includes(tag)))
    && (!config.excludeTags?.some((tag) => item.tags.includes(tag)))
    && (config.maximumUsage == null || item.usage.count <= config.maximumUsage)
    && (!threshold || !item.usage.lastUsedAt || new Date(item.usage.lastUsedAt).getTime() < threshold));
  const selected: QuestionBankItem[] = [];
  const pool = [...available].sort((a, b) => seededScore(config.seed, a.id) - seededScore(config.seed, b.id));
  const shortages: string[] = [];
  const pick = (count: number, predicate: (item: QuestionBankItem) => boolean, label: string) => {
    const matches = pool.filter((item) => !selected.some((selectedItem) => selectedItem.id === item.id) && predicate(item));
    selected.push(...matches.slice(0, count));
    if (matches.length < count) shortages.push(`Thiếu ${count - matches.length} câu ${label}.`);
  };
  for (const [difficulty, count] of Object.entries(config.difficulties || {})) if (Number(count) > 0) pick(Number(count), (item) => item.difficulty === difficulty, difficulty);
  for (const [level, count] of Object.entries(config.cognitiveLevels || {})) if (Number(count) > 0) pick(Number(count), (item) => item.cognitiveLevel === level, level);
  const remaining = Math.max(0, config.count - selected.length);
  pick(remaining, () => true, "phù hợp với bộ lọc");
  return { selected: selected.slice(0, config.count), available: available.length, requested: config.count, shortages: [...new Set(shortages)] };
}
