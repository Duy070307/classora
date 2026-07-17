import type {
  DuplicateCluster,
  DuplicateMatch,
  QuestionAuditIssue,
  QuestionBankItem,
} from "@/lib/question-bank-core/types";

export function normalizeQuestionText(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\\(?:left|right|mathrm|text)\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9+\-*/=<>\s]/g, "")
    .trim();
}

function ngrams(value: string, size = 2) {
  const tokens = normalizeQuestionText(value).split(/\s+/).filter(Boolean);
  return new Set(
    tokens.length < size
      ? tokens
      : tokens
          .slice(0, tokens.length - size + 1)
          .map((_, index) => tokens.slice(index, index + size).join(" ")),
  );
}

export function questionSimilarity(left: string, right: string) {
  const a = ngrams(left);
  const b = ngrams(right);
  if (!a.size && !b.size) return 1;
  const intersection = [...a].filter((item) => b.has(item)).length;
  const phraseScore =
    intersection / Math.max(1, a.size + b.size - intersection);
  const leftTokens = new Set(
    normalizeQuestionText(left).split(/\s+/).filter(Boolean),
  );
  const rightTokens = new Set(
    normalizeQuestionText(right).split(/\s+/).filter(Boolean),
  );
  const tokenIntersection = [...leftTokens].filter((item) =>
    rightTokens.has(item),
  ).length;
  const tokenScore =
    tokenIntersection /
    Math.max(1, leftTokens.size + rightTokens.size - tokenIntersection);
  return Math.max(phraseScore, tokenScore);
}

function hasBrokenLatex(value: string) {
  const opens = (value.match(/\{/g) || []).length;
  const closes = (value.match(/\}/g) || []).length;
  const dollars = (value.match(/(?<!\\)\$/g) || []).length;
  return opens !== closes || dollars % 2 !== 0;
}

export function auditQuestion(item: QuestionBankItem): QuestionAuditIssue[] {
  const issues: QuestionAuditIssue[] = [];
  if (!item.prompt.trim())
    issues.push({
      code: "empty_prompt",
      severity: "error",
      message: "Thiếu nội dung câu hỏi.",
    });
  if (item.score < 0 || !Number.isFinite(item.score))
    issues.push({
      code: "invalid_score",
      severity: "error",
      message: "Điểm số không hợp lệ.",
    });
  if (hasBrokenLatex(`${item.prompt}\n${item.answer}\n${item.explanation}`))
    issues.push({
      code: "broken_latex",
      severity: "error",
      message: "Cú pháp LaTeX có dấu ngoặc hoặc dấu $ chưa cân bằng.",
    });
  if (item.visuals.some((visual) => !visual.content?.trim()))
    issues.push({
      code: "missing_visual",
      severity: "warning",
      message: "Có tham chiếu hình/bảng nhưng chưa có nội dung.",
    });
  if (item.type === "multiple_choice") {
    if (item.options.length < 2)
      issues.push({
        code: "missing_options",
        severity: "error",
        message: "Câu trắc nghiệm cần ít nhất hai phương án.",
      });
    const normalized = item.options.map((option) =>
      normalizeQuestionText(option.text),
    );
    if (
      new Set(normalized.filter(Boolean)).size !==
      normalized.filter(Boolean).length
    )
      issues.push({
        code: "duplicate_options",
        severity: "error",
        message: "Có phương án trả lời bị trùng.",
      });
    if (item.correctOptionIds.length !== 1)
      issues.push({
        code: "invalid_correct_count",
        severity: "error",
        message: "Câu trắc nghiệm cần đúng một phương án đúng.",
      });
    if (
      item.correctOptionIds.some(
        (id) => !item.options.some((option) => option.id === id),
      )
    )
      issues.push({
        code: "answer_not_in_options",
        severity: "error",
        message: "Đáp án không khớp với phương án hiện có.",
      });
  } else if (item.type === "true_false") {
    if (!item.trueFalseStatements.length)
      issues.push({
        code: "missing_statements",
        severity: "error",
        message: "Câu Đúng/Sai chưa có mệnh đề.",
      });
    if (
      new Set(item.trueFalseStatements.map((statement) => statement.id))
        .size !== item.trueFalseStatements.length
    )
      issues.push({
        code: "unstable_statement_ids",
        severity: "error",
        message: "Mã mệnh đề Đúng/Sai bị trùng.",
      });
    if (item.trueFalseStatements.some((statement) => !statement.text.trim()))
      issues.push({
        code: "empty_statement",
        severity: "error",
        message: "Có mệnh đề Đúng/Sai để trống.",
      });
  } else if (item.type === "matching" && !item.matchingPairs.length)
    issues.push({
      code: "missing_pairs",
      severity: "error",
      message: "Câu ghép đôi chưa có cặp dữ liệu.",
    });
  else if (item.type === "ordering" && item.orderingItems.length < 2)
    issues.push({
      code: "missing_order_items",
      severity: "error",
      message: "Câu sắp xếp cần ít nhất hai mục.",
    });
  else if (item.type === "table_completion" && !item.tableAnswers.length)
    issues.push({
      code: "missing_table_answers",
      severity: "warning",
      message: "Bảng chưa có ô đáp án được khai báo.",
    });
  else if (item.type === "essay" && !item.essayRubric.length)
    issues.push({
      code: "missing_rubric",
      severity: "warning",
      message: "Câu tự luận chưa có hướng dẫn chấm/rubric.",
    });
  if (
    ["short_answer", "essay", "fill_blank"].includes(item.type) &&
    !item.answer.trim() &&
    !item.acceptedAnswers.length
  )
    issues.push({
      code: "missing_answer",
      severity: "error",
      message: "Chưa có đáp án hoặc phương án chấp nhận.",
    });
  if (
    item.type === "short_answer" &&
    /^[-+]?\d+(?:[.,]\d+)?$/.test(item.answer.trim()) &&
    !item.unit &&
    /đơn vị|tính|bao nhiêu/i.test(item.prompt)
  )
    issues.push({
      code: "missing_unit",
      severity: "warning",
      message: "Đáp án số có thể đang thiếu đơn vị.",
    });
  if (item.prompt.trim().length < 8)
    issues.push({
      code: "ambiguous_wording",
      severity: "warning",
      message: "Nội dung quá ngắn, cần rà soát tính rõ nghĩa.",
    });
  return issues;
}

export function auditAndUpdate(item: QuestionBankItem): QuestionBankItem {
  const issues = auditQuestion(item).filter(
    (issue) => !item.quality.ignoredIssueCodes.includes(issue.code),
  );
  return {
    ...item,
    quality: {
      ...item.quality,
      issues: issues.map((issue) => issue.message),
      status: issues.some((issue) => issue.severity === "error")
        ? "invalid"
        : issues.length
          ? "needs_review"
          : "valid",
      checkedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };
}

const duplicateCache = new Map<string, DuplicateMatch[]>();

function fnv1a(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizedOptions(item: QuestionBankItem) {
  return item.options.map((option) => normalizeQuestionText(option.text));
}

function sortedOptionKey(item: QuestionBankItem) {
  return [...normalizedOptions(item)].sort().join("|");
}

function orderedOptionKey(item: QuestionBankItem) {
  return normalizedOptions(item).join("|");
}

function answerKey(item: QuestionBankItem) {
  if (item.type === "multiple_choice") {
    return item.correctOptionIds
      .map((id) => item.options.find((option) => option.id === id)?.text || "")
      .map(normalizeQuestionText)
      .sort()
      .join("|");
  }
  if (item.type === "true_false")
    return item.trueFalseStatements
      .map(
        (statement) =>
          `${normalizeQuestionText(statement.text)}:${statement.answer}`,
      )
      .sort()
      .join("|");
  return normalizeQuestionText(
    [item.answer, ...item.acceptedAnswers].filter(Boolean).sort().join("|"),
  );
}

function structuralKey(item: QuestionBankItem) {
  return [
    item.type,
    item.options.length,
    item.trueFalseStatements.length,
    item.matchingPairs.length,
    item.orderingItems.length,
  ].join(":");
}

function setSimilarity(left: string[], right: string[]) {
  const a = new Set(left.filter(Boolean));
  const b = new Set(right.filter(Boolean));
  if (!a.size && !b.size) return 1;
  const intersection = [...a].filter((value) => b.has(value)).length;
  return intersection / Math.max(1, a.size + b.size - intersection);
}

const intentPatterns: Array<[string, RegExp]> = [
  ["calculate", /\b(tinh|tim|xac dinh|bao nhieu|gia tri)\b/],
  ["prove", /\b(chung minh|chi ra rang)\b/],
  ["explain", /\b(giai thich|vi sao|tai sao)\b/],
  ["compare", /\b(so sanh|phan biet)\b/],
  ["identify", /\b(chon|phat bieu|nhan biet|dung|sai)\b/],
  ["evaluate", /\b(danh gia|nhan xet|phan tich)\b/],
];

function questionIntent(value: string) {
  const normalized = normalizeQuestionText(value);
  return (
    intentPatterns.find(([, pattern]) => pattern.test(normalized))?.[0] || ""
  );
}

function mathSignature(value: string) {
  return (
    normalizeQuestionText(value)
      .match(/(?:\\[a-z]+|\d+(?:[.,]\d+)?|[a-z]\s*[=+\-*/<>]\s*[^\s,;]+)/g)
      ?.join("|") || ""
  );
}

function duplicateSemanticText(value: string) {
  return normalizeQuestionText(value)
    .replace(/\b(hay|vui long|cho biet)\b/g, " ")
    .replace(/\b(khi|voi)\b/g, " tai ")
    .replace(/\b(cua)\b/g, " ")
    .replace(/\bbang mot\b/g, " 1 ")
    .replace(/\s+/g, " ")
    .trim();
}

function nearDuplicateConfidence(a: QuestionBankItem, b: QuestionBankItem) {
  if (a.type !== b.type || structuralKey(a) !== structuralKey(b)) return 0;
  if (a.subject && b.subject && a.subject !== b.subject) return 0;
  if (a.grade && b.grade && a.grade !== b.grade) return 0;

  const leftIntent = questionIntent(a.prompt);
  const rightIntent = questionIntent(b.prompt);
  if (leftIntent && rightIntent && leftIntent !== rightIntent) return 0;

  const promptScore = Math.max(
    questionSimilarity(a.prompt, b.prompt),
    questionSimilarity(
      duplicateSemanticText(a.prompt),
      duplicateSemanticText(b.prompt),
    ),
  );
  if (promptScore < 0.82) return 0;

  const answerCompatible =
    answerKey(a) === answerKey(b) && Boolean(answerKey(a));
  const optionScore =
    a.type === "multiple_choice"
      ? setSimilarity(normalizedOptions(a), normalizedOptions(b))
      : 1;
  if (a.type === "multiple_choice" && (!answerCompatible || optionScore < 0.75))
    return 0;

  const leftMath = mathSignature(a.prompt);
  const rightMath = mathSignature(b.prompt);
  const mathCompatible = !leftMath || !rightMath || leftMath === rightMath;
  if (!mathCompatible) return 0;

  const topicCompatible = !a.topic || !b.topic || a.topic === b.topic;
  const signals = [
    promptScore >= 0.88,
    answerCompatible,
    optionScore >= 0.9,
    topicCompatible,
    mathCompatible,
    Boolean(leftIntent && leftIntent === rightIntent),
  ].filter(Boolean).length;

  return signals >= 4
    ? Math.min(0.99, promptScore * 0.72 + optionScore * 0.28)
    : 0;
}

export function questionContentHash(item: QuestionBankItem) {
  return fnv1a(
    [
      normalizeQuestionText(item.prompt),
      structuralKey(item),
      orderedOptionKey(item),
      answerKey(item),
    ].join("::"),
  );
}

export function duplicateDecisionKey(
  left: QuestionBankItem,
  right: QuestionBankItem,
) {
  return [
    `${left.id}:${questionContentHash(left)}`,
    `${right.id}:${questionContentHash(right)}`,
  ]
    .sort()
    .join("|");
}

export function detectDuplicates(items: QuestionBankItem[]): DuplicateMatch[] {
  const fingerprint = items
    .map((item) => `${item.id}:${questionContentHash(item)}`)
    .sort()
    .join(";");
  const cached = duplicateCache.get(fingerprint);
  if (cached) return cached;

  const matches: DuplicateMatch[] = [];
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      const a = items[left];
      const b = items[right];
      const samePrompt =
        normalizeQuestionText(a.prompt) === normalizeQuestionText(b.prompt);
      const sameAnswer = answerKey(a) === answerKey(b);
      const sameStructure = structuralKey(a) === structuralKey(b);
      const sameOrderedOptions = orderedOptionKey(a) === orderedOptionKey(b);
      const sameOptionSet = sortedOptionKey(a) === sortedOptionKey(b);

      if (samePrompt && sameAnswer && sameStructure && sameOrderedOptions) {
        matches.push({
          leftId: a.id,
          rightId: b.id,
          kind: "exact",
          similarity: 1,
        });
        continue;
      }
      if (
        a.type === "multiple_choice" &&
        b.type === "multiple_choice" &&
        samePrompt &&
        sameAnswer &&
        sameOptionSet
      ) {
        matches.push({
          leftId: a.id,
          rightId: b.id,
          kind: "reordered_options",
          similarity: 1,
        });
        continue;
      }

      const confidence = nearDuplicateConfidence(a, b);
      if (confidence >= 0.82)
        matches.push({
          leftId: a.id,
          rightId: b.id,
          kind: "near",
          similarity: confidence,
        });
    }
  }

  duplicateCache.set(fingerprint, matches);
  if (duplicateCache.size > 12)
    duplicateCache.delete(duplicateCache.keys().next().value || "");
  return matches;
}

export function filterIgnoredDuplicateMatches(
  matches: DuplicateMatch[],
  items: QuestionBankItem[],
  ignoredKeys: ReadonlySet<string>,
) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return matches.filter((match) => {
    const left = byId.get(match.leftId);
    const right = byId.get(match.rightId);
    return (
      !left || !right || !ignoredKeys.has(duplicateDecisionKey(left, right))
    );
  });
}

export function clusterDuplicateMatches(
  items: QuestionBankItem[],
  matches: DuplicateMatch[] = detectDuplicates(items),
): DuplicateCluster[] {
  const adjacency = new Map<string, Set<string>>();
  for (const match of matches) {
    if (!adjacency.has(match.leftId)) adjacency.set(match.leftId, new Set());
    if (!adjacency.has(match.rightId)) adjacency.set(match.rightId, new Set());
    adjacency.get(match.leftId)!.add(match.rightId);
    adjacency.get(match.rightId)!.add(match.leftId);
  }

  const visited = new Set<string>();
  const clusters: DuplicateCluster[] = [];
  for (const start of adjacency.keys()) {
    if (visited.has(start)) continue;
    const stack = [start];
    const questionIds: string[] = [];
    while (stack.length) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      questionIds.push(id);
      for (const neighbor of adjacency.get(id) || []) stack.push(neighbor);
    }
    const questionSet = new Set(questionIds);
    const clusterMatches = matches.filter(
      (match) =>
        questionSet.has(match.leftId) && questionSet.has(match.rightId),
    );
    const kind = clusterMatches.some((match) => match.kind === "exact")
      ? "exact"
      : clusterMatches.some((match) => match.kind === "reordered_options")
        ? "reordered_options"
        : "near";
    clusters.push({
      id: questionIds.sort().join("--"),
      questionIds: questionIds.sort(),
      kind,
      confidence:
        clusterMatches.reduce((total, match) => total + match.similarity, 0) /
        Math.max(1, clusterMatches.length),
      matches: clusterMatches,
    });
  }
  return clusters.sort(
    (a, b) =>
      ({ exact: 0, reordered_options: 1, near: 2 })[a.kind] -
        { exact: 0, reordered_options: 1, near: 2 }[b.kind] ||
      b.questionIds.length - a.questionIds.length,
  );
}
