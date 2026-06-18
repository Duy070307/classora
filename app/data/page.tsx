"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Download, Upload, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { getDocumentSettings } from "@/lib/document-settings";
import { getHistory } from "@/lib/history";
import {
  clearAllClassoraData, clearHistory, clearQuestionBank, clearSettings, clearTemplates, clearUsage,
  downloadLocalDataBackup, importLocalDataBackup, validateBackupJson
} from "@/lib/local-data-manager";
import { getQuestions } from "@/lib/question-bank";
import { getTemplates } from "@/lib/templates";
import { getMockPlan, getUsageCount } from "@/lib/usage";
import { clearAllFormDrafts, getAllFormDrafts } from "@/lib/form-drafts";

type Summary = { history: number; templates: number; questions: number; drafts: number; settings: boolean; plan: string; usage: number };
const emptySummary: Summary = { history: 0, templates: 0, questions: 0, drafts: 0, settings: false, plan: "Free demo", usage: 0 };

function readSummary(): Summary {
  const settings = getDocumentSettings();
  return {
    history: getHistory().length,
    templates: getTemplates().length,
    questions: getQuestions().length,
    drafts: getAllFormDrafts().length,
    settings: Boolean(settings.schoolName || settings.teacherName || settings.department || settings.schoolYear),
    plan: getMockPlan() === "pro" ? "Pro demo" : "Free demo",
    usage: getUsageCount()
  };
}

export default function DataManagementPage() {
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const refresh = () => setSummary(readSummary());
  useEffect(() => queueMicrotask(refresh), []);

  function success(text: string) {
    setError("");
    setMessage(text);
    refresh();
  }

  function confirmClear(label: string, action: () => void) {
    if (!window.confirm(`Bạn có chắc muốn ${label}? Hành động này không thể hoàn tác nếu chưa có bản sao lưu.`)) return;
    action();
    success(`Đã ${label}.`);
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setMessage("");
    setError("");
  }

  async function importBackup() {
    if (!file) return setError("Hãy chọn một file JSON trước khi nhập.");
    if (!window.confirm("Dữ liệu hiện tại có thể bị ghi đè. Bạn có chắc muốn tiếp tục nhập?")) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!validateBackupJson(parsed)) throw new Error("File không phải bản sao lưu Classora hợp lệ.");
      importLocalDataBackup(parsed);
      success("Đã khôi phục dữ liệu từ file JSON.");
    } catch (importError) {
      setMessage("");
      setError(importError instanceof Error ? importError.message : "Không thể đọc file backup.");
    }
  }

  const rows = [
    ["Số tài liệu trong lịch sử", summary.history],
    ["Số mẫu cá nhân", summary.templates],
    ["Số câu hỏi trong ngân hàng", summary.questions],
    ["Số bản nháp biểu mẫu", summary.drafts],
    ["Cài đặt tài liệu", summary.settings ? "Có" : "Chưa có"],
    ["Gói demo hiện tại", summary.plan],
    ["Lượt dùng demo", summary.usage]
  ];

  return <div className="min-h-screen md:flex"><Sidebar /><main className="min-w-0 flex-1 p-5 md:p-8">
    <PageHeader title="Quản lý dữ liệu" description="Sao lưu, khôi phục hoặc xóa dữ liệu Classora đang lưu cục bộ trên trình duyệt này." />
    <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">Classora hiện dùng localStorage. Nếu bạn xóa dữ liệu trình duyệt, dữ liệu có thể mất.</div>
    {message ? <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</div> : null}
    {error ? <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div> : null}
    <Link href="/drafts" className="btn-secondary mb-6 inline-flex">Mở bản nháp biểu mẫu</Link>
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="card overflow-hidden"><h2 className="border-b border-line p-5 text-lg font-bold text-ink">Dữ liệu đang lưu trên trình duyệt</h2><dl>{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[1fr_auto] gap-4 border-b border-line px-5 py-3 last:border-0"><dt className="text-sm text-muted">{label}</dt><dd className="text-sm font-bold text-ink">{value}</dd></div>)}</dl></section>
      <div className="space-y-6">
        <section className="card p-5"><h2 className="text-lg font-bold text-ink">Sao lưu dữ liệu</h2><p className="mt-2 text-sm leading-6 text-muted">Tải xuống toàn bộ dữ liệu Classora đang lưu trên trình duyệt này.</p><button type="button" className="btn-primary mt-4" onClick={() => { downloadLocalDataBackup(); success("Đã tạo file sao lưu JSON."); }}><Download size={16} />Xuất bản sao lưu JSON</button></section>
        <section className="card p-5"><h2 className="text-lg font-bold text-ink">Khôi phục dữ liệu</h2><p className="mt-2 text-sm font-medium leading-6 text-amber-700">Dữ liệu hiện tại có thể bị ghi đè. Hãy xuất bản sao lưu trước khi nhập.</p><input type="file" accept=".json,application/json" className="form-field mt-4" onChange={selectFile} /><button type="button" className="btn-secondary mt-3" onClick={importBackup}><Upload size={16} />Nhập dữ liệu từ file JSON</button></section>
      </div>
    </div>
    <section className="card mt-6 border-red-200 p-5"><h2 className="text-lg font-bold text-red-700">Xóa dữ liệu</h2><p className="mt-2 text-sm leading-6 text-muted">Mỗi thao tác đều yêu cầu xác nhận. Nên xuất backup trước khi xóa.</p><div className="mt-4 flex flex-wrap gap-2">
      <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa lịch sử", clearHistory)}>Xóa lịch sử</button>
      <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa mẫu cá nhân", clearTemplates)}>Xóa mẫu cá nhân</button>
      <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa ngân hàng câu hỏi", clearQuestionBank)}>Xóa ngân hàng câu hỏi</button>
      <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa cài đặt tài liệu", clearSettings)}>Xóa cài đặt tài liệu</button>
      <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa lượt dùng demo", clearUsage)}>Xóa lượt dùng demo</button>
      <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa bản nháp biểu mẫu", clearAllFormDrafts)}>Xóa bản nháp biểu mẫu</button>
      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700" onClick={() => confirmClear("xóa toàn bộ dữ liệu Classora", clearAllClassoraData)}><Trash2 size={16} />Xóa toàn bộ dữ liệu Classora</button>
    </div></section>
  </main></div>;
}
