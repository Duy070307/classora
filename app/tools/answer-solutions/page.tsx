"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { AnswerSolutionsWorkspace } from "@/components/answer-solutions/AnswerSolutionsWorkspace";

export default function AnswerSolutionsPage() {
  return <AppShell title="Lời giải & đáp án" contentClassName="w-full p-3 sm:p-5 lg:p-6"><Suspense fallback={<div className="empty-state">Đang mở công cụ lời giải…</div>}><AnswerSolutionsWorkspace /></Suspense></AppShell>;
}
