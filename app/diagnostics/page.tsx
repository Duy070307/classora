"use client";

import Link from "next/link";
import { Download, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { getAIProviderName } from "@/lib/ai";
import { getDocumentSettings } from "@/lib/document-settings";
import { getHistory } from "@/lib/history";
import { downloadLocalDataBackup, getClassoraStorageKeys } from "@/lib/local-data-manager";
import { getQuestions } from "@/lib/question-bank";
import { isStorageAvailable } from "@/lib/storage";
import { getTemplates } from "@/lib/templates";
import { getMockPlan, getUsageCount } from "@/lib/usage";
import { getAllFormDrafts } from "@/lib/form-drafts";
import { getFavoriteTools } from "@/lib/favorites";
import { getRecentTools } from "@/lib/recent-tools";
import { toolRegistry } from "@/lib/tool-registry";
import { CommandPaletteButton } from "@/components/CommandPalette";

type Status = { storage: boolean; history: number; templates: number; questions: number; drafts: number; favorites: number; recent: number; plan: string; usage: number; settings: boolean; keys: string[] };

function readStatus(): Status {
  const settings = getDocumentSettings();
  return {
    storage: isStorageAvailable(),
    history: getHistory().length,
    templates: getTemplates().length,
    questions: getQuestions().length,
    drafts: getAllFormDrafts().length,
    favorites: getFavoriteTools().length,
    recent: getRecentTools().length,
    plan: getMockPlan() === "pro" ? "Pro demo" : "Free demo",
    usage: getUsageCount(),
    settings: Boolean(settings.schoolName || settings.teacherName || settings.schoolYear),
    keys: getClassoraStorageKeys()
  };
}

export default function DiagnosticsPage() {
  const [status, setStatus] = useState<Status>({ storage: false, history: 0, templates: 0, questions: 0, drafts: 0, favorites: 0, recent: 0, plan: "Free demo", usage: 0, settings: false, keys: [] });
  const refresh = () => setStatus(readStatus());
  useEffect(() => queueMicrotask(refresh), []);
  const rows = [
    ["Phiên bản ứng dụng", "v0.5 RC"],
    ["Chế độ build", process.env.NODE_ENV],
    ["localStorage khả dụng", status.storage ? "Có" : "Không"],
    ["Số tài liệu lịch sử", String(status.history)],
    ["Số mẫu tài liệu", String(status.templates)],
    ["Số câu hỏi", String(status.questions)],
    ["Số bản nháp biểu mẫu", String(status.drafts)],
    ["Số công cụ yêu thích", String(status.favorites)],
    ["Số công cụ dùng gần đây", String(status.recent)],
    ["Command palette khả dụng", "Có"],
    ["Số metadata công cụ", String(toolRegistry.length)],
    ["Metadata công cụ lỗi", String(toolRegistry.filter((tool) => !tool.title || !tool.description || !tool.href || !tool.category).length)],
    ["Gói hiện tại", status.plan],
    ["Lượt đã dùng", String(status.usage)],
    ["Có cài đặt tài liệu", status.settings ? "Có" : "Không"],
    ["Chế độ demo", "Đang hoạt động"],
    ["AI provider", getAIProviderName()],
    ["Hệ thống sao lưu", status.storage ? "Sẵn sàng" : "Không khả dụng"]
  ];

  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-4 sm:p-5 md:p-8">
    <PageHeader title="Kiểm tra trạng thái ứng dụng" description="Thông tin dễ đọc để kiểm tra dữ liệu và trạng thái bản demo." />
    <section className="card max-w-3xl overflow-hidden"><dl>{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[1fr_auto] gap-4 border-b border-line px-4 py-3 last:border-0"><dt className="text-sm text-muted">{label}</dt><dd className="text-sm font-bold text-ink">{value}</dd></div>)}</dl></section>
    <section className="card mt-5 max-w-3xl p-4"><h2 className="font-bold text-ink">Dữ liệu cục bộ được nhận diện</h2><p className="mt-2 text-sm leading-6 text-muted">{status.keys.length ? `Soạn Lab đang dùng ${status.keys.length} nhóm dữ liệu trên trình duyệt này.` : "Chưa có dữ liệu Soạn Lab được lưu."}</p>{status.keys.length ? <div className="mt-3 flex flex-wrap gap-2">{status.keys.map((key) => <code key={key} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{key}</code>)}</div> : null}</section>
    <div className="mt-5 flex flex-wrap gap-2"><button className="btn-primary" onClick={refresh}><RefreshCw size={16} />Kiểm tra lại</button><CommandPaletteButton /><Link href="/release-candidate" className="btn-secondary">Checklist release</Link><Link href="/known-issues" className="btn-secondary">Giới hạn hiện tại</Link><Link href="/data" className="btn-secondary">Quản lý dữ liệu</Link><Link href="/demo-data" className="btn-secondary">Dữ liệu demo</Link><Link href="/feedback" className="btn-secondary">Gửi góp ý</Link><button className="btn-secondary" onClick={downloadLocalDataBackup}><Download size={16} />Xuất sao lưu</button></div>
  </main></div>;
}
