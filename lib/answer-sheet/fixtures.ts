import type { AnswerSheetPageLayout, BoundingBox } from "@/lib/answer-sheet/types";
import type { GrayImage, SheetCorners } from "@/lib/answer-sheet/recognition";

export type SyntheticMark = { regionId: string; kind: "selected" | "faint" | "tick" | "cross" };

function point(corners: SheetCorners, u: number, v: number) {
  const topX = corners.topLeft.x + (corners.topRight.x - corners.topLeft.x) * u; const topY = corners.topLeft.y + (corners.topRight.y - corners.topLeft.y) * u;
  const bottomX = corners.bottomLeft.x + (corners.bottomRight.x - corners.bottomLeft.x) * u; const bottomY = corners.bottomLeft.y + (corners.bottomRight.y - corners.bottomLeft.y) * u;
  return { x: topX + (bottomX - topX) * v, y: topY + (bottomY - topY) * v };
}

function pixel(image: GrayImage, x: number, y: number, value: number) {
  if (x >= 0 && y >= 0 && x < image.width && y < image.height) image.data[Math.floor(y) * image.width + Math.floor(x)] = Math.min(image.data[Math.floor(y) * image.width + Math.floor(x)], value);
}

function fillSquare(image: GrayImage, center: { x: number; y: number }, size: number, value = 0) {
  for (let y = center.y - size / 2; y <= center.y + size / 2; y += 1) for (let x = center.x - size / 2; x <= center.x + size / 2; x += 1) pixel(image, x, y, value);
}

function drawBubble(image: GrayImage, center: { x: number; y: number }, radius: number, kind?: SyntheticMark["kind"]) {
  for (let y = -radius; y <= radius; y += 1) for (let x = -radius; x <= radius; x += 1) {
    const distance = Math.sqrt(x * x + y * y) / radius;
    if (distance > 0.78 && distance < 1.05) pixel(image, center.x + x, center.y + y, 30);
    if (kind === "selected" && distance < 0.68) pixel(image, center.x + x, center.y + y, 20);
    if (kind === "faint" && distance < 0.68 && (Math.floor(Math.abs(x * 17 + y * 31)) % 4 === 0)) pixel(image, center.x + x, center.y + y, 80);
    if (kind === "tick" && distance < 0.74 && (Math.abs(y - x * 0.7) < 1.2 || Math.abs(y + x * 1.6 - radius * 0.2) < 1.2)) pixel(image, center.x + x, center.y + y, 15);
    if (kind === "cross" && distance < 0.82 && (Math.abs(y - x) < 1.4 || Math.abs(y + x) < 1.4)) pixel(image, center.x + x, center.y + y, 10);
  }
}

function centerOf(box: BoundingBox, page: AnswerSheetPageLayout, corners: SheetCorners) {
  return point(corners, (box.x + box.width / 2) / page.width, (box.y + box.height / 2) / page.height);
}

export function renderAnswerSheetFixture(page: AnswerSheetPageLayout, marks: SyntheticMark[] = [], options: { perspective?: boolean; shadow?: boolean; missingAnchor?: number; scale?: number } = {}): GrayImage {
  const scale = options.scale || 1.4; const width = Math.round(page.width * scale); const height = Math.round(page.height * scale);
  const inset = 18;
  const corners: SheetCorners = options.perspective ? { topLeft: { x: inset + 16, y: inset }, topRight: { x: width - inset - 30, y: inset + 22 }, bottomRight: { x: width - inset, y: height - inset - 14 }, bottomLeft: { x: inset, y: height - inset - 35 } } : { topLeft: { x: inset, y: inset }, topRight: { x: width - inset, y: inset }, bottomRight: { x: width - inset, y: height - inset }, bottomLeft: { x: inset, y: height - inset } };
  const image: GrayImage = { width, height, data: new Uint8Array(width * height).fill(255) };
  const anchors = page.recognitionRegions.filter((region) => region.type === "anchor");
  anchors.forEach((region, index) => { if (index !== options.missingAnchor) fillSquare(image, centerOf(region.boundingBox, page, corners), Math.max(10, region.boundingBox.width * scale), 5); });
  const marksById = new Map(marks.map((mark) => [mark.regionId, mark.kind]));
  page.recognitionRegions.filter((region) => region.type === "bubble").forEach((region) => {
    const center = centerOf(region.boundingBox, page, corners);
    drawBubble(image, center, Math.max(5, region.boundingBox.width * scale * 0.48), marksById.get(region.id));
  });
  if (options.shadow) for (let y = 0; y < image.height; y += 1) for (let x = 0; x < image.width; x += 1) image.data[y * image.width + x] = Math.max(0, image.data[y * image.width + x] - Math.round(55 * x / image.width));
  return image;
}

export const ANSWER_SHEET_FIXTURE_NAMES = [
  "clean-unmarked-a4", "clear-mcq", "faint-pencil", "tick-marks", "crossed-replacement", "multiple-selection", "rotated-photo", "perspective-photo", "shadowed-photo", "low-resolution-copy", "missing-qr", "missing-anchor", "wrong-exam-code", "multi-page-12-4-6", "true-false", "numeric-short-answer",
] as const;
