"use client";
import type { GeneratedDocument } from "@/lib/types";
export const REVIEW_PACK_SESSION_KEY = "soanlab:review-pack-source:v1";
export type ReviewPackSession = { document: GeneratedDocument; sourceActivityIds?: string[] };
export function openReviewPack(document: GeneratedDocument, sourceActivityIds?: string[]) { sessionStorage.setItem(REVIEW_PACK_SESSION_KEY, JSON.stringify({ document, sourceActivityIds } satisfies ReviewPackSession)); window.location.assign("/tools/review-pack?mode=source"); }
export function readReviewPackSession() { try { const raw = sessionStorage.getItem(REVIEW_PACK_SESSION_KEY); sessionStorage.removeItem(REVIEW_PACK_SESSION_KEY); return raw ? JSON.parse(raw) as ReviewPackSession : null; } catch { return null; } }
