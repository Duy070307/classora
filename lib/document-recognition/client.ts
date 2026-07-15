"use client";

import { classifyPdfPage, isBlankPixelSample, recognitionDocumentHash, RECOGNITION_MAX_PAGES, validateRecognitionFile } from "@/lib/document-recognition/validation";
import { textToRecognitionBlocks } from "@/lib/document-recognition/layout";
import type { RecognitionPage } from "@/lib/document-recognition/types";

export type PreparedRecognitionPage = RecognitionPage & { imageBlob?: Blob; extractedText?: string };

async function fileHash(data: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function canvasBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.9) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("corrupt_file")), type, quality));
}

function blankCanvas(context: CanvasRenderingContext2D, width: number, height: number) {
  const sampleWidth = Math.min(160, width); const sampleHeight = Math.min(220, height);
  const canvas = document.createElement("canvas"); canvas.width = sampleWidth; canvas.height = sampleHeight;
  const target = canvas.getContext("2d", { willReadFrequently: true }); if (!target) return false;
  target.drawImage(context.canvas, 0, 0, width, height, 0, 0, sampleWidth, sampleHeight);
  const data = target.getImageData(0, 0, sampleWidth, sampleHeight).data;
  return isBlankPixelSample(data);
}

function detectBrightPageBoundary(bitmap: ImageBitmap) {
  const width = Math.min(180, bitmap.width); const height = Math.max(1, Math.round(width * bitmap.height / bitmap.width));
  const sample = document.createElement("canvas"); sample.width = width; sample.height = height;
  const context = sample.getContext("2d", { willReadFrequently: true });
  if (!context) return { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  context.drawImage(bitmap, 0, 0, width, height); const pixels = context.getImageData(0, 0, width, height).data;
  const luminance = (x: number, y: number) => { const index = (y * width + x) * 4; return (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3; };
  const corner = (luminance(0, 0) + luminance(width - 1, 0) + luminance(0, height - 1) + luminance(width - 1, height - 1)) / 4;
  if (corner > 225) return { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  const threshold = Math.min(245, Math.max(190, corner + 28)); let minX = width; let minY = height; let maxX = -1; let maxY = -1;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) if (luminance(x, y) >= threshold) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  const area = maxX >= minX && maxY >= minY ? (maxX - minX + 1) * (maxY - minY + 1) / (width * height) : 0;
  if (area < 0.35 || area > 0.98) return { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  const margin = 3; minX = Math.max(0, minX - margin); minY = Math.max(0, minY - margin); maxX = Math.min(width - 1, maxX + margin); maxY = Math.min(height - 1, maxY + margin);
  return { x: Math.round(minX / width * bitmap.width), y: Math.round(minY / height * bitmap.height), width: Math.max(1, Math.round((maxX - minX + 1) / width * bitmap.width)), height: Math.max(1, Math.round((maxY - minY + 1) / height * bitmap.height)) };
}

export async function normalizeImageBlob(blob: Blob, rotation: 0 | 90 | 180 | 270 = 0) {
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const crop = detectBrightPageBoundary(bitmap);
  const maxSide = 2200; const scale = Math.min(1, maxSide / Math.max(crop.width, crop.height));
  const sourceWidth = Math.max(1, Math.round(crop.width * scale)); const sourceHeight = Math.max(1, Math.round(crop.height * scale));
  const rotated = rotation === 90 || rotation === 270;
  const canvas = document.createElement("canvas"); canvas.width = rotated ? sourceHeight : sourceWidth; canvas.height = rotated ? sourceWidth : sourceHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true }); if (!context) throw new Error("corrupt_file");
  context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height);
  context.save(); context.translate(canvas.width / 2, canvas.height / 2); context.rotate(rotation * Math.PI / 180);
  context.filter = "contrast(1.08) brightness(1.03)"; context.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight); context.restore(); bitmap.close();
  const normalized = await canvasBlob(canvas);
  return { blob: normalized, dataUrl: canvas.toDataURL("image/jpeg", 0.88), blank: blankCanvas(context, canvas.width, canvas.height), width: canvas.width, height: canvas.height };
}

export async function cropRecognitionBlock(blob: Blob, boundingBox: { x: number; y: number; width: number; height: number }) {
  const bitmap = await createImageBitmap(blob); const padding = 0.012;
  const x = Math.max(0, Math.floor((boundingBox.x - padding) * bitmap.width)); const y = Math.max(0, Math.floor((boundingBox.y - padding) * bitmap.height));
  const width = Math.max(1, Math.min(bitmap.width - x, Math.ceil((boundingBox.width + padding * 2) * bitmap.width))); const height = Math.max(1, Math.min(bitmap.height - y, Math.ceil((boundingBox.height + padding * 2) * bitmap.height)));
  const scale = Math.min(1, 1000 / Math.max(width, height)); const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d"); if (!context) { bitmap.close(); return undefined; }
  context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, x, y, width, height, 0, 0, canvas.width, canvas.height); bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82); return dataUrl.length <= 600_000 ? dataUrl : undefined;
}

async function imagePage(file: File, hash: string): Promise<PreparedRecognitionPage> {
  const normalized = await normalizeImageBlob(file);
  return { pageNumber: 1, type: normalized.blank ? "empty" : "scanned_image", textLength: 0, imageCoverage: normalized.blank ? 0 : 1, recognitionRequired: !normalized.blank, warnings: normalized.blank ? ["Trang có vẻ trống."] : [], blocks: [], sourceDataUrl: URL.createObjectURL(file), adjustedDataUrl: normalized.dataUrl, rotation: 0, status: normalized.blank ? "needs_review" : "pending", cacheKey: `${hash}:1`, imageBlob: normalized.blob };
}

function textFromContent(items: Array<{ str?: string; hasEOL?: boolean }>) {
  return items.map((item) => `${item.str || ""}${item.hasEOL ? "\n" : " "}`).join("").replace(/[ \t]+\n/g, "\n").trim();
}

async function pdfPages(file: File, buffer: ArrayBuffer, hash: string): Promise<PreparedRecognitionPage[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  let pdf;
  try { pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, useWorkerFetch: false }).promise; }
  catch (error) { if (error instanceof Error && /password/i.test(`${error.name} ${error.message}`)) throw new Error("password_protected"); throw new Error("corrupt_file"); }
  if (pdf.numPages > RECOGNITION_MAX_PAGES) throw new Error("too_many_pages");
  const pages: PreparedRecognitionPage[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const extractedText = textFromContent(textContent.items as Array<{ str?: string; hasEOL?: boolean }>);
    const operators = await page.getOperatorList();
    const imageFunctions = new Set([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject, pdfjs.OPS.paintImageMaskXObject]);
    const imageObjectCount = operators.fnArray.filter((value) => imageFunctions.has(value)).length;
    const baseViewport = page.getViewport({ scale: 1 });
    const classification = classifyPdfPage({ pageNumber, extractedText, imageObjectCount, imageCoverage: imageObjectCount ? extractedText.replace(/\s/g, "").length < 30 ? 0.9 : 0.4 : 0, width: baseViewport.width, height: baseViewport.height, textObjectCount: textContent.items.length });
    let imageBlob: Blob | undefined; let dataUrl: string | undefined;
    if (classification.recognitionRequired) {
      const viewport = page.getViewport({ scale: Math.min(2.2, 1800 / baseViewport.width) });
      const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { willReadFrequently: true }); if (!context) throw new Error("corrupt_file");
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      imageBlob = await canvasBlob(canvas); dataUrl = canvas.toDataURL("image/jpeg", 0.86);
    }
    pages.push({ ...classification, blocks: classification.type === "text_layer" ? textToRecognitionBlocks(extractedText, pageNumber) : [], adjustedDataUrl: dataUrl, rotation: 0, status: classification.type === "text_layer" ? "recognized" : classification.type === "empty" || classification.type === "unreadable" ? "needs_review" : "pending", cacheKey: `${hash}:${pageNumber}`, imageBlob, extractedText });
    page.cleanup();
  }
  await pdf.destroy();
  return pages;
}

export async function prepareRecognitionFile(file: File) {
  const buffer = await file.arrayBuffer();
  validateRecognitionFile({ name: file.name, type: file.type, size: file.size, bytes: new Uint8Array(buffer.slice(0, 16)) });
  const hash = await fileHash(buffer);
  const pages = file.type === "application/pdf" ? await pdfPages(file, buffer, hash) : [await imagePage(file, hash)];
  const sourceType = file.type !== "application/pdf" ? "image" as const : pages.every((page) => page.type === "text_layer") ? "text_pdf" as const : pages.some((page) => page.type === "text_layer" || page.type === "mixed") ? "mixed_pdf" as const : "scanned_pdf" as const;
  return { pages, sourceType, documentHash: recognitionDocumentHash({ hash, pages: pages.map((page) => ({ pageNumber: page.pageNumber, type: page.type, cacheKey: page.cacheKey })) }) };
}

const cachePrefix = "soanlab-recognition-page:";
export function readPageCache(key?: string) {
  if (!key) return null;
  try { const value = JSON.parse(localStorage.getItem(`${cachePrefix}${key}`) || "null") as Pick<RecognitionPage, "blocks" | "warnings"> | null; return value?.blocks ? value : null; } catch { return null; }
}
export function writePageCache(key: string | undefined, value: Pick<RecognitionPage, "blocks" | "warnings">) {
  if (!key) return;
  try { localStorage.setItem(`${cachePrefix}${key}`, JSON.stringify(value)); } catch { /* Trình duyệt có thể giới hạn bộ nhớ; kết quả hiện tại vẫn được giữ trong phiên. */ }
}
