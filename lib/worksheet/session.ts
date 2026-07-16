"use client";

import type { GeneratedDocument } from "@/lib/types";
import type { WorksheetPurpose } from "@/lib/worksheet/types";

export const WORKSHEET_SESSION_KEY="soanlab:worksheet-source:v1";
export type WorksheetSession={document:GeneratedDocument;purpose?:WorksheetPurpose};
export function openWorksheetGenerator(document:GeneratedDocument,purpose?:WorksheetPurpose){sessionStorage.setItem(WORKSHEET_SESSION_KEY,JSON.stringify({document,purpose} satisfies WorksheetSession));window.location.assign("/tools/worksheet-generator?mode=saved");}
export function readWorksheetSession(){try{const raw=sessionStorage.getItem(WORKSHEET_SESSION_KEY);sessionStorage.removeItem(WORKSHEET_SESSION_KEY);return raw?JSON.parse(raw) as WorksheetSession:null;}catch{return null;}}
