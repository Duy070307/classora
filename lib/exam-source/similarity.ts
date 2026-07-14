function normalize(value: string, replaceNumbers = false) {
  let result = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
  result = result.replace(/\\(?:left|right|mathrm|text|displaystyle)/g, "");
  if (replaceNumbers) result = result.replace(/[+-]?\d+(?:[.,]\d+)?/g, "#");
  return result.replace(/[^a-z0-9#+\-*/^=<>]/g, " ").replace(/\s+/g, " ").trim();
}

function ngrams(value: string, size = 3) {
  const words = normalize(value).split(" ").filter(Boolean);
  const result = new Set<string>();
  for (let index = 0; index <= words.length - size; index += 1) result.add(words.slice(index, index + size).join(" "));
  return result;
}

function jaccard(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;
  const common = [...left].filter((value) => right.has(value)).length;
  return common / (left.size + right.size - common);
}

export function compareQuestionSimilarity(candidate: string, source: string) {
  const normalizedCandidate = normalize(candidate);
  const normalizedSource = normalize(source);
  const exact = normalizedCandidate.length > 0 && normalizedCandidate === normalizedSource;
  const ngramSimilarity = jaccard(ngrams(candidate), ngrams(source));
  const numericVariant = normalize(candidate, true) === normalize(source, true) && normalizedCandidate !== normalizedSource;
  const mathCandidate = normalizedCandidate.match(/[a-z]?\s*[=<>]\s*[^ ]+(?:\s*[^ ]+){0,8}/g)?.join(" ") || "";
  const mathSource = normalizedSource.match(/[a-z]?\s*[=<>]\s*[^ ]+(?:\s*[^ ]+){0,8}/g)?.join(" ") || "";
  const mathMatch = Boolean(mathCandidate && mathSource && normalize(mathCandidate, true) === normalize(mathSource, true));
  const nearDuplicate = exact || ngramSimilarity >= 0.72 || numericVariant || mathMatch;
  return { exact, nearDuplicate, numericVariant, mathMatch, ngramSimilarity };
}

export function filterPreviousExamDuplicates<T>(items: T[], sourceStems: string[], getText: (item: T) => string) {
  const rejected: Array<{ item: T; reason: string; similarity: number }> = [];
  const accepted = items.filter((item) => {
    let strongest = { nearDuplicate: false, exact: false, numericVariant: false, mathMatch: false, ngramSimilarity: 0 };
    for (const source of sourceStems) {
      const result = compareQuestionSimilarity(getText(item), source);
      if (result.ngramSimilarity > strongest.ngramSimilarity || result.exact || result.numericVariant || result.mathMatch) strongest = result;
    }
    if (!strongest.nearDuplicate) return true;
    rejected.push({ item, reason: strongest.exact ? "exact_copy" : strongest.numericVariant ? "numeric_variant" : strongest.mathMatch ? "math_variant" : "near_duplicate", similarity: strongest.ngramSimilarity });
    return false;
  });
  return { accepted, rejected };
}

