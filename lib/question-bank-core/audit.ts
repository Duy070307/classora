import type { DuplicateMatch, QuestionAuditIssue, QuestionBankItem } from "@/lib/question-bank-core/types";

export function normalizeQuestionText(value: string) {
  return value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .replace(/\\(?:left|right|mathrm|text)\b/g, "").replace(/\s+/g, " ").replace(/[^a-z0-9+\-*/=<>\s]/g, "").trim();
}

function ngrams(value: string, size = 2) {
  const tokens = normalizeQuestionText(value).split(/\s+/).filter(Boolean);
  return new Set(tokens.length < size ? tokens : tokens.slice(0, tokens.length - size + 1).map((_, index) => tokens.slice(index, index + size).join(" ")));
}

export function questionSimilarity(left: string, right: string) {
  const a = ngrams(left); const b = ngrams(right);
  if (!a.size && !b.size) return 1;
  const intersection = [...a].filter((item) => b.has(item)).length;
  const phraseScore = intersection / Math.max(1, a.size + b.size - intersection);
  const leftTokens = new Set(normalizeQuestionText(left).split(/\s+/).filter(Boolean));
  const rightTokens = new Set(normalizeQuestionText(right).split(/\s+/).filter(Boolean));
  const tokenIntersection = [...leftTokens].filter((item) => rightTokens.has(item)).length;
  const tokenScore = tokenIntersection / Math.max(1, leftTokens.size + rightTokens.size - tokenIntersection);
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
  if (!item.prompt.trim()) issues.push({ code: "empty_prompt", severity: "error", message: "Thiếu nội dung câu hỏi." });
  if (item.score < 0 || !Number.isFinite(item.score)) issues.push({ code: "invalid_score", severity: "error", message: "Điểm số không hợp lệ." });
  if (hasBrokenLatex(`${item.prompt}\n${item.answer}\n${item.explanation}`)) issues.push({ code: "broken_latex", severity: "error", message: "Cú pháp LaTeX có dấu ngoặc hoặc dấu $ chưa cân bằng." });
  if (item.visuals.some((visual) => !visual.content?.trim())) issues.push({ code: "missing_visual", severity: "warning", message: "Có tham chiếu hình/bảng nhưng chưa có nội dung." });
  if (item.type === "multiple_choice") {
    if (item.options.length < 2) issues.push({ code: "missing_options", severity: "error", message: "Câu trắc nghiệm cần ít nhất hai phương án." });
    const normalized = item.options.map((option) => normalizeQuestionText(option.text));
    if (new Set(normalized.filter(Boolean)).size !== normalized.filter(Boolean).length) issues.push({ code: "duplicate_options", severity: "error", message: "Có phương án trả lời bị trùng." });
    if (item.correctOptionIds.length !== 1) issues.push({ code: "invalid_correct_count", severity: "error", message: "Câu trắc nghiệm cần đúng một phương án đúng." });
    if (item.correctOptionIds.some((id) => !item.options.some((option) => option.id === id))) issues.push({ code: "answer_not_in_options", severity: "error", message: "Đáp án không khớp với phương án hiện có." });
  } else if (item.type === "true_false") {
    if (!item.trueFalseStatements.length) issues.push({ code: "missing_statements", severity: "error", message: "Câu Đúng/Sai chưa có mệnh đề." });
    if (new Set(item.trueFalseStatements.map((statement) => statement.id)).size !== item.trueFalseStatements.length) issues.push({ code: "unstable_statement_ids", severity: "error", message: "Mã mệnh đề Đúng/Sai bị trùng." });
    if (item.trueFalseStatements.some((statement) => !statement.text.trim())) issues.push({ code: "empty_statement", severity: "error", message: "Có mệnh đề Đúng/Sai để trống." });
  } else if (item.type === "matching" && !item.matchingPairs.length) issues.push({ code: "missing_pairs", severity: "error", message: "Câu ghép đôi chưa có cặp dữ liệu." });
  else if (item.type === "ordering" && item.orderingItems.length < 2) issues.push({ code: "missing_order_items", severity: "error", message: "Câu sắp xếp cần ít nhất hai mục." });
  else if (item.type === "table_completion" && !item.tableAnswers.length) issues.push({ code: "missing_table_answers", severity: "warning", message: "Bảng chưa có ô đáp án được khai báo." });
  else if (item.type === "essay" && !item.essayRubric.length) issues.push({ code: "missing_rubric", severity: "warning", message: "Câu tự luận chưa có hướng dẫn chấm/rubric." });
  if (["short_answer", "essay", "fill_blank"].includes(item.type) && !item.answer.trim() && !item.acceptedAnswers.length) issues.push({ code: "missing_answer", severity: "error", message: "Chưa có đáp án hoặc phương án chấp nhận." });
  if (item.type === "short_answer" && /^[-+]?\d+(?:[.,]\d+)?$/.test(item.answer.trim()) && !item.unit && /đơn vị|tính|bao nhiêu/i.test(item.prompt)) issues.push({ code: "missing_unit", severity: "warning", message: "Đáp án số có thể đang thiếu đơn vị." });
  if (item.prompt.trim().length < 8) issues.push({ code: "ambiguous_wording", severity: "warning", message: "Nội dung quá ngắn, cần rà soát tính rõ nghĩa." });
  return issues;
}

export function auditAndUpdate(item: QuestionBankItem): QuestionBankItem {
  const issues = auditQuestion(item).filter((issue) => !item.quality.ignoredIssueCodes.includes(issue.code));
  return { ...item, quality: { ...item.quality, issues: issues.map((issue) => issue.message), status: issues.some((issue) => issue.severity === "error") ? "invalid" : issues.length ? "needs_review" : "valid", checkedAt: new Date().toISOString() }, updatedAt: new Date().toISOString() };
}

function optionKey(item: QuestionBankItem) {
  return item.options.map((option) => normalizeQuestionText(option.text)).sort().join("|");
}

function expressionSkeleton(value: string) {
  return normalizeQuestionText(value).replace(/\b\d+(?:[.,]\d+)?\b/g, "#");
}

export function detectDuplicates(items: QuestionBankItem[]): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  for (let left = 0; left < items.length; left += 1) for (let right = left + 1; right < items.length; right += 1) {
    const a = items[left]; const b = items[right];
    const exact = normalizeQuestionText(a.prompt) === normalizeQuestionText(b.prompt);
    const reordered = a.type === "multiple_choice" && b.type === "multiple_choice" && exact && optionKey(a) === optionKey(b);
    const similarity = questionSimilarity(a.prompt, b.prompt);
    const expressionVariant = !exact && expressionSkeleton(a.prompt) === expressionSkeleton(b.prompt);
    if (reordered) matches.push({ leftId: a.id, rightId: b.id, kind: "reordered_options", similarity: 1 });
    else if (exact) matches.push({ leftId: a.id, rightId: b.id, kind: "exact", similarity: 1 });
    else if (expressionVariant) matches.push({ leftId: a.id, rightId: b.id, kind: "expression_variant", similarity });
    else if (similarity >= 0.55) matches.push({ leftId: a.id, rightId: b.id, kind: "near", similarity });
  }
  return matches;
}
