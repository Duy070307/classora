"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, RefreshCw, Save, ShieldCheck, Sparkles, Upload, WandSparkles, XCircle } from "lucide-react";
import { OutputPreview } from "@/components/OutputPreview";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { auditStructuredExam } from "@/lib/exam-audit/audit";
import { auditConfigFromDocument, EXAM_AUDIT_SESSION_INPUT, EXAM_AUDIT_SESSION_RESULT, withAuditResult } from "@/lib/exam-audit/document";
import { allSafeFixIssueIds, applySafeFixes, previewSafeFixes } from "@/lib/exam-audit/fixes";
import { documentWithExam, normalizeExamDocument, parseExamText } from "@/lib/exam-audit/normalize";
import type { ExamAuditConfig, ExamAuditIssue, ExamAuditPayload, ExamAuditResult, SemanticAuditFinding } from "@/lib/exam-audit/types";
import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import { getCloudDocument, listCloudDocuments } from "@/lib/data/documents-store";
import { createDocument, getHistory, saveDocument } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";
import { openExamMixer } from "@/lib/exam-mixer/session";
import { openAnswerSolutions } from "@/lib/answer-solutions/session";
import { openGradingAssistant } from "@/lib/grading/session";
import { openAnswerSheet } from "@/lib/answer-sheet/session";

type Filter = "all" | "error" | "warning" | "fixed";

const cachePrefix = "soanlab-exam-audit-cache:";

function actualCounts(exam: StructuredExam) {
  return {
    partI: exam.parts.find((part) => part.type === "multiple_choice")?.questions.length || 0,
    partII: exam.parts.find((part) => part.type === "true_false")?.questions.length || 0,
    partIII: exam.parts.find((part) => part.type === "short_answer")?.questions.length || 0,
  };
}

function issueTone(issue: ExamAuditIssue) {
  if (issue.severity === "error") return "border-red-200 bg-red-50 text-red-900";
  if (issue.severity === "warning") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-blue-200 bg-blue-50 text-blue-950";
}

function statusTone(readiness: ExamAuditResult["summary"]["readiness"]) {
  if (readiness === "failed") return "border-red-200 bg-red-50 text-red-700";
  if (readiness === "review") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function parseSessionPayload(raw: string | null): ExamAuditPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ExamAuditPayload;
    return parsed?.document?.content ? parsed : null;
  } catch {
    return null;
  }
}

export function ExamAuditWorkspace() {
  const searchParams = useSearchParams();
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [config, setConfig] = useState<ExamAuditConfig>({ requireFourOptions: true });
  const [result, setResult] = useState<ExamAuditResult | null>(null);
  const [semanticFindings, setSemanticFindings] = useState<SemanticAuditFinding[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [fixed, setFixed] = useState<ExamAuditIssue[]>([]);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [previewIds, setPreviewIds] = useState<string[]>([]);
  const [editQuestionId, setEditQuestionId] = useState("");
  const [questionDraft, setQuestionDraft] = useState<ExamQuestion | null>(null);

  useEffect(() => {
    queueMicrotask(async () => {
      const cloud = await listCloudDocuments();
      const docs = (cloud ?? getHistory()).filter((item) => item.type === "exam");
      setHistory(docs);
      const historyId = searchParams.get("history");
      if (historyId) {
        const saved = await getCloudDocument(historyId) ?? docs.find((item) => item.id === historyId) ?? null;
        if (saved?.type === "exam") openDocument(saved, auditConfigFromDocument(saved), "Đã mở đề từ lịch sử.");
        return;
      }
      const payload = parseSessionPayload(sessionStorage.getItem(EXAM_AUDIT_SESSION_INPUT));
      if (payload) openDocument(payload.document, payload.config || auditConfigFromDocument(payload.document), "Đã nhận đề từ công cụ tạo đề.");
    });
  // searchParams chỉ dùng để nạp nguồn ban đầu.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openDocument(source: GeneratedDocument, sourceConfig?: ExamAuditConfig, note = "Đã nạp đề để kiểm tra.") {
    const normalized = normalizeExamDocument(source);
    if (!normalized.structuredExam) return setMessage("Chưa nhận diện được cấu trúc đề.");
    const counts = actualCounts(normalized.structuredExam);
    const nextConfig = {
      ...auditConfigFromDocument(normalized),
      ...sourceConfig,
      expectedSectionCounts: sourceConfig?.expectedSectionCounts || auditConfigFromDocument(normalized).expectedSectionCounts || counts,
      totalScore: sourceConfig?.totalScore || auditConfigFromDocument(normalized).totalScore || normalized.structuredExam.metadata.totalScore || 10,
      acceptedWarningIds: normalized.auditMeta?.acceptedWarningIds || [],
    };
    setDocument(normalized);
    setConfig(nextConfig);
    setAccepted(nextConfig.acceptedWarningIds || []);
    setResult(null);
    setSemanticFindings([]);
    setSelected([]);
    setFixed([]);
    setPreviewIds([]);
    setMessage(note);
  }

  function usePastedText() {
    if (pasteText.trim().length < 20) return setMessage("Vui lòng dán nội dung đề đầy đủ hơn.");
    const parsed = parseExamText(pasteText);
    const next = createDocument(parsed.exam.metadata.title, "exam", pasteText);
    next.structuredExam = parsed.exam;
    next.examMeta = { subject: parsed.exam.metadata.subject, grade: parsed.exam.metadata.grade, duration: parsed.exam.metadata.duration, examCode: parsed.exam.metadata.examCode, examStyle: parsed.exam.metadata.examStyle };
    openDocument(next, { totalScore: 10, expectedSectionCounts: actualCounts(parsed.exam), requireFourOptions: true }, parsed.warnings[0] || "Đã nhận diện cấu trúc từ văn bản.");
  }

  async function uploadFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setMessage("Đang đọc file…");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/exam-audit/import", { method: "POST", body: form });
      const data = await response.json() as { ok?: boolean; exam?: StructuredExam; warnings?: string[]; error?: string; message?: string; maintenance?: boolean };
      if (data.maintenance) return window.location.assign("/maintenance");
      if (!response.ok || !data.ok || !data.exam) throw new Error(data.error || "Chưa thể đọc file.");
      const next = createDocument(data.exam.metadata.title || file.name, "exam", "Đề được nhập từ file để kiểm tra chất lượng.");
      next.structuredExam = data.exam;
      next.examMeta = { subject: data.exam.metadata.subject, grade: data.exam.metadata.grade, duration: data.exam.metadata.duration, examCode: data.exam.metadata.examCode, examStyle: data.exam.metadata.examStyle };
      openDocument(next, { totalScore: data.exam.metadata.totalScore || 10, expectedSectionCounts: actualCounts(data.exam), requireFourOptions: true }, data.warnings?.[0] || "Đã đọc file. Vui lòng kiểm tra bản xem trước.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chưa thể đọc file.");
    } finally {
      setLoading(false);
    }
  }

  function runAudit(findings = semanticFindings) {
    if (!document?.structuredExam) return setMessage("Vui lòng chọn hoặc nhập một đề trước.");
    const nextConfig = { ...config, acceptedWarningIds: accepted };
    const next = auditStructuredExam(document.structuredExam, nextConfig, findings);
    setResult(next);
    setSelected(next.issues.filter((issue) => issue.severity === "error" && issue.canAutoFix).map((issue) => issue.id));
    const audited = withAuditResult(documentWithExam(document, next.exam), next, accepted);
    setDocument(audited);
    setMessage(`Đã kiểm tra ${next.summary.totalQuestions} câu: ${next.summary.errorCount} lỗi, ${next.summary.warningCount} cảnh báo.`);
  }

  async function runSemanticAudit() {
    if (!document?.structuredExam || !result) return;
    const key = `${cachePrefix}${result.summary.contentHash}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const findings = JSON.parse(cached) as SemanticAuditFinding[];
        setSemanticFindings(findings);
        const next = auditStructuredExam(document.structuredExam, { ...config, acceptedWarningIds: accepted }, findings);
        next.summary.cacheHit = true;
        setResult(next);
        setMessage("Đã dùng kết quả rà soát chuyên sâu đã lưu cho đúng nội dung đề này.");
        return;
      } catch {
        localStorage.removeItem(key);
      }
    }
    setSemanticLoading(true);
    try {
      const response = await fetch("/api/exam-audit/semantic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exam: document.structuredExam, deterministicIssues: result.issues.map((issue) => ({ code: issue.code, questionId: issue.questionId })) }) });
      const data = await response.json() as { ok?: boolean; findings?: SemanticAuditFinding[]; error?: string; message?: string; maintenance?: boolean };
      if (data.maintenance) return window.location.assign("/maintenance");
      if (!response.ok || !data.ok) throw new Error(data.error || "Chưa thể rà soát chuyên sâu.");
      const findings = data.findings || [];
      localStorage.setItem(key, JSON.stringify(findings));
      setSemanticFindings(findings);
      const next = auditStructuredExam(document.structuredExam, { ...config, acceptedWarningIds: accepted }, findings);
      setResult(next);
      setDocument(withAuditResult(documentWithExam(document, next.exam), next, accepted));
      setMessage(findings.length ? `Đã thêm ${findings.length} nhận định cần giáo viên xác nhận.` : "Không phát hiện thêm vấn đề ngữ nghĩa có căn cứ.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chưa thể rà soát chuyên sâu.");
    } finally {
      setSemanticLoading(false);
    }
  }

  function requestFix(ids: string[]) {
    if (!result || !document?.structuredExam) return;
    const safe = ids.filter((id) => result.issues.some((issue) => issue.id === id && issue.canAutoFix));
    if (!safe.length) return setMessage("Chưa chọn lỗi nào có thể sửa an toàn.");
    setPreviewIds(safe);
  }

  function confirmFixes() {
    if (!result || !document?.structuredExam || !previewIds.length) return;
    const fixedExam = applySafeFixes(document.structuredExam, result.issues, previewIds, config);
    const resolvedIssues = result.issues.filter((issue) => previewIds.includes(issue.id));
    const next = auditStructuredExam(fixedExam, { ...config, acceptedWarningIds: accepted }, semanticFindings);
    const nextDocument = withAuditResult(documentWithExam(document, fixedExam), next, accepted);
    setDocument(nextDocument);
    setResult(next);
    setFixed((current) => [...new Map([...current, ...resolvedIssues].map((issue) => [issue.id, issue])).values()]);
    setSelected([]);
    setPreviewIds([]);
    sessionStorage.setItem(EXAM_AUDIT_SESSION_RESULT, JSON.stringify(nextDocument));
    setMessage("Đã áp dụng thay đổi an toàn và kiểm tra lại trên cùng dữ liệu đề.");
  }

  function acceptWarning(issue: ExamAuditIssue) {
    if (issue.severity !== "warning" || !document?.structuredExam) return;
    const nextAccepted = Array.from(new Set([...accepted, issue.id]));
    setAccepted(nextAccepted);
    const next = auditStructuredExam(document.structuredExam, { ...config, acceptedWarningIds: nextAccepted }, semanticFindings);
    setResult(next);
    setDocument(withAuditResult(documentWithExam(document, next.exam), next, nextAccepted));
  }

  function beginManualEdit(issue: ExamAuditIssue) {
    const question = document?.structuredExam?.parts.flatMap((part) => part.questions).find((item) => item.id === issue.questionId);
    if (!question) return setMessage("Vấn đề này áp dụng cho toàn đề; hãy chỉnh cấu hình hoặc nội dung nguồn.");
    setEditQuestionId(question.id);
    setQuestionDraft(JSON.parse(JSON.stringify(question)) as ExamQuestion);
  }

  function saveManualEdit() {
    if (!document?.structuredExam || !questionDraft || !editQuestionId) return;
    const exam = JSON.parse(JSON.stringify(document.structuredExam)) as StructuredExam;
    exam.parts.forEach((part) => { part.questions = part.questions.map((question) => question.id === editQuestionId ? questionDraft : question); });
    const next = auditStructuredExam(exam, { ...config, acceptedWarningIds: accepted }, []);
    setSemanticFindings([]);
    setDocument(withAuditResult(documentWithExam(document, exam), next, accepted));
    setResult(next);
    setEditQuestionId("");
    setQuestionDraft(null);
    setMessage("Đã lưu chỉnh sửa thủ công và kiểm tra lại câu hỏi.");
  }

  function saveAuditedDocument() {
    if (!document || !result) return;
    const final = withAuditResult(documentWithExam(document, result.exam), result, accepted);
    saveDocument(final);
    sessionStorage.setItem(EXAM_AUDIT_SESSION_RESULT, JSON.stringify(final));
    setDocument(final);
    setMessage("Đã lưu đề và trạng thái kiểm tra vào lịch sử.");
  }

  function mixAuditedDocument() {
    if (!document || !result) return;
    if (result.summary.errorCount) return setMessage("Đề vẫn còn lỗi nghiêm trọng. Thầy cô cần xử lý trước khi trộn mã.");
    openExamMixer(withAuditResult(documentWithExam(document, result.exam), result, accepted));
  }

  const visibleIssues = useMemo(() => {
    if (!result) return [];
    if (filter === "fixed") return fixed;
    if (filter === "all") return result.issues;
    return result.issues.filter((issue) => issue.severity === filter);
  }, [filter, fixed, result]);
  const changes = useMemo(() => result && document?.structuredExam && previewIds.length ? previewSafeFixes(document.structuredExam, result.issues, previewIds, config) : [], [config, document?.structuredExam, previewIds, result]);

  return <div className="space-y-6">
    <section className="rounded-[30px] border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"><ShieldCheck size={14} />Kiểm tra trước khi xuất</span><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Kiểm tra chất lượng đề</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Kiểm tra cấu trúc, đáp án, điểm, phương án, câu trùng, dữ liệu trực quan và mức sẵn sàng trước khi xuất Word/PDF.</p></div>
        <Link href="/tools/exam-generator" className="btn-secondary">Tạo đề mới</Link>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-black text-slate-900">Đề đang tạo</p><p className="mt-1 text-sm text-slate-600">Nhận trực tiếp từ công cụ tạo đề qua nút “Kiểm tra đề trước khi xuất”.</p><button type="button" className="btn-secondary mt-3" onClick={() => { const payload = parseSessionPayload(sessionStorage.getItem(EXAM_AUDIT_SESSION_INPUT)); if (payload) openDocument(payload.document, payload.config); else setMessage("Chưa có đề đang tạo trong phiên này."); }}><ClipboardCheck size={16} />Nạp đề hiện tại</button></div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-black text-slate-900">Lịch sử đã lưu</p><select className="form-field mt-3" defaultValue="" onChange={(event) => { const saved = history.find((item) => item.id === event.target.value); if (saved) openDocument(saved, auditConfigFromDocument(saved), "Đã mở đề của thầy/cô từ lịch sử."); }}><option value="">Chọn một đề…</option>{history.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
        <label className="cursor-pointer rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 p-4"><p className="font-black text-slate-900">Tải Word, PDF hoặc TXT</p><p className="mt-1 text-sm text-slate-600">Tối đa 8MB. PDF cần có lớp chữ để đọc trực tiếp.</p><span className="btn-secondary mt-3 inline-flex"><Upload size={16} />{loading ? "Đang đọc…" : "Chọn file"}</span><input className="hidden" type="file" accept=".docx,.pdf,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" disabled={loading} onChange={(event) => void uploadFile(event.target.files?.[0])} /></label>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4"><p className="font-black text-slate-900">Đề chụp hoặc PDF quét</p><p className="mt-1 text-sm leading-6 text-slate-600">Nhận dạng và xác nhận cấu trúc trước khi kiểm tra chất lượng.</p><Link href="/tools/document-recognition" className="btn-secondary mt-3 inline-flex"><FileText size={16} />Đọc đề từ ảnh/PDF</Link></div>
      </div>
      <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-black text-slate-900">Hoặc dán nội dung đề</summary><textarea className="form-field mt-3 min-h-44" value={pasteText} onChange={(event) => setPasteText(event.target.value)} placeholder="Dán đề, các phương án và đáp án nếu có…" /><button type="button" className="btn-secondary mt-3" onClick={usePastedText}><FileText size={16} />Nhận diện đề đã dán</button></details>
    </section>

    {document?.structuredExam ? <>
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-blue-700">Cấu hình đối chiếu</p><h2 className="mt-1 text-xl font-black text-slate-950">{document.title}</h2></div><button type="button" className="btn-secondary" onClick={() => setConfig((current) => ({ ...current, expectedSectionCounts: { partI: 12, partII: 4, partIII: 6 }, numericShortAnswers: true, totalScore: 10 }))}>Chuẩn THPTQG 12/4/6</button></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {([['partI','PHẦN I'],['partII','PHẦN II'],['partIII','PHẦN III']] as const).map(([key, label]) => <label key={key}><span className="label">Số câu {label}</span><input type="number" min="0" className="form-field mt-1" value={config.expectedSectionCounts?.[key] ?? 0} onChange={(event) => setConfig((current) => ({ ...current, expectedSectionCounts: { partI: current.expectedSectionCounts?.partI || 0, partII: current.expectedSectionCounts?.partII || 0, partIII: current.expectedSectionCounts?.partIII || 0, [key]: Number(event.target.value) } }))} /></label>)}
          <label><span className="label">Tổng điểm</span><input type="number" step="0.25" className="form-field mt-1" value={config.totalScore ?? 10} onChange={(event) => setConfig((current) => ({ ...current, totalScore: Number(event.target.value) || 0 }))} /></label>
          <label className="flex items-center gap-2 self-end rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={config.numericShortAnswers === true} onChange={(event) => setConfig((current) => ({ ...current, numericShortAnswers: event.target.checked }))} />PHẦN III chỉ nhận số</label>
        </div>
        {document.structuredExam.metadata.importWarnings?.map((warning) => <p key={warning} className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{warning}</p>)}
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="btn-primary" onClick={() => runAudit()}><ClipboardCheck size={17} />Kiểm tra đề</button>{result ? <button type="button" className="btn-secondary" disabled={semanticLoading} onClick={() => void runSemanticAudit()}><Sparkles size={16} />{semanticLoading ? "Đang rà soát…" : "Rà soát chuyên sâu"}</button> : null}</div>
      </section>

      {result ? <>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[['Tổng số câu',result.summary.totalQuestions,'text-slate-900'],['Lỗi nghiêm trọng',result.summary.errorCount,'text-red-700'],['Cảnh báo',result.summary.warningCount,'text-amber-700'],['Gợi ý',result.summary.infoCount,'text-blue-700']].map(([label,value,tone]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p></div>)}
          <div className={`rounded-2xl border p-4 shadow-sm ${statusTone(result.summary.readiness)}`}><p className="text-xs font-black uppercase tracking-wide">Trạng thái xuất file</p><p className="mt-2 text-xl font-black">{result.summary.readinessLabel}</p></div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center gap-2"><button type="button" className="btn-primary" disabled={!selected.length} onClick={() => requestFix(selected)}><WandSparkles size={16} />Sửa lỗi đã chọn</button><button type="button" className="btn-secondary" onClick={() => requestFix(allSafeFixIssueIds(result))}><ShieldCheck size={16} />Sửa các lỗi an toàn</button><button type="button" className="btn-secondary" onClick={() => runAudit()}><RefreshCw size={16} />Kiểm tra lại</button><button type="button" className="btn-secondary" onClick={saveAuditedDocument}><Save size={16} />Lưu lịch sử</button><button type="button" className="btn-secondary" onClick={() => openAnswerSolutions(document)}><FileText size={16} />Kiểm tra đáp án và tạo lời giải</button><button type="button" className="btn-secondary" disabled={result.summary.errorCount > 0} onClick={mixAuditedDocument}><Sparkles size={16} />Trộn mã sau khi kiểm tra</button><DocumentExportMenu document={document} /></div>
          <div className="mt-4 flex gap-2 overflow-x-auto">{([['all','Tất cả'],['error','Lỗi'],['warning','Cảnh báo'],['fixed','Đã sửa']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${filter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>)}</div>
          <div className="mt-4 space-y-3">{visibleIssues.length ? visibleIssues.map((issue) => <article key={issue.id} className={`rounded-2xl border p-4 ${issueTone(issue)}`}>
            <div className="flex items-start gap-3">{issue.canAutoFix ? <input className="mt-1" type="checkbox" checked={selected.includes(issue.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, issue.id] : selected.filter((id) => id !== issue.id))} aria-label={`Chọn ${issue.title}`} /> : issue.severity === 'error' ? <XCircle className="mt-0.5 shrink-0" size={19} /> : issue.severity === 'warning' ? <AlertTriangle className="mt-0.5 shrink-0" size={19} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={19} />}
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{issue.title}</h3>{issue.section ? <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-black">{issue.section}{issue.questionNumber ? ` · Câu ${issue.questionNumber}` : ''}</span> : null}{issue.aiAssisted ? <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-black">Hỗ trợ phân tích · {issue.confidence || 'medium'}</span> : null}</div><p className="mt-1 text-sm leading-6">{issue.description}</p><p className="mt-2 text-sm"><strong>Đề xuất:</strong> {issue.suggestedFix}</p><div className="mt-3 flex flex-wrap gap-2">{issue.questionId ? <button type="button" className="rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm" onClick={() => beginManualEdit(issue)}>Mở câu hỏi</button> : null}{issue.canAutoFix ? <button type="button" className="rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm" onClick={() => requestFix([issue.id])}>Áp dụng sửa</button> : null}<button type="button" className="rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm" onClick={() => beginManualEdit(issue)}>Sửa thủ công</button>{issue.severity === 'warning' && !accepted.includes(issue.id) ? <button type="button" className="rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm" onClick={() => acceptWarning(issue)}>Bỏ qua cảnh báo</button> : null}</div></div>
            </div>
          </article>) : <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-800"><CheckCircle2 className="mx-auto" /><p className="mt-2 font-black">Không có vấn đề trong bộ lọc này.</p></div>}</div>
        </section>

        {previewIds.length ? <section className="rounded-[28px] border border-blue-200 bg-blue-50 p-5"><h2 className="text-xl font-black text-slate-950">Xem thay đổi</h2><p className="mt-1 text-sm text-slate-600">Chỉ áp dụng các thay đổi cấu trúc an toàn. Nội dung toán học của đề bài không được tự viết lại.</p>{changes.length ? <div className="mt-4 space-y-4">{changes.slice(0, 12).map((change) => <div key={change.questionId} className="grid gap-3 lg:grid-cols-2"><div className="rounded-2xl bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">Nội dung hiện tại · {change.label}</p><pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{change.current}</pre></div><div className="rounded-2xl border border-blue-200 bg-white p-4"><p className="text-xs font-black uppercase text-blue-700">Nội dung đề xuất</p><pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{change.proposed}</pre></div></div>)}</div> : <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600">Thay đổi áp dụng ở cấp toàn đề, như cân lại tổng điểm hoặc đánh số lại.</p>}<div className="mt-4 flex gap-2"><button type="button" className="btn-primary" onClick={confirmFixes}>Áp dụng</button><button type="button" className="btn-secondary" onClick={() => setPreviewIds([])}>Giữ nguyên</button></div></section> : null}

        {questionDraft ? <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-slate-950">Sửa thủ công · Câu {questionDraft.number}</h2><div className="mt-4 grid gap-3"><label><span className="label">Nội dung câu hỏi</span><textarea className="form-field mt-1 min-h-28" value={questionDraft.stem} onChange={(event) => setQuestionDraft({ ...questionDraft, stem: event.target.value })} /></label>{questionDraft.options ? <div className="grid gap-3 sm:grid-cols-2">{(['A','B','C','D'] as const).map((key) => <label key={key}><span className="label">Phương án {key}</span><input className="form-field mt-1" value={questionDraft.options?.[key] || ''} onChange={(event) => setQuestionDraft({ ...questionDraft, options: { ...questionDraft.options!, [key]: event.target.value } })} /></label>)}</div> : null}<div className="grid gap-3 sm:grid-cols-2"><label><span className="label">Đáp án</span><input className="form-field mt-1" value={questionDraft.answer} onChange={(event) => setQuestionDraft({ ...questionDraft, answer: event.target.value })} /></label><label><span className="label">Điểm</span><input type="number" step="0.01" className="form-field mt-1" value={questionDraft.score} onChange={(event) => setQuestionDraft({ ...questionDraft, score: Number(event.target.value) || 0 })} /></label></div></div><div className="mt-4 flex gap-2"><button type="button" className="btn-primary" onClick={saveManualEdit}>Lưu và kiểm tra lại</button><button type="button" className="btn-secondary" onClick={() => { setQuestionDraft(null); setEditQuestionId(''); }}>Hủy</button></div></section> : null}
      </> : null}

      <OutputPreview document={document} />
      {result ? <div className="flex flex-wrap gap-2"><button type="button" className="btn-secondary" disabled={result.summary.errorCount > 0} onClick={() => openGradingAssistant(document)}><ClipboardCheck size={16}/>Chấm bài bằng đáp án đã kiểm tra</button><button type="button" className="btn-secondary" disabled={result.summary.errorCount > 0} onClick={() => openAnswerSheet(document)}><ClipboardCheck size={16}/>Tạo phiếu trả lời</button></div> : null}
    </> : null}
    {message ? <div className="fixed bottom-5 right-5 z-50 max-w-md rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl">{message}</div> : null}
  </div>;
}
