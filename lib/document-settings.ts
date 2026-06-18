"use client";
import { readJson, removeStored, writeJson } from "@/lib/safe-storage";

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
  const value = readJson<Partial<DocumentSettings>>(SETTINGS_KEY, {});
  return {
    schoolName: typeof value.schoolName === "string" ? value.schoolName : "",
    teacherName: typeof value.teacherName === "string" ? value.teacherName : "",
    department: typeof value.department === "string" ? value.department : "",
    schoolYear: typeof value.schoolYear === "string" ? value.schoolYear : "",
    fontFamily: value.fontFamily === "Arial" ? "Arial" : "Times New Roman",
    fontSize: ["12", "13", "14"].includes(value.fontSize ?? "") ? value.fontSize as DocumentSettings["fontSize"] : "13"
  };
}

export function saveDocumentSettings(settings: DocumentSettings) {
  writeJson(SETTINGS_KEY, settings);
}

export function resetDocumentSettings() {
  removeStored(SETTINGS_KEY);
}
