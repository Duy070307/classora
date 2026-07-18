import { createHash } from "node:crypto";
import sharp from "sharp";
import type { SourceBox, TikzPreprocessingSettings } from "@/lib/tikz/types";

export type PreprocessSettings = Partial<TikzPreprocessingSettings>;
type Cached = {
  base64: string;
  mimeType: "image/png";
  sourceHash: string;
  settingsHash: string;
  originalWidth?: number;
  originalHeight?: number;
  processedWidth?: number;
  processedHeight?: number;
  deskewAngle: number;
  rotationConfidence: number;
  appliedSettings: TikzPreprocessingSettings;
  warnings: string[];
};
const cache = new Map<string, Cached>();

const defaults: TikzPreprocessingSettings = { rotation: 0, perspectiveCorrection: false, deskew: false, grayscale: true, contrast: "normal", thresholdMode: "none", denoise: false, lineEnhancement: true, useOriginal: false };

function normalizeCrop(crop: SourceBox | undefined, width: number, height: number) {
  if (!crop) return undefined;
  const left = Math.max(0, Math.min(width - 1, Math.round(crop.x))); const top = Math.max(0, Math.min(height - 1, Math.round(crop.y)));
  const cropWidth = Math.max(1, Math.min(width - left, Math.round(crop.width))); const cropHeight = Math.max(1, Math.min(height - top, Math.round(crop.height)));
  return { left, top, width: cropWidth, height: cropHeight };
}

async function estimateDeskew(buffer: Buffer) {
  const { data, info } = await sharp(buffer).rotate().resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true }).grayscale().raw().toBuffer({ resolveWithObject: true });
  const points: Array<[number, number]> = [];
  for (let y = 0; y < info.height; y += 3) for (let x = 0; x < info.width; x += 3) if (data[y * info.width + x] < 115) points.push([x, y]);
  if (points.length < 40) return { angle: 0, confidence: 0 };
  const meanX = points.reduce((sum, point) => sum + point[0], 0) / points.length; const meanY = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  let xx = 0; let yy = 0; let xy = 0;
  for (const [x, y] of points) { const dx = x - meanX; const dy = y - meanY; xx += dx * dx; yy += dy * dy; xy += dx * dy; }
  let angle = 0.5 * Math.atan2(2 * xy, xx - yy) * 180 / Math.PI;
  while (angle > 45) angle -= 90; while (angle < -45) angle += 90;
  const spread = Math.sqrt((xx - yy) ** 2 + 4 * xy ** 2); const confidence = Math.min(1, spread / Math.max(1, xx + yy));
  return Math.abs(angle) <= 7 && confidence >= 0.12 ? { angle, confidence } : { angle: 0, confidence };
}

export async function preprocessDiagramImage(buffer: Buffer, input: PreprocessSettings = {}): Promise<Cached> {
  const settings: TikzPreprocessingSettings = { ...defaults, ...input, cropBounds: input.cropBounds };
  const sourceHash = createHash("sha256").update(buffer).digest("hex"); const settingsHash = createHash("sha256").update(JSON.stringify(settings)).digest("hex"); const cacheKey = `${sourceHash}:${settingsHash}`; const cached = cache.get(cacheKey); if (cached) return cached;
  let image = sharp(buffer, { failOn: "error", limitInputPixels: 40_000_000 }).rotate(); const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error("invalid_image");
  const crop = normalizeCrop(settings.cropBounds, metadata.width, metadata.height); if (crop) image = image.extract(crop);
  if (settings.rotation) image = image.rotate(settings.rotation);
  let deskewAngle = 0; let rotationConfidence = 0;
  if (settings.deskew && !settings.useOriginal) { const estimate = await estimateDeskew(buffer); deskewAngle = estimate.angle; rotationConfidence = estimate.confidence; if (deskewAngle) image = image.rotate(-deskewAngle, { background: "#ffffff" }); }
  if (settings.perspectiveCorrection && !settings.useOriginal) image = image.flatten({ background: "#ffffff" }).trim({ background: "#ffffff", threshold: 12 });
  if (!settings.useOriginal) {
    image = image.flatten({ background: "#ffffff" }).resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true });
    if (settings.grayscale) image = image.grayscale();
    image = settings.contrast === "enhanced" ? image.clahe({ width: 3, height: 3, maxSlope: 3 }).linear(1.08, -5) : image.normalize();
    if (settings.thresholdMode === "adaptive") image = image.clahe({ width: 5, height: 5, maxSlope: 2 }).threshold(185);
    if (settings.denoise) image = image.median(3);
    if (settings.lineEnhancement) image = image.sharpen({ sigma: settings.thresholdMode === "adaptive" ? 0.45 : 0.6, m1: 0.35, m2: 1 });
  }
  const { data, info } = await image.png({ compressionLevel: 8 }).toBuffer({ resolveWithObject: true });
  const warnings: string[] = [];
  if (settings.perspectiveCorrection) warnings.push("Đã cắt biên nền tự động. Biến dạng phối cảnh mạnh vẫn cần giáo viên kiểm tra bằng ảnh gốc.");
  if (settings.deskew && !deskewAngle) warnings.push("Không phát hiện được góc nghiêng đủ tin cậy nên ảnh không bị xoay tự động.");
  const result: Cached = { base64: data.toString("base64"), mimeType: "image/png", sourceHash, settingsHash, originalWidth: metadata.width, originalHeight: metadata.height, processedWidth: info.width, processedHeight: info.height, deskewAngle, rotationConfidence, appliedSettings: settings, warnings };
  cache.set(cacheKey, result); if (cache.size > 24) cache.delete(cache.keys().next().value!); return result;
}

export function clearPreprocessCacheForTests() { cache.clear(); }
