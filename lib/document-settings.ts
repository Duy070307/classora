"use client";

export type DocumentSettings = {
  schoolName: string;
  teacherName: string;
  department: string;
  schoolYear: string;
  fontFamily: "Times New Roman" | "Arial";
  fontSize: "12" | "13" | "14";
};

export const defaultDocumentSettings: DocumentSettings = {
  schoolName: "",
  teacherName: "",
  department: "",
  schoolYear: "",
  fontFamily: "Times New Roman",
  fontSize: "13"
};

const SETTINGS_KEY = "classora_document_settings";

export function getDocumentSettings(): DocumentSettings {
  if (typeof window === "undefined") return defaultDocumentSettings;
  try {
    return { ...defaultDocumentSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return defaultDocumentSettings;
  }
}

export function saveDocumentSettings(settings: DocumentSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resetDocumentSettings() {
  localStorage.removeItem(SETTINGS_KEY);
}
