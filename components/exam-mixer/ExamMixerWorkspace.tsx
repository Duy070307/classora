"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Copy, Download, FileArchive, FileCheck2, FileText, RefreshCw, Save, Shuffle, Upload } from "lucide-react";
import { OutputPreview } from "@/components/OutputPreview";
import { EXAM_AUDIT_SESSION_INPUT } from "@/lib/exam-audit/document";
import { listCloudDocuments } from "@/lib/data/documents-store";
import { createExamVariants, regenerateExamVariant, validateSourceExamForMixing, variantAnswerRows, variantComparisonRows } from "@/lib/exam-mixer/engine";
import { variantSetAnswerKeyDocument, variantSetToHistoryDocument, variantToDocument } from "@/lib/exam-mixer/document";
import { exportCombinedAnswerKey, exportComparison, exportVariantAnswerKey, exportVariantSetZip, exportVariantWord } from "@/lib/exam-mixer/export";
import { createMixerSeed } from "@/lib/exam-mixer/rng";
import { EXAM_MIXER_SESSION_KEY } from "@/lib/exam-mixer/session";
import { defaultExamMixingOptions, type ExamMixingOptions, type ExamVariantSet } from "@/lib/exam-mixer/types";
import type { StructuredExam } from "@/lib/exam-types";
import { getHistory, saveDocument } from "@/lib/history";
import { printGeneratedDocument } from "@/lib/print-document";
import type { GeneratedDocument } from "@/lib/types";

type ExportOptions = { word: boolean; pdf: boolean; keys: boolean; comparison: boolean; zip: boolean };

function parseSessionSource() {
  try {
    const value = sessionStorage.getItem(EXAM_MIXER_SESSION_KEY);
    return value ? JSON.parse(value) as GeneratedDocument : null;
  } catch { return null; }
}

function counts(exam: StructuredExam) {
  return exam.parts.map((part) => `${part.title}: ${part.questions.length} câu`).join(" · ");
}

function optionLabel(key: keyof ExamMixingOptions) {
  const labels: Record<keyof ExamMixingOptions, string> = {
    shuffleMultipleChoiceQuestions: "Trộn thứ tự câu phần trắc nghiệm",
    shuffleMultipleChoiceOptions: "Trộn phương án A/B/C/D",
    shuffleTrueFalseQuestions: "Trộn thứ tự câu đúng/sai",
    shuffleTrueFalseStatements: "Trộn thứ tự các mệnh đề đúng/sai",
    shuffleShortAnswerQuestions: "Trộn thứ tự câu trả lời ngắn",
    shuffleEssayQuestions: "Trộn thứ tự câu tự luận nếu có",
    keepGroups: "Giữ nhóm câu hỏi liên quan",
    balanceAnswers: "Cân bằng đáp án A/B/C/D",
  };
  return labels[key];
}

export function ExamMixerWorkspace() {
  const searchParams = useSearchParams();
  const [source, setSource] = useState<GeneratedDocument | null>(null);
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [set, setSet] = useState<ExamVariantSet | null>(null);
  const [variantCount, setVariantCount] = useState(4);
  const [startingCode, setStartingCode] = useState(101);
  const [seed, setSeed] = useState(() => createMixerSeed());
  const [options, setOptions] = useState(defaultExamMixingOptions);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({ word: true, pdf: false, keys: true, comparison: true, zip: true });
  const [activeCode, setActiveCode] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      const docs = (await listCloudDocuments()) ?? getHistory();
      setHistory(docs.filter((item) => item.type === "exam" || item.type === "exam-shuffler"));
      const historyId = searchParams.get("history");
      const saved = historyId ? docs.find((item) => item.id === historyId) : null;
      if (saved?.examVariantSet) {
        setSource(saved);
        setSet(saved.examVariantSet);
        setSeed(saved.examVariantSet.seed);
        setVariantCount(saved.examVariantSet.variantCount);
        setStartingCode(saved.examVariantSet.startingCode);
        setOptions(saved.examVariantSet.mixingOptions);
        setActiveCode(saved.examVariantSet.variants[0]?.code || "");
        setMessage("Đã mở đúng bộ mã đề đã lưu.");
      } else if (saved?.structuredExam) {
        setSource(saved);
        setMessage("Đã nạp đề từ lịch sử.");
      } else {
        const current = parseSessionSource();
        if (current?.structuredExam) { setSource(current); setMessage("Đã nhận đề hiện tại."); }
      }
    });
  // Chỉ nạp nguồn một lần khi mở công cụ.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validation = useMemo(() => {
    if (!source?.structuredExam) return null;
    const result = validateSourceExamForMixing(source.structuredExam);
    if (!source.auditMeta?.errorCount) return result;
    return { ...result, valid: false, errors: [...result.errors, `Đề còn ${source.auditMeta.errorCount} lỗi nghiêm trọng chưa được xử lý trong lần kiểm tra gần nhất.`] };
  }, [source]);
  const activeVariant = set?.variants.find((variant) => variant.code === activeCode) || set?.variants[0];

  function selectSource(document: GeneratedDocument) {
    if (document.examVariantSet) {
      setSource(document); setSet(document.examVariantSet); setSeed(document.examVariantSet.seed); setVariantCount(document.examVariantSet.variantCount); setStartingCode(document.examVariantSet.startingCode); setOptions(document.examVariantSet.mixingOptions); setActiveCode(document.examVariantSet.variants[0]?.code || "");
      return setMessage("Đã mở bộ mã đề đã lưu mà không tạo lại khác đi.");
    }
    if (!document.structuredExam) return setMessage("Tài liệu này chưa có cấu trúc đề hợp lệ.");
    setSource(document); setSet(null); setActiveCode(""); setMessage("Đã nạp đề để kiểm tra trước khi trộn mã.");
  }

  async function uploadFile(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/exam-audit/import", { method: "POST", body: form });
      const data = await response.json() as { ok?: boolean; exam?: StructuredExam; error?: string; maintenance?: boolean };
      if (data.maintenance) return window.location.assign("/maintenance");
      if (!response.ok || !data.exam) throw new Error(data.error || "Chưa thể đọc file đề.");
      selectSource({ id: crypto.randomUUID(), title: data.exam.metadata.title || file.name, type: "exam", content: "Đề nhập từ file", createdAt: new Date().toISOString(), structuredExam: data.exam });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chưa thể đọc file đề."); }
    finally { setUploading(false); }
  }

  function openAudit() {
    if (!source) return;
    sessionStorage.setItem(EXAM_AUDIT_SESSION_INPUT, JSON.stringify({ document: source, source: "mixer" }));
    window.location.assign("/tools/exam-audit");
  }

  function createVariants(nextSeed = seed) {
    if (!source?.structuredExam || !validation?.valid) return setMessage("Đề vẫn còn lỗi nghiêm trọng. Thầy cô cần kiểm tra đề trước khi trộn mã.");
    try {
      const next = createExamVariants({ exam: source.structuredExam, sourceExamId: source.id, sourceExamTitle: source.title, variantCount, startingCode, seed: nextSeed.trim() || createMixerSeed(), options });
      setSet(next); setSeed(next.seed); setActiveCode(next.variants[0]?.code || ""); setMessage(`Đã tạo ${next.variants.length} mã đề và kiểm tra tính tương đương.`);
    } catch { setMessage("Chưa thể tạo bộ mã đề. Vui lòng mở công cụ Kiểm tra đề để rà soát lại."); }
  }

  function regenerateAll() { const next = createMixerSeed(); setSeed(next); createVariants(next); }
  function regenerateOne(index: number) { if (!set) return; const next = regenerateExamVariant(set, index); setSet(next); setMessage(`Đã tạo lại mã ${next.variants[index]?.code} và kiểm tra lại.`); }
  function saveSet() { if (!set) return; saveDocument(variantSetToHistoryDocument(set)); setMessage("Đã lưu một bản ghi bộ mã đề vào lịch sử."); }

  async function exportAll() {
    if (!set || set.variants.some((variant) => !variant.auditResult.valid)) return setMessage("Có mã đề không hợp lệ nên chưa thể xuất.");
    setExporting(true);
    try {
      if (exportOptions.zip) await exportVariantSetZip(set);
      else {
        if (exportOptions.word) for (const variant of set.variants) await exportVariantWord(set, variant);
        if (exportOptions.keys) await exportCombinedAnswerKey(set);
        if (exportOptions.comparison) await exportComparison(set);
      }
      setMessage(exportOptions.pdf ? "Đã xuất các file đã chọn. PDF cần mở từng mã bằng nút In/lưu PDF để dùng hộp thoại in hiện có." : "Đã xuất bộ mã đề.");
    } finally { setExporting(false); }
  }

  return <div className="space-y-6">
    <section className="rounded-[30px] border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"><Shuffle size={14} />Biến đổi xác định, không tạo lại nội dung</span><h1 className="mt-3 text-3xl font-black text-slate-950">Tạo nhiều mã đề</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Trộn thứ tự câu và phương án từ một đề đã hoàn thiện, giữ nguyên nội dung, điểm số, dữ liệu trực quan và đáp án đúng.</p></div><Link href="/tools/exam-generator" className="btn-secondary">Tạo đề mới</Link></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-black">Đề hiện tại</p><button type="button" className="btn-secondary mt-3" onClick={() => { const current = parseSessionSource(); if (current) selectSource(current); else setMessage("Chưa có đề trong phiên hiện tại."); }}><FileCheck2 size={16} />Nạp đề hiện tại</button></div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-black">Lịch sử của thầy/cô</p><select className="form-field mt-3" value="" onChange={(event) => { const item = history.find((document) => document.id === event.target.value); if (item) selectSource(item); }}><option value="">Chọn đề hoặc bộ mã…</option>{history.map((item) => <option key={item.id} value={item.id}>{item.examVariantSet ? "Bộ mã đề · " : ""}{item.title}</option>)}</select></div>
        <label className="cursor-pointer rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 p-4"><p className="font-black">Tải DOCX, PDF hoặc TXT</p><p className="mt-1 text-sm text-slate-600">Dùng bộ nhận diện đề hiện có; không tạo parser riêng.</p><span className="btn-secondary mt-3 inline-flex"><Upload size={16} />{uploading ? "Đang đọc…" : "Chọn file"}</span><input className="hidden" type="file" accept=".docx,.pdf,.txt" disabled={uploading} onChange={(event) => void uploadFile(event.target.files?.[0])} /></label>
      </div>
      {message ? <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{message}</p> : null}
    </section>

    {source?.structuredExam ? <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-blue-700">Đề nguồn</p><h2 className="mt-1 text-xl font-black text-slate-950">{source.title}</h2><p className="mt-1 text-sm text-slate-600">{counts(source.structuredExam)}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${validation?.valid ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{validation?.valid ? "Đủ điều kiện trộn mã" : "Cần sửa trước khi trộn"}</span></div>
      {validation?.errors.length ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><p className="font-black">Đề vẫn còn lỗi nghiêm trọng. Thầy cô cần kiểm tra đề trước khi trộn mã.</p><ul className="mt-2 list-disc space-y-1 pl-5">{validation.errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul><button type="button" className="btn-secondary mt-3" onClick={openAudit}>Mở công cụ Kiểm tra đề</button></div> : null}
      {validation?.warnings.length ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-black">Có cảnh báo cần rà soát</p><ul className="mt-2 list-disc space-y-1 pl-5">{validation.warnings.slice(0, 6).map((warning) => <li key={warning}>{warning}</li>)}</ul><p className="mt-2">Không có lỗi chặn nên thầy/cô vẫn có thể tiếp tục.</p></div> : null}
    </section> : null}

    {source?.structuredExam && validation?.valid ? <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-black">Cấu hình trộn mã</h2><div className="mt-4 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Số lượng mã đề (2–20)</span><input className="form-field mt-1" type="number" min="2" max="20" value={variantCount} onChange={(event) => setVariantCount(Math.min(20, Math.max(2, Number(event.target.value) || 2)))} /></label><label><span className="label">Mã bắt đầu</span><input className="form-field mt-1" type="number" min="1" value={startingCode} onChange={(event) => setStartingCode(Math.max(1, Number(event.target.value) || 101))} /></label><label className="sm:col-span-2"><span className="label">Hạt trộn</span><div className="mt-1 flex gap-2"><input className="form-field min-w-0 flex-1" value={seed} onChange={(event) => setSeed(event.target.value)} /><button type="button" className="btn-secondary px-3" onClick={() => setSeed(createMixerSeed())}><RefreshCw size={16} /></button><button type="button" className="btn-secondary px-3" onClick={() => void navigator.clipboard.writeText(seed)}><Copy size={16} /></button></div><span className="mt-1 block text-xs text-slate-500">Cùng đề, cấu hình và hạt trộn sẽ tạo lại đúng bộ mã trước đó.</span></label></div>
      <div className="grid gap-2 sm:grid-cols-2">{(Object.keys(options) as (keyof ExamMixingOptions)[]).map((key) => <label key={key} className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm"><input className="mt-1" type="checkbox" checked={options[key]} onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))} /><span><strong>{optionLabel(key)}</strong>{key === "keepGroups" ? <small className="mt-1 block text-slate-500">Các câu dùng chung dữ kiện, bảng hoặc hình sẽ được giữ cùng nhóm.</small> : key === "balanceAnswers" ? <small className="mt-1 block text-slate-500">Cố gắng phân bố đáp án hợp lý mà không đổi nội dung.</small> : null}</span></label>)}</div>
    </div><button type="button" className="btn-primary mt-5" onClick={() => createVariants()}><Shuffle size={17} />Tạo các mã đề</button></section> : null}

    {set ? <>
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Xem trước các mã đề</h2><p className="mt-1 text-sm text-slate-600">Mức độ tương đương giữa các mã: {set.variants.every((variant) => variant.auditResult.valid && !variant.auditResult.warnings.length) ? "Tương đương" : set.variants.every((variant) => variant.auditResult.valid) ? "Có cảnh báo" : "Không hợp lệ"}</p></div><div className="flex flex-wrap gap-2"><button type="button" className="btn-secondary" onClick={regenerateAll}><RefreshCw size={16} />Hạt mới</button><button type="button" className="btn-secondary" onClick={saveSet}><Save size={16} />Lưu lịch sử</button></div></div>
        <div className="mt-4 max-w-full overflow-x-auto"><div className="flex min-w-max gap-2">{set.variants.map((variant) => <button key={variant.code} type="button" className={`rounded-xl px-4 py-2 text-sm font-black ${activeVariant?.code === variant.code ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setActiveCode(variant.code)}>Mã {variant.code}</button>)}</div></div>
        {activeVariant ? <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_280px]"><OutputPreview document={variantToDocument(set, activeVariant)} /><aside className="space-y-3"><div className="rounded-2xl border border-slate-200 p-4 text-sm"><p className="font-black">Mã {activeVariant.code}</p><p className="mt-2">{activeVariant.auditResult.questionCount} câu · {activeVariant.auditResult.totalScore} điểm</p><p className="mt-1">A/B/C/D: {Object.values(activeVariant.auditResult.answerDistribution).join("/")}</p><p className={`mt-2 font-bold ${activeVariant.auditResult.valid ? "text-emerald-700" : "text-red-700"}`}>{activeVariant.auditResult.valid ? activeVariant.auditResult.warnings.length ? "Có cảnh báo" : "Tương đương" : "Không hợp lệ"}</p></div><button className="btn-secondary w-full" type="button" onClick={() => regenerateOne(set.variants.indexOf(activeVariant))}><RefreshCw size={16} />Tạo lại mã này</button><button className="btn-secondary w-full" type="button" disabled={!activeVariant.auditResult.valid} onClick={() => void exportVariantWord(set, activeVariant)}><FileText size={16} />Word đề học sinh</button><button className="btn-secondary w-full" type="button" disabled={!activeVariant.auditResult.valid} onClick={() => void exportVariantAnswerKey(set, activeVariant)}><FileCheck2 size={16} />Đáp án mã này</button><button className="btn-secondary w-full" type="button" disabled={!activeVariant.auditResult.valid} onClick={() => printGeneratedDocument(variantToDocument(set, activeVariant))}><Download size={16} />In/lưu PDF</button></aside></div> : null}
      </section>
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-black">Đối chiếu mã đề</h2><div className="mt-4 max-w-full overflow-x-auto"><table className="min-w-max border-collapse text-sm"><thead><tr><th className="border border-slate-200 bg-slate-50 p-2">Câu gốc</th>{set.variants.map((variant) => <th key={variant.code} className="border border-slate-200 bg-slate-50 p-2">Mã {variant.code}</th>)}</tr></thead><tbody>{variantComparisonRows(set).map((row) => <tr key={row.original}><td className="border border-slate-200 p-2 font-bold">{row.original}</td>{set.variants.map((variant) => <td key={variant.code} className="border border-slate-200 p-2 text-center">{row.variants[variant.code]}</td>)}</tr>)}</tbody></table></div><h3 className="mt-6 font-black">Bảng đáp án theo mã</h3><div className="mt-3 max-w-full overflow-x-auto"><table className="min-w-max border-collapse text-sm"><thead><tr><th className="border border-slate-200 bg-slate-50 p-2">Câu</th>{set.variants.map((variant) => <th key={variant.code} className="border border-slate-200 bg-slate-50 p-2">{variant.code}</th>)}</tr></thead><tbody>{variantAnswerRows(set).map((row) => <tr key={row.number}><td className="border border-slate-200 p-2 font-bold">{row.number}</td>{set.variants.map((variant) => <td key={variant.code} className="border border-slate-200 p-2 text-center">{row.variants[variant.code]}</td>)}</tr>)}</tbody></table></div></section>
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-black">Xuất bộ mã đề</h2><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{([['word','Word cho từng mã'],['pdf','PDF qua hộp thoại in'],['keys','Đáp án riêng'],['comparison','Bảng đối chiếu'],['zip','Gộp thành ZIP']] as const).map(([key,label]) => <label key={key} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-bold"><input type="checkbox" checked={exportOptions[key]} onChange={(event) => setExportOptions((current) => ({ ...current, [key]: event.target.checked }))} />{label}</label>)}</div>{exportOptions.pdf ? <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">PDF dùng luồng In/lưu PDF hiện có để giữ đúng định dạng. Trình duyệt cần lưu từng mã; ZIP không chứa file PDF giả.</p> : null}<div className="mt-4 flex flex-wrap gap-2"><button className="btn-primary" type="button" disabled={exporting} onClick={() => void exportAll()}><FileArchive size={17} />{exporting ? "Đang tạo file…" : "Xuất tất cả"}</button><button className="btn-secondary" type="button" onClick={() => void exportCombinedAnswerKey(set)}>Đáp án tổng hợp Word</button><button className="btn-secondary" type="button" onClick={() => printGeneratedDocument(variantSetAnswerKeyDocument(set))}>In/lưu PDF đáp án</button><button className="btn-secondary" type="button" onClick={() => void exportComparison(set)}>Bảng đối chiếu</button></div></section>
    </> : null}
  </div>;
}
