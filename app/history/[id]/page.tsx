"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Copy, Download, Eye, FileCheck2, Presentation, RefreshCw, Shuffle, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OutputPreview } from "@/components/OutputPreview";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { deleteDocument, getHistory, saveDocument } from "@/lib/history";
import { deleteCloudDocument, getCloudDocument } from "@/lib/data/documents-store";
import type { GeneratedDocument } from "@/lib/types";
import { EXAM_BLUEPRINT_SESSION_KEY } from "@/lib/exam-blueprints";
import { openExamMixer } from "@/lib/exam-mixer/session";
import { openAnswerSolutions } from "@/lib/answer-solutions/session";
import { openLessonSlides } from "@/lib/lesson-slides/source";
import { downloadLessonSlidesPptx } from "@/lib/lesson-slides/pptx";
import { openGradingAssistant } from "@/lib/grading/session";
import { openAnswerSheet } from "@/lib/answer-sheet/session";
import { downloadAnswerSheetPdf } from "@/lib/answer-sheet/export";
import { withAnswerSheetChecksum } from "@/lib/answer-sheet/checksum";
import { buildAnswerSheetLayout } from "@/lib/answer-sheet/layout";
import { answerSheetToDocument } from "@/lib/answer-sheet/history";

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
    {document.gradingJob || document.structuredExam || document.examVariantSet || document.type === "rubric" ? <div className="mb-4 flex flex-wrap gap-2">{document.gradingJob ? <Link href={`/tools/grading-assistant?history=${encodeURIComponent(document.id)}`} className="btn-primary"><ClipboardCheck size={16}/>Tiếp tục chấm</Link> : <button type="button" className="btn-primary" onClick={() => openGradingAssistant(document)}><ClipboardCheck size={16}/>Chấm bài</button>}</div> : null}
    {document.answerSheetTemplate ? <div className="mb-4 flex flex-wrap gap-2"><Link href={`/tools/answer-sheet?history=${encodeURIComponent(document.id)}`} className="btn-primary"><Eye size={16}/>Mở lại phiếu</Link><button type="button" className="btn-secondary" onClick={() => void downloadAnswerSheetPdf(document.answerSheetTemplate!)}><Download size={16}/>Tải PDF</button><button type="button" className="btn-secondary" onClick={() => { const id = crypto.randomUUID(); const now = new Date().toISOString(); const template = withAnswerSheetChecksum({ ...document.answerSheetTemplate!, id, recognition: { ...document.answerSheetTemplate!.recognition, templateId: id, checksum: "" }, metadata: { ...document.answerSheetTemplate!.metadata, createdAt: now, updatedAt: now } }); saveDocument(answerSheetToDocument(template, buildAnswerSheetLayout(template))); router.push(`/tools/answer-sheet?history=${id}`); }}><Copy size={16}/>Tạo bản sao</button><button type="button" className="btn-secondary" onClick={() => openAnswerSheet(document)}><RefreshCw size={16}/>Tạo cho mã đề khác</button><button type="button" className="btn-secondary" onClick={() => openGradingAssistant(document)}><ClipboardCheck size={16}/>Dùng để chấm bài</button></div> : null}
    {document.slideDeck ? <div className="mb-4 flex flex-wrap gap-2"><Link href={`/tools/lesson-slides?history=${encodeURIComponent(document.id)}`} className="btn-primary"><Presentation size={16} />Mở &amp; chỉnh sửa</Link><button className="btn-secondary" onClick={() => void downloadLessonSlidesPptx(document.slideDeck!, "student")}><Download size={16}/>PowerPoint học sinh</button><button className="btn-secondary" onClick={() => void downloadLessonSlidesPptx(document.slideDeck!, "teacher")}><Download size={16}/>Bản giáo viên</button><button className="btn-secondary" onClick={() => { const id = crypto.randomUUID(); saveDocument({ ...document, id, title: `${document.title} (bản sao)`, createdAt: new Date().toISOString(), slideDeck: { ...document.slideDeck!, id } }); router.push(`/tools/lesson-slides?history=${id}`); }}><Copy size={16}/>Nhân bản</button></div> : null}
    {!document.slideDeck && ["lesson-plan", "worksheet", "exam", "rubric", "document-recognition"].includes(document.type) ? <div className="mb-4"><button className="btn-secondary" onClick={() => openLessonSlides(document, document.type === "worksheet" ? "solution" : document.type === "exam" ? "review" : undefined)}><Presentation size={16}/>{document.type === "worksheet" ? "Tạo slide chữa bài" : document.type === "exam" ? "Tạo slide ôn tập" : "Tạo slide từ nội dung này"}</button></div> : null}
    <div className="mb-4 flex flex-wrap items-center gap-2"><DocumentExportMenu document={document} />{document.type === "document-recognition" ? <Link href={`/tools/document-recognition?history=${encodeURIComponent(document.id)}`} className="btn-primary"><FileCheck2 size={16} />Tiếp tục rà soát</Link> : null}{document.type === "exam" ? <Link href={`/tools/exam-audit?history=${encodeURIComponent(document.id)}`} className="btn-secondary"><ClipboardCheck size={16} />Kiểm tra lại</Link> : null}{document.structuredExam ? <button type="button" className="btn-secondary" onClick={() => openAnswerSolutions(document)}><FileCheck2 size={16} />Lời giải &amp; đáp án</button> : null}{document.type === "exam" ? <button type="button" className="btn-secondary" onClick={() => openExamMixer(document)}><Shuffle size={16} />Trộn mã đề</button> : null}{document.examVariantSet ? <Link href={`/tools/exam-mixer?history=${encodeURIComponent(document.id)}`} className="btn-secondary"><Shuffle size={16} />Mở bộ mã đề</Link> : null}{document.type === "exam" && document.generationMeta?.normalizedBlueprint ? <button type="button" className="btn-secondary" onClick={() => { sessionStorage.setItem(EXAM_BLUEPRINT_SESSION_KEY, JSON.stringify(document.generationMeta?.normalizedBlueprint)); router.push("/tools/exam-generator?mode=file"); }}><RefreshCw size={16} />Tạo đề mới theo cấu trúc này</button> : null}<button className="btn-secondary text-red-600" onClick={() => { if (window.confirm("Xóa tài liệu này khỏi lịch sử?")) { deleteDocument(document.id); void deleteCloudDocument(document.id); router.push("/history"); } }}><Trash2 size={16} />Xóa</button></div>
    <OutputPreview document={document} />
  </main></div>;
}
