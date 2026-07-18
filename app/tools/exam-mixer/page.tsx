"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { ExamMixerWorkspace } from "@/components/exam-mixer/ExamMixerWorkspace";

export default function ExamMixerPage() {
  return <AppShell title="Trộn mã đề" contentClassName="w-full p-3 sm:p-5 lg:p-6"><Suspense fallback={<div className="empty-state">Đang mở công cụ trộn mã đề…</div>}><ExamMixerWorkspace /></Suspense></AppShell>;
}
