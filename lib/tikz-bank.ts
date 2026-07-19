import { tikzSafetyError } from "@/lib/tikz-bank/import-validation";

export const tikzCategories = [
  "Hình học phẳng",
  "Hình học không gian",
  "Đồ thị hàm số",
  "Trục tọa độ",
  "Vectơ",
  "Đường tròn",
  "Tam giác",
  "Tứ giác",
  "Vật lí",
  "Khác",
] as const;

export type TikzBankScope = "system" | "user";

export type TikzSnippet = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  bank_scope: TikzBankScope;
  title: string;
  description: string | null;
  category: string | null;
  subject: string | null;
  grade: string | null;
  tags: string[] | null;
  tikz_code: string;
  full_latex: string | null;
  preview_note: string | null;
  source_type: string | null;
  needs_review: boolean;
  slug?: string | null;
  subcategory?: string | null;
  grades?: string[] | null;
  complexity?: string | null;
  package_dependencies?: string[] | null;
  source_name?: string | null;
  source_url?: string | null;
  source_author?: string | null;
  source_license?: string | null;
  originality_mode?: string | null;
  sha256?: string | null;
  imported_at?: string | null;
  metadata?: Record<string, unknown>;
};

export type TikzSnippetInput = Pick<TikzSnippet, "title" | "description" | "category" | "subject" | "grade" | "tags" | "tikz_code" | "full_latex" | "preview_note"> & {
  source_type?: string;
  metadata?: Record<string, unknown>;
};

const limits = {
  title: 160,
  description: 1000,
  category: 100,
  subject: 100,
  grade: 60,
  tikz_code: 30000,
  full_latex: 50000,
  preview_note: 1000,
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\r\n?/g, "\n") : "";
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function nullableText(...values: unknown[]) {
  for (const value of values) {
    const normalized = text(value);
    if (normalized) return normalized;
  }
  return null;
}

export function normalizeTikzTags(value: unknown) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return [...new Set(source.map((item) => text(item)).filter(Boolean))].slice(0, 15).map((item) => item.slice(0, 50));
}

export function normalizeTikzSnippetRecord(value: unknown): TikzSnippet | null {
  const source = record(value);
  const id = text(source.id);
  const title = nullableText(source.title, source.name);
  const tikzCode = nullableText(source.tikz_code, source.tikzCode, source.code, source.content);
  if (!id || !title || !tikzCode || !/\\(?:begin\s*\{(?:tikzpicture|circuitikz)\}|draw\b|path\b|node\b|coordinate\b)/i.test(tikzCode)) return null;

  const rawScope = text(source.bank_scope ?? source.bankScope).toLowerCase();
  const scope: TikzBankScope = rawScope === "system" || source.is_shared === true || text(source.visibility) === "public" ? "system" : "user";
  const metadata = record(source.metadata);
  const now = new Date(0).toISOString();

  return {
    id,
    created_at: nullableText(source.created_at, source.createdAt) || now,
    updated_at: nullableText(source.updated_at, source.updatedAt, source.created_at, source.createdAt) || now,
    user_id: scope === "system" ? null : nullableText(source.user_id, source.userId, source.owner_id, source.ownerId),
    bank_scope: scope,
    title,
    description: nullableText(source.description),
    category: nullableText(source.category),
    subject: nullableText(source.subject, source.subject_name, source.subjectName),
    grade: nullableText(source.grade, source.class_name, source.className),
    tags: normalizeTikzTags(source.tags),
    tikz_code: tikzCode,
    full_latex: nullableText(source.full_latex, source.fullLatex, source.standalone_latex, source.standaloneLatex),
    preview_note: nullableText(source.preview_note, source.previewNote),
    source_type: nullableText(source.source_type, source.sourceType),
    needs_review: typeof source.needs_review === "boolean" ? source.needs_review : typeof source.needsReview === "boolean" ? source.needsReview : true,
    slug: nullableText(source.slug),
    subcategory: nullableText(source.subcategory),
    grades: normalizeTikzTags(source.grades),
    complexity: nullableText(source.complexity),
    package_dependencies: normalizeTikzTags(source.package_dependencies ?? source.packageDependencies),
    source_name: nullableText(source.source_name, source.sourceName),
    source_url: nullableText(source.source_url, source.sourceUrl),
    source_author: nullableText(source.source_author, source.sourceAuthor),
    source_license: nullableText(source.source_license, source.sourceLicense),
    originality_mode: nullableText(source.originality_mode, source.originalityMode),
    sha256: nullableText(source.sha256),
    imported_at: nullableText(source.imported_at, source.importedAt),
    metadata: scope === "system" ? {} : metadata,
  };
}

export function normalizeTikzSnippetRecords(values: unknown) {
  if (!Array.isArray(values)) return { snippets: [] as TikzSnippet[], rejected: 0 };
  const snippets: TikzSnippet[] = [];
  let rejected = 0;
  for (const value of values) {
    const normalized = normalizeTikzSnippetRecord(value);
    if (normalized) snippets.push(normalized);
    else rejected += 1;
  }
  return { snippets, rejected };
}

export function validateTikzSnippetInput(value: unknown):
  | { ok: true; data: TikzSnippetInput; warnings: string[] }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "Thông tin mã TikZ chưa hợp lệ." };
  const source = value as Record<string, unknown>;
  const data: TikzSnippetInput = {
    title: text(source.title),
    description: text(source.description) || null,
    category: text(source.category) || null,
    subject: text(source.subject) || null,
    grade: text(source.grade) || null,
    tags: normalizeTikzTags(source.tags),
    tikz_code: text(source.tikz_code),
    full_latex: text(source.full_latex) || null,
    preview_note: text(source.preview_note) || null,
    source_type: text(source.source_type) || "teacher_created",
    metadata: source.metadata && typeof source.metadata === "object" && !Array.isArray(source.metadata) ? source.metadata as Record<string, unknown> : undefined,
  };

  if (!data.title) return { ok: false, error: "Vui lòng nhập tiêu đề." };
  if (!data.tikz_code) return { ok: false, error: "Vui lòng nhập mã TikZ." };
  const safetyError = tikzSafetyError(data.tikz_code, data.full_latex);
  if (safetyError) return { ok: false, error: safetyError };
  for (const [key, max] of Object.entries(limits) as Array<[keyof typeof limits, number]>) {
    const current = data[key];
    if (typeof current === "string" && current.length > max) return { ok: false, error: `Trường “${key}” không được dài quá ${max} ký tự.` };
  }
  const hasPicture = /\\begin\s*\{(?:tikzpicture|circuitikz)\}/i.test(data.tikz_code);
  const hasCommand = /\\(?:draw|path|node|coordinate|fill|filldraw)\b/.test(data.tikz_code);
  if (!hasPicture && !hasCommand) return { ok: false, error: "Mã chưa có môi trường tikzpicture/circuitikz hoặc lệnh vẽ TikZ hợp lệ." };
  return { ok: true, data, warnings: hasPicture ? [] : ["Mã chưa có môi trường tikzpicture. Hãy kiểm tra lại trước khi biên dịch."] };
}

export function buildStandaloneLatex(tikzCode: string) {
  return `\\documentclass[tikz,border=5pt]{standalone}\n\\usepackage{tikz}\n\\begin{document}\n${tikzCode.trim()}\n\\end{document}\n`;
}

export function tikzFilename(title: string) {
  const slug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "hinh-ve";
  return `soan-lab-tikz-${slug}.tex`;
}
