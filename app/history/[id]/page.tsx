"use client";

import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OutputPreview } from "@/components/OutputPreview";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { deleteDocument, getHistory } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [document, setDocument] = useState<GeneratedDocument | null | undefined>(undefined);
  useEffect(() => queueMicrotask(() => setDocument(getHistory().find((item) => item.id === params.id) ?? null)), [params.id]);

  if (document === undefined) return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8"><div className="empty-state">Đang tải tài liệu...</div></main></div>;
  if (!document) return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8"><div className="empty-state"><p className="font-semibold text-ink">Không tìm thấy tài liệu.</p><Link href="/history" className="btn-primary mt-4">Quay lại lịch sử</Link></div></main></div>;

  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8">
    <Link href="/history" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand"><ArrowLeft size={16} />Quay lại lịch sử</Link>
    <PageHeader title={document.title} description={`${document.folder || "Khác"} · ${new Date(document.createdAt).toLocaleString("vi-VN")}`} />
    <div className="mb-4 flex flex-wrap items-center gap-2"><DocumentExportMenu document={document} /><button className="btn-secondary text-red-600" onClick={() => { if (window.confirm("Xóa tài liệu này khỏi lịch sử?")) { deleteDocument(document.id); router.push("/history"); } }}><Trash2 size={16} />Xóa</button></div>
    <OutputPreview document={document} />
  </main></div>;
}
