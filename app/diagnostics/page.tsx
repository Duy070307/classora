"use client";

import Link from "next/link";
import { RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { getDocumentSettings } from "@/lib/document-settings";
import { getHistory } from "@/lib/history";
import { getQuestions } from "@/lib/question-bank";
import { clearClassoraStorage, isStorageAvailable } from "@/lib/storage";
import { getTemplates } from "@/lib/templates";
import { getMockPlan, getUsageCount } from "@/lib/usage";
import { getAIProviderName } from "@/lib/ai";

type Status = { storage: boolean; history: number; templates: number; questions: number; plan: string; usage: number; settings: boolean };

function readStatus(): Status {
  const settings = getDocumentSettings();
  return {
    storage: isStorageAvailable(), history: getHistory().length, templates: getTemplates().length,
    questions: getQuestions().length, plan: getMockPlan() === "pro" ? "Pro demo" : "Free demo",
    usage: getUsageCount(), settings: Boolean(settings.schoolName || settings.teacherName || settings.schoolYear)
  };
}

export default function DiagnosticsPage() {
  const [status, setStatus] = useState<Status>({ storage: false, history: 0, templates: 0, questions: 0, plan: "Free demo", usage: 0, settings: false });
  const refresh = () => setStatus(readStatus());
  useEffect(() => queueMicrotask(refresh), []);
  const rows = [
    ["localStorage khả dụng", status.storage ? "Có" : "Không"], ["Số tài liệu lịch sử", String(status.history)],
    ["Số mẫu tài liệu", String(status.templates)], ["Số câu hỏi", String(status.questions)],
    ["Gói hiện tại", status.plan], ["Lượt đã dùng", String(status.usage)],
    ["Có cài đặt tài liệu", status.settings ? "Có" : "Không"], ["Chế độ demo", "Đang hoạt động"], ["AI provider", getAIProviderName()]
  ];
  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-4 sm:p-5 md:p-8">
    <PageHeader title="Kiểm tra trạng thái ứng dụng" description="Trang này chỉ dùng để kiểm thử bản MVP." />
    <section className="card max-w-3xl overflow-hidden"><dl>{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[1fr_auto] gap-4 border-b border-line px-4 py-3 last:border-0"><dt className="text-sm text-muted">{label}</dt><dd className="text-sm font-bold text-ink">{value}</dd></div>)}</dl></section>
    <div className="mt-5 flex flex-wrap gap-2"><button className="btn-primary" onClick={refresh}><RefreshCw size={16} />Kiểm tra lại</button><button className="btn-secondary text-red-600" onClick={() => { if (window.confirm("Xóa dữ liệu localStorage của Classora?")) { clearClassoraStorage(); refresh(); } }}><Trash2 size={16} />Xóa dữ liệu lỗi localStorage</button><Link href="/demo-data" className="btn-secondary">Đi tới dữ liệu demo</Link></div>
  </main></div>;
}
