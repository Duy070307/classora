"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { ExamMixerWorkspace } from "@/components/exam-mixer/ExamMixerWorkspace";

export default function ExamMixerPage() {
  return <AppShell title="Trộn mã đề"><Suspense fallback={<div className="empty-state">Đang mở công cụ trộn mã đề…</div>}><ExamMixerWorkspace /></Suspense></AppShell>;
}
