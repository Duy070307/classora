import type { RecognizedAnswer } from "@/lib/grading/types";
import type { AnswerSheetLayout, AnswerSheetPageLayout, AnswerSheetScanResult, AnswerSheetTemplate, BoundingBox, DetectedBubble, RecognitionRegion } from "@/lib/answer-sheet/types";

export type GrayImage = { width: number; height: number; data: Uint8Array };
export type SheetCorners = { topLeft: Point; topRight: Point; bottomRight: Point; bottomLeft: Point };
type Point = { x: number; y: number };

export function rotateGrayCounterClockwise(image: GrayImage): GrayImage {
  const data = new Uint8Array(image.width * image.height);
  const width = image.height; const height = image.width;
  for (let y = 0; y < image.height; y += 1) for (let x = 0; x < image.width; x += 1) data[(image.width - 1 - x) * width + y] = image.data[y * image.width + x];
  return { width, height, data };
}

export function normalizeSheetOrientation(image: GrayImage, page: AnswerSheetPageLayout) {
  const imageLandscape = image.width > image.height; const pageLandscape = page.width > page.height;
  return imageLandscape === pageLandscape ? image : rotateGrayCounterClockwise(image);
}

function darkRatio(image: GrayImage, box: { x: number; y: number; width: number; height: number }, threshold = 120) {
  const x0 = Math.max(0, Math.floor(box.x)); const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(image.width, Math.ceil(box.x + box.width)); const y1 = Math.min(image.height, Math.ceil(box.y + box.height));
  if (x1 <= x0 || y1 <= y0) return 0;
  let dark = 0; let total = 0;
  for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) { total += 1; if (image.data[y * image.width + x] < threshold) dark += 1; }
  return total ? dark / total : 0;
}

function darkestInQuadrant(image: GrayImage, quadrant: "tl" | "tr" | "br" | "bl") {
  const searchWidth = Math.floor(image.width * 0.28); const searchHeight = Math.floor(image.height * 0.24);
  const startX = quadrant === "tr" || quadrant === "br" ? image.width - searchWidth : 0;
  const startY = quadrant === "bl" || quadrant === "br" ? image.height - searchHeight : 0;
  const windowSize = Math.max(7, Math.round(Math.min(image.width, image.height) * 0.018));
  let best = { ratio: 0, x: startX, y: startY };
  const step = Math.max(2, Math.floor(windowSize / 3));
  for (let y = startY; y <= startY + searchHeight - windowSize; y += step) for (let x = startX; x <= startX + searchWidth - windowSize; x += step) {
    const ratio = darkRatio(image, { x, y, width: windowSize, height: windowSize }, 145);
    if (ratio > best.ratio) best = { ratio, x, y };
  }
  return best.ratio >= 0.18 ? { x: best.x + windowSize / 2, y: best.y + windowSize / 2, strength: best.ratio } : null;
}

export function detectCornerAnchors(image: GrayImage): { corners: SheetCorners | null; confidence: "high" | "medium" | "low" } {
  const points = [darkestInQuadrant(image, "tl"), darkestInQuadrant(image, "tr"), darkestInQuadrant(image, "br"), darkestInQuadrant(image, "bl")];
  const found = points.filter(Boolean).length;
  if (found < 3) return { corners: null, confidence: "low" };
  const fallback = { tl: { x: image.width * 0.05, y: image.height * 0.05 }, tr: { x: image.width * 0.95, y: image.height * 0.05 }, br: { x: image.width * 0.95, y: image.height * 0.95 }, bl: { x: image.width * 0.05, y: image.height * 0.95 } };
  return { corners: { topLeft: points[0] || fallback.tl, topRight: points[1] || fallback.tr, bottomRight: points[2] || fallback.br, bottomLeft: points[3] || fallback.bl }, confidence: found === 4 ? "high" : "medium" };
}

function bilinear(corners: SheetCorners, u: number, v: number): Point {
  const top = { x: corners.topLeft.x + (corners.topRight.x - corners.topLeft.x) * u, y: corners.topLeft.y + (corners.topRight.y - corners.topLeft.y) * u };
  const bottom = { x: corners.bottomLeft.x + (corners.bottomRight.x - corners.bottomLeft.x) * u, y: corners.bottomLeft.y + (corners.bottomRight.y - corners.bottomLeft.y) * u };
  return { x: top.x + (bottom.x - top.x) * v, y: top.y + (bottom.y - top.y) * v };
}

function mappedBox(box: BoundingBox, page: AnswerSheetPageLayout, corners: SheetCorners) {
  const anchorCenter = 34.5;
  const normalizedX = (value: number) => (value - anchorCenter) / (page.width - anchorCenter * 2);
  const normalizedY = (value: number) => (value - anchorCenter) / (page.height - anchorCenter * 2);
  const topLeft = bilinear(corners, normalizedX(box.x), normalizedY(box.y));
  const bottomRight = bilinear(corners, normalizedX(box.x + box.width), normalizedY(box.y + box.height));
  return { x: Math.min(topLeft.x, bottomRight.x), y: Math.min(topLeft.y, bottomRight.y), width: Math.abs(bottomRight.x - topLeft.x), height: Math.abs(bottomRight.y - topLeft.y) };
}

function bubbleMetrics(image: GrayImage, box: BoundingBox) {
  const cx = box.x + box.width / 2; const cy = box.y + box.height / 2;
  const rx = Math.max(2, box.width * 0.34); const ry = Math.max(2, box.height * 0.34);
  const pixels: number[] = []; const diagonalPixels: number[] = []; const backgroundPixels: number[] = [];
  for (let y = Math.max(0, Math.floor(cy - ry * 1.8)); y <= Math.min(image.height - 1, Math.ceil(cy + ry * 1.8)); y += 1) for (let x = Math.max(0, Math.floor(cx - rx * 1.8)); x <= Math.min(image.width - 1, Math.ceil(cx + rx * 1.8)); x += 1) {
    const dx = (x - cx) / rx; const dy = (y - cy) / ry; const distance = dx * dx + dy * dy;
    if (distance > 1.7 && distance < 3.1) backgroundPixels.push(image.data[y * image.width + x]);
  }
  const background = backgroundPixels.length ? backgroundPixels.reduce((sum, value) => sum + value, 0) / backgroundPixels.length : 245;
  const darkThreshold = Math.max(55, Math.min(210, background - 32));
  for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(image.height - 1, Math.ceil(cy + ry)); y += 1) for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(image.width - 1, Math.ceil(cx + rx)); x += 1) {
    const dx = (x - cx) / rx; const dy = (y - cy) / ry;
    if (dx * dx + dy * dy > 1) continue;
    const value = image.data[y * image.width + x]; pixels.push(value);
    if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 0.2) diagonalPixels.push(value);
  }
  if (!pixels.length) return { coverage: 0, mean: 255, diagonal: 0, damaged: true };
  const mean = pixels.reduce((sum, value) => sum + value, 0) / pixels.length;
  const coverage = pixels.filter((value) => value < darkThreshold).length / pixels.length;
  const diagonal = diagonalPixels.length ? diagonalPixels.filter((value) => value < darkThreshold).length / diagonalPixels.length : 0;
  return { coverage, mean, diagonal, damaged: box.x < 0 || box.y < 0 || box.x + box.width > image.width || box.y + box.height > image.height };
}

export function detectBubble(image: GrayImage, page: AnswerSheetPageLayout, region: RecognitionRegion, corners: SheetCorners): DetectedBubble {
  const box = mappedBox(region.boundingBox, page, corners);
  const metrics = bubbleMetrics(image, box);
  let state: DetectedBubble["state"] = "blank"; let confidence: DetectedBubble["confidence"] = "high";
  if (metrics.damaged) { state = "damaged"; confidence = "low"; }
  else if (metrics.coverage >= 0.34) { state = "selected"; confidence = "high"; }
  else if (metrics.diagonal > 0.48 && metrics.coverage < 0.34) { state = "crossed_out"; confidence = "low"; }
  else if (metrics.coverage >= 0.16) { state = "faint_selected"; confidence = "medium"; }
  else if (metrics.coverage >= 0.075) { state = "unclear"; confidence = "low"; }
  return { regionId: region.id, questionId: region.questionId, questionNumber: region.questionNumber, statementId: region.statementId, optionValue: region.optionValue, state, confidence, inkCoverage: Number(metrics.coverage.toFixed(3)) };
}

function markMultipleSelections(bubbles: DetectedBubble[]) {
  const groups = new Map<string, DetectedBubble[]>();
  bubbles.forEach((bubble) => {
    const key = `${bubble.questionId || bubble.questionNumber}:${bubble.statementId || "question"}`;
    groups.set(key, [...(groups.get(key) || []), bubble]);
  });
  groups.forEach((items) => {
    const marked = items.filter((item) => item.state === "selected" || item.state === "faint_selected");
    if (marked.length > 1) marked.forEach((item) => { item.state = "multiple_selected"; item.confidence = "low"; });
    if (items.some((item) => item.state === "crossed_out") && marked.length) marked.forEach((item) => { item.confidence = "medium"; });
  });
  return bubbles;
}

export function recognizeAnswerSheetPage(image: GrayImage, template: AnswerSheetTemplate, layout: AnswerSheetLayout, pageNumber: number, qrValid = false): AnswerSheetScanResult {
  const page = layout.pages.find((item) => item.pageNumber === pageNumber) || layout.pages[0];
  if (!page) return { templateId: template.recognition.templateId, variantCode: template.variantCode, pageNumber, qrValid, alignment: "failed", bubbles: [], missingPages: [], duplicatePages: [], warnings: ["Không tìm thấy bản đồ trang tương ứng."], genericOcrUsed: false };
  image = normalizeSheetOrientation(image, page);
  const anchors = detectCornerAnchors(image);
  if (!page || !anchors.corners) return { templateId: template.recognition.templateId, variantCode: template.variantCode, pageNumber, qrValid, alignment: "failed", bubbles: [], missingPages: [], duplicatePages: [], warnings: ["Không xác định được đủ điểm định vị của phiếu."], genericOcrUsed: false };
  const bubbles = markMultipleSelections(page.recognitionRegions.filter((region) => region.type === "bubble").map((region) => detectBubble(image, page, region, anchors.corners!)));
  return { templateId: template.recognition.templateId, variantCode: template.variantCode, pageNumber, qrValid, alignment: anchors.confidence === "high" ? "aligned" : "partial", bubbles, missingPages: [], duplicatePages: [], warnings: anchors.confidence === "medium" ? ["Thiếu một điểm định vị; kết quả cần được giáo viên rà soát."] : [], genericOcrUsed: false };
}

export function bubblesToRecognizedAnswers(template: AnswerSheetTemplate, bubbles: DetectedBubble[], pageNumber = 1): RecognizedAnswer[] {
  const answers: RecognizedAnswer[] = [];
  for (const section of template.sections) {
    if (section.type === "multiple_choice") section.questions.forEach((question) => {
      const row = bubbles.filter((bubble) => bubble.questionId === question.questionId && !bubble.statementId);
      const marked = row.filter((bubble) => bubble.state === "selected" || bubble.state === "faint_selected" || bubble.state === "multiple_selected");
      const unclear = row.some((bubble) => bubble.state === "unclear" || bubble.state === "damaged" || bubble.state === "crossed_out");
      answers.push({ questionId: question.questionId, questionNumber: question.questionNumber, rawValue: marked.map((item) => item.optionValue).join(","), normalizedValue: marked.length === 1 ? marked[0].optionValue : marked.map((item) => item.optionValue || ""), confidence: marked.length === 1 && !unclear ? marked[0].confidence : marked.length || unclear ? "low" : "high", sourcePage: pageNumber, warnings: marked.length > 1 ? ["Phát hiện nhiều lựa chọn."] : marked.some((item) => item.state === "faint_selected") ? ["Dấu tô mờ cần giáo viên xác nhận."] : unclear ? ["Có dấu sửa hoặc vùng chưa rõ, cần giáo viên kiểm tra."] : undefined });
    });
    if (section.type === "true_false") section.questions.forEach((question) => {
      const values: boolean[] = []; let confidence: RecognizedAnswer["confidence"] = "high"; const warnings: string[] = [];
      question.statements.forEach((statement) => {
        const row = bubbles.filter((bubble) => bubble.statementId === statement.statementId && (bubble.state === "selected" || bubble.state === "faint_selected" || bubble.state === "multiple_selected"));
        if (row.length !== 1) { confidence = "low"; warnings.push(`Mệnh đề ${statement.label} chưa có một lựa chọn rõ ràng.`); values.push(false); }
        else { values.push(row[0].optionValue === "true"); if (row[0].confidence !== "high" && confidence !== "low") confidence = row[0].confidence; }
      });
      answers.push({ questionId: question.questionId, questionNumber: question.questionNumber, rawValue: values.map((value) => value ? "Đ" : "S").join(""), normalizedValue: values, confidence, sourcePage: pageNumber, warnings: warnings.length ? warnings : undefined });
    });
  }
  return answers;
}

export function shortAnswerRegionsToRecognizedAnswers(page: AnswerSheetPageLayout, sourceCrops: Record<string, string> = {}): RecognizedAnswer[] {
  const seen = new Set<string>();
  return page.recognitionRegions
    .filter((region) => region.type === "short_answer" && region.questionId && !seen.has(region.questionId) && seen.add(region.questionId))
    .map((region) => ({
      questionId: region.questionId,
      questionNumber: region.questionNumber || 0,
      rawValue: "",
      normalizedValue: "",
      confidence: "low" as const,
      sourcePage: page.pageNumber,
      sourceRegion: {
        x: region.boundingBox.x / page.width,
        y: region.boundingBox.y / page.height,
        width: region.boundingBox.width / page.width,
        height: region.boundingBox.height / page.height,
      },
      sourceCrop: sourceCrops[region.id],
      warnings: ["Câu trả lời viết tay cần giáo viên đọc và xác nhận."],
      teacherConfirmed: false,
    }));
}

export function detectPageSet(expectedPages: number[], scannedPages: number[]) {
  const counts = new Map<number, number>(); scannedPages.forEach((page) => counts.set(page, (counts.get(page) || 0) + 1));
  return { missingPages: expectedPages.filter((page) => !counts.has(page)), duplicatePages: [...counts.entries()].filter(([, count]) => count > 1).map(([page]) => page), unexpectedPages: [...counts.keys()].filter((page) => !expectedPages.includes(page)) };
}
