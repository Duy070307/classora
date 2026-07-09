"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { Download, FolderSync, ShieldCheck, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { saveQuestionsToCloud } from "@/lib/data/question-bank-store";
import { saveSettingsToCloud } from "@/lib/data/settings-store";
import { getStorageMode } from "@/lib/data/storage-mode";
import { saveTemplatesToCloud } from "@/lib/data/templates-store";
import { migrateDocumentsToCloud } from "@/lib/data/documents-store";
import { defaultDocumentSettings, getDocumentSettings } from "@/lib/document-settings";
import { getFavoriteTools } from "@/lib/favorites";
import { clearAllFormDrafts, getAllFormDrafts } from "@/lib/form-drafts";
import { getHistory } from "@/lib/history";
import {
  clearAllClassoraData,
  clearFavorites,
  clearHistory,
  clearQuestionBank,
  clearRecent,
  clearSettings,
  clearTemplates,
  clearUsage,
  downloadLocalDataBackup,
  importLocalDataBackup,
  validateBackupJson,
} from "@/lib/local-data-manager";
import { getQuestions } from "@/lib/question-bank";
import { getRecentTools } from "@/lib/recent-tools";
import { getTemplates } from "@/lib/templates";
import { getUsageCount } from "@/lib/usage";

type Summary = {
  history: number;
  templates: number;
  questions: number;
  drafts: number;
  favorites: number;
  recent: number;
  settings: boolean;
  usage: number;
};

const emptySummary: Summary = {
  history: 0,
  templates: 0,
  questions: 0,
  drafts: 0,
  favorites: 0,
  recent: 0,
  settings: false,
  usage: 0,
};

function readSummary(): Summary {
  const settings = getDocumentSettings();
  const hasSettings = JSON.stringify(settings) !== JSON.stringify(defaultDocumentSettings);
  return {
    history: getHistory().length,
    templates: getTemplates().length,
    questions: getQuestions().length,
    drafts: getAllFormDrafts().length,
    favorites: getFavoriteTools().length,
    recent: getRecentTools().length,
    settings: hasSettings,
    usage: getUsageCount(),
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
    if (!file) {
      setError("Hãy chọn một file JSON trước khi nhập.");
      return;
    }
    if (!window.confirm("Dữ liệu hiện tại có thể bị ghi đè. Bạn có chắc muốn tiếp tục nhập?")) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!validateBackupJson(parsed)) throw new Error("File không phải bản sao lưu Soạn Lab hợp lệ.");
      importLocalDataBackup(parsed);
      success("Đã khôi phục dữ liệu từ file JSON.");
    } catch (importError) {
      setMessage("");
      setError(importError instanceof Error ? importError.message : "Không thể đọc file sao lưu.");
    }
  }

  async function migrateLocalDataToAccount() {
    try {
      const mode = await getStorageMode();
      if (mode.mode !== "cloud") {
        setError("Hãy đăng nhập tài khoản Soạn Lab trước khi đồng bộ dữ liệu.");
        setMessage("");
        return;
      }
      const historyCount = await migrateDocumentsToCloud(getHistory());
      await saveTemplatesToCloud(getTemplates());
      await saveQuestionsToCloud(getQuestions());
      await saveSettingsToCloud(getDocumentSettings());
      success(`Đã đồng bộ lên tài khoản: ${historyCount} tài liệu, ${getTemplates().length} mẫu, ${getQuestions().length} câu hỏi.`);
    } catch {
      setMessage("");
      setError("Chưa thể đồng bộ dữ liệu lúc này. Vui lòng thử lại sau.");
    }
  }

  const rows = [
    ["Tài liệu trong lịch sử", summary.history],
    ["Mẫu cá nhân", summary.templates],
    ["Câu hỏi trong ngân hàng", summary.questions],
    ["Bản nháp biểu mẫu", summary.drafts],
    ["Công cụ yêu thích", summary.favorites],
    ["Công cụ dùng gần đây", summary.recent],
    ["Cài đặt tài liệu", summary.settings ? "Đã thiết lập" : "Chưa thiết lập"],
    ["Lượt tạo nội dung", summary.usage],
  ] as const;

  return (
    <AppShell title="Dữ liệu">
      <PageHeader
        title="Dữ liệu của thầy/cô"
        description="Sao lưu, khôi phục, đồng bộ hoặc dọn dẹp dữ liệu Soạn Lab một cách an toàn."
        eyebrow="Quản lý dữ liệu"
      />

      <div className="mb-6 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
        Trước khi xóa dữ liệu, thầy/cô nên xuất một bản sao lưu JSON để có thể khôi phục khi cần.
      </div>

      {message ? <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</div> : null}
      {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-[32px] border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Tổng quan dữ liệu</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Các mục đang được lưu để phục vụ quá trình soạn tài liệu.</p>
            </div>
            <ShieldCheck className="text-blue-600" size={28} />
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <dt className="text-sm font-semibold text-slate-500">{label}</dt>
                <dd className="mt-1 text-2xl font-black text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <Link href="/drafts" className="btn-secondary mt-5">Mở bản nháp biểu mẫu</Link>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Đồng bộ lên tài khoản</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sau khi đăng nhập, thầy/cô có thể đưa lịch sử, mẫu cá nhân, ngân hàng câu hỏi và cài đặt hiện có lên tài khoản.
            </p>
            <button type="button" className="btn-primary mt-4" onClick={migrateLocalDataToAccount}>
              <FolderSync size={16} /> Đồng bộ dữ liệu
            </button>
          </section>

          <section className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Sao lưu dữ liệu</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tải xuống toàn bộ dữ liệu Soạn Lab đang lưu trên thiết bị này.
            </p>
            <button
              type="button"
              className="btn-primary mt-4"
              onClick={() => {
                downloadLocalDataBackup();
                success("Đã tạo file sao lưu JSON.");
              }}
            >
              <Download size={16} /> Xuất bản sao lưu JSON
            </button>
          </section>

          <section className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Khôi phục dữ liệu</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-amber-700">
              Dữ liệu hiện tại có thể bị ghi đè. Hãy xuất bản sao lưu trước khi nhập.
            </p>
            <input type="file" accept=".json,application/json" className="form-field mt-4" onChange={selectFile} />
            <button type="button" className="btn-secondary mt-3" onClick={importBackup}>
              <Upload size={16} /> Nhập dữ liệu từ file JSON
            </button>
          </section>
        </aside>
      </div>

      <section className="mt-6 rounded-[32px] border border-red-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 size={20} />
          </span>
          <div>
            <h2 className="text-xl font-black text-red-700">Dọn dẹp dữ liệu</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Mỗi thao tác đều yêu cầu xác nhận. Nên xuất bản sao lưu trước khi xóa.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa lịch sử", clearHistory)}>Xóa lịch sử</button>
          <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa mẫu cá nhân", clearTemplates)}>Xóa mẫu cá nhân</button>
          <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa ngân hàng câu hỏi", clearQuestionBank)}>Xóa ngân hàng câu hỏi</button>
          <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa cài đặt tài liệu", clearSettings)}>Xóa cài đặt tài liệu</button>
          <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa bộ đếm lượt sử dụng", clearUsage)}>Xóa bộ đếm lượt</button>
          <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa bản nháp biểu mẫu", clearAllFormDrafts)}>Xóa bản nháp</button>
          <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa công cụ yêu thích", clearFavorites)}>Xóa yêu thích</button>
          <button className="btn-secondary text-red-600" onClick={() => confirmClear("xóa công cụ dùng gần đây", clearRecent)}>Xóa gần đây</button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700" onClick={() => confirmClear("xóa toàn bộ dữ liệu Soạn Lab", clearAllClassoraData)}>
            <Trash2 size={16} /> Xóa toàn bộ
          </button>
        </div>
      </section>
    </AppShell>
  );
}
