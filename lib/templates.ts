"use client";

import { getDocumentSettings } from "@/lib/document-settings";
import { readJson, writeJson } from "@/lib/safe-storage";

export type TemplateItem = {
  id: string;
  name: string;
  type: string;
  content: string;
  notes: string;
  updatedAt: string;
};

const TEMPLATE_KEY = "classora_templates";

export const templateTypes = ["Đề kiểm tra", "Giáo án", "Phiếu học tập", "Nhận xét học sinh", "Tin nhắn phụ huynh"];

export function getTemplates(): TemplateItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = readJson<unknown>(TEMPLATE_KEY, []);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is TemplateItem => {
      if (!item || typeof item !== "object") return false;
      const value = item as Partial<TemplateItem>;
      return typeof value.id === "string" && typeof value.name === "string" && typeof value.type === "string" && typeof value.content === "string";
    });
  } catch {
    return [];
  }
}

export function saveTemplates(items: TemplateItem[]) {
  writeJson(TEMPLATE_KEY, items);
}

export function applyTemplate(template: TemplateItem | undefined, content: string, values: Record<string, string>) {
  if (!template) return content;
  const settings = getDocumentSettings();
  const replacements: Record<string, string> = {
    ten_truong: settings.schoolName,
    ten_giao_vien: settings.teacherName,
    nam_hoc: settings.schoolYear,
    mon_hoc: values.subject || "",
    lop: values.grade || values.className || "",
    chu_de: values.topic || "",
    noi_dung: content
  };
  const rendered = template.content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => replacements[key] || "");
  const includesContent = template.content.includes("{{noi_dung}}");
  return `MẪU TÀI LIỆU: ${template.name}\n\n${rendered}${includesContent ? "" : `\n\n${content}`}`;
}
