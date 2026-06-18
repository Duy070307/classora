"use client";

import { getDocumentSettings, type DocumentSettings } from "@/lib/document-settings";

export function getDocumentHeaderLines(settings: DocumentSettings = getDocumentSettings()) {
  return [
    settings.schoolName,
    settings.department ? `Tổ/Bộ môn: ${settings.department}` : "",
    settings.teacherName ? `Giáo viên: ${settings.teacherName}` : "",
    settings.schoolYear ? `Năm học: ${settings.schoolYear}` : ""
  ].filter(Boolean);
}

export function getDocumentHeaderText(settings: DocumentSettings = getDocumentSettings()) {
  return getDocumentHeaderLines(settings).join("\n");
}
