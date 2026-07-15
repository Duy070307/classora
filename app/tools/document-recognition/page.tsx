"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { DocumentRecognitionWorkspace } from "@/components/document-recognition/DocumentRecognitionWorkspace";

export default function DocumentRecognitionPage() {
  return (
    <AppShell title="Đọc đề từ ảnh/PDF">
      <Suspense fallback={<div className="empty-state">Đang mở công cụ nhận dạng tài liệu…</div>}>
        <DocumentRecognitionWorkspace />
      </Suspense>
    </AppShell>
  );
}
