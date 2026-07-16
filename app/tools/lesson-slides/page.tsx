"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { LessonSlidesWorkspace } from "@/components/lesson-slides/LessonSlidesWorkspace";

export default function LessonSlidesPage() {
  return <AppShell title="Tạo slide bài giảng" contentClassName="w-full p-3 sm:p-5 lg:p-6"><Suspense fallback={<div className="empty-state">Đang mở công cụ tạo slide…</div>}><LessonSlidesWorkspace /></Suspense></AppShell>;
}
