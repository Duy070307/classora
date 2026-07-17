import { createHash } from "node:crypto";
import sharp from "sharp";

export type PreprocessSettings = { rotation?: -90 | 0 | 90 | 180; contrast?: "normal" | "enhanced"; useOriginal?: boolean };
type Cached = { base64: string; mimeType: "image/png"; sourceHash: string; originalWidth?: number; originalHeight?: number; processedWidth?: number; processedHeight?: number; warnings: string[] };
const cache = new Map<string, Cached>();

export async function preprocessDiagramImage(buffer: Buffer, settings: PreprocessSettings = {}): Promise<Cached> {
  const sourceHash = createHash("sha256").update(buffer).digest("hex"); const cacheKey = `${sourceHash}:${JSON.stringify(settings)}`; const cached = cache.get(cacheKey); if (cached) return cached;
  let image = sharp(buffer, { failOn: "error", limitInputPixels: 40_000_000 }).rotate(); const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error("invalid_image");
  if (settings.rotation) image = image.rotate(settings.rotation);
  if (!settings.useOriginal) image = image.flatten({ background: "#ffffff" }).resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true }).grayscale().normalize();
  if (settings.contrast === "enhanced") image = image.linear(1.12, -8).sharpen({ sigma: 0.6, m1: 0.4, m2: 1.2 });
  else if (!settings.useOriginal) image = image.sharpen({ sigma: 0.35, m1: 0.25, m2: 0.7 });
  const { data, info } = await image.png({ compressionLevel: 8 }).toBuffer({ resolveWithObject: true });
  const result: Cached = { base64: data.toString("base64"), mimeType: "image/png", sourceHash, originalWidth: metadata.width, originalHeight: metadata.height, processedWidth: info.width, processedHeight: info.height, warnings: [] };
  cache.set(cacheKey, result); if (cache.size > 24) cache.delete(cache.keys().next().value!); return result;
}
