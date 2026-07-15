import { stableHash } from "@/lib/answer-solutions/hash";
import type { PageClassificationInput, RecognitionBlock, RecognitionDocument, RecognitionPageType } from "@/lib/document-recognition/types";

export const RECOGNITION_MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const RECOGNITION_MAX_PDF_SIZE = 40 * 1024 * 1024;
export const RECOGNITION_MAX_PAGES = 30;
export const recognitionImageMimes = new Set(["image/png", "image/jpeg", "image/webp"]);

export function sanitizeRecognitionFileName(value: string) {
  return value.replace(/[\\/]/g, "_").replace(/[\u0000-\u001f<>:"|?*]/g, "_").replace(/\.{2,}/g, ".").slice(0, 180) || "tai-lieu";
}

export function extensionOf(value: string) {
  return value.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
}

export function validateRecognitionFile(input: { name: string; type: string; size: number; bytes?: Uint8Array }) {
  const extension = extensionOf(input.name);
  if (extension === ".heic" || input.type === "image/heic") throw new Error("heic_unsupported");
  const isPdf = extension === ".pdf" && input.type === "application/pdf";
  const isImage = [".png", ".jpg", ".jpeg", ".webp"].includes(extension) && recognitionImageMimes.has(input.type);
  if (!isPdf && !isImage) throw new Error("unsupported_file");
  if (isPdf && input.size > RECOGNITION_MAX_PDF_SIZE || isImage && input.size > RECOGNITION_MAX_IMAGE_SIZE) throw new Error("file_too_large");
  if (input.bytes?.length) {
    const bytes = input.bytes;
    const pdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
    const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const jpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (isPdf && !pdf || isImage && !(png || jpg || webp)) throw new Error("corrupt_file");
  }
  return { extension, kind: isPdf ? "pdf" as const : "image" as const, safeName: sanitizeRecognitionFileName(input.name) };
}

export function recognitionErrorMessage(reason: unknown) {
  const code = reason instanceof Error ? reason.message : String(reason || "unknown");
  if (code === "heic_unsupported") return "Định dạng HEIC chưa được hỗ trợ. Vui lòng chuyển ảnh sang JPG hoặc PNG.";
  if (code === "file_too_large") return "File vượt quá giới hạn cho phép. Vui lòng giảm dung lượng hoặc chia thành nhiều file.";
  if (code === "password_protected") return "File PDF đang được bảo vệ bằng mật khẩu. Vui lòng bỏ mật khẩu trước khi tải lên.";
  if (code === "too_many_pages") return `Tài liệu vượt quá ${RECOGNITION_MAX_PAGES} trang. Vui lòng chia thành nhiều file.`;
  if (code === "unsupported_file") return "SOẠN LAB hỗ trợ PNG, JPG/JPEG, WEBP và PDF.";
  return "SOẠN LAB không đọc được file này. Vui lòng kiểm tra và tải lại.";
}

function suspiciousEncoding(text: string) {
  const bad = (text.match(/[�\u0000-\u0008]/g) || []).length;
  return text.length > 0 && bad / text.length > 0.02;
}

export function classifyPdfPage(input: PageClassificationInput) {
  const compactLength = input.extractedText.replace(/\s/g, "").length;
  const pageArea = Math.max(1, Number(input.width || 1) * Number(input.height || 1));
  const textDensity = compactLength / pageArea;
  const hasTextObjects = Number(input.textObjectCount || 0) > 0;
  const imageCoverage = Math.max(0, Math.min(1, input.imageCoverage ?? (input.imageObjectCount ? 0.75 : 0)));
  let type: RecognitionPageType;
  const warnings: string[] = [];
  if (!compactLength && !input.imageObjectCount) type = "empty";
  else if (suspiciousEncoding(input.extractedText)) { type = "unreadable"; warnings.push("Lớp chữ của trang có dấu hiệu mã hóa không đọc được."); }
  else if (compactLength >= 80 && (hasTextObjects || textDensity > 0.00008) && (!input.imageObjectCount || imageCoverage < 0.25)) type = "text_layer";
  else if (compactLength >= 30 && input.imageObjectCount) type = "mixed";
  else if (compactLength < 30 && input.imageObjectCount) type = "scanned_image";
  else { type = "unreadable"; warnings.push("Trang có quá ít nội dung để nhận diện chắc chắn."); }
  return { pageNumber: input.pageNumber, type, textLength: input.extractedText.length, imageCoverage, recognitionRequired: type === "scanned_image" || type === "mixed", warnings };
}

export function hasBrokenFormula(value: string) {
  const braces = [...value].reduce((count, char) => count + (char === "{" ? 1 : char === "}" ? -1 : 0), 0);
  return braces !== 0 || /\\(?:frac|sqrt)\s*$/.test(value) || /\$[^$]*$/.test(value);
}

export function isBlankPixelSample(values: ArrayLike<number>, channels = 4) {
  if (!values.length || channels < 3) return true;
  let dark = 0; let distanceFromWhite = 0; let pixels = 0;
  for (let index = 0; index + 2 < values.length; index += channels) {
    const luminance = (Number(values[index]) + Number(values[index + 1]) + Number(values[index + 2])) / 3;
    if (luminance < 235) dark += 1;
    distanceFromWhite += Math.abs(255 - luminance); pixels += 1;
  }
  return pixels === 0 || dark / pixels < 0.002 && distanceFromWhite / pixels < 4;
}

export function recognitionSummary(document: RecognitionDocument) {
  const blocks = document.pages.flatMap((page) => page.blocks).filter((block) => !block.excluded);
  return {
    totalPages: document.pageCount,
    recognizedPages: document.pages.filter((page) => page.status === "recognized" || page.status === "needs_review").length,
    reviewPages: document.pages.filter((page) => page.status === "needs_review" || page.status === "failed").length,
    formulaReviewCount: blocks.filter((block) => block.type === "formula" && (block.confidence !== "high" || hasBrokenFormula(block.latex || block.text))).length,
    visualCount: blocks.filter((block) => ["table", "image", "graph", "geometric_figure"].includes(block.type)).length,
    questionCount: blocks.filter((block) => ["question", "essay_question"].includes(block.type)).length,
    lowConfidenceBlockCount: blocks.filter((block) => block.confidence === "low" && !block.reviewed).length,
  };
}

export function finalizationIssues(document: RecognitionDocument) {
  const summary = recognitionSummary(document);
  const blocks = document.pages.flatMap((page) => page.blocks).filter((block) => !block.excluded);
  const issues: string[] = [];
  if (!summary.questionCount) issues.push("Chưa nhận diện được câu hỏi hợp lệ.");
  if (document.pages.some((page) => page.status === "failed")) issues.push("Có trang chưa đọc thành công. Vui lòng thử lại hoặc bỏ qua trang.");
  if (summary.lowConfidenceBlockCount) issues.push("Vẫn còn nội dung độ tin cậy thấp chưa được xác nhận.");
  if (blocks.some((block) => block.type === "option" && !block.parentBlockId && !block.questionId)) issues.push("Có phương án chưa được gắn với câu hỏi.");
  if (blocks.some((block) => block.type === "true_false_statement" && !block.parentBlockId && !block.questionId)) issues.push("Có mệnh đề Đúng/Sai chưa được gắn với câu hỏi.");
  if (blocks.some((block) => block.type === "formula" && hasBrokenFormula(block.latex || block.text))) issues.push("Có công thức chưa khép đủ dấu hoặc chưa nhận dạng hoàn chỉnh.");
  if (blocks.some((block) => block.type === "answer_key" && block.confidence === "low" && !block.reviewed)) issues.push("Có đáp án độ tin cậy thấp chưa được xác nhận.");
  const visualTypes = new Set(["image", "graph", "geometric_figure", "table"]);
  if (document.pages.some((page) => page.blocks.some((block) => !block.excluded && visualTypes.has(block.type) && !block.sourceCrop && !page.adjustedDataUrl && !page.sourceDataUrl && block.type !== "table"))) issues.push("Có hình tham chiếu nhưng chưa còn dữ liệu ảnh.");
  return [...new Set(issues)];
}

export function recognitionDocumentHash(value: unknown) {
  return stableHash(value);
}

export function stripLargeRecognitionAssets(document: RecognitionDocument): RecognitionDocument {
  return { ...document, pages: document.pages.map((page) => ({ ...page, sourceDataUrl: page.sourceDataUrl && page.sourceDataUrl.length <= 350_000 ? page.sourceDataUrl : undefined, adjustedDataUrl: page.adjustedDataUrl && page.adjustedDataUrl.length <= 350_000 ? page.adjustedDataUrl : undefined, blocks: page.blocks.map((block) => ({ ...block, sourceCrop: block.sourceCrop && block.sourceCrop.length <= 180_000 ? block.sourceCrop : undefined })) })) };
}

export function blockCacheKey(block: Pick<RecognitionBlock, "pageNumber" | "type" | "text" | "latex" | "boundingBox">) {
  return stableHash(block);
}
