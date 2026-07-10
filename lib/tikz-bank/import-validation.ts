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

const unsafeCommandPattern = /\\(?:write18|openin|openout|read|input|include|immediate)(?![A-Za-z@])/i;
const unsafeResourcePattern = /\.\.[/\\]|https?:\/\/|shell[ -]?escape/i;
const supportedEnvironment = /\\begin\s*\{(?:tikzpicture|circuitikz)\}/i;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\r\n?/g, "\n").slice(0, max) : "";
}

function stringArray(value: unknown, limit = 30) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => clean(item, 100)).filter(Boolean))].slice(0, limit);
}

function tags(value: unknown) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return [...new Set(source.map((item) => clean(item, 50)).filter(Boolean))].slice(0, 15);
}

function alias(source: Record<string, unknown>, snakeCase: string, camelCase: string) {
  return source[snakeCase] !== undefined ? source[snakeCase] : source[camelCase];
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

export function validateTikzImportItem(value: unknown, index?: number): TikzImportValidation {
  const prefix = typeof index === "number" ? `Mục số ${index + 1}` : "Mục dữ liệu";
  if (!value || typeof value !== "object" || Array.isArray(value)) return { status: "error", message: `${prefix} chưa đúng định dạng.`, item: null };
  const source = value as Record<string, unknown>;
  const slug = clean(source.slug, 180).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  const title = clean(source.title, 160);
  const tikzCode = clean(alias(source, "tikz_code", "tikzCode"), 30000);
  if (!slug) return { status: "error", message: `${prefix} thiếu slug.`, item: null };
  if (!title) return { status: "error", message: `${prefix} thiếu title.`, item: null };
  if (!tikzCode) return { status: "error", message: `${prefix} thiếu tikz_code.`, item: null };
  if (!supportedEnvironment.test(tikzCode)) return { status: "error", message: `${prefix} chưa có môi trường tikzpicture hoặc circuitikz.`, item: null };
  const fullLatex = clean(alias(source, "full_latex", "fullLatex"), 50000) || null;
  if (unsafeCommandPattern.test(`${tikzCode}\n${fullLatex || ""}`) || unsafeResourcePattern.test(`${tikzCode}\n${fullLatex || ""}`)) {
    return { status: "error", message: `${prefix}: Mã TikZ chứa lệnh không được hỗ trợ vì lý do an toàn.`, item: null };
  }
  const category = clean(source.category, 100) || null;
  const subject = clean(source.subject, 100) || null;
  const normalizedTags = tags(source.tags);
  const packages = stringArray(alias(source, "package_dependencies", "packageDependencies"), 20);
  const sourceName = clean(alias(source, "source_name", "sourceName"), 200) || null;
  const sourceLicense = clean(alias(source, "source_license", "sourceLicense"), 100) || null;
  const recommendedMissing = [category, subject, normalizedTags.length ? "tags" : null, fullLatex, packages.length ? "packages" : null, sourceName, sourceLicense].filter((item) => !item).length;
  const item: TikzImportItem = {
    slug,
    title,
    description: clean(source.description, 1000) || null,
    category,
    subcategory: clean(source.subcategory, 100) || null,
    subject,
    grade: clean(source.grade, 60) || null,
    grades: stringArray(source.grades, 12),
    tags: normalizedTags,
    complexity: clean(source.complexity, 30) || null,
    tikz_code: tikzCode,
    full_latex: fullLatex,
    package_dependencies: packages,
    source_name: sourceName,
    source_url: clean(alias(source, "source_url", "sourceUrl"), 500) || null,
    source_author: clean(alias(source, "source_author", "sourceAuthor"), 200) || null,
    source_license: sourceLicense,
    originality_mode: clean(alias(source, "originality_mode", "originalityMode"), 80) || null,
    preview_note: clean(alias(source, "preview_note", "previewNote"), 1000) || null,
    needs_review: typeof alias(source, "needs_review", "needsReview") === "boolean" ? Boolean(alias(source, "needs_review", "needsReview")) : true,
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
  if (Array.isArray(value)) {
    if (value.length > 1000) throw new Error("Bộ dữ liệu có quá nhiều mục. Vui lòng chia thành các tệp nhỏ hơn.");
    return { version: "không rõ", product: "", items: value };
  }
  if (!value || typeof value !== "object") throw new Error("JSON không đúng cấu trúc.");
  const manifest = value as Record<string, unknown>;
  if (!("items" in manifest)) throw new Error("Không tìm thấy trường items.");
  if (!Array.isArray(manifest.items)) throw new Error("Trường items phải là một danh sách.");
  if (manifest.items.length > 1000) throw new Error("Bộ dữ liệu có quá nhiều mục. Vui lòng chia thành các tệp nhỏ hơn.");
  return {
    version: clean(manifest.version, 40) || "không rõ",
    product: clean(manifest.product, 100),
    items: manifest.items,
  };
}
