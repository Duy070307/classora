"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { getDocumentSettings, type DocumentSettings } from "@/lib/document-settings";
import { getDocumentHeaderLines } from "@/lib/document-header";
import { PRINT_DOCUMENT_KEY } from "@/lib/print-document";
import type { GeneratedDocument } from "@/lib/types";

export default function PrintPage() {
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [settings, setSettings] = useState<DocumentSettings | null>(null);
  useEffect(() => queueMicrotask(() => {
    setSettings(getDocumentSettings());
    try {
      const raw = sessionStorage.getItem(PRINT_DOCUMENT_KEY);
      setDocument(raw ? JSON.parse(raw) as GeneratedDocument : null);
    } catch { setDocument(null); }
  }), []);

  if (!document) return <main className="mx-auto max-w-3xl p-5 md:p-10"><div className="empty-state"><p className="font-semibold text-ink">Không tìm thấy tài liệu để in.</p><Link href="/history" className="btn-primary mt-4">Quay lại lịch sử</Link></div></main>;

  const header = settings ? getDocumentHeaderLines(settings) : [];

  return <main className="print-page mx-auto max-w-4xl p-4 md:p-8">
    <div className="document-actions mb-5 flex flex-wrap gap-2"><button className="btn-primary" onClick={() => window.print()}><Printer size={16} />In hoặc lưu PDF</button><button className="btn-secondary" onClick={() => window.history.back()}>Quay lại</button></div>
    <article className="print-document bg-white p-6 text-slate-900 shadow-sm ring-1 ring-slate-200 md:p-12" style={{ fontFamily: settings?.fontFamily, fontSize: `${settings?.fontSize || "13"}pt` }}>
      {header.length ? <header className="mb-8 space-y-1 border-b border-slate-300 pb-4">{header.map((line) => <p key={line}>{line}</p>)}</header> : null}
      <h1 className="mb-8 text-center text-2xl font-bold">{document.title}</h1>
      <div className="whitespace-pre-wrap break-words leading-7">{document.content || "(Tài liệu chưa có nội dung.)"}</div>
      <p className="mt-10 border-t border-amber-200 pt-4 text-xs text-amber-700">Nội dung hiện được tạo bằng AI mô phỏng trong bản demo. Giáo viên cần kiểm tra lại trước khi sử dụng.</p>
    </article>
  </main>;
}
