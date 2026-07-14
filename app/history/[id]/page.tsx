"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardCheck, FileCheck2, RefreshCw, Shuffle, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OutputPreview } from "@/components/OutputPreview";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { deleteDocument, getHistory } from "@/lib/history";
import { deleteCloudDocument, getCloudDocument } from "@/lib/data/documents-store";
import type { GeneratedDocument } from "@/lib/types";
import { EXAM_BLUEPRINT_SESSION_KEY } from "@/lib/exam-blueprints";
import { openExamMixer } from "@/lib/exam-mixer/session";
import { openAnswerSolutions } from "@/lib/answer-solutions/session";

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [document, setDocument] = useState<GeneratedDocument | null | undefined>(undefined);
  useEffect(() => {
    queueMicrotask(async () => {
      const cloudDocument = await getCloudDocument(params.id);
      setDocument(cloudDocument ?? getHistory().find((item) => item.id === params.id) ?? null);
    });
  }, [params.id]);

  if (document === undefined) return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8"><div className="empty-state">Đang tải tài liệu...</div></main></div>;
  if (!document) return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8"><div className="empty-state"><p className="font-semibold text-ink">Không tìm thấy tài liệu.</p><Link href="/history" className="btn-primary mt-4">Quay lại lịch sử</Link></div></main></div>;

  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8">
    <Link href="/history" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand"><ArrowLeft size={16} />Quay lại lịch sử</Link>
    <PageHeader title={document.title} description={`${document.folder || "Khác"} · ${new Date(document.createdAt).toLocaleString("vi-VN")}`} />
    <div className="mb-4 flex flex-wrap items-center gap-2"><DocumentExportMenu document={document} />{document.type === "exam" ? <Link href={`/tools/exam-audit?history=${encodeURIComponent(document.id)}`} className="btn-secondary"><ClipboardCheck size={16} />Kiểm tra lại</Link> : null}{document.structuredExam ? <button type="button" className="btn-secondary" onClick={() => openAnswerSolutions(document)}><FileCheck2 size={16} />Lời giải &amp; đáp án</button> : null}{document.type === "exam" ? <button type="button" className="btn-secondary" onClick={() => openExamMixer(document)}><Shuffle size={16} />Trộn mã đề</button> : null}{document.examVariantSet ? <Link href={`/tools/exam-mixer?history=${encodeURIComponent(document.id)}`} className="btn-secondary"><Shuffle size={16} />Mở bộ mã đề</Link> : null}{document.type === "exam" && document.generationMeta?.normalizedBlueprint ? <button type="button" className="btn-secondary" onClick={() => { sessionStorage.setItem(EXAM_BLUEPRINT_SESSION_KEY, JSON.stringify(document.generationMeta?.normalizedBlueprint)); router.push("/tools/exam-generator?mode=file"); }}><RefreshCw size={16} />Tạo đề mới theo cấu trúc này</button> : null}<button className="btn-secondary text-red-600" onClick={() => { if (window.confirm("Xóa tài liệu này khỏi lịch sử?")) { deleteDocument(document.id); void deleteCloudDocument(document.id); router.push("/history"); } }}><Trash2 size={16} />Xóa</button></div>
    <OutputPreview document={document} />
  </main></div>;
}
