"use client";

import type { GeneratedDocument } from "@/lib/types";

export const DOCUMENT_RECOGNITION_SESSION_KEY = "soanlab-document-recognition-source";

export function openDocumentRecognition(document?: GeneratedDocument) {
  if (document) sessionStorage.setItem(DOCUMENT_RECOGNITION_SESSION_KEY, JSON.stringify(document));
  window.location.assign("/tools/document-recognition");
}
