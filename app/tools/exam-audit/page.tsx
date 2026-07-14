"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { ExamAuditWorkspace } from "@/components/exam-audit/ExamAuditWorkspace";

export default function ExamAuditPage() {
  return <AppShell title="Kiểm tra đề"><Suspense fallback={<div className="empty-state">Đang mở công cụ kiểm tra đề…</div>}><ExamAuditWorkspace /></Suspense></AppShell>;
}
