"use client";
import type { GeneratedDocument } from "@/lib/types";
export const RUBRIC_SESSION_KEY = "soanlab:rubric-source:v1";
export type RubricSession = { document: GeneratedDocument; sourceActivityId?: string };
export function openRubricGenerator(document: GeneratedDocument, sourceActivityId?: string) { sessionStorage.setItem(RUBRIC_SESSION_KEY, JSON.stringify({ document, sourceActivityId } satisfies RubricSession)); window.location.assign("/tools/rubric?mode=source"); }
export function readRubricSession() { try { const raw = sessionStorage.getItem(RUBRIC_SESSION_KEY); sessionStorage.removeItem(RUBRIC_SESSION_KEY); return raw ? JSON.parse(raw) as RubricSession : null; } catch { return null; } }
