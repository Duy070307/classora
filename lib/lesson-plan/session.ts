"use client";
import type { GeneratedDocument } from "@/lib/types";
import type { LessonType } from "@/lib/lesson-plan/types";
export const LESSON_PLAN_SESSION_KEY="soanlab:lesson-plan-source:v1";
export function openLessonPlanGenerator(document:GeneratedDocument,lessonType?:LessonType){sessionStorage.setItem(LESSON_PLAN_SESSION_KEY,JSON.stringify({document,lessonType}));window.location.assign("/tools/lesson-plan?mode=saved");}
export function readLessonPlanSession(){try{const raw=sessionStorage.getItem(LESSON_PLAN_SESSION_KEY);sessionStorage.removeItem(LESSON_PLAN_SESSION_KEY);return raw?JSON.parse(raw) as {document:GeneratedDocument;lessonType?:LessonType}:null;}catch{return null;}}
