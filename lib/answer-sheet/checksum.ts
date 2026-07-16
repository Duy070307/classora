import type { AnswerSheetTemplate } from "@/lib/answer-sheet/types";

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

export function answerSheetChecksum(value: unknown) {
  const source = stable(value);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function templateChecksumInput(template: AnswerSheetTemplate) {
  return {
    templateId: template.recognition.templateId,
    templateVersion: template.recognition.templateVersion,
    examId: template.examId,
    variantSetId: template.variantSetId,
    variantCode: template.variantCode,
    sections: template.sections,
    pageSize: template.pageSize,
    density: template.density,
  };
}

export function withAnswerSheetChecksum(template: AnswerSheetTemplate): AnswerSheetTemplate {
  return { ...template, recognition: { ...template.recognition, checksum: answerSheetChecksum(templateChecksumInput(template)) } };
}

export type AnswerSheetQrPayload = { v: 1; templateId: string; templateVersion: string; examRef?: string; variantCode?: string; page: number; checksum: string };

export function createQrPayload(template: AnswerSheetTemplate, page: number): AnswerSheetQrPayload {
  return { v: 1, templateId: template.recognition.templateId, templateVersion: template.recognition.templateVersion, examRef: template.examId || template.variantSetId, variantCode: template.variantCode, page, checksum: template.recognition.checksum };
}

export function parseQrPayload(value: string): AnswerSheetQrPayload | null {
  try {
    const parsed = JSON.parse(value) as Partial<AnswerSheetQrPayload>;
    if (parsed.v !== 1 || typeof parsed.templateId !== "string" || typeof parsed.templateVersion !== "string" || typeof parsed.page !== "number" || typeof parsed.checksum !== "string") return null;
    return parsed as AnswerSheetQrPayload;
  } catch { return null; }
}

export function validateQrPayload(payload: AnswerSheetQrPayload, template: AnswerSheetTemplate) {
  return payload.templateId === template.recognition.templateId && payload.templateVersion === template.recognition.templateVersion && payload.checksum === template.recognition.checksum && payload.variantCode === template.variantCode;
}

export function isAnswerSheetOwner(template: Pick<AnswerSheetTemplate, "ownerId">, userId: string) {
  return Boolean(template.ownerId && template.ownerId === userId);
}
