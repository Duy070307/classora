"use client";

import { getBuiltInTemplate } from "@/lib/built-in-templates";
import { getDocumentSettings } from "@/lib/document-settings";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage";

export type TemplateItem = {
  id: string;
  name: string;
  type: string;
  content: string;
  notes: string;
  updatedAt: string;
};

const TEMPLATE_KEY = STORAGE_KEYS.templates;

export const templateTypes = ["Đề kiểm tra", "Đáp án và thang điểm", "Ma trận đề", "Giáo án", "Phiếu học tập", "Nhận xét học sinh", "Tin nhắn phụ huynh"];
export const activeTemplateTypes = templateTypes.filter(
  (type) => !["Nhận xét học sinh", "Tin nhắn phụ huynh"].includes(type),
);

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
  if (typeof window !== "undefined") {
    import("@/lib/data/templates-store").then(({ saveTemplatesToCloud }) => saveTemplatesToCloud(items)).catch(() => undefined);
  }
}

export function resolveTemplate(id: string) {
  if (!id) return undefined;
  if (id.startsWith("builtin:")) return getBuiltInTemplate(id.slice("builtin:".length));
  return getTemplates().find((item) => item.id === id);
}

function extractSection(content: string, patterns: RegExp[]) {
  const lines = content.split("\n");
  const start = lines.findIndex((line) => patterns.some((pattern) => pattern.test(line.trim())));
  if (start < 0) return "";
  const end = lines.slice(start + 1).findIndex((line) => /^(I{1,3}|IV|V|VI|VII)\.|\b(ĐÁP ÁN|THANG ĐIỂM|MA TRẬN|BẢN ĐẶC TẢ|PHẦN|YÊU CẦU|Nội dung hiện)/i.test(line.trim()));
  return lines.slice(start, end < 0 ? undefined : start + 1 + end).join("\n").trim();
}

export function applyTemplate(template: TemplateItem | undefined, content: string, values: Record<string, string>) {
  if (!template) return content;
  const settings = getDocumentSettings();
  const answer = values.answer || values.dap_an || extractSection(content, [/^III\.\s*ĐÁP ÁN/i, /^ĐÁP ÁN/i, /^I\.\s*BẢNG ĐÁP ÁN/i]);
  const rubric = values.rubric || values.thang_diem || extractSection(content, [/^IV\.\s*THANG ĐIỂM/i, /^THANG ĐIỂM/i, /THANG ĐIỂM/i]);
  const matrix = values.matrix || values.ma_tran || extractSection(content, [/^V\.\s*MA TRẬN/i, /^MA TRẬN/i, /MA TRẬN ĐỀ/i]);
  const note = values.note || values.ghi_chu || values.objective || values.extraRequirements || "";
  const replacements: Record<string, string> = {
    ten_truong: settings.schoolName,
    ten_giao_vien: settings.teacherName,
    to_bo_mon: settings.department,
    nam_hoc: settings.schoolYear,
    mon_hoc: values.subject || values.mon_hoc || "",
    lop: values.grade || values.className || values.lop || "",
    chu_de: values.topic || values.lessonName || values.chu_de || "",
    thoi_gian: values.duration || values.thoi_gian || "",
    noi_dung: content,
    dap_an: answer,
    thang_diem: rubric,
    ma_tran: matrix,
    ghi_chu: note
  };
  const rendered = template.content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => replacements[key] || "");
  const includesContent = template.content.includes("{{noi_dung}}");
  return `MẪU TÀI LIỆU: ${template.name}\n\n${rendered}${includesContent ? "" : `\n\n${content}`}`;
}
