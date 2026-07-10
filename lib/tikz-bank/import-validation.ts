import { normalizeTikzTags } from "@/lib/tikz-bank";

export type TikzImportStatus = "valid" | "warning" | "error";

export type TikzImportItem = {
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  subject: string | null;
  grade: string | null;
  grades: string[];
  tags: string[];
  complexity: string | null;
  tikz_code: string;
  full_latex: string | null;
  package_dependencies: string[];
  source_name: string | null;
  source_url: string | null;
  source_author: string | null;
  source_license: string | null;
  originality_mode: string | null;
  preview_note: string | null;
  needs_review: boolean;
  metadata: Record<string, unknown>;
};

export type TikzImportValidation = {
  status: TikzImportStatus;
  message: string;
  item: TikzImportItem | null;
};

const unsafePattern = /\\(?:write18|openin|openout|read|input|include|immediate)\b|\.\.[/\\]|https?:\/\/|shell[ -]?escape/i;
const supportedEnvironment = /\\begin\s*\{(?:tikzpicture|circuitikz|tikzcd)\}/i;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\r\n?/g, "\n").slice(0, max) : "";
}

function stringArray(value: unknown, limit = 30) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => clean(item, 100)).filter(Boolean))].slice(0, limit);
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try {
    const serialized = JSON.stringify(value);
    return serialized.length <= 10000 ? JSON.parse(serialized) as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function validateTikzImportItem(value: unknown): TikzImportValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { status: "error", message: "Mục dữ liệu chưa đúng định dạng.", item: null };
  const source = value as Record<string, unknown>;
  const slug = clean(source.slug, 180).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  const title = clean(source.title, 160);
  const tikzCode = clean(source.tikz_code, 30000);
  if (!slug || !title || !tikzCode) return { status: "error", message: "Thiếu slug, tiêu đề hoặc mã TikZ.", item: null };
  if (!supportedEnvironment.test(tikzCode)) return { status: "error", message: "Mã TikZ chưa có môi trường vẽ được hỗ trợ.", item: null };
  const fullLatex = clean(source.full_latex, 50000) || null;
  if (unsafePattern.test(`${tikzCode}\n${fullLatex || ""}`)) {
    return { status: "error", message: "Mã TikZ chứa lệnh không được hỗ trợ vì lý do an toàn.", item: null };
  }
  const category = clean(source.category, 100) || null;
  const subject = clean(source.subject, 100) || null;
  const tags = normalizeTikzTags(source.tags);
  const packages = stringArray(source.package_dependencies, 20);
  const sourceName = clean(source.source_name, 200) || null;
  const sourceLicense = clean(source.source_license, 100) || null;
  const recommendedMissing = [category, subject, tags.length ? "tags" : null, fullLatex, packages.length ? "packages" : null, sourceName, sourceLicense].filter((item) => !item).length;
  const item: TikzImportItem = {
    slug,
    title,
    description: clean(source.description, 1000) || null,
    category,
    subcategory: clean(source.subcategory, 100) || null,
    subject,
    grade: clean(source.grade, 60) || null,
    grades: stringArray(source.grades, 12),
    tags,
    complexity: clean(source.complexity, 30) || null,
    tikz_code: tikzCode,
    full_latex: fullLatex,
    package_dependencies: packages,
    source_name: sourceName,
    source_url: clean(source.source_url, 500) || null,
    source_author: clean(source.source_author, 200) || null,
    source_license: sourceLicense,
    originality_mode: clean(source.originality_mode, 80) || null,
    preview_note: clean(source.preview_note, 1000) || null,
    needs_review: typeof source.needs_review === "boolean" ? source.needs_review : true,
    metadata: safeMetadata(source.metadata),
  };
  return recommendedMissing
    ? { status: "warning", message: "Mã hợp lệ nhưng còn thiếu một số thông tin khuyến nghị.", item }
    : { status: "valid", message: "Mã hợp lệ.", item };
}

export function normalizeTikzCode(value: string) {
  return value.replace(/%[^\n]*/g, "").replace(/\s+/g, " ").trim();
}

export function parseTikzManifest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Tệp dữ liệu chưa đúng định dạng.");
  const manifest = value as Record<string, unknown>;
  if (!Array.isArray(manifest.items)) throw new Error("Tệp dữ liệu cần có danh sách items.");
  if (manifest.items.length > 1000) throw new Error("Bộ dữ liệu có quá nhiều mục. Vui lòng chia thành các tệp nhỏ hơn.");
  return {
    version: clean(manifest.version, 40) || "không rõ",
    product: clean(manifest.product, 100),
    items: manifest.items,
  };
}
